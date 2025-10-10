

"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { OrderData, MenuItem, InventoryItem, RecipeItem, ExpenseItem, PurchaseOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { exportFinancialsToPDF } from '@/lib/pdf-export';
import { useAuth } from '@/context/AuthContext';

const formatRupiah = (price?: number) => {
    if (price === undefined || price === null || isNaN(price)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};


export function ReportsDisplay() {
    const { companyName } = useAuth();
    const [allCompletedOrders, setAllCompletedOrders] = useState<(OrderData & {id: string, completedAt: any})[]>([]);
    const [allCompletedPOs, setAllCompletedPOs] = useState<PurchaseOrder[]>([]);
    const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

    useEffect(() => {
        const unsubscribes: (() => void)[] = [];

        const qOrders = query(collection(db, "completed_orders"), orderBy("completedAt", "desc"));
        unsubscribes.push(onSnapshot(qOrders, (snapshot) => {
            setAllCompletedOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderData & {id: string, completedAt: any})));
            setIsLoading(false);
        }));

        const qPOs = query(collection(db, "purchase_orders"), orderBy("receivedDate", "desc"));
         unsubscribes.push(onSnapshot(qPOs, (snapshot) => {
            setAllCompletedPOs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder)).filter(po => po.status === 'Completed'));
        }));

        const qExpenses = query(collection(db, "expenses"), orderBy("date", "desc"));
        unsubscribes.push(onSnapshot(qExpenses, (snapshot) => {
            setAllExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseItem)));
        }));

        unsubscribes.push(onSnapshot(collection(db, 'menu'), (snapshot) => {
            setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
        }));

        unsubscribes.push(onSnapshot(collection(db, 'gudang'), (snapshot) => {
            setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
        }));

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);
    
    const filteredData = useMemo(() => {
        if (!date?.from) {
            return { completedOrders: allCompletedOrders, expenses: allExpenses, completedPOs: allCompletedPOs };
        }
        const fromDate = startOfDay(date.from);
        const toDate = date.to ? endOfDay(date.to) : endOfDay(date.from);

        const completedOrders = allCompletedOrders.filter(order => {
            if (!order.completedAt?.toDate) return false;
            const orderDate = order.completedAt.toDate();
            return orderDate >= fromDate && orderDate <= toDate;
        });

        const completedPOs = allCompletedPOs.filter(po => {
            if (!po.receivedDate?.toDate) return false;
            const poDate = po.receivedDate.toDate();
            return poDate >= fromDate && poDate <= toDate;
        });

        const expenses = allExpenses.filter(expense => {
            if (!expense.date?.toDate) return false;
            const expenseDate = expense.date.toDate();
            return expenseDate >= fromDate && expenseDate <= toDate;
        });

        return { completedOrders, expenses, completedPOs };
    }, [allCompletedOrders, allExpenses, allCompletedPOs, date]);


    const inventoryPriceMap = useMemo(() => {
        return new Map(inventory.map(item => [item.id, item.price || 0]));
    }, [inventory]);

    const menuItemRecipeMap = useMemo(() => {
        return new Map(menuItems.map(item => [item.name, item.recipe || []]));
    }, [menuItems]);

    const calculateRecipeCost = useCallback((recipe: RecipeItem[] = []) => {
        return recipe.reduce((total, item) => {
            const price = inventoryPriceMap.get(item.ingredientId) || 0;
            return total + (price * item.quantity);
        }, 0);
    }, [inventoryPriceMap]);

    const detailedFinancials = useMemo(() => {
        let totalRevenue = 0;
        let totalCogs = 0;
        
        const ordersWithCost = filteredData.completedOrders.map(order => {
            const orderRevenue = order.subtotal; // Use subtotal for revenue calculation
            const recipeCost = order.items.reduce((itemSum, item) => {
                 const recipe = menuItemRecipeMap.get(item.name);
                 if (recipe) {
                    const cost = calculateRecipeCost(recipe);
                    return itemSum + (cost * item.quantity);
                }
                return itemSum;
            }, 0);
            
            // HPP = Biaya Resep. PPN & Service tidak termasuk dalam HPP.
            const orderCogs = recipeCost; 

            totalRevenue += orderRevenue;
            totalCogs += orderCogs;

            return {
                ...order,
                cogs: orderCogs,
                profit: orderRevenue - orderCogs,
            };
        });
        
        const totalIngredientCost = filteredData.completedPOs.reduce((sum, po) => sum + po.totalAmount, 0);
        const grossProfit = totalRevenue - totalCogs;
        const totalOperationalExpenses = filteredData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const netProfit = grossProfit - totalOperationalExpenses - totalIngredientCost;


        return { totalRevenue, totalCogs, grossProfit, totalOperationalExpenses, totalIngredientCost, netProfit, ordersWithCost };
    }, [filteredData, menuItemRecipeMap, calculateRecipeCost]);
    
    const chartData = [
        { name: 'Total', Pendapatan: detailedFinancials.totalRevenue, HPP: detailedFinancials.totalCogs, "Beban Bahan Baku": detailedFinancials.totalIngredientCost, "Beban Operasional": detailedFinancials.totalOperationalExpenses, "Laba Bersih": detailedFinancials.netProfit },
    ];
    
     const handleExport = (reportType: 'sales' | 'profit' | 'all') => {
        exportFinancialsToPDF({
            reportType,
            date,
            detailedFinancials: { 
                ...detailedFinancials, 
                expenses: filteredData.expenses, 
                completedPOs: filteredData.completedPOs 
            },
            companyName: companyName,
        });
    };


    if (isLoading) {
        return (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <Card className="md:col-span-2 lg:col-span-5">
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-2 items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, "LLL dd, y")} -{" "}
                                {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pilih tanggal</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" onClick={() => setDate({ from: new Date(), to: new Date() })}>
                        Hari Ini
                    </Button>
                    <Button variant="outline" onClick={() => setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>
                        Bulan Ini
                    </Button>
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Ekspor ke PDF
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleExport('sales')}>Laporan Penjualan</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleExport('profit')}>Laporan Laba Kotor</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleExport('all')}>Laporan Keuangan Lengkap</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Pendapatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatRupiah(detailedFinancials.totalRevenue)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total HPP</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatRupiah(detailedFinancials.totalCogs)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Laba Kotor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatRupiah(detailedFinancials.grossProfit)}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Beban Bahan Baku</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatRupiah(detailedFinancials.totalIngredientCost)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Beban Operasional</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatRupiah(detailedFinancials.totalOperationalExpenses)}</p>
                    </CardContent>
                </Card>
            </div>
             <Card className="border-primary md:col-span-2 lg:col-span-5">
                <CardHeader>
                    <CardTitle>Laba Bersih</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatRupiah(detailedFinancials.netProfit)}</p>
                    <p className="text-sm text-muted-foreground">
                        {detailedFinancials.totalRevenue > 0 ? ((detailedFinancials.netProfit / detailedFinancials.totalRevenue) * 100).toFixed(1) : '0.0'}% dari pendapatan
                    </p>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Ringkasan Keuangan</CardTitle>
                    <CardDescription>
                       Menampilkan data untuk {' '}
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "d LLL yyyy", {locale: id})} - {format(date.to, "d LLL yyyy", {locale: id})}
                            </>
                        ) : (
                            format(date.from, "d LLL yyyy", {locale: id})
                        )
                        ) : (
                         "Semua Waktu"
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{
                        Pendapatan: { label: 'Pendapatan', color: 'hsl(var(--chart-2))' },
                        HPP: { label: 'HPP', color: 'hsl(var(--chart-3))' },
                        'Beban Bahan Baku': { label: 'Beban Bahan', color: 'hsl(var(--chart-5))' },
                        'Beban Operasional': { label: 'Beban Ops', color: 'hsl(var(--chart-4))' },
                        'Laba Bersih': { label: 'Laba Bersih', color: 'hsl(var(--chart-1))' },
                    }} className="h-[300px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickFormatter={(value) => formatRupiah(Number(value))} />
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    content={<ChartTooltipContent formatter={(value) => formatRupiah(Number(value))}/>}
                                />
                                <Bar dataKey="Pendapatan" fill="var(--color-Pendapatan)" radius={4} />
                                <Bar dataKey="HPP" fill="var(--color-HPP)" radius={4} />
                                <Bar dataKey="Beban Bahan Baku" fill="var(--color-Beban Bahan Baku)" radius={4} />
                                <Bar dataKey="Beban Operasional" fill="var(--color-Beban Operasional)" radius={4} />
                                <Bar dataKey="Laba Bersih" fill="var(--color-Laba Bersih)" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

        </div>
    );
}

function CardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-1/2" />
            </CardContent>
        </Card>
    );
}

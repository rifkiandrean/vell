
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { OrderData, ExpenseItem, MenuItem, InventoryItem, RecipeItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Download, Calendar as CalendarIcon, FileSearch, Scale, Send } from 'lucide-react';
import { format, addDays, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendAuditReport } from '@/ai/flows/send-audit-report';
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

export function AuditDisplay() {
    const { companyName } = useAuth();
    const [allCompletedOrders, setAllCompletedOrders] = useState<(OrderData & {id: string, completedAt: any})[]>([]);
    const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
    });
    const [realCash, setRealCash] = useState(0);
    const [realNonCash, setRealNonCash] = useState(0);
    const [isAuditing, setIsAuditing] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const unsubOrders = onSnapshot(query(collection(db, "completed_orders"), orderBy("completedAt", "desc")), (snapshot) => {
            setAllCompletedOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderData & {id: string, completedAt: any})));
        });

        const unsubExpenses = onSnapshot(query(collection(db, "expenses"), orderBy("date", "desc")), (snapshot) => {
            setAllExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseItem)));
        });

        const unsubMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
            setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
        });
        
        const unsubInventory = onSnapshot(collection(db, 'gudang'), (snapshot) => {
            setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
            setIsLoading(false); // Set loading to false after the last listener is set up
        });

        return () => {
            unsubOrders();
            unsubExpenses();
            unsubMenu();
            unsubInventory();
        };
    }, []);
    
    const filteredData = useMemo(() => {
        if (!date?.from) {
            return { orders: [], expenses: [], systemCash: 0, systemNonCash: 0, systemTotal: 0 };
        }
        const fromDate = startOfDay(date.from);
        const toDate = date.to ? endOfDay(date.to) : endOfDay(date.from);

        let systemCash = 0;
        let systemNonCash = 0;

        const orders = allCompletedOrders.filter(order => {
            if (!order.completedAt?.toDate) return false;
            const orderDate = order.completedAt.toDate();
            const inRange = orderDate >= fromDate && orderDate <= toDate;
            if (inRange) {
                if (order.paymentMethod === 'Cash') {
                    systemCash += order.total;
                } else {
                    systemNonCash += order.total;
                }
            }
            return inRange;
        });
        
        const expenses = allExpenses.filter(expense => {
            if (!expense.date?.toDate) return false;
            const expenseDate = expense.date.toDate();
            return expenseDate >= fromDate && expenseDate <= toDate;
        });

        const systemTotal = systemCash + systemNonCash;

        return { orders, expenses, systemCash, systemNonCash, systemTotal };
    }, [allCompletedOrders, allExpenses, date]);

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
        
        const ordersWithCost = filteredData.orders.map(order => {
            const orderRevenue = order.subtotal; // Use subtotal for revenue calculation before tax/service
            const recipeCost = order.items.reduce((itemSum, item) => {
                 const recipe = menuItemRecipeMap.get(item.name);
                 if (recipe) {
                    const cost = calculateRecipeCost(recipe);
                    return itemSum + (cost * item.quantity);
                }
                return itemSum;
            }, 0);
            
            // HPP = Biaya Resep + PPN + Biaya Layanan
            const orderCogs = recipeCost + order.ppnAmount + order.serviceChargeAmount;

            totalRevenue += orderRevenue;
            totalCogs += orderCogs;
            
            return {
                ...order,
                cogs: orderCogs,
                profit: orderRevenue - orderCogs,
            };
        });

        const grossProfit = totalRevenue - totalCogs;
        const totalExpenses = filteredData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const netProfit = grossProfit - totalExpenses;


        return { totalRevenue, totalCogs, grossProfit, totalExpenses, netProfit, ordersWithCost };
    }, [filteredData, menuItemRecipeMap, calculateRecipeCost]);
    
    const realTotal = realCash + realNonCash;
    const cashDifference = realCash - filteredData.systemCash;
    const nonCashDifference = realNonCash - filteredData.systemNonCash;
    const totalDifference = realTotal - filteredData.systemTotal;
    
    const handleAuditNow = async () => {
        if (totalDifference !== 0) {
            toast({
                title: "Audit Gagal",
                description: "Pastikan total selisih adalah nol sebelum mengirim laporan.",
                variant: "destructive",
            });
            return;
        }
        setIsAuditing(true);
        try {
            const dateRange = date?.from
                ? `${format(date.from, "d MMM yyyy", { locale: id })}${date.to && date.from !== date.to ? ' - ' + format(date.to, "d MMM yyyy", { locale: id }) : ''}`
                : "Semua Waktu";

            // 1. Generate AI text report
            const result = await sendAuditReport({
                systemCash: filteredData.systemCash,
                systemNonCash: filteredData.systemNonCash,
                systemTotal: filteredData.systemTotal,
                realCash: realCash,
                realNonCash: realNonCash,
                realTotal: realTotal,
                dateRange: dateRange,
                companyName: companyName,
            });

            console.log("=== Laporan Audit Harian (Teks) ===");
            console.log(result.report);
            
            // 2. Export detailed PDF report
             exportFinancialsToPDF({
                date,
                detailedFinancials: detailedFinancials,
                expenses: filteredData.expenses,
                companyName: companyName,
             });

            toast({
                title: "Audit Selesai!",
                description: "Laporan teks dibuat & PDF laporan keuangan lengkap telah diunduh.",
                duration: 7000,
            });
        } catch (error) {
            console.error("Gagal mengirim laporan audit:", error);
            toast({
                title: "Error",
                description: "Gagal membuat laporan audit.",
                variant: "destructive",
            });
        } finally {
            setIsAuditing(false);
        }
    };


    if (isLoading) {
        return <Skeleton className="h-[400px] w-full" />
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
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileSearch /> Data Sistem</CardTitle>
                        <CardDescription>Pendapatan yang tercatat di sistem untuk periode yang dipilih.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="font-medium">Pendapatan Tunai</span>
                            <span className="font-bold text-lg">{formatRupiah(filteredData.systemCash)}</span>
                        </div>
                         <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="font-medium">Pendapatan Non-Tunai</span>
                            <span className="font-bold text-lg">{formatRupiah(filteredData.systemNonCash)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary">
                            <span className="font-bold text-primary">TOTAL PENDAPATAN SISTEM</span>
                            <span className="font-bold text-xl text-primary">{formatRupiah(filteredData.systemTotal)}</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Scale /> Realita Fisik</CardTitle>
                        <CardDescription>Masukkan jumlah uang fisik yang dihitung secara manual.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="space-y-2">
                          <Label htmlFor="realCash">Jumlah Uang Tunai (Cash)</Label>
                          <Input 
                            id="realCash"
                            type="number"
                            value={realCash || ''}
                            onChange={(e) => setRealCash(Number(e.target.value))}
                            placeholder="cth., 1500000"
                          />
                       </div>
                       <div className="space-y-2">
                          <Label htmlFor="realNonCash">Jumlah Uang Non-Tunai</Label>
                          <Input 
                            id="realNonCash"
                            type="number"
                            value={realNonCash || ''}
                            onChange={(e) => setRealNonCash(Number(e.target.value))}
                            placeholder="cth., 2500000"
                          />
                       </div>
                       <div className="flex justify-between items-center p-4 bg-accent/10 rounded-lg border border-accent">
                            <span className="font-bold text-accent-foreground">TOTAL PENDAPATAN FISIK</span>
                            <span className="font-bold text-xl text-accent-foreground">{formatRupiah(realTotal)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Hasil Audit</CardTitle>
                     <CardDescription>Perbandingan antara data sistem dan realita fisik.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className={cn(
                        "flex justify-between items-center p-3 rounded-lg border",
                        cashDifference === 0 ? "bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-700" : "bg-red-100 border-red-300 dark:bg-red-900/50 dark:border-red-700"
                    )}>
                        <span className="font-medium">Selisih Uang Tunai</span>
                        <span className={cn("font-bold text-lg", cashDifference === 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}>{formatRupiah(cashDifference)}</span>
                    </div>
                     <div className={cn(
                        "flex justify-between items-center p-3 rounded-lg border",
                        nonCashDifference === 0 ? "bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-700" : "bg-red-100 border-red-300 dark:bg-red-900/50 dark:border-red-700"
                    )}>
                        <span className="font-medium">Selisih Uang Non-Tunai</span>
                        <span className={cn("font-bold text-lg", nonCashDifference === 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}>{formatRupiah(nonCashDifference)}</span>
                    </div>
                    <div className={cn(
                        "flex justify-between items-center p-4 rounded-lg border-2",
                        totalDifference === 0 ? "bg-green-200 border-green-500 dark:bg-green-800/60 dark:border-green-600" : "bg-red-200 border-red-500 dark:bg-red-800/60 dark:border-red-600"
                    )}>
                        <span className={cn("font-bold", totalDifference === 0 ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200")}>TOTAL SELISIH</span>
                        <span className={cn("font-bold text-xl", totalDifference === 0 ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200")}>{formatRupiah(totalDifference)}</span>
                    </div>
                    {totalDifference !== 0 && (
                        <p className="text-sm text-center text-red-600 font-medium">
                            Ada selisih antara pendapatan sistem dan pendapatan fisik. Silakan periksa kembali transaksi Anda.
                        </p>
                    )}
                </CardContent>
                {totalDifference === 0 && (realTotal > 0) && (
                    <CardFooter className="border-t pt-6">
                        <div className="w-full text-center space-y-4">
                             <p className="text-sm text-green-600 font-medium">
                                Data sistem dan realita fisik sudah cocok. Laporan siap dikunci.
                            </p>
                            <Button onClick={handleAuditNow} disabled={isAuditing}>
                                <Download className="mr-2 h-4 w-4" />
                                {isAuditing ? "Memproses..." : "Kunci & Ekspor Laporan Audit"}
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>

        </div>
    );
}

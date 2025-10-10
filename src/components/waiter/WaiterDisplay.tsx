
"use client";

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, getDoc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import type { OrderData, TableData, TableStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { useSettings } from '@/context/SettingsContext';
import { HandPlatter, BellRing, Table as TableIcon, User, Brush, MoreVertical } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';

interface OrderWithId extends OrderData {
    id: string;
}

const getNumberColor = (status: TableStatus) => {
    switch (status) {
        case 'Available':
            return 'text-white';
        case 'Needs Cleanup':
             return 'text-white';
        case 'Unavailable':
            return 'text-white/80';
        default:
            return 'text-foreground';
    }
}


export function WaiterDisplay() {
    const { user } = useAuth();
    const [servedOrders, setServedOrders] = useState<OrderWithId[]>([]);
    const [tables, setTables] = useState<TableData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const prevServedOrderCountRef = useRef(0);
    const { requestPermission, showNotification } = useNotifications();
    const { playSound } = useSettings();

    useEffect(() => {
        requestPermission();

        // Listener for orders ready to be served
        const qServed = query(collection(db, "orders"), where("status", "==", "Served"));
        const unsubscribeServed = onSnapshot(qServed, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderWithId));
            orders.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));

            if (!isLoading && orders.length > prevServedOrderCountRef.current) {
                playSound();
                const newOrder = orders[orders.length - 1];
                if (newOrder) {
                    showNotification(
                        'Pesanan Siap Diantar!',
                        `Pesanan untuk ${newOrder.tableNumber || 'Take Away'} sudah siap.`
                    );
                }
            }

            setServedOrders(orders);
            prevServedOrderCountRef.current = orders.length;
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil pesanan yang siap disajikan:", error);
            toast({ title: "Error", description: "Gagal memuat pesanan yang siap disajikan.", variant: "destructive" });
        });

        // Listener for all table statuses
        const qTables = query(collection(db, "tables"), orderBy("id"));
        const unsubscribeTables = onSnapshot(qTables, (snapshot) => {
            const tableData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableData));
            // Ensure tables are sorted numerically/alphanumerically
            tableData.sort((a, b) => {
                const aNum = parseInt(a.id.replace('meja ', ''), 10);
                const bNum = parseInt(b.id.replace('meja ', ''), 10);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum;
                }
                return a.id.localeCompare(b.id);
            });
            setTables(tableData);
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil data meja:", error);
            toast({ title: "Error", description: "Gagal memuat status meja.", variant: "destructive" });
        });


        return () => {
            unsubscribeServed();
            unsubscribeTables();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, toast, requestPermission, showNotification, playSound]);

     const handleMarkAsDelivered = async (order: OrderWithId) => {
        const orderRef = doc(db, "orders", order.id);
        try {
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                const orderData = orderSnap.data() as OrderData;
                const completedOrderData = { ...orderData, status: 'Delivered', completedAt: serverTimestamp() };
                
                await setDoc(doc(db, "completed_orders", order.id), completedOrderData);
                await deleteDoc(orderRef);

                logActivity(user, `Mengantarkan pesanan #${order.id} ke ${order.customerName}`);
                toast({ title: "Pesanan Diantarkan!", description: `Pesanan untuk ${orderData.customerName} telah diantarkan.` });
            }
        } catch (error) {
            console.error("Gagal menandai pesanan telah diantar:", error);
            toast({ title: "Error", description: "Gagal memperbarui status pesanan.", variant: "destructive" });
        }
    };
    
    const handleSetTableFinished = async (tableId: string) => {
        const tableRef = doc(db, "tables", tableId);
        try {
            await updateDoc(tableRef, {
                status: 'Needs Cleanup',
                currentOrderId: null,
                customerName: null,
                lastActivity: serverTimestamp()
            });
            logActivity(user, `Menandai ${tableId} sebagai selesai (perlu dibersihkan)`);
            toast({ title: "Meja Selesai", description: `${tableId} sekarang perlu dibersihkan.` });
        } catch (error) {
            console.error("Gagal menyelesaikan meja:", error);
            toast({ title: "Error", description: "Gagal memperbarui status meja.", variant: "destructive" });
        }
    };

    const handleMarkTableClean = async (tableId: string) => {
        const tableRef = doc(db, "tables", tableId);
        try {
            await updateDoc(tableRef, { status: 'Available' });
            logActivity(user, `Menandai ${tableId} sebagai bersih dan tersedia`);
            toast({ title: "Meja Bersih", description: `${tableId} sekarang tersedia.` });
        } catch (error) {
            console.error("Gagal membersihkan meja:", error);
            toast({ title: "Error", description: "Gagal memperbarui status meja.", variant: "destructive" });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Ready to Deliver */}
            <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
                    <BellRing className="h-7 w-7 text-primary" /> Siap Diantar
                </h2>
                <div className="bg-muted/50 p-4 rounded-lg h-[75vh] overflow-y-auto space-y-4">
                     {isLoading ? <p>Memuat pesanan...</p> : servedOrders.length > 0 ? (
                        <AnimatePresence>
                            {servedOrders.map(order => (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                                >
                                    <Card className="shadow-lg border-2 border-primary animate-pulse-once">
                                        <CardHeader>
                                            <CardTitle className="flex justify-between items-center text-xl">
                                                <span>{order.tableNumber ? `Meja ${order.tableNumber.replace('meja ','')}` : 'Take Away'}</span>
                                                <Badge variant="secondary">{order.customerName}</Badge>
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground font-mono pt-1">{order.id}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-1 text-sm">
                                                {order.items.map((item, index) => (
                                                    <li key={index}>
                                                        <span className="font-semibold">{item.quantity}x {item.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Button onClick={() => handleMarkAsDelivered(order)} className="w-full bg-primary hover:bg-primary/90 text-white">
                                                <HandPlatter className="mr-2 h-4 w-4" /> Tandai Telah Diantar
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                     ) : (
                        <div className="text-center py-16">
                            <p className="text-muted-foreground">Tidak ada pesanan yang siap diantar.</p>
                        </div>
                     )}
                </div>
            </div>

            {/* Column 2: Table Status Grid */}
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Status Meja</h2>
                <div className="flex items-center gap-4 text-sm mb-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-green-500"></div>
                        <span>Tersedia</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-card border"></div>
                        <span>Terisi</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-red-500"></div>
                        <span>Perlu Dibersihkan</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-slate-400"></div>
                        <span>Tidak Tersedia</span>
                    </div>
                </div>
                 <div className="bg-muted/50 p-4 rounded-lg h-[calc(75vh-40px)] overflow-y-auto">
                    {isLoading ? (
                        <p>Memuat status meja...</p>
                    ) : tables.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            <AnimatePresence>
                                {tables.map(table => (
                                    <motion.div
                                        key={table.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        title={`${table.id} - ${table.status}`}
                                    >
                                        <div 
                                            className={cn(
                                                "relative flex flex-col items-center justify-center aspect-square w-full rounded-lg border-2 shadow-sm transition-all duration-300 p-1",
                                                table.status === 'Needs Cleanup' ? 'bg-red-500 border-red-600 animate-pulse' : '',
                                                table.status === 'Occupied' ? 'bg-card' : '',
                                                table.status === 'Available' ? 'bg-green-500 border-green-600' : '',
                                                table.status === 'Unavailable' ? 'bg-slate-400 border-slate-500' : '',
                                            )}
                                        >
                                            <TableIcon className={cn("h-8 w-8 sm:h-10 sm:w-10 transition-colors", 
                                                (table.status === 'Available' || table.status === 'Needs Cleanup' || table.status === 'Unavailable') ? 'text-white/50' : 'text-foreground/30'
                                            )} />
                                            <span className={cn(
                                                "absolute text-xl font-bold transition-colors",
                                                getNumberColor(table.status)
                                            )}>
                                                {table.id.replace('meja ', '')}
                                            </span>
                                            {table.status === 'Occupied' && table.customerName && (
                                                <div className="absolute bottom-1 w-full text-center px-1">
                                                    <div className="flex items-center justify-center gap-1 bg-black/30 text-white rounded-full text-[10px] sm:text-xs truncate py-0.5">
                                                        <User className="h-3 w-3" />
                                                        <span className="truncate">{table.customerName}</span>
                                                    </div>
                                                </div>
                                            )}
                                             {table.status === 'Occupied' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 text-foreground/50 hover:text-foreground">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => handleSetTableFinished(table.id)}>
                                                            <Brush className="mr-2 h-4 w-4"/>
                                                            Set Selesai & Perlu Dibersihkan
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                             )}
                                             {table.status === 'Needs Cleanup' && (
                                                 <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 text-white/80 hover:text-white" onClick={() => handleMarkTableClean(table.id)}>
                                                    <Brush className="h-4 w-4" />
                                                </Button>
                                             )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-muted-foreground">Tidak ada data meja. Silakan buat melalui halaman Admin Seeder.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


    

"use client";

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { OrderData } from '@/lib/types';
import { OrderSummary } from '../order/OrderSummary';
import { CashierMenu } from './CashierMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PendingPayments } from './PendingPayments';
import { CompletedOrders } from './CompletedOrders'; 
import { ProcessingOrders } from './ProcessingOrders';
import { useNotifications } from '@/hooks/use-notifications';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';


interface OrderWithId extends OrderData {
    id: string;
}

function NewOrder() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 h-full">
            <div className="lg:col-span-2">
                <CashierMenu />
            </div>
            <div className="lg:sticky lg:top-24 h-fit">
                <OrderSummary isCashier={true}/>
            </div>
        </div>
    )
}


export function CashierDisplay() {
    const [pendingOrders, setPendingOrders] = useState<OrderWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const prevOrderCountRef = useRef(0);
    const [isBlinking, setIsBlinking] = useState(false);
    const { requestPermission, showNotification } = useNotifications();
    const { playSound } = useSettings();
    const { user } = useAuth();

     useEffect(() => {
        requestPermission();

        const q = query(
            collection(db, "orders"), 
            where("status", "==", "Pending Payment")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderWithId));
            orders.sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
                }
                return 0;
            });

            // Play notification sound and show notification if a new order arrives
            if (!isLoading && orders.length > prevOrderCountRef.current) {
                playSound();
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), 3000); // Blink for 3 seconds
                const newOrder = orders[orders.length - 1]; // Assuming the newest is last
                if (newOrder) {
                    showNotification(
                        'Pembayaran Tertunda Baru',
                        `Pesanan dari ${newOrder.customerName} (Meja: ${newOrder.tableNumber || 'N/A'}) menunggu konfirmasi.`
                    );
                }
            }

            setPendingOrders(orders);
            prevOrderCountRef.current = orders.length;
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil pesanan tertunda:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, requestPermission, showNotification, playSound]);


    return (
        <>
            <Tabs defaultValue="pending" className="h-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="pending">
                        Pembayaran Tertunda
                        {pendingOrders.length > 0 && (
                            <Badge className={cn("ml-2", isBlinking && "animate-pulse-fast")}>{pendingOrders.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="new">Pesanan Baru (POS)</TabsTrigger>
                    <TabsTrigger value="processing">Pesanan Diproses</TabsTrigger>
                    <TabsTrigger value="completed">Pesanan Selesai</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                    <PendingPayments pendingOrders={pendingOrders} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="new" className="mt-4 h-full">
                    <NewOrder />
                </TabsContent>
                 <TabsContent value="processing" className="mt-4">
                    <ProcessingOrders />
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                    <CompletedOrders />
                </TabsContent>
            </Tabs>
        </>
    );
}

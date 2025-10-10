
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import type { OrderData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CookingPot, Utensils } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface OrderWithId extends OrderData {
    id: string;
}

export function ProcessingOrders() {
    const [processingOrders, setProcessingOrders] = useState<OrderWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "orders"),
            where("status", "in", ["Placed", "Preparing"]),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderWithId));
            setProcessingOrders(orders);
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil pesanan yang diproses:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return <div className="text-center p-10">Memuat pesanan yang sedang diproses...</div>;
    }

    if (processingOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-220px)] text-center bg-card rounded-lg border">
                 <CookingPot className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-6 text-xl font-semibold">Tidak Ada Pesanan Aktif</h3>
                <p className="mt-2 text-md text-muted-foreground">Saat ini tidak ada pesanan yang sedang disiapkan oleh dapur atau bar.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[calc(100vh-220px)]">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 <AnimatePresence>
                    {processingOrders.map(order => (
                        <motion.div
                            key={order.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                        >
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">
                                            {order.tableNumber ? `Meja ${order.tableNumber.replace('meja ','')}` : 'Take Away'}
                                        </CardTitle>
                                        <Badge variant={order.status === 'Placed' ? 'destructive' : 'secondary'} className="animate-pulse">
                                            {order.status === 'Placed' ? 'Baru' : 'Diproses'}
                                        </Badge>
                                    </div>
                                    <CardDescription>{order.customerName}</CardDescription>
                                    <p className="text-xs text-muted-foreground font-mono pt-1">{order.id}</p>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm">
                                        {order.items.map((item, index) => (
                                            <li key={index} className="flex justify-between">
                                                <span>{item.quantity}x {item.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
             </div>
        </ScrollArea>
    );
}

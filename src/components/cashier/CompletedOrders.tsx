
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import type { OrderData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { startOfDay } from 'date-fns';

interface CompletedOrder extends OrderData {
    id: string;
}

const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

export function CompletedOrders() {
    const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const todayStart = startOfDay(new Date());

        const q = query(
            collection(db, "completed_orders"),
            where("completedAt", ">=", todayStart),
            orderBy("completedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompletedOrder));
            setCompletedOrders(orders);
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil pesanan selesai:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card>
            <CardContent className="pt-6">
                 <ScrollArea className="h-[calc(100vh-250px)]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>Waktu Selesai</TableHead>
                                <TableHead>No. Bill</TableHead>
                                <TableHead>Nama Pembeli</TableHead>
                                <TableHead>No. Meja</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Memuat data...
                                    </TableCell>
                                </TableRow>
                            ) : completedOrders.length > 0 ? (
                                completedOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            {order.completedAt ? format((order.completedAt as Timestamp).toDate(), 'HH:mm:ss', { locale: id }) : 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                        <TableCell>{order.customerName}</TableCell>
                                        <TableCell>{order.tableNumber || 'Take Away'}</TableCell>
                                        <TableCell className="text-right font-medium">{formatRupiah(order.total)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Belum ada pesanan yang selesai hari ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

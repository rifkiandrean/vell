
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { OrderData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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

export function AccountingDisplay() {
    const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, "completed_orders"), orderBy("completedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompletedOrder));
            setCompletedOrders(orders);
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil pesanan selesai:", error);
            toast({
                title: "Error",
                description: "Gagal memuat data riwayat.",
                variant: "destructive"
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const renderItems = (items: CompletedOrder['items']) => {
        return (
            <ul className="list-disc list-inside">
                {items.map((item, index) => (
                    <li key={index}>
                        {item.quantity}x {item.name}
                        {item.customizations && (item.customizations.sugarLevel || item.customizations.toppings) && 
                         <span className="text-xs text-muted-foreground"> ({[item.customizations.sugarLevel, item.customizations.toppings].filter(Boolean).join(', ')})</span>}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Waktu Selesai</TableHead>
                            <TableHead>Nama Pembeli</TableHead>
                            <TableHead>No. Meja</TableHead>
                            <TableHead>Item Pesanan</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead>PPN</TableHead>
                            <TableHead>Layanan</TableHead>
                            <TableHead className="text-right">Total Akhir</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Memuat data...
                                </TableCell>
                            </TableRow>
                        ) : completedOrders.length > 0 ? (
                            completedOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        {order.completedAt ? format(order.completedAt.toDate(), 'PPP p', { locale: id }) : 'N/A'}
                                    </TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>{order.tableNumber || 'N/A'}</TableCell>
                                    <TableCell>{renderItems(order.items)}</TableCell>
                                    <TableCell>{formatRupiah(order.subtotal)}</TableCell>
                                    <TableCell>{formatRupiah(order.ppnAmount)}</TableCell>
                                    <TableCell>{formatRupiah(order.serviceChargeAmount)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatRupiah(order.total)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Belum ada pesanan yang selesai.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

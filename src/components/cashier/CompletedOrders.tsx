
"use client";

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import type { OrderData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { startOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BillReceipt, type PrinterType } from './BillReceipt';
import { Printer } from 'lucide-react';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';

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
    const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
    const [printerType, setPrinterType] = useState<PrinterType>('thermal');

    const handlePrint = () => {
        const printableArea = document.getElementById('printable-area-container');
        if (!printableArea) return;
        
        printableArea.className = `printable-area ${printerType}-printer`;

        document.body.classList.add('printing-bill');
        window.print();
        document.body.classList.remove('printing-bill');
    };


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
        <>
            <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}>
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
                                                <TableCell className="font-mono text-xs">
                                                    <DialogTrigger asChild>
                                                        <Button variant="link" className="p-0 h-auto" onClick={() => setSelectedOrder(order)}>
                                                            {order.id}
                                                        </Button>
                                                    </DialogTrigger>
                                                </TableCell>
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

                {selectedOrder && (
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Detail Bill: {selectedOrder.id}</DialogTitle>
                            <DialogDescription>
                                Rincian untuk pesanan atas nama {selectedOrder.customerName}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                             <Label>Pengaturan Cetak</Label>
                             <RadioGroup defaultValue="thermal" value={printerType} onValueChange={(value: PrinterType) => setPrinterType(value)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="thermal" id="r1" />
                                    <Label htmlFor="r1">Printer Struk (Thermal)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="standard" id="r2" />
                                    <Label htmlFor="r2">Printer Biasa (A4)</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <Separator />
                        <div className="flex justify-center p-4 bg-gray-200 rounded-md">
                            <BillReceipt order={selectedOrder} printerType={printerType} />
                        </div>
                        <DialogFooter>
                            <Button className="w-full" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" /> Cetak Bill
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
            
            <div id="printable-area-container" className="hidden">
                 {selectedOrder && <BillReceipt order={selectedOrder} printerType={printerType} />}
            </div>
        </>
    );
}

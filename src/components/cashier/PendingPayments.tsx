
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { OrderData, TableData, PaymentMethod } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Hourglass, Wallet, Smartphone, AlertTriangle, X, ShoppingBag } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { id } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface OrderWithId extends OrderData {
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

interface PendingPaymentsProps {
    pendingOrders: OrderWithId[];
    isLoading: boolean;
}

const CANCELLATION_TIME_MS = 10 * 60 * 1000; // 10 minutes

export function PendingPayments({ pendingOrders, isLoading }: PendingPaymentsProps) {
    const { user } = useAuth();
    const [selectedOrder, setSelectedOrder] = useState<OrderWithId | null>(null);
    const [timeRenders, setTimeRenders] = useState({}); // Used to force re-render for time display
    const { toast } = useToast();
    
    // State for the payment confirmation step
    const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
    const [paidAmount, setPaidAmount] = useState<number | string>('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');


    // Auto-cancellation and time update effect
    useEffect(() => {
        const intervalId = setInterval(async () => {
            const now = Date.now();
            
            for (const order of pendingOrders) {
                if (order.createdAt?.toDate) {
                    const orderAge = now - order.createdAt.toDate().getTime();
                    if (orderAge > CANCELLATION_TIME_MS) {
                        // Check again to make sure it wasn't just confirmed
                        const orderRef = doc(db, "orders", order.id);
                        const freshSnap = await getDoc(orderRef);
                        if (freshSnap.exists() && freshSnap.data().status === 'Pending Payment') {
                            await handleCancelOrder(order.id, "Pesanan dibatalkan secara otomatis karena melewati batas waktu pembayaran 10 menit.");
                        }
                    }
                }
            }
             setTimeRenders({}); // Force re-render for all time displays
        }, 1000 * 30); // Check every 30 seconds

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingOrders]);


    useEffect(() => {
        // This effect updates the selected order when the list changes.
        if (selectedOrder && !pendingOrders.some(o => o.id === selectedOrder.id)) {
            // If the previously selected order is no longer in the list, select the first one.
            setSelectedOrder(pendingOrders[0] || null);
             resetConfirmationState();
        } else if (!selectedOrder && pendingOrders.length > 0) {
            // If no order is selected, select the first one.
            setSelectedOrder(pendingOrders[0] || null);
        }
    }, [pendingOrders, selectedOrder]);
    
    useEffect(() => {
        // When selected order changes, reset the payment confirmation state
        resetConfirmationState();
        if (selectedOrder) {
            setPaymentMethod(selectedOrder.paymentMethod || 'Cash');
        }
    }, [selectedOrder]);

    const resetConfirmationState = () => {
        setConfirmingOrderId(null);
        setPaidAmount('');
    };

    const handleConfirmPayment = async (orderId: string, finalPaymentMethod: PaymentMethod) => {
        const orderRef = doc(db, "orders", orderId);
        try {
            await updateDoc(orderRef, { status: "Placed", paymentMethod: finalPaymentMethod });
            logActivity(user, `Mengonfirmasi pembayaran untuk pesanan #${orderId} via ${finalPaymentMethod}`);
            toast({
                title: "Pembayaran Dikonfirmasi",
                description: "Pesanan akan segera diproses oleh dapur.",
            });
            resetConfirmationState();
        } catch (error) {
            console.error("Gagal mengonfirmasi pembayaran:", error);
            toast({ title: "Error", description: "Gagal memperbarui status pesanan.", variant: "destructive" });
        }
    };
    
    const handleCancelOrder = async (orderId: string, reason: string) => {
        const orderRef = doc(db, "orders", orderId);
        try {
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) return; // Already processed or cancelled

            const orderData = orderSnap.data() as OrderData;
            
            // Revert table status to Available if it was linked to this order
            if (orderData.tableNumber) {
                const tableRef = doc(db, "tables", orderData.tableNumber);
                const tableSnap = await getDoc(tableRef);
                if (tableSnap.exists() && tableSnap.data().currentOrderId === orderId) {
                     await updateDoc(tableRef, {
                        status: 'Available',
                        currentOrderId: null,
                        customerName: null,
                    });
                }
            }

            await deleteDoc(orderRef);
            logActivity(user, `Membatalkan pesanan #${orderId}`);
            toast({
                variant: "destructive",
                title: "Pesanan Dibatalkan",
                description: reason,
            });

        } catch (error) {
             console.error("Gagal membatalkan pesanan:", error);
             toast({ title: "Error", description: "Gagal membatalkan pesanan.", variant: "destructive" });
        }
    }

    const getTimeLeft = (createdAt: any) => {
        if (!createdAt?.toDate) return null;
        const deadline = createdAt.toDate().getTime() + CANCELLATION_TIME_MS;
        const timeLeftMs = deadline - Date.now();
        if (timeLeftMs <= 0) return "Melebihi batas";
        return formatDistanceToNowStrict(deadline, { locale: id, addSuffix: true }).replace("dalam ", "");
    }
    
    const PaymentMethodIcon = ({ method }: { method?: PaymentMethod }) => {
        switch (method) {
            case 'Cash':
                return <Wallet className="h-4 w-4 mr-2" />;
            case 'Transfer':
                return <Smartphone className="h-4 w-4 mr-2" />;
            default:
                return null;
        }
    };
    
    const handleStartPaymentProcess = (order: OrderWithId) => {
        setConfirmingOrderId(order.id);
        setPaymentMethod(order.paymentMethod || 'Cash');
    }
    
    const changeAmount = Number(paidAmount) - (selectedOrder?.total ?? 0);

    if (isLoading) {
        return <div className="text-center p-10">Memuat pesanan...</div>;
    }

    if (pendingOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-220px)] text-center bg-card rounded-lg border">
                 <Hourglass className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-6 text-xl font-semibold">Tidak Ada Pembayaran Tertunda</h3>
                <p className="mt-2 text-md text-muted-foreground">Semua pesanan yang menunggu pembayaran telah dikonfirmasi.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
           <div className="md:col-span-1 bg-card rounded-lg border">
                <CardHeader>
                    <CardTitle>Menunggu Pembayaran ({pendingOrders.length})</CardTitle>
                </CardHeader>
                <ScrollArea className="h-[calc(100%-80px)]">
                    <div className="p-2 space-y-2">
                        {pendingOrders.map(order => {
                            const timeLeft = getTimeLeft(order.createdAt);
                            const isOverdue = timeLeft === "Melebihi batas";
                            return (
                                <button
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-md border transition-colors",
                                        selectedOrder?.id === order.id
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "bg-muted/50 hover:bg-muted"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg">{order.tableNumber ? `Meja ${order.tableNumber.replace('meja ','')}` : <span className="flex items-center gap-1"><ShoppingBag className="h-4 w-4" />Take Away</span>}</p>
                                            <p className="text-sm font-medium">{order.customerName}</p>
                                        </div>
                                        <Badge
                                            variant={selectedOrder?.id === order.id ? 'secondary': 'default'}
                                            className="flex items-center"
                                        >
                                            <PaymentMethodIcon method={order.paymentMethod} />
                                            {order.paymentMethod}
                                        </Badge>
                                    </div>
                                    <div className={cn(
                                        "text-xs mt-2 font-semibold flex items-center", 
                                        isOverdue ? 'text-red-500' : 'text-amber-600'
                                    )}>
                                        <AlertTriangle className="h-3 w-3 mr-1" /> 
                                        Batas waktu: {timeLeft || 'N/A'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>
            
            <div className="md:col-span-2">
                {selectedOrder ? (
                    <Card className="h-full flex flex-col shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl">Detail Pesanan</CardTitle>
                             <p className="text-sm text-muted-foreground pt-1 font-mono">{selectedOrder.id}</p>
                            <CardDescription>
                                {selectedOrder.tableNumber ? `Meja ${selectedOrder.tableNumber.replace('meja ','')}` : 'Take Away'} - {selectedOrder.customerName} | {' '}
                                {selectedOrder.createdAt ? format(selectedOrder.createdAt.toDate(), 'd MMM yyyy, HH:mm', { locale: id }) : 'N/A'}
                            </CardDescription>
                        </CardHeader>
                        <ScrollArea className="flex-grow">
                        <CardContent className="pr-6">
                            <ul className="space-y-4">
                                {selectedOrder.items.map((item, index) => (
                                    <li key={index} className="flex justify-between items-start">
                                        <div className="flex items-start gap-4">
                                             <div className="font-bold text-primary w-6 text-center">{item.quantity}x</div>
                                             <div>
                                                <p className="font-semibold">{item.name}</p>
                                                {item.customizations && (item.customizations.sugarLevel || item.customizations.toppings) && 
                                                <p className="text-xs text-muted-foreground">
                                                    {[item.customizations.sugarLevel, item.customizations.toppings].filter(Boolean).join(', ')}
                                                </p>}
                                             </div>
                                        </div>
                                        <p className="font-medium whitespace-nowrap">{formatRupiah(item.price)}</p>
                                    </li>
                                ))}
                            </ul>
                            <div className="space-y-2 text-sm mt-4 pt-4 border-t">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatRupiah(selectedOrder.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">PPN</span>
                                    <span>{formatRupiah(selectedOrder.ppnAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Service</span>
                                    <span>{formatRupiah(selectedOrder.serviceChargeAmount)}</span>
                                </div>
                            </div>
                             <div className="mt-4 pt-4 border-t-2">
                                <div className="flex justify-between font-bold text-2xl text-primary">
                                    <span>TOTAL</span>
                                    <span>{formatRupiah(selectedOrder.total)}</span>
                                </div>
                            </div>
                        </CardContent>
                        </ScrollArea>
                        <CardFooter className="flex-col gap-4 pt-4 border-t-2">
                             {confirmingOrderId === selectedOrder.id ? (
                                <div className="w-full space-y-4 animate-in fade-in-50 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                                            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                                <SelectTrigger id="paymentMethod">
                                                    <SelectValue placeholder="Pilih metode" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                    <SelectItem value="Transfer">Transfer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="paidAmount">Nominal Pembayaran (IDR)</Label>
                                            <Input 
                                                id="paidAmount" 
                                                type="number"
                                                value={paidAmount}
                                                onChange={(e) => setPaidAmount(e.target.value)}
                                                placeholder="e.g., 100000"
                                            />
                                        </div>
                                    </div>
                                    
                                    {changeAmount >= 0 && Number(paidAmount) > 0 && (
                                         <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
                                            <span className="text-lg font-bold">Kembalian:</span>
                                            <span className="text-xl font-bold text-green-600">{formatRupiah(changeAmount)}</span>
                                        </div>
                                    )}

                                    <div className="flex w-full gap-2">
                                        <Button variant="ghost" onClick={resetConfirmationState}>
                                            <X className="mr-2 h-4 w-4" /> Batal
                                        </Button>
                                        <Button 
                                            onClick={() => handleConfirmPayment(selectedOrder.id, paymentMethod)}
                                            size="lg" 
                                            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg"
                                            disabled={changeAmount < 0}
                                        >
                                            <CheckCircle2 className="mr-3 h-6 w-6" /> Selesaikan Pembayaran
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex w-full gap-2">
                                    <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-1/3">Batalkan</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Batalkan Pesanan Ini?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tindakan ini akan menghapus pesanan dari antrian. Jika meja terkait, statusnya akan dikembalikan menjadi 'Available'. Lanjutkan?
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Tidak</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleCancelOrder(selectedOrder.id, "Pesanan dibatalkan secara manual oleh kasir.")}>Ya, Batalkan</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                    </AlertDialog>
                                    <Button onClick={() => handleStartPaymentProcess(selectedOrder)} size="lg" className="w-2/3">
                                        Proses Pembayaran
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="flex items-center justify-center h-full bg-card rounded-lg border">
                        <p className="text-muted-foreground">Pilih pesanan untuk melihat detail.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

    
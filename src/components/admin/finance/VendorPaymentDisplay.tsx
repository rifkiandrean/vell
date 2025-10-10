"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import type { PurchaseOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '../../ui/badge';
import { MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { Button } from '../../ui/button';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';
import { Separator } from '@/components/ui/separator';

const formatRupiah = (price?: number) => {
    if (price === undefined || price === null || isNaN(price)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

export function VendorPaymentDisplay() {
    const [awaitingPaymentOrders, setAwaitingPaymentOrders] = useState<PurchaseOrder[]>([]);
    const [paidOrders, setPaidOrders] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        // Query for orders awaiting payment
        const qAwaiting = query(collection(db, "purchase_orders"), where("status", "==", "Ordered"));
        const unsubAwaiting = onSnapshot(qAwaiting, (snapshot) => {
            const pos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
            setAwaitingPaymentOrders(pos);
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil data PO untuk pembayaran:", error);
            toast({ title: "Error", description: "Gagal memuat data PO yang menunggu pembayaran.", variant: "destructive" });
            setIsLoading(false);
        });

        // Query for paid or completed orders
        const qPaid = query(
            collection(db, "purchase_orders"), 
            where("status", "in", ["Paid", "Completed"])
        );
        const unsubPaid = onSnapshot(qPaid, (snapshot) => {
            const pos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
            // Sort client-side to avoid needing a composite index immediately
            pos.sort((a, b) => {
                const dateA = a.orderDate?.toDate() || 0;
                const dateB = b.orderDate?.toDate() || 0;
                return dateB.valueOf() - dateA.valueOf();
            });
            setPaidOrders(pos);
        }, (error) => {
            console.error("Gagal mengambil data PO yang sudah dibayar:", error);
            toast({ title: "Error", description: "Gagal memuat riwayat pembayaran.", variant: "destructive" });
        });


        return () => {
          unsubAwaiting();
          unsubPaid();
        };
    }, [toast]);
    
    const handleUpdatePaymentStatus = async (poId: string, newStatus: 'Paid' | 'Payment Rejected') => {
      const poRef = doc(db, 'purchase_orders', poId);
      try {
        await updateDoc(poRef, { status: newStatus });
        logActivity(user, `Mengubah status pembayaran PO #${poId} menjadi ${newStatus}`);
        toast({
          title: "Status Pembayaran Diperbarui",
          description: `PO #${poId} telah ditandai sebagai ${newStatus === 'Paid' ? 'Telah Dibayar' : 'Pembayaran Ditolak'}.`
        });
      } catch (error) {
        console.error("Gagal memperbarui status pembayaran:", error);
        toast({
          title: "Error",
          description: "Gagal memperbarui status pembayaran PO.",
          variant: "destructive"
        });
      }
    };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Daftar PO Menunggu Pembayaran</CardTitle>
          <CardDescription>
              Purchase Order yang sudah disetujui dan menunggu untuk dibayarkan ke vendor.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tanggal Order</TableHead>
                        <TableHead>ID Order</TableHead>
                        <TableHead>Nama Vendor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : awaitingPaymentOrders.length > 0 ? (
                    awaitingPaymentOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell>
                          {po.orderDate ? format(po.orderDate.toDate(), 'd MMM yyyy', { locale: id }) : 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{po.id}</TableCell>
                        <TableCell className="font-medium">{po.vendorName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{po.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(po.totalAmount)}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => handleUpdatePaymentStatus(po.id, 'Paid')}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Tandai Telah Dibayar
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleUpdatePaymentStatus(po.id, 'Payment Rejected')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Tandai Pembayaran Ditolak
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Tidak ada Purchase Order yang menunggu pembayaran saat ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <Separator />

       <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembayaran PO</CardTitle>
          <CardDescription>
              Daftar Purchase Order yang telah dibayar atau diselesaikan.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tanggal Order</TableHead>
                        <TableHead>ID Order</TableHead>
                        <TableHead>Nama Vendor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Memuat riwayat...
                      </TableCell>
                    </TableRow>
                  ) : paidOrders.length > 0 ? (
                    paidOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell>
                          {po.orderDate ? format(po.orderDate.toDate(), 'd MMM yyyy', { locale: id }) : 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{po.id}</TableCell>
                        <TableCell className="font-medium">{po.vendorName}</TableCell>
                        <TableCell>
                          <Badge variant={po.status === 'Completed' ? 'default' : 'secondary'}>
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(po.totalAmount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Belum ada riwayat pembayaran.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}

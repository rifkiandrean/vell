

"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import type { PurchaseOrder, Vendor, CompanyInfo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
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
import { MoreVertical, Trash2, Eye, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { exportPOToPDF } from '@/lib/po-pdf-export';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';

const formatRupiah = (price?: number) => {
    if (price === undefined || price === null || isNaN(price)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

export function OrderManagement() {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        const q = query(collection(db, "purchase_orders"), orderBy("orderDate", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
            setPurchaseOrders(pos);
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil data PO:", error);
            toast({
                title: "Error",
                description: "Gagal memuat data purchase order.",
                variant: "destructive"
            });
            setIsLoading(false);
        });

        const unsubVendors = onSnapshot(collection(db, 'vendors'), (snapshot) => {
            setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor)));
        });

        const unsubCompanyInfo = onSnapshot(doc(db, "settings", "companyInfo"), (doc) => {
            if (doc.exists()) {
                setCompanyInfo(doc.data() as CompanyInfo);
            }
        });

        return () => { unsubscribe(); unsubVendors(); unsubCompanyInfo(); };
    }, [toast]);
    
    const handleCreateNew = () => {
        router.push('/ers/cafe/admin/orders/new');
    };

    const handleViewDetails = (id: string) => {
        router.push(`/ers/cafe/admin/orders/${id}`);
    };
    
    const handleDelete = async (id: string) => {
      const orderToDelete = purchaseOrders.find(po => po.id === id);
      if (orderToDelete && (orderToDelete.status === 'Completed' || orderToDelete.status === 'Paid')) {
        toast({
          title: "Aksi Ditolak",
          description: "Purchase Order yang sudah dibayar atau selesai tidak dapat dihapus.",
          variant: "destructive",
        });
        return;
      }
      try {
        await deleteDoc(doc(db, "purchase_orders", id));
        logActivity(user, `Menghapus PO #${id}`);
        toast({
          title: "Sukses!",
          description: "Purchase Order telah dihapus.",
        });
      } catch (error) {
        console.error("Gagal menghapus PO: ", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Gagal menghapus purchase order.",
        });
      }
    };
    
    const handleDownloadPDF = async (po: PurchaseOrder) => {
        if (!companyInfo) {
            toast({ title: "Error", description: "Informasi perusahaan tidak ditemukan.", variant: "destructive" });
            return;
        }
        const vendor = vendors.find(v => v.id === po.vendorId);
        if (!vendor) {
            toast({ title: "Error", description: "Data vendor tidak ditemukan.", variant: "destructive" });
            return;
        }
        try {
            await exportPOToPDF({ po, vendor, companyInfo });
            logActivity(user, `Mengunduh PDF untuk PO #${po.id}`);
            toast({ title: "PDF Dibuat!", description: `Purchase Order ${po.id} telah diunduh.`});
        } catch (error) {
            console.error("Gagal membuat PDF:", error);
            toast({ title: "Error", description: `Gagal membuat file PDF. ${error}`, variant: "destructive" });
        }
    };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Manajemen Purchase Order</CardTitle>
            <CardDescription>
            Kelola pesanan pembelian (Purchase Order) ke vendor atau pemasok Anda.
            </CardDescription>
        </div>
        <Button onClick={handleCreateNew}>Buat Order Baru</Button>
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
                ) : purchaseOrders.length > 0 ? (
                  purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>
                        {po.orderDate ? format(po.orderDate.toDate(), 'd MMM yyyy', { locale: id }) : 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{po.id}</TableCell>
                      <TableCell className="font-medium">{po.vendorName}</TableCell>
                      <TableCell>
                         <Badge
                            variant={
                                po.status === 'Completed' ? 'default' : 
                                po.status === 'Paid' ? 'default' :
                                po.status === 'Ordered' ? 'secondary' : 
                                po.status === 'Pending Approval' ? 'destructive' : 
                                po.status === 'Payment Rejected' ? 'destructive' : 'outline'
                            }
                         >
                            {po.status}
                        </Badge>
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
                              <DropdownMenuItem onClick={() => handleViewDetails(po.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat/Ubah
                              </DropdownMenuItem>
                              {(po.status === 'Ordered' || po.status === 'Completed' || po.status === 'Paid') && (
                                <DropdownMenuItem onClick={() => handleDownloadPDF(po)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Unduh PDF
                                </DropdownMenuItem>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tindakan ini tidak dapat dibatalkan. PO yang sudah 'Paid' atau 'Completed' tidak bisa dihapus.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(po.id)}>Hapus</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Belum ada Purchase Order. Klik "Buat Order Baru" untuk memulai.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
          </Table>
      </CardContent>
    </Card>
  );
}

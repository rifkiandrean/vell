

"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, addDoc, getDocs } from 'firebase/firestore';
import type { Vendor } from '@/lib/types';
import { AddVendorForm } from './AddVendorForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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
import { Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';

const sampleVendors: Omit<Vendor, 'id'>[] = [
    { name: "Pemasok Kopi Nusantara", contactPerson: "Bapak Surya", phone: "081234567890", email: "sales@kopinusantara.com", address: "Jl. Kopi No. 1, Bandung" },
    { name: "Susu Segar Sentosa", contactPerson: "Ibu Murni", phone: "082345678901", email: "info@sususegar.id", address: "Jl. Peternakan No. 23, Lembang" },
    { name: "Toko Gula Manis", contactPerson: "Pak Tebu", phone: "083456789012", email: "order@gulamanis.com", address: "Jl. Pabrik Gula No. 5, Cirebon" },
    { name: "Sirup Aneka Rasa", contactPerson: "Bapak Rasa", phone: "084567890123", email: "marketing@sirup.com", address: "Jl. Buah No. 8, Jakarta" },
    { name: "Kemasan Jaya Abadi", contactPerson: "Ibu Kemas", phone: "085678901234", email: "cs@kemasanjaya.com", address: "Jl. Industri No. 101, Tangerang" }
];


export function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Vendor | undefined>(undefined);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const seedVendors = async () => {
        const vendorsCollection = collection(db, 'vendors');
        const snapshot = await getDocs(vendorsCollection);
        if (snapshot.empty) {
            console.log("No vendors found, seeding initial data...");
            for (const vendorData of sampleVendors) {
                await addDoc(vendorsCollection, vendorData);
            }
            toast({
                title: "Data Vendor Ditambahkan",
                description: "5 data vendor contoh telah ditambahkan ke database.",
            });
        }
    };

    seedVendors();

    const unsubscribe = onSnapshot(collection(db, 'vendors'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
      setVendors(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data vendor: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data vendor.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleEditClick = (item: Vendor) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, "vendors", id));
      logActivity(user, `Menghapus vendor: ${name}`);
      toast({
        title: "Sukses!",
        description: "Vendor telah dihapus.",
      });
    } catch (error) {
      console.error("Gagal menghapus dokumen: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus vendor.",
      });
    }
  };

  const isEditMode = !!editingItem;

  return (
     <div className="space-y-8">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manajemen Vendor</CardTitle>
                    <CardDescription>
                    Kelola daftar vendor atau pemasok bahan baku Anda.
                    </CardDescription>
                </div>
                <Button onClick={handleAddNewClick}>Tambah Vendor Baru</Button>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nama Vendor</TableHead>
                    <TableHead>Narahubung</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Alamat</TableHead>
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
                    ) : vendors.length > 0 ? (
                        vendors.map((vendor) => (
                            <TableRow key={vendor.id}>
                                <TableCell className="font-medium">{vendor.name}</TableCell>
                                <TableCell>{vendor.contactPerson}</TableCell>
                                <TableCell>{vendor.phone}</TableCell>
                                <TableCell>{vendor.email}</TableCell>
                                <TableCell>{vendor.address}</TableCell>
                                <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(vendor)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data vendor secara permanen.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(vendor.id, vendor.name)}>Hapus</AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Belum ada data vendor. Klik "Tambah Vendor Baru" untuk memulai.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
            </Card>

             <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                <DialogTitle>{isEditMode ? "Ubah Vendor" : "Tambah Vendor Baru"}</DialogTitle>
                <DialogDescription>{isEditMode ? "Ubah detail vendor di bawah ini." : "Isi formulir untuk menambahkan vendor baru."}</DialogDescription>
                </DialogHeader>
                <AddVendorForm vendor={editingItem} onFormSubmit={() => setIsFormOpen(false)} />
            </DialogContent>
        </Dialog>
     </div>
  );
}

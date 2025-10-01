
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, serverTimestamp, addDoc, updateDoc } from 'firebase/firestore';
import type { ExpenseItem } from '@/lib/types';
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
import { AddExpenseForm } from './AddExpenseForm';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const formatRupiah = (price?: number) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

export function ExpensesManagement() {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseItem));
      items.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      setExpenseItems(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data beban: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data beban.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleEditClick = (item: ExpenseItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
      toast({
        title: "Sukses!",
        description: "Item beban telah dihapus.",
      });
    } catch (error) {
      console.error("Gagal menghapus dokumen: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus item beban.",
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
              <CardTitle>Daftar Beban Operasional</CardTitle>
              <CardDescription>Catat semua pengeluaran di luar biaya bahan baku, seperti gaji, sewa, listrik, dll.</CardDescription>
            </div>
            <Button onClick={handleAddNewClick}>Tambah Beban Baru</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nama Beban</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.date ? format(item.date.toDate(), 'PPP', { locale: id }) : 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{formatRupiah(item.amount)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
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
                                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus item beban secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Ubah Item Beban" : "Tambah Beban Baru"}</DialogTitle>
              <DialogDescription>{isEditMode ? "Ubah detail item di bawah ini." : "Isi formulir untuk menambahkan item beban baru."}</DialogDescription>
            </DialogHeader>
            <AddExpenseForm expenseItem={editingItem} onFormSubmit={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

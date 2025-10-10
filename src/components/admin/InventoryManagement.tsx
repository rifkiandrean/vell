
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { InventoryItem } from '@/lib/types';
import { AddInventoryItemForm } from './AddInventoryItemForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

const formatRupiah = (price?: number) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

export function InventoryManagement() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'gudang'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      items.sort((a, b) => a.name.localeCompare(b.name));
      setInventoryItems(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data gudang: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data gudang.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, "gudang", id));
      logActivity(user, `Menghapus item gudang: ${name}`);
      toast({
        title: "Sukses!",
        description: "Item gudang telah dihapus.",
      });
    } catch (error) {
      console.error("Gagal menghapus dokumen: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus item gudang.",
      });
    }
  };

  const handleStockClick = (item: InventoryItem) => {
    setEditingStockId(item.id);
    setStockValue(item.stock);
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStockValue(Number(e.target.value));
  };
  
  const handleStockUpdate = async (itemId: string, itemName: string, oldStock: number) => {
    if (editingStockId !== itemId) return;
    try {
        const docRef = doc(db, "gudang", itemId);
        await updateDoc(docRef, { stock: stockValue });
        logActivity(user, `Memperbarui stok ${itemName} dari ${oldStock} menjadi ${stockValue}`);
        toast({
            title: "Sukses!",
            description: "Jumlah stok telah diperbarui.",
        });
    } catch (error) {
        console.error("Gagal memperbarui stok: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Gagal memperbarui stok.",
        });
    } finally {
        setEditingStockId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, item: InventoryItem) => {
    if (e.key === 'Enter') {
      handleStockUpdate(item.id, item.name, item.stock);
    } else if (e.key === 'Escape') {
      setEditingStockId(null);
    }
  };


  return (
    <div className="space-y-8">
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Stok Gudang</CardTitle>
            <Button onClick={handleAddNewClick}>Tambah Item Baru</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Item</TableHead>
                  <TableHead>Jumlah Stok</TableHead>
                  <TableHead>Satuan</TableHead>
                   <TableHead>Harga Beli / Satuan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell onClick={() => handleStockClick(item)} className="cursor-pointer">
                           {editingStockId === item.id ? (
                            <Input
                                type="number"
                                value={stockValue}
                                onChange={handleStockChange}
                                onBlur={() => handleStockUpdate(item.id, item.name, item.stock)}
                                onKeyDown={(e) => handleKeyDown(e, item)}
                                autoFocus
                                className="w-24 h-8"
                            />
                            ) : (
                                item.stock
                            )}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                         <TableCell>{formatRupiah(item.price)}</TableCell>
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
                                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus item gudang secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id, item.name)}>Hapus</AlertDialogAction>
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
          <AddInventoryItemForm inventoryItem={editingItem} onFormSubmit={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

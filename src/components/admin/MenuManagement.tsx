

"use client";

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { MenuItem, MenuItemCategory, SugarLevel } from '@/lib/types';
import { AddMenuItemForm } from './AddMenuItemForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
import { Trash2, Edit, FileUp, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';

const isValidUrl = (urlString: string) => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

const validCategories: MenuItemCategory[] = ["Coffee Based", "Milk Based", "Juice", "Mocktail", "Food", "Desserts"];
const validSugarLevels: SugarLevel[] = ['Less Sugar', 'Normal', 'Extra Sugar'];

const BulkImportDialog = ({ onImportSuccess }: { onImportSuccess: () => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            { 
                name: "Contoh Kopi Enak",
                description: "Deskripsi singkat kopi enak.",
                price: 35000,
                category: "Coffee Based",
                image: "cappuccino",
                sugarLevels: "Less Sugar, Normal, Extra Sugar"
            },
             { 
                name: "Contoh Makanan Lezat",
                description: "Deskripsi singkat makanan lezat.",
                price: 55000,
                category: "Food",
                image: "https://images.unsplash.com/photo-1592415486695-555540324159?q=80&w=1080&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                sugarLevels: ""
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Produk");
         // Add comments for explanation
        const comments = [
            { cell: "A1", text: "Nama produk Anda." },
            { cell: "B1", text: "Deskripsi singkat yang menarik." },
            { cell: "C1", text: "Harga dalam format angka (contoh: 35000)." },
            { cell: "D1", text: `Kategori yang valid: ${validCategories.join(', ')}.` },
            { cell: "E1", text: "URL gambar atau ID dari gambar placeholder (contoh: 'cappuccino' atau 'https://url.gambar/anda.jpg')." },
            { cell: "F1", text: "Pilihan tingkat kemanisan, pisahkan dengan koma (contoh: 'Less Sugar, Normal'). Kosongkan jika tidak ada." },
        ];
        comments.forEach(c => {
            if(!worksheet[c.cell].c) worksheet[c.cell].c=[];
            worksheet[c.cell].c.push({a:"Template", t:c.text});
        });
        XLSX.writeFile(workbook, "template_produk.xlsx");
    };
    
    const handleImport = async () => {
        if (!file) {
            toast({ title: "Tidak ada file", description: "Silakan pilih file Excel untuk diimpor.", variant: "destructive" });
            return;
        }

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    throw new Error("File Excel kosong atau format tidak sesuai.");
                }

                const batch = writeBatch(db);
                let count = 0;
                let skippedCount = 0;

                json.forEach((row, index) => {
                    if (!row.name || !row.description || row.price == null || !row.category) {
                        console.warn(`Melewatkan baris ${index + 2}: Data tidak lengkap.`);
                        skippedCount++;
                        return;
                    }

                    const category = row.category.trim();
                    if (!validCategories.includes(category)) {
                         console.warn(`Melewatkan baris ${index + 2}: Kategori '${category}' tidak valid.`);
                         skippedCount++;
                         return;
                    }
                    
                    const sugarLevels = (row.sugarLevels || "")
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter((s: string) => validSugarLevels.includes(s as SugarLevel));

                    const newMenuItem: Omit<MenuItem, 'id'> = {
                        name: row.name,
                        description: row.description,
                        price: Number(row.price),
                        category: category,
                        image: row.image || "",
                        customizations: {
                            sugarLevels: sugarLevels,
                            toppings: [], // Toppings cannot be managed via Excel for now
                        },
                    };

                    const docRef = doc(collection(db, "menu"));
                    batch.set(docRef, newMenuItem);
                    count++;
                });

                if (count === 0) {
                    throw new Error("Tidak ada data valid yang ditemukan dalam file untuk diimpor.");
                }

                await batch.commit();
                logActivity(user, `Mengimpor ${count} produk baru dari file Excel.`);
                toast({ title: "Impor Berhasil!", description: `${count} produk baru ditambahkan. ${skippedCount > 0 ? `${skippedCount} baris dilewati.` : ''}` });
                onImportSuccess(); // Closes the dialog
            } catch (error: any) {
                 toast({
                    title: "Impor Gagal",
                    description: error.message || "Terjadi kesalahan saat memproses file.",
                    variant: "destructive",
                });
            } finally {
                setIsImporting(false);
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Impor Produk Massal dari Excel</DialogTitle>
                <DialogDescription>
                    Unggah file .xlsx untuk menambahkan beberapa produk sekaligus. Unduh template untuk memastikan format yang benar.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh Template Excel
                </Button>
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    disabled={isImporting}
                />
                 {file && <p className="text-sm text-muted-foreground">File dipilih: {file.name}</p>}
            </div>
            <DialogFooter>
                <Button onClick={handleImport} disabled={!file || isImporting}>
                    <FileUp className="mr-2 h-4 w-4" />
                    {isImporting ? "Mengimpor..." : "Impor Sekarang"}
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenuItems(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data menu: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data menu.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleEditClick = (item: MenuItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, "menu", id));
      logActivity(user, `Menghapus produk: ${name}`);
      toast({
        title: "Sukses!",
        description: "Item menu telah dihapus.",
      });
    } catch (error) {
      console.error("Gagal menghapus dokumen: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus item menu.",
      });
    }
  };
  
  const getImageUrl = (imageIdentifier: string) => {
    if (isValidUrl(imageIdentifier)) {
      return imageIdentifier;
    }
    const placeholder = PlaceHolderImages.find(p => p.id === imageIdentifier);
    return placeholder ? placeholder.imageUrl : ''; // Return a fallback or empty string
  };

  const isEditMode = !!editingItem;

  return (
    <div className="space-y-8">
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Daftar Menu</CardTitle>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>Impor dari Excel</Button>
                  <Button onClick={handleAddNewClick}>Tambah Produk Baru</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Gambar</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
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
                    menuItems.map((item) => {
                      const imageUrl = getImageUrl(item.image);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                             <div className="relative h-12 w-12 rounded-md overflow-hidden">
                                {imageUrl && <Image src={imageUrl} alt={item.name} fill sizes="48px" className="object-cover" />}
                             </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>Rp{item.price.toLocaleString('id-ID')}</TableCell>
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
                                    Tindakan ini tidak dapat dibatalkan. Ini akan menghapus item menu secara permanen.
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <BulkImportDialog onImportSuccess={() => setIsBulkImportOpen(false)} />
        </Dialog>
        
        <DialogContent className="sm:max-w-[600px] grid-rows-[auto_minmax(0,1fr)] p-0">
           <DialogHeader className="p-6 pb-0">
            <DialogTitle>{isEditMode ? "Ubah Item Menu" : "Tambah Item Menu Baru"}</DialogTitle>
            <DialogDescription>{isEditMode ? "Ubah detail produk di bawah ini." : "Isi formulir di bawah ini untuk menambahkan produk baru."}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="p-6">
              <AddMenuItemForm menuItem={editingItem} onFormSubmit={() => setIsFormOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

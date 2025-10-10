

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, doc, addDoc, updateDoc, getDoc, onSnapshot, writeBatch, runTransaction, serverTimestamp, setDoc, query, where, getDocs } from "firebase/firestore";
import type { Vendor, InventoryItem, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, CompanyInfo } from "@/lib/types";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Save, Send, ChevronsUpDown, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { exportPOToPDF } from '@/lib/po-pdf-export';
import { logActivity } from '@/lib/activity-log';


const poItemSchema = z.object({
  itemId: z.string().min(1),
  name: z.string(),
  quantity: z.coerce.number().min(0.01, "Jumlah harus lebih dari 0"),
  unit: z.string(),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
});

const poSchema = z.object({
  vendorId: z.string().min(1, "Vendor wajib dipilih"),
  notes: z.string().optional(),
  items: z.array(poItemSchema).min(1, "Tambahkan setidaknya satu item"),
});

type POFormValues = z.infer<typeof poSchema>;

interface POFormProps {
  poId?: string;
}

const formatRupiah = (price?: number) => {
    if (price === undefined || price === null || isNaN(price)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

const useUserRole = () => {
    return 'Manager'; 
};

async function generateNewPOId() {
    const today = new Date();
    const dateSuffix = format(today, 'ddMMyyyy');
    const prefix = `PO-`;

    const poRef = collection(db, "purchase_orders");
    const todayIdRegex = new RegExp(`^${prefix}\\d{3}${dateSuffix}$`);
    
    const querySnapshot = await getDocs(poRef);
    let todayCount = 0;
    querySnapshot.forEach((doc) => {
        if (todayIdRegex.test(doc.id)) {
            todayCount++;
        }
    });

    const newSequence = (todayCount + 1).toString().padStart(3, '0');
    return `${prefix}${newSequence}${dateSuffix}`;
}


export function POForm({ poId }: POFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!poId;
  const userRole = useUserRole();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState('');
  const [poStatus, setPoStatus] = useState<PurchaseOrderStatus>('Draft');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [currentPoId, setCurrentPoId] = useState(poId);


  useEffect(() => {
    const unsubVendors = onSnapshot(collection(db, 'vendors'), (snapshot) => {
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor)));
    });
    const unsubInventory = onSnapshot(collection(db, 'gudang'), (snapshot) => {
      setInventoryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    });
     const unsubCompanyInfo = onSnapshot(doc(db, "settings", "companyInfo"), (doc) => {
      if (doc.exists()) {
        setCompanyInfo(doc.data() as CompanyInfo);
      }
    });
    return () => { unsubVendors(); unsubInventory(); unsubCompanyInfo(); };
  }, []);

  const form = useForm<POFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      vendorId: "",
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch('items');

  useEffect(() => {
    const fetchPO = async () => {
      if (poId) {
        setIsLoading(true);
        const docRef = doc(db, "purchase_orders", poId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const poData = docSnap.data() as PurchaseOrder;
          form.reset({
            vendorId: poData.vendorId,
            notes: poData.notes || "",
            items: poData.items,
          });
          setPoStatus(poData.status);
          setCurrentPoId(poData.id);
        } else {
          toast({ title: "Error", description: "Purchase Order tidak ditemukan.", variant: "destructive" });
          router.push('/cafe/admin/orders');
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setCurrentPoId(undefined);
      }
    };
    fetchPO();
  }, [poId, form, toast, router]);


  const addInventoryItemToPO = () => {
    const itemToAdd = inventoryItems.find(i => i.id === selectedInventoryItem);
    if (itemToAdd) {
      const itemExists = fields.some(field => field.itemId === itemToAdd.id);
      if (itemExists) {
        toast({ title: "Item Sudah Ada", description: "Item ini sudah ada di dalam Purchase Order.", variant: 'default' });
        return;
      }
      append({
        itemId: itemToAdd.id,
        name: itemToAdd.name,
        quantity: 1,
        unit: itemToAdd.unit,
        price: itemToAdd.price || 0,
      });
      setSelectedInventoryItem('');
    }
  };
  
  const handleSave = async (data: POFormValues, newStatus: PurchaseOrderStatus) => {
    const vendor = vendors.find(v => v.id === data.vendorId);
    if (!vendor) {
        toast({ title: "Error", description: "Vendor tidak valid.", variant: "destructive" });
        return;
    }
    
    const totalAmount = data.items.reduce((total, item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        return total + quantity * price;
    }, 0);


    try {
        if (isEditMode && currentPoId) {
            const poData: Partial<PurchaseOrder> = {
                vendorId: vendor.id,
                vendorName: vendor.name,
                items: data.items,
                totalAmount: totalAmount,
                status: newStatus,
                notes: data.notes || "",
            };
            const docRef = doc(db, "purchase_orders", currentPoId);
            await updateDoc(docRef, poData);
            logActivity(user, `Memperbarui PO #${currentPoId} menjadi status '${newStatus}'`);
            toast({ title: "Sukses!", description: `Purchase Order telah diperbarui.` });
        } else {
            const newId = await generateNewPOId();
            const poData: PurchaseOrder = {
                id: newId,
                vendorId: vendor.id,
                vendorName: vendor.name,
                orderDate: serverTimestamp(),
                items: data.items,
                totalAmount: totalAmount,
                status: newStatus,
                notes: data.notes || "",
            };
            const docRef = doc(db, "purchase_orders", newId);
            await setDoc(docRef, poData);
            logActivity(user, `Membuat PO baru #${newId} dengan status '${newStatus}'`);
            toast({ title: "Sukses!", description: `Purchase Order baru telah dibuat.` });
        }
        router.push('/ers/cafe/admin/orders');
    } catch (error) {
        console.error("Gagal menyimpan PO:", error);
        toast({ title: "Error", description: "Gagal menyimpan Purchase Order.", variant: "destructive" });
    }
  };

  const handleStatusChange = async (newStatus: PurchaseOrderStatus) => {
    if (!poId) return;
    if (!companyInfo || !user) {
        toast({ title: "Error", description: "Informasi perusahaan tidak lengkap.", variant: "destructive"});
        return;
    }

    try {
        const poRef = doc(db, "purchase_orders", poId);
        
        await updateDoc(poRef, { status: newStatus });
        logActivity(user, `Mengubah status PO #${poId} menjadi '${newStatus}'`);
        toast({ title: "Status Diperbarui", description: `Status PO diubah menjadi ${newStatus}.`});
        setPoStatus(newStatus);
        
        if (newStatus === 'Ordered') {
            toast({ title: "Menunggu Pembayaran", description: "PO telah diteruskan ke bagian keuangan untuk pembayaran."});
        }
        
        router.push('/ers/cafe/admin/orders');

    } catch(error) {
        console.error("Gagal mengubah status:", error);
        toast({ title: "Error", description: `Gagal mengubah status PO. ${error}`, variant: "destructive"});
    }
  };
  
  const handleCompletePO = async () => {
     if (!poId || poStatus !== 'Paid') {
        toast({ title: "Aksi Ditolak", description: "Hanya PO yang sudah 'Paid' yang bisa diselesaikan.", variant: "destructive"});
        return;
     }

    try {
        await runTransaction(db, async (transaction) => {
            const poRef = doc(db, "purchase_orders", poId);
            const poSnap = await transaction.get(poRef);

            if (!poSnap.exists()) {
                throw new Error("Purchase Order tidak ditemukan!");
            }
            
            const poData = poSnap.data() as PurchaseOrder;

            // 1. Perform all reads first
            const inventoryRefs = poData.items.map(item => doc(db, "gudang", item.itemId));
            const inventorySnaps = await Promise.all(inventoryRefs.map(ref => transaction.get(ref)));

            // 2. Now perform all writes
            inventorySnaps.forEach((inventorySnap, index) => {
                const item = poData.items[index];
                if (inventorySnap.exists()) {
                    const currentStock = inventorySnap.data().stock;
                    const newStock = currentStock + item.quantity;
                    transaction.update(inventorySnap.ref, { stock: newStock });
                }
            });

            // 3. Finally, update the PO status
            transaction.update(poRef, { status: 'Completed', receivedDate: serverTimestamp() });
        });
        logActivity(user, `Menyelesaikan PO #${poId} dan memperbarui stok.`);
        toast({ title: "Sukses!", description: "Stok gudang telah diperbarui dan PO ditandai selesai." });
        router.push('/ers/cafe/admin/orders');

    } catch (error) {
        console.error("Gagal menyelesaikan PO:", error);
        toast({ title: "Error", description: `Gagal menyelesaikan PO: ${error}`, variant: "destructive" });
    }
  };


  const isFormLocked = ['Completed', 'Ordered', 'Paid'].includes(poStatus);
  const showApprovalButtons = poStatus === 'Pending Approval' && userRole === 'Manager';
  const showSubmitForApprovalButton = poStatus === 'Draft' || !isEditMode || poStatus === 'Payment Rejected';
  const showSaveAsDraftButton = poStatus === 'Draft' || !isEditMode || poStatus === 'Payment Rejected';
  const showCompleteButton = poStatus === 'Paid';


  const currentTotalAmount = (form.getValues('items') || []).reduce((total, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return total + quantity * price;
  }, 0);


  if (isLoading) {
    return <p>Memuat data Purchase Order...</p>;
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => handleSave(data, 'Pending Approval'))} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{isEditMode ? "Ubah Purchase Order" : "Buat Purchase Order Baru"}</CardTitle>
                <CardDescription>
                  {isEditMode ? `ID: ${currentPoId}` : "Isi detail pesanan ke vendor."}
                </CardDescription>
              </div>
               <Badge variant={
                    poStatus === 'Completed' ? 'default' : 
                    poStatus === 'Paid' ? 'default' :
                    poStatus === 'Ordered' ? 'secondary' : 
                    poStatus === 'Pending Approval' ? 'destructive' : 
                    poStatus === 'Payment Rejected' ? 'destructive' : 'outline'
                }>
                  Status: {poStatus}
               </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isFormLocked}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Catatan untuk vendor atau internal..." {...field} disabled={isFormLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Item Pesanan</h3>
              {!isFormLocked && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <div className="flex-grow">
                         <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isComboboxOpen}
                                className="w-full justify-between"
                                >
                                {selectedInventoryItem
                                    ? inventoryItems.find((item) => item.id === selectedInventoryItem)?.name
                                    : "Pilih atau cari item dari gudang..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Cari item..." />
                                    <CommandEmpty>Item tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        <ScrollArea className="h-48">
                                            {inventoryItems.map((item) => (
                                                <CommandItem
                                                key={item.id}
                                                value={item.name}
                                                onSelect={() => {
                                                    setSelectedInventoryItem(item.id);
                                                    setIsComboboxOpen(false);
                                                }}
                                                >
                                                <Check
                                                    className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedInventoryItem === item.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {item.name}
                                                </CommandItem>
                                            ))}
                                        </ScrollArea>
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button type="button" onClick={addInventoryItemToPO} disabled={!selectedInventoryItem}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Tambah Item
                    </Button>
                </div>
              )}

              <Card>
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead className="w-2/5">Nama Item</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead>Harga/Satuan</TableHead>
                        <TableHead>Subtotal</TableHead>
                        {!isFormLocked && <TableHead>Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={6} className="text-center h-24">Belum ada item yang ditambahkan.</TableCell>
                          </TableRow>
                      ) : (
                        fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">{field.name}</TableCell>
                            <TableCell>
                              <Controller
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                      <Input
                                      type="number"
                                      {...field}
                                      className="w-24"
                                      disabled={isFormLocked}
                                      onChange={(e) => {
                                          field.onChange(parseFloat(e.target.value) || 0);
                                          form.trigger('items'); // Trigger re-render/re-validation
                                      }}
                                      />
                                  )}
                              />
                            </TableCell>
                            <TableCell>{field.unit}</TableCell>
                            <TableCell>
                               <Controller
                                  control={form.control}
                                  name={`items.${index}.price`}
                                  render={({ field }) => (
                                      <Input
                                      type="number"
                                      {...field}
                                      className="w-32"
                                      disabled={isFormLocked}
                                      onChange={(e) => {
                                        field.onChange(parseFloat(e.target.value) || 0);
                                        form.trigger('items');
                                      }}
                                      />
                                  )}
                              />
                            </TableCell>
                            <TableCell>{formatRupiah(watchedItems[index]?.quantity * watchedItems[index]?.price)}</TableCell>
                            {!isFormLocked && (
                                <TableCell>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
              <div className="flex justify-end font-bold text-xl pr-4">
                  <span>TOTAL: {formatRupiah(currentTotalAmount)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {showSaveAsDraftButton && (
                 <Button type="button" variant="outline" onClick={form.handleSubmit((data) => handleSave(data, 'Draft'))} disabled={form.formState.isSubmitting}>
                    <Save className="mr-2 h-4 w-4"/> Simpan sebagai Draft
                </Button>
            )}
            {showSubmitForApprovalButton && (
                <Button type="submit" disabled={form.formState.isSubmitting || fields.length === 0}>
                   <Send className="mr-2 h-4 w-4"/> Ajukan Persetujuan
                </Button>
            )}

            {showApprovalButtons && (
                <div className="flex w-full justify-between">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive">
                                <ThumbsDown className="mr-2 h-4 w-4"/> Tolak
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Tolak Purchase Order?</AlertDialogTitle>
                            <AlertDialogDescription>
                                PO ini akan dikembalikan ke status 'Draft' untuk direvisi. Apakah Anda yakin?
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleStatusChange('Draft')}>Ya, Tolak</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button type="button" onClick={() => handleStatusChange('Ordered')}>
                        <ThumbsUp className="mr-2 h-4 w-4"/> Setujui & Kirim ke Keuangan
                    </Button>
                </div>
            )}
             {showCompleteButton && (
                <Button type="button" onClick={handleCompletePO}>
                    Tandai Barang Diterima & Tambah Stok
                </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}


"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activity-log";

const inventoryItemSchema = z.object({
  name: z.string().min(1, "Nama item wajib diisi"),
  stock: z.coerce.number().min(0, "Stok harus angka positif"),
  unit: z.string().min(1, "Satuan wajib diisi (cth: kg, liter, pcs)"),
  price: z.coerce.number().min(0, "Harga harus angka positif").optional(),
});

type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;

interface AddInventoryItemFormProps {
  inventoryItem?: InventoryItem;
  onFormSubmit?: () => void;
}

export function AddInventoryItemForm({ inventoryItem, onFormSubmit }: AddInventoryItemFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!inventoryItem;

  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      stock: 0,
      unit: "",
      price: 0,
    },
  });

  useEffect(() => {
    if (inventoryItem) {
      form.reset({
        name: inventoryItem.name,
        stock: inventoryItem.stock,
        unit: inventoryItem.unit,
        price: inventoryItem.price || 0,
      });
    } else {
        form.reset({
            name: "",
            stock: 0,
            unit: "",
            price: 0,
        });
    }
  }, [inventoryItem, form]);


  const onSubmit = async (data: InventoryItemFormValues) => {
    try {
      if (isEditMode) {
        const docRef = doc(db, "gudang", inventoryItem.id);
        await updateDoc(docRef, data);
        logActivity(user, `Memperbarui item gudang: ${data.name}`);
        toast({
          title: "Sukses!",
          description: "Item gudang telah diperbarui.",
        });
      } else {
        await addDoc(collection(db, "gudang"), data);
        logActivity(user, `Menambah item gudang baru: ${data.name}`);
        toast({
          title: "Sukses!",
          description: "Item gudang baru telah ditambahkan.",
        });
      }
      
      if (onFormSubmit) {
        onFormSubmit();
      }
      if (!isEditMode) {
        form.reset();
      }
    } catch (error) {
      console.error("Gagal menyimpan dokumen: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan item gudang. Silakan coba lagi.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle>{isEditMode ? "Ubah Item Gudang" : "Tambah Item Gudang Baru"}</CardTitle>
            <CardDescription>{isEditMode ? "Ubah detail item di bawah ini." : "Isi formulir di bawah ini untuk menambahkan item baru."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Item</FormLabel>
                  <FormControl>
                    <Input placeholder="cth., Biji Kopi Arabika" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Stok</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="cth., 10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Satuan</FormLabel>
                  <FormControl>
                    <Input placeholder="cth., kg, liter, pcs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Beli per Satuan (IDR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="cth., 150000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Menyimpan..." : (isEditMode ? "Simpan Perubahan" : "Tambah Item")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

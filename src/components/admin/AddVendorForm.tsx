
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Vendor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activity-log";

const vendorSchema = z.object({
  name: z.string().min(1, "Nama vendor wajib diisi"),
  contactPerson: z.string().min(1, "Nama narahubung wajib diisi"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  address: z.string().min(1, "Alamat wajib diisi"),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

interface AddVendorFormProps {
  vendor?: Vendor;
  onFormSubmit?: () => void;
}

export function AddVendorForm({ vendor, onFormSubmit }: AddVendorFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!vendor;

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (vendor) {
      form.reset(vendor);
    } else {
      form.reset({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
      });
    }
  }, [vendor, form]);

  const onSubmit = async (data: VendorFormValues) => {
    try {
      if (isEditMode) {
        const docRef = doc(db, "vendors", vendor.id);
        await updateDoc(docRef, data);
        logActivity(user, `Memperbarui vendor: ${data.name}`);
        toast({
          title: "Sukses!",
          description: "Data vendor telah diperbarui.",
        });
      } else {
        await addDoc(collection(db, "vendors"), data);
        logActivity(user, `Menambah vendor baru: ${data.name}`);
        toast({
          title: "Sukses!",
          description: "Vendor baru telah ditambahkan.",
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
        description: "Gagal menyimpan data vendor. Silakan coba lagi.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Vendor</FormLabel>
              <FormControl>
                <Input placeholder="cth., PT Pemasok Biji Kopi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Narahubung</FormLabel>
              <FormControl>
                <Input placeholder="cth., Bapak Budi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Telepon</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="cth., 081234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="cth., sales@pemasok.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Textarea placeholder="Masukkan alamat lengkap vendor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan..." : (isEditMode ? "Simpan Perubahan" : "Tambah Vendor")}
        </Button>
      </form>
    </Form>
  );
}

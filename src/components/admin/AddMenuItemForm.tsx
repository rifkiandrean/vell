
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { ALL_SUGAR_LEVELS } from "@/lib/menu-data";
import type { SugarLevel, MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activity-log";

const menuItemSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  price: z.coerce.number().min(0, "Harga harus angka positif"),
  category: z.enum(["Coffee Based", "Milk Based", "Juice", "Mocktail", "Food", "Desserts"]),
  image: z.string().url("Silakan masukkan URL gambar yang valid"),
  sugarLevels: z.array(z.string()),
});

type MenuItemFormValues = z.infer<typeof menuItemSchema>;

interface AddMenuItemFormProps {
  menuItem?: MenuItem;
  onFormSubmit?: () => void;
}

export function AddMenuItemForm({ menuItem, onFormSubmit }: AddMenuItemFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!menuItem;

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "Coffee Based",
      image: "",
      sugarLevels: [],
    },
  });

  useEffect(() => {
    if (menuItem) {
      form.reset({
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        category: menuItem.category,
        image: menuItem.image,
        sugarLevels: menuItem.customizations?.sugarLevels || [],
      });
    } else {
        form.reset({
            name: "",
            description: "",
            price: 0,
            category: "Coffee Based",
            image: "",
            sugarLevels: [],
        });
    }
  }, [menuItem, form]);


  const onSubmit = async (data: MenuItemFormValues) => {
    const dataToSave = {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        image: data.image,
        customizations: {
          sugarLevels: data.sugarLevels,
          toppings: [],
        },
      };

    try {
      if (isEditMode && menuItem) {
        const docRef = doc(db, "menu", menuItem.id);
        await updateDoc(docRef, dataToSave);
        logActivity(user, `Memperbarui produk: ${data.name}`);
        toast({
          title: "Sukses!",
          description: "Item menu telah diperbarui.",
        });
      } else {
        await addDoc(collection(db, "menu"), dataToSave);
        logActivity(user, `Membuat produk baru: ${data.name}`);
        toast({
          title: "Sukses!",
          description: "Item menu baru telah ditambahkan.",
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
        description: "Gagal menyimpan item menu. Silakan coba lagi.",
      });
    }
  };

  const sugarLevelLabels: Record<SugarLevel, string> = {
    'Less Sugar': 'Rendah Gula',
    'Normal': 'Normal',
    'Extra Sugar': 'Tambah Gula',
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Produk</FormLabel>
                  <FormControl>
                    <Input placeholder="cth., Iced Caramel Macchiato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsikan produk..." {...field} />
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
                  <FormLabel>Harga (IDR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="cth., 45000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Coffee Based">Coffee Based</SelectItem>
                      <SelectItem value="Milk Based">Milk Based</SelectItem>
                      <SelectItem value="Juice">Juice</SelectItem>
                      <SelectItem value="Mocktail">Mocktail</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Desserts">Desserts</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Gambar Produk</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Kustomisasi</h3>
                <FormField
                control={form.control}
                name="sugarLevels"
                render={() => (
                    <FormItem>
                    <div className="mb-4">
                        <FormLabel className="text-base">Tingkat Kemanisan</FormLabel>
                        <p className="text-sm text-muted-foreground">Pilih tingkat kemanisan yang tersedia.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    {(ALL_SUGAR_LEVELS as SugarLevel[]).map((level) => (
                        <FormField
                        key={level}
                        control={form.control}
                        name="sugarLevels"
                        render={({ field }) => {
                            return (
                            <FormItem
                                key={level}
                                className="flex flex-row items-start space-x-3 space-y-0"
                            >
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(level)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...field.value, level])
                                        : field.onChange(
                                            field.value?.filter(
                                            (value) => value !== level
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal">
                                {sugarLevelLabels[level]}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                        />
                    ))}
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div>
                 <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Menyimpan..." : (isEditMode ? "Simpan Perubahan" : "Tambah Produk")}
                </Button>
            </div>
        </div>
      </form>
    </Form>
  );
}

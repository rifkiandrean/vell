

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { doc, setDoc, getDoc, collection, onSnapshot, addDoc, deleteDoc, writeBatch, getDocs, serverTimestamp, query, orderBy, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState, useRef } from "react";
import type { CompanyInfo, MenuCategorySetting, Schedule, ShopStatus, NotificationSettings, TaxSettings, PromoSettings, PromoSlide } from "@/lib/types";
import { Trash2, Edit, PlusCircle, HelpCircle, Database, RefreshCcw, DatabaseZap, Archive, PowerOff, Bell, Volume2, Music, Percent, FileImage } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Icons } from "../icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { accessRules as initialAccessRules } from '@/lib/access-rules';
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Textarea } from "../ui/textarea";
import { AddUserForm } from "./AddUserForm";
import { ActivityLogDisplay } from "./ActivityLogDisplay";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activity-log";

const companyInfoSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal('')),
  logoUrl: z.string().url("URL logo tidak valid").optional().or(z.literal('')),
  ersLogoUrl: z.string().url("URL logo tidak valid").optional().or(z.literal('')),
  websiteVersion: z.string().optional(),
  managerSignatureUrl: z.string().url("URL tanda tangan tidak valid").optional().or(z.literal('')),
  spvSignatureUrl: z.string().url("URL tanda tangan tidak valid").optional().or(z.literal('')),
});

const promoSettingsSchema = z.object({
    promoBannerEnabled: z.boolean().optional(),
    promoBannerBackgroundUrl: z.string().url("URL gambar latar tidak valid").optional().or(z.literal('')),
});

const promoSlideSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  productImageUrl: z.string().url("URL gambar produk tidak valid").optional().or(z.literal('')),
  linkUrl: z.string().url("URL link tidak valid").optional().or(z.literal('')),
});


const notificationSettingsSchema = z.object({
    soundEnabled: z.boolean(),
    soundUrl: z.string().url("URL suara tidak valid").or(z.literal('')),
    volume: z.number().min(0).max(1),
});

const taxSettingsSchema = z.object({
    ppn: z.coerce.number().min(0, "Pajak tidak boleh negatif").max(100, "Pajak tidak boleh lebih dari 100%"),
    serviceCharge: z.coerce.number().min(0, "Biaya layanan tidak boleh negatif").max(100, "Biaya layanan tidak boleh lebih dari 100%"),
});

const categorySchema = z.object({
    label: z.string().min(1, "Label wajib diisi"),
    name: z.enum(["Coffee Based", "Milk Based", "Juice", "Mocktail", "Food", "Desserts"]),
    icon: z.string().min(1, "Ikon wajib diisi"),
});

const scheduleSchema = z.object({
    monday: z.string(),
    tuesday: z.string(),
    wednesday: z.string(),
    thursday: z.string(),
    friday: z.string(),
    saturday: z.string(),
    sunday: z.string(),
});

const shopStatusSchema = z.object({
  isOpen: z.boolean(),
  schedule: scheduleSchema,
});


type CompanyInfoFormValues = z.infer<typeof companyInfoSchema>;
type PromoSettingsFormValues = z.infer<typeof promoSettingsSchema>;
type PromoSlideFormValues = z.infer<typeof promoSlideSchema>;
type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;
type TaxSettingsFormValues = z.infer<typeof taxSettingsSchema>;
type CategoryFormValues = z.infer<typeof categorySchema>;
type ShopStatusFormValues = z.infer<typeof shopStatusSchema>;


const getIconComponent = (iconName: string, fallback: React.ElementType = HelpCircle): React.ElementType => {
    if (iconName in Icons) {
        return Icons[iconName as keyof typeof Icons];
    }
    if (iconName in LucideIcons) {
        return (LucideIcons as any)[iconName];
    }
    return fallback;
};


function SlideForm({ onFormSubmit, slide, slideCount }: { onFormSubmit: () => void, slide?: PromoSlide, slideCount: number }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const isEditMode = !!slide;

    const form = useForm<PromoSlideFormValues>({
        resolver: zodResolver(promoSlideSchema),
        defaultValues: slide ? { ...slide } : {
            title: "",
            description: "",
            productImageUrl: "",
            linkUrl: "",
        }
    });

    useEffect(() => {
        if(slide) form.reset(slide);
    }, [slide, form]);

    const onSubmit = async (data: PromoSlideFormValues) => {
        try {
            if (isEditMode) {
                await setDoc(doc(db, "promo_slides", slide.id), { ...data }, { merge: true });
                logActivity(user, `Memperbarui slide promo: ${data.title}`);
                toast({ title: "Sukses!", description: "Slide telah diperbarui." });
            } else {
                await addDoc(collection(db, "promo_slides"), { 
                    ...data, 
                    order: slideCount, 
                    createdAt: serverTimestamp() 
                });
                logActivity(user, `Menambah slide promo baru: ${data.title}`);
                toast({ title: "Sukses!", description: "Slide baru telah ditambahkan." });
            }
            onFormSubmit();
        } catch (error) {
            console.error("Gagal menyimpan slide:", error);
            toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan slide." });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Judul Promo</FormLabel>
                        <FormControl>
                            <Input placeholder="cth., DISKON 20%!" {...field} />
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
                        <FormLabel>Deskripsi Promo (Opsional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="cth., Untuk Semua Minuman Kopi" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="productImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL Gambar Produk (Transparan)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://... (URL gambar .png transparan)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="linkUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL Link Tujuan (Opsional)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://... (URL jika banner bisa diklik)" {...field} />
                            </FormControl>
                            <FormDescription>Pelanggan akan diarahkan ke link ini jika banner diklik.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Tambah Slide"}
                </Button>
            </form>
        </Form>
    )
}



function CategoryForm({ onFormSubmit, category }: { onFormSubmit: () => void, category?: MenuCategorySetting }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const isEditMode = !!category;

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: category ? { label: category.label, name: category.name, icon: category.icon } : {
            label: "",
            name: "Food",
            icon: "Sandwich",
        }
    });

    const watchedIcon = form.watch("icon");
    const IconPreview = getIconComponent(watchedIcon);


    useEffect(() => {
        if(category) form.reset({ label: category.label, name: category.name, icon: category.icon });
    }, [category, form]);

    const onSubmit = async (data: CategoryFormValues) => {
        try {
            if (isEditMode) {
                 await setDoc(doc(db, "menu_categories", category.id), { ...data }, { merge: true });
                 logActivity(user, `Memperbarui kategori menu: ${data.label}`);
                 toast({ title: "Sukses!", description: "Kategori telah diperbarui." });
            } else {
                 const currentCategoriesSnap = await getDoc(doc(db, "menu_categories_order", "order"));
                 const currentOrder = currentCategoriesSnap.exists() ? currentCategoriesSnap.data().order : [];
                 const newCategoryRef = await addDoc(collection(db, "menu_categories"), { ...data, visible: true, order: currentOrder.length });
                 await setDoc(doc(db, "menu_categories_order", "order"), { order: [...currentOrder, newCategoryRef.id]});
                 logActivity(user, `Menambah kategori menu baru: ${data.label}`);
                 toast({ title: "Sukses!", description: "Kategori baru telah ditambahkan." });
            }
            onFormSubmit();
        } catch (error) {
            console.error("Gagal menyimpan kategori:", error);
            toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan kategori." });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Label Kategori</FormLabel>
                        <FormControl>
                            <Input placeholder="cth., Makanan" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tipe Kategori</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger></FormControl>
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
                    name="icon"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ikon (dari Lucide)</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormControl>
                                    <Input placeholder="cth., Sandwich, Coffee, Beer" {...field} />
                                </FormControl>
                                <IconPreview className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <FormDescription>Lihat daftar ikon di lucide.dev</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Tambah Kategori"}
                </Button>
            </form>
        </Form>
    )
}


export function SettingsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<MenuCategorySetting[]>([]);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategorySetting | undefined>();
  const [accessRules, setAccessRules] = useState(initialAccessRules);
  const [isAddAccountFormOpen, setIsAddAccountFormOpen] = useState(false);
  const [promoSlides, setPromoSlides] = useState<PromoSlide[]>([]);
  const [isSlideFormOpen, setIsSlideFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<PromoSlide | undefined>();


  const testAudioRef = useRef<HTMLAudioElement | null>(null);


  // States from former SeederPage
  const [tableCount, setTableCount] = useState<number>(30);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSettingUnavailable, setIsSettingUnavailable] = useState(false);
  const [isResettingInventory, setIsResettingInventory] = useState(false);


  const companyForm = useForm<CompanyInfoFormValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: { 
        companyName: "",
        address: "",
        phone: "",
        email: "",
        logoUrl: "", 
        ersLogoUrl: "",
        websiteVersion: "",
        managerSignatureUrl: "",
        spvSignatureUrl: "",
     },
  });

   const promoSettingsForm = useForm<PromoSettingsFormValues>({
    resolver: zodResolver(promoSettingsSchema),
    defaultValues: {
      promoBannerEnabled: false,
      promoBannerBackgroundUrl: "",
    },
  });
  
  const shopStatusForm = useForm<ShopStatusFormValues>({
    resolver: zodResolver(shopStatusSchema),
    defaultValues: {
        isOpen: true,
        schedule: {
            monday: "09:00 - 22:00",
            tuesday: "09:00 - 22:00",
            wednesday: "09:00 - 22:00",
            thursday: "09:00 - 22:00",
            friday: "09:00 - 22:00",
            saturday: "10:00 - 23:00",
            sunday: "10:00 - 23:00",
        }
    }
  });

  const notificationForm = useForm<NotificationSettingsFormValues>({
      resolver: zodResolver(notificationSettingsSchema),
      defaultValues: {
          soundEnabled: true,
          soundUrl: "/notification.mp3",
          volume: 0.5,
      },
  });

  const taxForm = useForm<TaxSettingsFormValues>({
      resolver: zodResolver(taxSettingsSchema),
      defaultValues: { ppn: 0, serviceCharge: 0 },
  });


  useEffect(() => {
    const fetchCompanyInfo = async () => {
        const docRef = doc(db, "settings", "companyInfo");
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) {
            companyForm.reset(docSnap.data() as CompanyInfo);
        }
    };

    const fetchPromoSettings = async () => {
        const docRef = doc(db, "settings", "promoSettings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            promoSettingsForm.reset(docSnap.data() as PromoSettings);
        }
    };
    
    const fetchShopStatus = async () => {
        const docRef = doc(db, "settings", "shopStatus");
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) {
            shopStatusForm.reset(docSnap.data() as ShopStatus);
        }
    }
    
     const fetchNotificationSettings = async () => {
        const docRef = doc(db, "settings", "notifications");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            notificationForm.reset(docSnap.data() as NotificationSettings);
        }
    };
    
    const fetchTaxSettings = async () => {
        const docRef = doc(db, "settings", "taxSettings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            taxForm.reset(docSnap.data() as TaxSettings);
        }
    };


    fetchCompanyInfo();
    fetchPromoSettings();
    fetchShopStatus();
    fetchNotificationSettings();
    fetchTaxSettings();

    const qSlides = query(collection(db, "promo_slides"), orderBy("order", "asc"));
    const unsubSlides = onSnapshot(qSlides, (snapshot) => {
        const slides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoSlide));
        setPromoSlides(slides);
    });

    const unsubCategories = onSnapshot(collection(db, "menu_categories"), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuCategorySetting));
        items.sort((a,b) => a.order - b.order);
        setCategories(items);
    });
    
     const unsubAccessRules = onSnapshot(doc(db, "settings", "access_rules"), (docSnap) => {
        if (docSnap.exists()) {
            const remoteRules = docSnap.data() as any;
            // Simple check to see if we need to sync from local file
            if (remoteRules.roles.length !== initialAccessRules.roles.length) {
                setDoc(doc(db, "settings", "access_rules"), initialAccessRules);
                setAccessRules(initialAccessRules);
            } else {
                setAccessRules(remoteRules);
            }
        } else {
            // If it doesn't exist, sync it from the local file
            setDoc(doc(db, "settings", "access_rules"), initialAccessRules);
            setAccessRules(initialAccessRules);
        }
    });


    return () => {
      unsubSlides();
      unsubCategories();
      unsubAccessRules();
    }

  }, [companyForm, promoSettingsForm, shopStatusForm, notificationForm, taxForm, toast]);

  const onCompanyInfoSubmit = async (data: CompanyInfoFormValues) => {
    try {
        const docRef = doc(db, "settings", "companyInfo");
        await setDoc(docRef, data, { merge: true });
        logActivity(user, "Memperbarui informasi perusahaan & branding.");
        toast({
            title: "Pengaturan Disimpan",
            description: "Informasi perusahaan telah diperbarui.",
        });
    } catch(error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal menyimpan informasi.", variant: "destructive" });
    }
  };

  const onPromoSettingsSubmit = async (data: PromoSettingsFormValues) => {
    try {
      const docRef = doc(db, "settings", "promoSettings");
      await setDoc(docRef, data, { merge: true });
      logActivity(user, `Mengubah status banner promo menjadi ${data.promoBannerEnabled ? 'Aktif' : 'Nonaktif'}.`);
      toast({
        title: "Pengaturan Promo Disimpan",
        description: `Banner promo sekarang ${data.promoBannerEnabled ? 'Aktif' : 'Nonaktif'}.`,
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Gagal menyimpan pengaturan promo.", variant: "destructive" });
    }
  };
  
  const onShopStatusSubmit = async (data: ShopStatusFormValues) => {
    try {
        const docRef = doc(db, "settings", "shopStatus");
        await setDoc(docRef, data);
        logActivity(user, `Mengubah status toko menjadi ${data.isOpen ? 'Buka' : 'Tutup'} dan memperbarui jadwal.`);
        toast({
            title: "Status Kafe Disimpan",
            description: `Kafe sekarang ${data.isOpen ? 'Buka' : 'Tutup'}. Jadwal operasional diperbarui.`,
        });
    } catch(error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal menyimpan status kafe.", variant: "destructive" });
    }
  };

  const onNotificationSettingsSubmit = async (data: NotificationSettingsFormValues) => {
      try {
          const docRef = doc(db, "settings", "notifications");
          await setDoc(docRef, data, { merge: true });
          logActivity(user, "Memperbarui pengaturan notifikasi.");
          toast({
              title: "Pengaturan Notifikasi Disimpan",
              description: "Suara dan volume notifikasi telah diperbarui.",
          });
      } catch (error) {
          console.error("Gagal menyimpan pengaturan notifikasi:", error);
          toast({ title: "Error", description: "Gagal menyimpan pengaturan notifikasi.", variant: "destructive" });
      }
  };

  const onTaxSettingsSubmit = async (data: TaxSettingsFormValues) => {
      try {
          const docRef = doc(db, "settings", "taxSettings");
          await setDoc(docRef, data, { merge: true });
          logActivity(user, `Memperbarui pengaturan pajak. PPN: ${data.ppn}%, Service: ${data.serviceCharge}%.`);
          toast({
              title: "Pengaturan Pajak Disimpan",
              description: "PPN dan biaya layanan telah diperbarui.",
          });
      } catch (error) {
          console.error("Gagal menyimpan pengaturan pajak:", error);
          toast({ title: "Error", description: "Gagal menyimpan pengaturan pajak.", variant: "destructive" });
      }
  };
  
  const handleTestSound = () => {
    const { soundUrl, volume, soundEnabled } = notificationForm.getValues();
    if (!soundEnabled) {
      toast({ variant: 'destructive', title: "Suara Nonaktif", description: "Aktifkan suara notifikasi terlebih dahulu."});
      return;
    }
    try {
      if (!testAudioRef.current) {
        testAudioRef.current = new Audio(soundUrl);
      } else {
        testAudioRef.current.src = soundUrl;
      }
      testAudioRef.current.volume = volume;
      testAudioRef.current.play().catch(err => {
        console.error("Audio play error:", err);
        toast({ variant: 'destructive', title: "Gagal Memutar Suara", description: "Pastikan URL suara valid dan dapat diakses."});
      });
    } catch (e) {
       console.error("Audio creation error:", e);
       toast({ variant: 'destructive', title: "URL Tidak Valid", description: "URL suara yang dimasukkan tidak valid."});
    }
  };


  const handleToggleVisibility = async (category: MenuCategorySetting) => {
    try {
        const docRef = doc(db, "menu_categories", category.id);
        const newVisibility = !category.visible;
        await setDoc(docRef, { visible: newVisibility }, { merge: true });
        logActivity(user, `Mengubah visibilitas kategori '${category.label}' menjadi ${newVisibility ? 'terlihat' : 'tersembunyi'}.`);
        toast({ title: "Sukses", description: `Kategori ${category.label} sekarang ${newVisibility ? 'terlihat' : 'tersembunyi'}.`});
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal mengubah visibilitas.", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryLabel: string) => {
    try {
        await deleteDoc(doc(db, "menu_categories", categoryId));
        logActivity(user, `Menghapus kategori menu: ${categoryLabel}.`);
        toast({ title: "Sukses", description: "Kategori telah dihapus."});
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal menghapus kategori.", variant: "destructive" });
    }
  };
  
  const handleAddNewCategory = () => {
    setEditingCategory(undefined);
    setIsCategoryFormOpen(true);
  }

  const handleEditCategory = (category: MenuCategorySetting) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  }

  const handleAddNewSlide = () => {
    setEditingSlide(undefined);
    setIsSlideFormOpen(true);
  }

  const handleEditSlide = (slide: PromoSlide) => {
    setEditingSlide(slide);
    setIsSlideFormOpen(true);
  }

  const handleDeleteSlide = async (slide: PromoSlide) => {
    try {
        await deleteDoc(doc(db, "promo_slides", slide.id));
        logActivity(user, `Menghapus slide promo: ${slide.title}`);
        toast({ title: "Sukses", description: "Slide telah dihapus."});
    } catch (error) {
        console.error("Gagal menghapus slide:", error);
        toast({ title: "Error", description: "Gagal menghapus slide.", variant: "destructive" });
    }
  }

  const handleSimulatedAction = () => {
    toast({
      title: "Fitur Dalam Pengembangan",
      description: "Fungsionalitas penuh untuk fitur ini akan segera hadir.",
    });
  };

    const handleSeedTables = async () => {
    setIsSeeding(true);
    try {
      const q = query(collection(db, "tables"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: "Koleksi 'tables' sudah berisi data. Hapus manual di Firebase Console jika ingin menimpa.",
        });
        setIsSeeding(false);
        return;
      }

      const batch = writeBatch(db);
      for (let i = 1; i <= tableCount; i++) {
        const tableId = `meja ${i}`;
        const tableRef = doc(db, 'tables', tableId);
        batch.set(tableRef, {
          id: tableId,
          status: 'Available',
          currentOrderId: null,
          lastActivity: serverTimestamp()
        });
      }
      await batch.commit();
      
      logActivity(user, `Membuat ${tableCount} data meja awal.`);
      toast({
        title: "Sukses!",
        description: `${tableCount} meja telah berhasil dibuat di database.`,
      });
    } catch (error) {
      console.error("Gagal membuat data meja:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal membuat data meja.",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetAllTables = async () => {
    setIsResetting(true);
    try {
        const tablesCollectionRef = collection(db, "tables");
        const querySnapshot = await getDocs(tablesCollectionRef);
        
        if (querySnapshot.empty) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: "Tidak ada data meja yang ditemukan untuk direset.",
            });
            setIsResetting(false);
            return;
        }

        const batch = writeBatch(db);
        querySnapshot.forEach((document) => {
            const tableRef = doc(db, 'tables', document.id);
            batch.update(tableRef, {
                status: 'Available',
                currentOrderId: null,
                customerName: null,
                lastActivity: serverTimestamp()
            });
        });

        await batch.commit();
        logActivity(user, `Mereset harian ${querySnapshot.size} meja.`);
        toast({
            title: "Sukses!",
            description: `Semua (${querySnapshot.size}) meja telah direset ke status 'Available'.`,
        });
    } catch (error) {
        console.error("Gagal mereset meja:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Terjadi kesalahan saat mereset status meja.",
        });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSetTablesUnavailable = async () => {
    setIsSettingUnavailable(true);
    try {
      const tablesCollectionRef = collection(db, "tables");
      const querySnapshot = await getDocs(tablesCollectionRef);
      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: "Tidak ada data meja yang ditemukan.",
        });
        setIsSettingUnavailable(false);
        return;
      }
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        const tableRef = doc(db, 'tables', document.id);
        batch.update(tableRef, {
          status: 'Unavailable',
          currentOrderId: null,
          customerName: null,
          lastActivity: serverTimestamp()
        });
      });
      await batch.commit();
      logActivity(user, `Mengatur status tutup untuk ${querySnapshot.size} meja.`);
      toast({
        title: "Sukses!",
        description: `Status semua (${querySnapshot.size}) meja telah diatur ke 'Unavailable'.`,
      });
    } catch (error) {
      console.error("Gagal mengatur status meja:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan saat mengatur status meja.",
      });
    } finally {
      setIsSettingUnavailable(false);
    }
  };
  
  const handleResetInventoryStock = async () => {
    setIsResettingInventory(true);
    try {
        const inventoryCollectionRef = collection(db, "gudang");
        const querySnapshot = await getDocs(inventoryCollectionRef);

        if (querySnapshot.empty) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: "Tidak ada data item di gudang untuk direset.",
            });
            setIsResettingInventory(false);
            return;
        }

        const batch = writeBatch(db);
        querySnapshot.forEach((document) => {
            const itemRef = doc(db, 'gudang', document.id);
            batch.update(itemRef, { stock: 0 });
        });

        await batch.commit();
        logActivity(user, `Mereset stok gudang (${querySnapshot.size} item) menjadi 0.`);
        toast({
            title: "Sukses!",
            description: `Stok semua (${querySnapshot.size}) item di gudang telah direset ke 0.`,
        });
    } catch (error) {
        console.error("Gagal mereset stok gudang:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Terjadi kesalahan saat mereset stok gudang.",
        });
    } finally {
      setIsResettingInventory(false);
    }
  };

  const scheduleDays: {key: keyof Schedule, label: string}[] = [
    { key: "monday", label: "Senin" },
    { key: "tuesday", label: "Selasa" },
    { key: "wednesday", label: "Rabu" },
    { key: "thursday", label: "Kamis" },
    { key: "friday", label: "Jumat" },
    { key: "saturday", label: "Sabtu" },
    { key: "sunday", label: "Minggu" },
  ];

  return (
    <div className="space-y-8">
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
        <Dialog open={isAddAccountFormOpen} onOpenChange={setIsAddAccountFormOpen}>
            <Dialog open={isSlideFormOpen} onOpenChange={setIsSlideFormOpen}>
                <Card>
                    <CardHeader>
                    <CardTitle>Informasi Perusahaan &amp; Branding</CardTitle>
                    <CardDescription>Atur nama, kontak, dan logo yang akan ditampilkan di seluruh aplikasi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...companyForm}>
                        <form onSubmit={companyForm.handleSubmit(onCompanyInfoSubmit)} className="space-y-4 max-w-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={companyForm.control}
                            name="companyName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nama Kafe / Perusahaan</FormLabel>
                                <FormControl>
                                <Input placeholder="Nama Coffee Shop Anda" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={companyForm.control}
                            name="phone"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nomor Telepon</FormLabel>
                                <FormControl>
                                <Input type="tel" placeholder="081234567890" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
                        <FormField
                            control={companyForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input type="email" placeholder="kontak@namakafe.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={companyForm.control}
                            name="address"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Alamat</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Alamat lengkap perusahaan Anda..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={companyForm.control}
                            name="websiteVersion"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Versi Website</FormLabel>
                                <FormControl>
                                <Input placeholder="cth., v1.0.0" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={companyForm.control}
                            name="logoUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL Logo Kafe</FormLabel>
                                <FormControl>
                                <Input placeholder="https://example.com/logo.png" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={companyForm.control}
                            name="ersLogoUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL Logo ERS (untuk Footer)</FormLabel>
                                <FormControl>
                                <Input placeholder="https://example.com/ers_logo.png" {...field} />
                                </FormControl>
                                <FormDescription>Logo ini akan muncul di footer halaman login.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={companyForm.control}
                            name="managerSignatureUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL Tanda Tangan Manajer (untuk PO)</FormLabel>
                                <FormControl>
                                <Input placeholder="https://... (URL gambar .png dari Google Drive)" {...field} />
                                </FormControl>
                                <FormDescription>Gambar ini akan digunakan pada PDF Purchase Order yang disetujui.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={companyForm.control}
                            name="spvSignatureUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL Tanda Tangan Spv F&amp;B (untuk PO)</FormLabel>
                                <FormControl>
                                <Input placeholder="https://... (URL gambar .png dari Google Drive)" {...field} />
                                </FormControl>
                                <FormDescription>Gambar ini akan digunakan pada PDF Purchase Order yang disetujui.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={companyForm.formState.isSubmitting}>
                            {companyForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Branding'}
                        </Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>

                <Separator />
                
                <Card>
                    <Form {...promoSettingsForm}>
                        <form onSubmit={promoSettingsForm.handleSubmit(onPromoSettingsSubmit)}>
                            <CardHeader>
                                <CardTitle>Pengaturan Banner Promosi</CardTitle>
                                <CardDescription>Atur banner promosi yang akan ditampilkan di halaman menu utama.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={promoSettingsForm.control}
                                    name="promoBannerEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Tampilkan Slideshow Promo</FormLabel>
                                                <FormDescription>Aktifkan untuk menampilkan slideshow di halaman menu.</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={promoSettingsForm.control}
                                    name="promoBannerBackgroundUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL Gambar Latar Statis</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://... (URL gambar latar untuk semua slide)" {...field} />
                                            </FormControl>
                                            <FormDescription>Gunakan rasio gambar 3:1 atau 4:1 untuk hasil terbaik.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">Manajemen Slide</h3>
                                    <Button type="button" onClick={handleAddNewSlide}><PlusCircle className="mr-2 h-4 w-4" />Tambah Slide</Button>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Judul</TableHead>
                                            <TableHead>Gambar Produk</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {promoSlides.map((slide) => (
                                            <TableRow key={slide.id}>
                                                <TableCell className="font-medium">{slide.title}</TableCell>
                                                <TableCell><FileImage className="h-5 w-5" /></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditSlide(slide)}><Edit className="h-4 w-4" /></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Hapus Slide Ini?</AlertDialogTitle>
                                                                <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteSlide(slide)}>Hapus</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                             <CardFooter>
                                <Button type="submit" disabled={promoSettingsForm.formState.isSubmitting}>
                                    {promoSettingsForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan Promo'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>

                <Separator />

                <Card>
                <Form {...taxForm}>
                    <form onSubmit={taxForm.handleSubmit(onTaxSettingsSubmit)}>
                        <CardHeader>
                            <CardTitle>Pengaturan Pajak &amp; Layanan</CardTitle>
                            <CardDescription>Atur persentase PPN dan biaya layanan yang akan ditambahkan ke total tagihan.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-6">
                            <FormField
                                control={taxForm.control}
                                name="ppn"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>PPN (Pajak Pertambahan Nilai)</FormLabel>
                                        <div className="flex items-center">
                                            <Input type="number" placeholder="cth., 11" {...field} />
                                            <Percent className="h-5 w-5 ml-2 text-muted-foreground"/>
                                        </div>
                                        <FormDescription>Masukkan tarif PPN dalam persen (%).</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={taxForm.control}
                                name="serviceCharge"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Biaya Layanan (Service Charge)</FormLabel>
                                        <div className="flex items-center">
                                            <Input type="number" placeholder="cth., 5" {...field} />
                                            <Percent className="h-5 w-5 ml-2 text-muted-foreground"/>
                                        </div>
                                        <FormDescription>Masukkan tarif layanan dalam persen (%).</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={taxForm.formState.isSubmitting}>
                                {taxForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan Pajak'}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
                </Card>

                <Separator />

                <Card>
                <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSettingsSubmit)}>
                        <CardHeader>
                            <CardTitle>Pengaturan Notifikasi</CardTitle>
                            <CardDescription>Atur suara, volume, dan status notifikasi untuk pesanan baru.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={notificationForm.control}
                                name="soundEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Suara Notifikasi</FormLabel>
                                            <FormDescription>Aktifkan atau nonaktifkan suara saat pesanan baru masuk.</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={notificationForm.control}
                                name="soundUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL Suara Notifikasi (MP3)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/notification.mp3" {...field} />
                                        </FormControl>
                                        <FormDescription>Gunakan URL file MP3 yang dapat diakses secara publik.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={notificationForm.control}
                                name="volume"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Volume</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                            <Slider
                                                min={0}
                                                max={1}
                                                step={0.1}
                                                value={[field.value]}
                                                onValueChange={(value) => field.onChange(value[0])}
                                            />
                                            <span className="w-12 text-center font-mono text-sm bg-muted rounded-md py-1">
                                                {Math.round(field.value * 100)}%
                                            </span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="gap-2">
                            <Button type="submit" disabled={notificationForm.formState.isSubmitting}>
                                {notificationForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Notifikasi'}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleTestSound}>
                                <Music className="mr-2 h-4 w-4" /> Test Suara
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
                </Card>
                
                <Separator />
                
                <Card>
                    <Form {...shopStatusForm}>
                        <form onSubmit={shopStatusForm.handleSubmit(onShopStatusSubmit)}>
                            <CardHeader>
                                <CardTitle>Status &amp; Jadwal Operasional Kafe</CardTitle>
                                <CardDescription>Atur status buka/tutup secara manual dan jadwal operasional mingguan.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={shopStatusForm.control}
                                    name="isOpen"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Status Kafe Saat Ini</FormLabel>
                                            <FormDescription>
                                            Atur status kafe menjadi buka atau tutup secara manual.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <div className="flex items-center space-x-2">
                                                <span className={!field.value ? 'font-bold text-destructive' : 'text-muted-foreground'}>Tutup</span>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                                <span className={field.value ? 'font-bold text-green-600' : 'text-muted-foreground'}>Buka</span>
                                            </div>
                                        </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-4">
                                    <h3 className="text-base font-medium">Jadwal Mingguan</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {scheduleDays.map(day => (
                                            <FormField
                                                key={day.key}
                                                control={shopStatusForm.control}
                                                name={`schedule.${day.key}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{day.label}</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="cth., 09:00 - 22:00 atau Tutup" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={shopStatusForm.formState.isSubmitting}>
                                    {shopStatusForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Status &amp; Jadwal'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>

                <Separator />

                <Card>
                    <CardHeader>
                        <CardTitle>Data Seeder &amp; Reset</CardTitle>
                        <CardDescription>
                            Gunakan alat ini untuk menginisialisasi atau mereset data aplikasi. Gunakan dengan hati-hati.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><DatabaseZap className="h-5 w-5" /> Manajemen Meja</h3>
                            <div className="p-4 border rounded-lg space-y-4">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">Pembuatan Data Awal</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                Gunakan ini hanya sekali untuk membuat data awal meja jika koleksi 'tables' masih kosong.
                                </p>
                                <div className="flex items-end gap-4">
                                    <div className="flex-grow space-y-2">
                                        <Label htmlFor="table-count">Jumlah Meja</Label>
                                        <Input
                                            id="table-count"
                                            type="number"
                                            value={tableCount}
                                            onChange={(e) => setTableCount(Number(e.target.value))}
                                            min="1"
                                        />
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button disabled={isSeeding}>
                                                {isSeeding ? 'Memproses...' : `Buat`}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Konfirmasi Seeding</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Anda akan membuat {tableCount} dokumen meja. Ini hanya boleh dilakukan jika koleksi 'tables' masih kosong. Lanjutkan?
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleSeedTables}>Lanjutkan</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg space-y-4">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">Reset &amp; Status</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Atur ulang semua meja ke status 'Available' di awal hari, atau 'Unavailable' di akhir hari.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="secondary" disabled={isResetting}>
                                                <RefreshCcw className="mr-2 h-4 w-4"/>
                                                {isResetting ? 'Mereset...' : 'Reset Harian'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Konfirmasi Reset</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Anda yakin ingin mereset status SEMUA meja menjadi 'Available' dan menghapus ID pesanan aktifnya?
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleResetAllTables} >Lanjutkan Reset</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={isSettingUnavailable}>
                                                <PowerOff className="mr-2 h-4 w-4"/>
                                                {isSettingUnavailable ? 'Memproses...' : 'Set Tutup'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Konfirmasi Status Tutup</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Anda yakin ingin mengatur SEMUA meja menjadi 'Unavailable'? Pelanggan tidak akan bisa memesan dari meja manapun.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleSetTablesUnavailable} className="bg-destructive hover:bg-destructive/90">Ya, Atur Tutup</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Archive className="h-5 w-5" /> Manajemen Gudang</h3>
                            <div className="p-4 border rounded-lg space-y-4">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">Reset Stok Gudang</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Gunakan ini untuk mereset jumlah stok SEMUA item di gudang menjadi 0. Berguna saat memulai stok opname.
                                </p>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={isResettingInventory}>
                                            <RefreshCcw className="mr-2 h-4 w-4"/>
                                            {isResettingInventory ? 'Mereset...' : 'Reset Stok Gudang ke 0'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Konfirmasi Reset Stok</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Anda yakin ingin mereset jumlah stok SEMUA item di gudang menjadi 0? Tindakan ini tidak dapat dibatalkan.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleResetInventoryStock} className="bg-destructive hover:bg-destructive/90">Ya, Reset Stok</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Separator />
                
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle>Manajemen Halaman Menu</CardTitle>
                            <CardDescription>Atur kategori menu yang ditampilkan di sidebar halaman utama.</CardDescription>
                        </div>
                        <Button onClick={handleAddNewCategory}><PlusCircle className="mr-2 h-4 w-4" />Tambah Kategori</Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Ikon</TableHead>
                                <TableHead>Nama Kategori</TableHead>
                                <TableHead className="text-center">Terlihat</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((cat) => {
                                    const IconComponent = getIconComponent(cat.icon);
                                    return (
                                        <TableRow key={cat.id}>
                                            <TableCell>
                                                <IconComponent className="h-5 w-5" />
                                            </TableCell>
                                            <TableCell className="font-medium flex items-center gap-2">
                                            {cat.label}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Checkbox checked={cat.visible} onCheckedChange={() => handleToggleVisibility(cat)} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)}>
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
                                                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus kategori menu secara permanen.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteCategory(cat.id, cat.label)}>Hapus</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                
                <Separator />

                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle>Manajemen Aturan Akses</CardTitle>
                            <CardDescription>Buat peran dan atur hak akses untuk setiap halaman admin.</CardDescription>
                        </div>
                        <Button onClick={() => setIsAddAccountFormOpen(true)}>Tambah Akun Baru</Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Halaman</TableHead>
                                        {accessRules.roles.map(role => (
                                            <TableHead key={role} className="text-center">{role}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {accessRules.pages.map(page => (
                                        <TableRow key={page}>
                                            <TableCell className="font-medium">{page}</TableCell>
                                            {accessRules.roles.map(role => (
                                                <TableCell key={role} className="text-center">
                                                    <Checkbox 
                                                        checked={(accessRules.permissions as any)[role]?.includes(page)} 
                                                        onClick={handleSimulatedAction}
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                
                <Separator />
                
                <ActivityLogDisplay />


                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{!!editingCategory ? 'Ubah Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
                        <DialogDescriptionComponent>{!!editingCategory ? 'Ubah detail kategori.' : 'Buat kategori menu baru.'}</DialogDescriptionComponent>
                    </DialogHeader>
                    <CategoryForm onFormSubmit={() => setIsCategoryFormOpen(false)} category={editingCategory} />
                </DialogContent>
                
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Tambah Akun Pengguna Baru</DialogTitle>
                        <DialogDescriptionComponent>
                            Buat kredensial login baru dan tetapkan peran untuk pengguna.
                        </DialogDescriptionComponent>
                    </DialogHeader>
                    <AddUserForm onFormSubmit={() => setIsAddAccountFormOpen(false)} />
                </DialogContent>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{!!editingSlide ? 'Ubah Slide Promo' : 'Tambah Slide Promo Baru'}</DialogTitle>
                        <DialogDescriptionComponent>{!!editingSlide ? 'Ubah detail slide.' : 'Buat slide promo baru untuk slideshow.'}</DialogDescriptionComponent>
                    </DialogHeader>
                    <SlideForm 
                        onFormSubmit={() => setIsSlideFormOpen(false)} 
                        slide={editingSlide}
                        slideCount={promoSlides.length} 
                    />
                </DialogContent>

            </Dialog>
        </Dialog>
      </Dialog>
    </div>
  );
}

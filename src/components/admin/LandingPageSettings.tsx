

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, onSnapshot, addDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { LandingPageContent, HeroSlide, PricingPackage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { logActivity } from "@/lib/activity-log";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


const heroSlideSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  subtitle: z.string().min(1, "Subjudul wajib diisi"),
  imageUrl: z.string().url("URL gambar tidak valid"),
  imageHint: z.string().optional(),
});

type HeroSlideFormValues = z.infer<typeof heroSlideSchema>;

const pricingPackageSchema = z.object({
  name: z.string().min(1, "Nama paket wajib diisi"),
  price: z.coerce.number().min(0, "Harga harus angka positif"),
  pricePeriod: z.enum(['sekali bayar', 'per bulan', 'per tahun']),
  features: z.string().min(1, "Fitur wajib diisi"),
  isPopular: z.boolean().default(false),
});

type PricingPackageFormValues = z.infer<typeof pricingPackageSchema>;

function HeroSlideForm({ onFormSubmit, slide, slideCount }: { onFormSubmit: () => void; slide?: HeroSlide; slideCount: number }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!slide;

  const form = useForm<HeroSlideFormValues>({
    resolver: zodResolver(heroSlideSchema),
    defaultValues: slide ? { ...slide } : {
      title: "",
      subtitle: "",
      imageUrl: "",
      imageHint: "",
    },
  });

  useEffect(() => {
    if (slide) form.reset(slide);
  }, [slide, form]);

  const onSubmit = async (data: HeroSlideFormValues) => {
    try {
      if (isEditMode) {
        await setDoc(doc(db, "hero_slides", slide.id), data, { merge: true });
        logActivity(user, `Memperbarui slide hero: ${data.title}`);
        toast({ title: "Sukses!", description: "Slide hero telah diperbarui." });
      } else {
        await addDoc(collection(db, "hero_slides"), {
          ...data,
          order: slideCount,
        });
        logActivity(user, `Menambah slide hero baru: ${data.title}`);
        toast({ title: "Sukses!", description: "Slide hero baru telah ditambahkan." });
      }
      onFormSubmit();
    } catch (error) {
      console.error("Gagal menyimpan slide hero:", error);
      toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan slide hero." });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Judul Slide</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="subtitle" render={({ field }) => (
          <FormItem><FormLabel>Subjudul</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="imageUrl" render={({ field }) => (
          <FormItem><FormLabel>URL Gambar Latar</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="imageHint" render={({ field }) => (
          <FormItem><FormLabel>Petunjuk Gambar (AI Hint)</FormLabel><FormControl><Input placeholder="Contoh: restaurant system" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan..." : (isEditMode ? "Simpan Perubahan" : "Tambah Slide")}
        </Button>
      </form>
    </Form>
  );
}

function PricingPackageForm({ onFormSubmit, pkg, packageCount }: { onFormSubmit: () => void; pkg?: PricingPackage; packageCount: number; }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const isEditMode = !!pkg;

    const form = useForm<PricingPackageFormValues>({
        resolver: zodResolver(pricingPackageSchema),
        defaultValues: pkg ? { ...pkg, features: pkg.features.join('\n') } : {
            name: "",
            price: 0,
            pricePeriod: 'sekali bayar',
            features: "",
            isPopular: false,
        },
    });
    
    useEffect(() => {
        if (pkg) form.reset({ ...pkg, features: pkg.features.join('\n') });
    }, [pkg, form]);

    const onSubmit = async (data: PricingPackageFormValues) => {
        try {
            const dataToSave = {
                ...data,
                features: data.features.split('\n').map(f => f.trim()).filter(f => f),
            };

            if (isEditMode) {
                await setDoc(doc(db, "pricing_packages", pkg.id), dataToSave, { merge: true });
                logActivity(user, `Memperbarui paket harga: ${data.name}`);
                toast({ title: "Sukses!", description: "Paket harga telah diperbarui." });
            } else {
                await addDoc(collection(db, "pricing_packages"), { ...dataToSave, order: packageCount });
                logActivity(user, `Menambah paket harga baru: ${data.name}`);
                toast({ title: "Sukses!", description: "Paket harga baru telah ditambahkan." });
            }
            onFormSubmit();
        } catch (error) {
            console.error("Gagal menyimpan paket harga:", error);
            toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan paket harga." });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nama Paket</FormLabel><FormControl><Input placeholder="cth., Paket Dasar" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Harga (IDR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="pricePeriod" render={({ field }) => (
                    <FormItem><FormLabel>Periode Harga</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                             <SelectContent>
                                <SelectItem value="sekali bayar">Sekali Bayar</SelectItem>
                                <SelectItem value="per bulan">Per Bulan</SelectItem>
                                <SelectItem value="per tahun">Per Tahun</SelectItem>
                             </SelectContent>
                        </Select>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="features" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Fitur</FormLabel>
                        <FormControl><Textarea placeholder="Satu fitur per baris..." rows={5} {...field} /></FormControl>
                        <FormDescription>Awali fitur dengan tanda seru (!) untuk menandainya sebagai tidak termasuk, contoh: !Fitur Tambahan</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="isPopular" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Tandai sebagai Populer</FormLabel>
                            <FormDescription>Paket ini akan ditandai secara visual di halaman utama.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Menyimpan..." : (isEditMode ? "Simpan Perubahan" : "Tambah Paket")}
                </Button>
            </form>
        </Form>
    );
}


const landingPageSchema = z.object({
  websiteTitle: z.string().optional(),
  brandName: z.string().optional(),
  vellLogoUrl: z.string().url("URL gambar tidak valid").or(z.literal('')).optional(),
  productsSectionTitle: z.string().optional(),
  productsSectionSubtitle: z.string().optional(),

  product1Title: z.string().optional(),
  product1Description: z.string().optional(),
  product1IconUrl: z.string().url("URL ikon tidak valid").or(z.literal('')).optional(),
  product1Link: z.string().url("URL link tidak valid").or(z.literal('')).optional(),
  
  product2Title: z.string().optional(),
  product2Description: z.string().optional(),
  product2IconUrl: z.string().url("URL ikon tidak valid").or(z.literal('')).optional(),
  product2Link: z.string().url("URL link tidak valid").or(z.literal('')).optional(),
  
  instagramUrl: z.string().url("URL tidak valid").or(z.literal('')).optional(),
  tiktokUrl: z.string().url("URL tidak valid").or(z.literal('')).optional(),
  facebookUrl: z.string().url("URL tidak valid").or(z.literal('')).optional(),
  twitterUrl: z.string().url("URL tidak valid").or(z.literal('')).optional(),
  instagramIconUrl: z.string().url("URL tidak valid").or(z.literal('')).optional(),
  tiktokIconUrl: z.string().url("URL tidak valid").or(z.literal('')).optional(),
  facebookIconUrl: z.string().url("URL tidak valid").or(z.literal('')).optional(),
  twitterIconUrl: z.string().url("URL tidak valid").or(z.literal('')).optional(),
});

type LandingPageFormValues = z.infer<typeof landingPageSchema>;

export function LandingPageSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([]);
  const [isSlideFormOpen, setIsSlideFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | undefined>();
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PricingPackage | undefined>();


  const form = useForm<LandingPageFormValues>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: {
      websiteTitle: "",
      brandName: "",
      vellLogoUrl: "",
      productsSectionTitle: "",
      productsSectionSubtitle: "",
      product1Title: "",
      product1Description: "",
      product1IconUrl: "",
      product1Link: "",
      product2Title: "",
      product2Description: "",
      product2IconUrl: "",
      product2Link: "",
      instagramUrl: "",
      tiktokUrl: "",
      facebookUrl: "",
      twitterUrl: "",
      instagramIconUrl: "",
      tiktokIconUrl: "",
      facebookIconUrl: "",
      twitterIconUrl: "",
    },
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, "settings", "landingPage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          form.reset(docSnap.data() as LandingPageContent);
        }
      } catch (error) {
        console.error("Gagal memuat konten landing page:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Gagal memuat pengaturan landing page.",
        });
      }
    };
    fetchContent();
    
    const qSlides = query(collection(db, "hero_slides"), orderBy("order", "asc"));
    const unsubSlides = onSnapshot(qSlides, (snapshot) => {
        const slides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HeroSlide));
        setHeroSlides(slides);
    });
    
    const qPackages = query(collection(db, "pricing_packages"), orderBy("order", "asc"));
    const unsubPackages = onSnapshot(qPackages, (snapshot) => {
        const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingPackage));
        setPricingPackages(packages);
    });

    return () => {
      unsubSlides();
      unsubPackages();
    }
  }, [form, toast]);

  const onSubmit = async (data: LandingPageFormValues) => {
    try {
      const docRef = doc(db, "settings", "landingPage");
      await setDoc(docRef, data, { merge: true });
      logActivity(user, "Memperbarui konten landing page VELL.");
      toast({
        title: "Pengaturan Disimpan",
        description: "Konten landing page telah diperbarui.",
      });
    } catch (error) {
      console.error("Gagal menyimpan pengaturan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan pengaturan.",
      });
    }
  };

  const handleAddNewSlide = () => {
    setEditingSlide(undefined);
    setIsSlideFormOpen(true);
  };

  const handleEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setIsSlideFormOpen(true);
  };

  const handleDeleteSlide = async (slide: HeroSlide) => {
    try {
      await deleteDoc(doc(db, "hero_slides", slide.id));
      logActivity(user, `Menghapus slide hero: ${slide.title}`);
      toast({ title: "Sukses", description: "Slide hero telah dihapus." });
    } catch (error) {
      console.error("Gagal menghapus slide hero:", error);
      toast({ variant: "destructive", title: "Error", description: "Gagal menghapus slide hero." });
    }
  };

  const handleAddNewPackage = () => {
    setEditingPackage(undefined);
    setIsPackageFormOpen(true);
  };

  const handleEditPackage = (pkg: PricingPackage) => {
    setEditingPackage(pkg);
    setIsPackageFormOpen(true);
  };

  const handleDeletePackage = async (pkg: PricingPackage) => {
    try {
      await deleteDoc(doc(db, "pricing_packages", pkg.id));
      logActivity(user, `Menghapus paket harga: ${pkg.name}`);
      toast({ title: "Sukses", description: "Paket harga telah dihapus." });
    } catch (error) {
      console.error("Gagal menghapus paket harga:", error);
      toast({ variant: "destructive", title: "Error", description: "Gagal menghapus paket harga." });
    }
  };


  return (
    <Dialog open={isSlideFormOpen} onOpenChange={setIsSlideFormOpen}>
      <Dialog open={isPackageFormOpen} onOpenChange={setIsPackageFormOpen}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Branding &amp; SEO</CardTitle>
                <CardDescription>Atur judul website, nama brand, dan logo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="websiteTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Website (Tab Browser)</FormLabel>
                      <FormControl>
                        <Input placeholder="VELL - Elektronik Restoran Sistem" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brandName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Brand di Header</FormLabel>
                      <FormControl>
                        <Input placeholder="VELL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vellLogoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Logo &amp; Favicon</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormDescription>Logo ini akan muncul di header dan sebagai ikon tab browser (favicon).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Bagian Utama (Hero Section)</CardTitle>
                  <CardDescription>Kelola slide yang tampil di bagian paling atas halaman utama.</CardDescription>
                </div>
                <Button type="button" onClick={handleAddNewSlide}><PlusCircle className="mr-2 h-4 w-4" />Tambah Slide</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Judul</TableHead>
                      <TableHead>Subjudul</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {heroSlides.length > 0 ? heroSlides.map((slide) => (
                      <TableRow key={slide.id}>
                        <TableCell className="font-medium">{slide.title}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-xs">{slide.subtitle}</TableCell>
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
                    )) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                          Belum ada slide. Klik "Tambah Slide" untuk memulai.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Manajemen Paket Harga</CardTitle>
                  <CardDescription>Atur paket harga yang ditampilkan di halaman utama.</CardDescription>
                </div>
                <Button type="button" onClick={handleAddNewPackage}><PlusCircle className="mr-2 h-4 w-4" />Tambah Paket</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Paket</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Populer</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingPackages.length > 0 ? pricingPackages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell className="text-muted-foreground">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(pkg.price)} / {pkg.pricePeriod}</TableCell>
                        <TableCell>{pkg.isPopular ? "Ya" : "Tidak"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditPackage(pkg)}><Edit className="h-4 w-4" /></Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Paket Ini?</AlertDialogTitle>
                                <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePackage(pkg)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                          Belum ada paket harga. Klik "Tambah Paket" untuk memulai.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bagian Produk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                  <FormField
                      control={form.control}
                      name="productsSectionTitle"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Judul Bagian Produk</FormLabel>
                          <FormControl>
                          <Input placeholder="Produk Kami" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="productsSectionSubtitle"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Deskripsi Bagian Produk</FormLabel>
                          <FormControl>
                          <Textarea placeholder="Lihat bagaimana kami telah membantu bisnis seperti milik Anda untuk berkembang." {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  
                  <Separator />
                  
                  <h3 className="text-lg font-medium">Produk 1: Sistem Restoran Digital</h3>
                  <FormField control={form.control} name="product1Title" render={({ field }) => (
                    <FormItem><FormLabel>Judul</FormLabel><FormControl><Input placeholder="Sistem Restoran Digital" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="product1IconUrl" render={({ field }) => (
                    <FormItem><FormLabel>URL Ikon Produk 1 (PNG)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="product1Description" render={({ field }) => (
                    <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Textarea placeholder="Aplikasi manajemen kafe lengkap..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="product1Link" render={({ field }) => (
                    <FormItem><FormLabel>Tautan Demo</FormLabel><FormControl><Input placeholder="/cafe" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  
                  <Separator />
                  
                  <h3 className="text-lg font-medium">Produk 2: Undangan Digital</h3>
                  <FormField control={form.control} name="product2Title" render={({ field }) => (
                    <FormItem><FormLabel>Judul</FormLabel><FormControl><Input placeholder="Undangan Pernikahan Digital" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="product2IconUrl" render={({ field }) => (
                    <FormItem><FormLabel>URL Ikon Produk 2 (PNG)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="product2Description" render={({ field }) => (
                    <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Textarea placeholder="Sistem undangan pernikahan digital modern..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="product2Link" render={({ field }) => (
                    <FormItem><FormLabel>Tautan Contoh</FormLabel><FormControl><Input placeholder="/upd/hani" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

              </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Pengaturan Media Sosial</CardTitle>
                    <CardDescription>Atur link profil dan ikon media sosial yang akan tampil di footer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Instagram */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                            <FormItem><FormLabel>URL Instagram</FormLabel><FormControl><Input placeholder="https://instagram.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="instagramIconUrl" render={({ field }) => (
                            <FormItem><FormLabel>URL Ikon Instagram (PNG)</FormLabel><FormControl><Input placeholder="Link Google Drive..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    {/* TikTok */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <FormField control={form.control} name="tiktokUrl" render={({ field }) => (
                            <FormItem><FormLabel>URL TikTok</FormLabel><FormControl><Input placeholder="https://tiktok.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tiktokIconUrl" render={({ field }) => (
                            <FormItem><FormLabel>URL Ikon TikTok (PNG)</FormLabel><FormControl><Input placeholder="Link Google Drive..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    {/* Facebook */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <FormField control={form.control} name="facebookUrl" render={({ field }) => (
                            <FormItem><FormLabel>URL Facebook</FormLabel><FormControl><Input placeholder="https://facebook.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="facebookIconUrl" render={({ field }) => (
                            <FormItem><FormLabel>URL Ikon Facebook (PNG)</FormLabel><FormControl><Input placeholder="Link Google Drive..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    {/* Twitter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <FormField control={form.control} name="twitterUrl" render={({ field }) => (
                            <FormItem><FormLabel>URL Twitter</FormLabel><FormControl><Input placeholder="https://twitter.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="twitterIconUrl" render={({ field }) => (
                            <FormItem><FormLabel>URL Ikon Twitter (PNG)</FormLabel><FormControl><Input placeholder="Link Google Drive..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </CardContent>
             </Card>

            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
            </Button>
          </form>
        </Form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{!!editingSlide ? 'Ubah Slide Hero' : 'Tambah Slide Hero Baru'}</DialogTitle>
            <DialogDescriptionComponent>{!!editingSlide ? 'Ubah detail slide.' : 'Buat slide hero baru untuk slideshow di halaman utama.'}</DialogDescriptionComponent>
          </DialogHeader>
          <HeroSlideForm
            onFormSubmit={() => setIsSlideFormOpen(false)}
            slide={editingSlide}
            slideCount={heroSlides.length}
          />
        </DialogContent>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{!!editingPackage ? 'Ubah Paket Harga' : 'Tambah Paket Harga Baru'}</DialogTitle>
             <DialogDescriptionComponent>{!!editingPackage ? 'Ubah detail paket.' : 'Buat paket harga baru.'}</DialogDescriptionComponent>
          </DialogHeader>
          <PricingPackageForm
            onFormSubmit={() => setIsPackageFormOpen(false)}
            pkg={editingPackage}
            packageCount={pricingPackages.length}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

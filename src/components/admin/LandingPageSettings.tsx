
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { LandingPageContent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { logActivity } from "@/lib/activity-log";
import { Separator } from "../ui/separator";


const landingPageSchema = z.object({
  websiteTitle: z.string().optional(),
  brandName: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroImageUrl: z.string().url("URL gambar tidak valid").or(z.literal('')).optional(),
  featuresSubtitle: z.string().optional(),
  portfolioSubtitle: z.string().optional(),
  portfolioImageUrl1: z.string().url("URL gambar tidak valid").or(z.literal('')).optional(),
  portfolioImageUrl2: z.string().url("URL gambar tidak valid").or(z.literal('')).optional(),
});

type LandingPageFormValues = z.infer<typeof landingPageSchema>;

export function LandingPageSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<LandingPageFormValues>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: {
      websiteTitle: "",
      brandName: "",
      heroTitle: "",
      heroSubtitle: "",
      heroImageUrl: "",
      featuresSubtitle: "",
      portfolioSubtitle: "",
      portfolioImageUrl1: "",
      portfolioImageUrl2: "",
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

  return (
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bagian Utama (Hero Section)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="heroTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Utama</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Elektronik Restoran Sistem Modern..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="heroSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-judul / Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="VELL menyediakan solusi lengkap..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="heroImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Gambar Hero</FormLabel>
                  <FormControl>
                    <Input placeholder="https://images.unsplash.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bagian Fitur &amp; Portofolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="featuresSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Bagian Fitur</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Dari pesanan di meja hingga laporan keuangan..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="portfolioSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Bagian Portofolio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Lihat bagaimana kami telah membantu..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="portfolioImageUrl1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Gambar Portofolio 1 (cth: Badia Kopi)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://images.unsplash.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="portfolioImageUrl2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Gambar Portofolio 2 (cth: Undangan)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://images.unsplash.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
        </Button>
      </form>
    </Form>
  );
}

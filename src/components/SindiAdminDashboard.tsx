'use client';

import React, { useState } from 'react';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, setDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Rsvp, GuestbookMessage, WeddingDetails, Photo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Trash } from 'lucide-react';
import { getGoogleDriveFileUrl } from '@/lib/utils';
import { useUser } from '@/firebase';

const flowerFrameUrlsSchema = z.object({
  topLeft: z.array(z.string().url("URL tidak valid").or(z.literal(''))).max(5, "Maksimal 5 URL").optional(),
  topRight: z.array(z.string().url("URL tidak valid").or(z.literal(''))).max(5, "Maksimal 5 URL").optional(),
});

const weddingDetailsSchema = z.object({
  coupleName: z.string().min(1, "Couple name is required."),
  eventDate: z.string().min(1, "Event date is required."),
  eventTime: z.string().min(1, "Event time is required."),
  eventLocation: z.string().min(1, "Event location is required."),
  eventAddress: z.string().min(1, "Event address is required."),
  quote: z.string().optional(),
  coverMainImageUrl: z.string().url("URL tidak valid.").optional().or(z.literal('')),
  coverBackgroundUrl: z.string().url("URL tidak valid.").optional().or(z.literal('')),
  backgroundUrl: z.string().url("URL tidak valid.").optional().or(z.literal('')),
  loadingGifUrl: z.string().url("URL tidak valid.").optional().or(z.literal('')),
  brideName: z.string().optional(),
  brideParents: z.string().optional(),
  brideImageUrl: z.string().url("URL tidak valid.").optional().or(z.literal('')),
  groomName: z.string().optional(),
  groomParents: z.string().optional(),
  groomImageUrl: z.string().url("URL tidak valid.").optional().or(z.literal('')),
  
  akadTitle: z.string().optional(),
  akadDate: z.string().optional(),
  akadTime: z.string().optional(),
  akadLocation: z.string().optional(),
  akadAddress: z.string().optional(),
  akadGoogleMapsUrl: z.string().url("URL tidak valid.").optional().or(z.literal('')),

  resepsiTitle: z.string().optional(),
  resepsiDate: z.string().optional(),
  resepsiTime: z.string().optional(),
  resepsiLocation: z.string().optional(),
  resepsiAddress: z.string().optional(),
  resepsiGoogleMapsUrl: z.string().url("URL tidak valid.").optional().or(z.literal('')),
  
  countdownDate: z.string().optional(),
  countdownTime: z.string().optional(),

  bcaAccountNumber: z.string().optional(),
  bcaAccountName: z.string().optional(),
  danaNumber: z.string().optional(),
  danaName: z.string().optional(),
  danaQrImageUrl: z.string().url("URL tidak valid.").optional().or(z.literal('')),
  flowerFrameUrls: flowerFrameUrlsSchema.optional(),
  flowerSeparatorUrl: z.string().url("URL tidak valid.").optional().or(z.literal('')),
});

const defaultWeddingDetails: WeddingDetails = {
    coupleName: "Sindi & Darsono",
    eventDate: "Saturday, September 28, 2024",
    eventTime: "4:00 PM onwards",
    eventLocation: "The Grand Ballroom",
    eventAddress: "123 Wedding Ave, Celebration City",
    quote: "To love and to be loved is to feel the sun from both sides.",
    coverMainImageUrl: '',
    coverBackgroundUrl: 'https://drive.google.com/file/d/1FmFHuCesWHrp_wXKjJ9pCRoqXLf9H_VP/view?usp=drive_link',
    backgroundUrl: 'https://drive.google.com/file/d/1FmFHuCesWHrp_wXKjJ9pCRoqXLf9H_VP/view?usp=drive_link',
    brideName: 'Sindi Aulia',
    brideParents: 'Putri dari Bapak John Doe & Ibu Jane Doe',
    brideImageUrl: '',
    groomName: 'Darsono Wijaya',
    groomParents: 'Putra dari Bapak Richard Roe & Ibu Mary Roe',
    groomImageUrl: '',
    akadTitle: 'Akad Nikah',
    akadDate: '2024-09-28',
    akadTime: '08:00 - 10:00 WIB',
    akadLocation: 'Masjid Istiqlal',
    akadAddress: 'Jl. Taman Wijaya Kusuma, Ps. Baru, Kecamatan Sawah Besar, Jakarta Pusat',
    akadGoogleMapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.81198224921!2d106.83115481476886!3d-6.155497995542!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5c0b165b63b%3A0x28b34f66432f8303!2sIstiqlal%20Mosque!5e0!3m2!1sen!2sid!4v1622013444444!5m2!1sen!2sid',
    resepsiTitle: 'Resepsi',
    resepsiDate: '2024-09-28',
    resepsiTime: '16:00',
    resepsiLocation: 'The Grand Ballroom',
    resepsiAddress: '123 Wedding Ave, Celebration City',
    resepsiGoogleMapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.81198224921!2d106.83115481476886!3d-6.155497995542!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5c0b165b63b%3A0x28b34f66432f8303!2sIstiqlal%20Mosque!5e0!3m2!1sen!2sid!4v1622013444444!5m2!1sen!2sid',
    countdownDate: '',
    countdownTime: '',
    bcaAccountNumber: '',
    bcaAccountName: '',
    danaNumber: '',
    danaName: '',
    danaQrImageUrl: '',
    flowerFrameUrls: {
      topLeft: Array(5).fill(''),
      topRight: Array(5).fill(''),
    },
    flowerSeparatorUrl: 'https://drive.google.com/file/d/1gq_23a7L3_8n-n3mGfFzGmzWJ8J2jYpS/view?usp=drive_link',
};

function FlowerFrameSettingsForm({ weddingId }: { weddingId: string }) {
    const { firestore } = useFirebase();
    const detailsDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'weddings', weddingId);
    }, [firestore, weddingId]);

    const { data: weddingDetails, isLoading } = useDoc<WeddingDetails>(detailsDocRef);
    
    const { register, control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<WeddingDetails>({
        resolver: zodResolver(weddingDetailsSchema),
        defaultValues: defaultWeddingDetails,
        values: weddingDetails ?? defaultWeddingDetails,
    });

    const { fields: topLeftFields, append: appendTopLeft, remove: removeTopLeft } = useFieldArray({
        control,
        name: "flowerFrameUrls.topLeft",
    });

    const { fields: topRightFields, append: appendTopRight, remove: removeTopRight } = useFieldArray({
        control,
        name: "flowerFrameUrls.topRight",
    });
    
    React.useEffect(() => {
        if (weddingDetails) {
            const currentTopLeft = weddingDetails.flowerFrameUrls?.topLeft || [];
            const currentTopRight = weddingDetails.flowerFrameUrls?.topRight || [];
            
            const paddedTopLeft = [...currentTopLeft, ...Array(5 - currentTopLeft.length).fill('')];
            const paddedTopRight = [...currentTopRight, ...Array(5 - currentTopRight.length).fill('')];

            reset({
                ...weddingDetails,
                flowerFrameUrls: {
                    topLeft: paddedTopLeft,
                    topRight: paddedTopRight,
                }
            });
        } else {
             reset(defaultWeddingDetails);
        }
    }, [weddingDetails, reset]);


    const onSubmit = async (data: WeddingDetails) => {
        if (!detailsDocRef) return;
        try {
            // Filter out empty strings before saving
            const saveData = {
                ...data,
                flowerFrameUrls: {
                    topLeft: data.flowerFrameUrls?.topLeft?.filter(url => url),
                    topRight: data.flowerFrameUrls?.topRight?.filter(url => url),
                }
            }
            await setDoc(detailsDocRef, saveData, { merge: true });
            toast({
                title: "Sukses!",
                description: "Pengaturan bingkai bunga telah diperbarui."
            });
        } catch (e) {
            console.error(e);
            toast({
                title: "Error",
                description: "Tidak dapat memperbarui pengaturan.",
                variant: 'destructive',
            });
        }
    };

    if (isLoading) {
        return <p>Memuat pengaturan...</p>;
    }

    const renderUrlInputs = (fields: any[], remove: (index: number) => void, namePrefix: "flowerFrameUrls.topLeft" | "flowerFrameUrls.topRight") => {
        return fields.slice(0, 5).map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
                <Input
                    {...register(`${namePrefix}.${index}` as const)}
                    placeholder={`URL Gambar Bunga ${index + 1}`}
                    className="flex-grow"
                />
            </div>
        ));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pengaturan Bingkai Bunga</CardTitle>
                <CardDescription>
                    Atur gambar yang akan ditampilkan sebagai bingkai bunga di halaman sampul. 
                    Anda bisa memasukkan hingga 5 URL untuk setiap sudut. Kosongkan input jika tidak ingin menampilkan bunga.
                    Animasi akan diterapkan pada 4 gambar pertama.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 border p-4 rounded-md">
                            <h3 className="font-medium">Sudut Kiri Atas</h3>
                            {renderUrlInputs(topLeftFields, removeTopLeft, "flowerFrameUrls.topLeft")}
                        </div>
                        <div className="space-y-4 border p-4 rounded-md">
                            <h3 className="font-medium">Sudut Kanan Atas</h3>
                            {renderUrlInputs(topRightFields, removeTopRight, "flowerFrameUrls.topRight")}
                        </div>
                    </div>
                    
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan Bunga'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function WeddingDetailsForm({ weddingId }: { weddingId: string }) {
  const { firestore } = useFirebase();
  const detailsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'weddings', weddingId);
  }, [firestore, weddingId]);

  const { data: weddingDetails, isLoading } = useDoc<WeddingDetails>(detailsDocRef);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<WeddingDetails>({
    resolver: zodResolver(weddingDetailsSchema),
    defaultValues: defaultWeddingDetails,
    values: weddingDetails ?? defaultWeddingDetails,
  });

  const brideImageUrl = watch('brideImageUrl');
  const groomImageUrl = watch('groomImageUrl');
  const displayBrideImageUrl = getGoogleDriveFileUrl(brideImageUrl);
  const displayGroomImageUrl = getGoogleDriveFileUrl(groomImageUrl);

  if (isLoading) {
    return <p>Loading details...</p>
  }
  
  const onSubmit = async (data: WeddingDetails) => {
    if (!detailsDocRef) return;
    try {
      await setDoc(detailsDocRef, data, { merge: true });
      toast({
        title: "Success!",
        description: "Wedding details have been updated."
      })
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Could not update details.",
        variant: 'destructive',
      })
    }
  };

  const mapUrlHelpText = "Buka Google Maps, cari lokasi, klik 'Share', lalu 'Embed a map'. Salin URL dari dalam src='...' dan tempel di sini.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail Undangan</CardTitle>
        <CardDescription>Atur detail untuk halaman undangan pernikahan. Klik simpan untuk membuat data undangan jika belum ada, atau memperbarui data yang sudah ada.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="coupleName">Nama Pasangan (contoh: Sindi & Darsono)</Label>
            <Input id="coupleName" {...register('coupleName')} />
            {errors.coupleName && <p className="text-destructive text-sm">{errors.coupleName.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium">Detail Mempelai Wanita</h3>
                <div className="space-y-2">
                    <Label htmlFor="brideName">Nama Lengkap Mempelai Wanita</Label>
                    <Input id="brideName" {...register('brideName')} />
                    {errors.brideName && <p className="text-destructive text-sm">{errors.brideName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="brideParents">Nama Orang Tua Mempelai Wanita</Label>
                    <Input id="brideParents" {...register('brideParents')} />
                    {errors.brideParents && <p className="text-destructive text-sm">{errors.brideParents.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="brideImageUrl">URL Foto Mempelai Wanita</Label>
                    <Input id="brideImageUrl" {...register('brideImageUrl')} placeholder="https://..." />
                    {errors.brideImageUrl && <p className="text-destructive text-sm">{errors.brideImageUrl.message}</p>}
                    {displayBrideImageUrl && <div className="mt-2 relative w-32 h-32 border rounded-full overflow-hidden"><Image src={displayBrideImageUrl} alt="Preview" layout="fill" objectFit="cover" /></div>}
                </div>
            </div>
            <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium">Detail Mempelai Pria</h3>
                <div className="space-y-2">
                    <Label htmlFor="groomName">Nama Lengkap Mempelai Pria</Label>
                    <Input id="groomName" {...register('groomName')} />
                    {errors.groomName && <p className="text-destructive text-sm">{errors.groomName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="groomParents">Nama Orang Tua Mempelai Pria</Label>
                    <Input id="groomParents" {...register('groomParents')} />
                    {errors.groomParents && <p className="text-destructive text-sm">{errors.groomParents.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="groomImageUrl">URL Foto Mempelai Pria</Label>
                    <Input id="groomImageUrl" {...register('groomImageUrl')} placeholder="https://..." />
                    {errors.groomImageUrl && <p className="text-destructive text-sm">{errors.groomImageUrl.message}</p>}
                    {displayGroomImageUrl && <div className="mt-2 relative w-32 h-32 border rounded-full overflow-hidden"><Image src={displayGroomImageUrl} alt="Preview" layout="fill" objectFit="cover" /></div>}
                </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="font-medium">Detail Akad Nikah</h3>
              <div className="space-y-2">
                  <Label htmlFor="akadTitle">Judul Acara</Label>
                  <Input id="akadTitle" {...register('akadTitle')} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="akadDate">Tanggal</Label>
                  <Input id="akadDate" {...register('akadDate')} placeholder="YYYY-MM-DD" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="akadTime">Waktu</Label>
                  <Input id="akadTime" {...register('akadTime')} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="akadLocation">Lokasi</Label>
                  <Input id="akadLocation" {...register('akadLocation')} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="akadAddress">Alamat</Label>
                  <Textarea id="akadAddress" {...register('akadAddress')} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="akadGoogleMapsUrl">URL Google Maps Embed</Label>
                  <Input id="akadGoogleMapsUrl" {...register('akadGoogleMapsUrl')} placeholder="https://www.google.com/maps/embed?pb=..." />
                  <p className="text-xs text-muted-foreground">{mapUrlHelpText}</p>
                  {errors.akadGoogleMapsUrl && <p className="text-destructive text-sm">{errors.akadGoogleMapsUrl.message}</p>}
              </div>
            </div>
            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="font-medium">Detail Resepsi</h3>
              <div className="space-y-2">
                  <Label htmlFor="resepsiTitle">Judul Acara</Label>
                  <Input id="resepsiTitle" {...register('resepsiTitle')} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="resepsiDate">Tanggal Acara</Label>
                  <Input id="resepsiDate" {...register('resepsiDate')} placeholder="YYYY-MM-DD" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="resepsiTime">Waktu Acara</Label>
                  <Input id="resepsiTime" {...register('resepsiTime')} placeholder="HH:mm" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="resepsiLocation">Lokasi</Label>
                  <Input id="resepsiLocation" {...register('resepsiLocation')} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="resepsiAddress">Alamat</Label>
                  <Textarea id="resepsiAddress" {...register('resepsiAddress')} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="resepsiGoogleMapsUrl">URL Google Maps Embed</Label>
                  <Input id="resepsiGoogleMapsUrl" {...register('resepsiGoogleMapsUrl')} placeholder="https://www.google.com/maps/embed?pb=..." />
                  <p className="text-xs text-muted-foreground">{mapUrlHelpText}</p>
                  {errors.resepsiGoogleMapsUrl && <p className="text-destructive text-sm">{errors.resepsiGoogleMapsUrl.message}</p>}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 border p-4 rounded-md">
              <h3 className="font-medium">Pengaturan Hitung Mundur</h3>
              <div className="space-y-2">
                <Label htmlFor="countdownDate">Tanggal Hitung Mundur</Label>
                <Input id="countdownDate" {...register('countdownDate')} placeholder="YYYY-MM-DD" />
                 {errors.countdownDate && <p className="text-destructive text-sm">{errors.countdownDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="countdownTime">Waktu Hitung Mundur</Label>
                <Input id="countdownTime" {...register('countdownTime')} placeholder="HH:mm" />
                 {errors.countdownTime && <p className="text-destructive text-sm">{errors.countdownTime.message}</p>}
              </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote">Kutipan</Label>
            <Textarea id="quote" {...register('quote')} placeholder="Kutipan indah untuk ditampilkan." />
            {errors.quote && <p className="text-destructive text-sm">{errors.quote.message}</p>}
          </div>

          {/* Hidden fields for backwards compatibility with Hero, can be removed later */}
          <input type="hidden" {...register('eventDate')} />
          <input type="hidden" {...register('eventTime')} />
          <input type="hidden" {...register('eventLocation')} />
          <input type="hidden" {...register('eventAddress')} />
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Detail'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function DisplaySettingsForm({ weddingId }: { weddingId: string }) {
  const { firestore } = useFirebase();
  const detailsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'weddings', weddingId);
  }, [firestore, weddingId]);

  const { data: weddingDetails, isLoading } = useDoc<WeddingDetails>(detailsDocRef);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<WeddingDetails>({
    resolver: zodResolver(weddingDetailsSchema),
    values: weddingDetails ?? defaultWeddingDetails,
  });

  const coverMainImageUrl = watch('coverMainImageUrl');
  const coverBackgroundUrl = watch('coverBackgroundUrl');
  const backgroundUrl = watch('backgroundUrl');
  const flowerSeparatorUrl = watch('flowerSeparatorUrl');
  const loadingGifUrl = watch('loadingGifUrl');
  
  const displayCoverMainUrl = getGoogleDriveFileUrl(coverMainImageUrl);
  const displayCoverBgUrl = getGoogleDriveFileUrl(coverBackgroundUrl);
  const displayBgUrl = getGoogleDriveFileUrl(backgroundUrl);
  const displayFlowerSeparatorUrl = getGoogleDriveFileUrl(flowerSeparatorUrl);
  const displayLoadingGifUrl = getGoogleDriveFileUrl(loadingGifUrl);
  
  if (isLoading) {
    return <p>Loading settings...</p>
  }
  
  const onSubmit = async (data: WeddingDetails) => {
    if (!detailsDocRef) return;
    try {
      await setDoc(detailsDocRef, data, { merge: true });

      toast({
        title: "Success!",
        description: "Display settings have been updated."
      })
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Could not update settings.",
        variant: 'destructive',
      })
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Tampilan</CardTitle>
        <CardDescription>Atur gambar latar untuk sampul dan undangan. Gunakan URL gambar dari Google Drive atau layanan lain.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="coverBackgroundUrl">URL Gambar Latar Sampul</Label>
            <Input 
              id="coverBackgroundUrl" 
              placeholder="https://..."
              {...register('coverBackgroundUrl')}
            />
            {errors.coverBackgroundUrl && <p className="text-destructive text-sm">{errors.coverBackgroundUrl.message}</p>}
            {displayCoverBgUrl && (
                <div className="mt-4 relative w-full h-64 border rounded-md overflow-hidden">
                    <Image src={displayCoverBgUrl} alt="Preview Latar Sampul" layout="fill" objectFit="cover" />
                </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverMainImageUrl">URL Gambar Utama Sampul</Label>
            <Input 
              id="coverMainImageUrl" 
              placeholder="https://..."
              {...register('coverMainImageUrl')}
            />
            {errors.coverMainImageUrl && <p className="text-destructive text-sm">{errors.coverMainImageUrl.message}</p>}
            {displayCoverMainUrl && (
                <div className="mt-4 relative w-48 h-48 border rounded-md overflow-hidden">
                    <Image src={displayCoverMainUrl} alt="Preview Gambar Utama Sampul" layout="fill" objectFit="cover" />
                </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="backgroundUrl">URL Gambar Latar Undangan</Label>
            <Input 
              id="backgroundUrl" 
              placeholder="https://..."
              {...register('backgroundUrl')}
            />
            {errors.backgroundUrl && <p className="text-destructive text-sm">{errors.backgroundUrl.message}</p>}
            {displayBgUrl && (
                <div className="mt-4 relative w-full h-64 border rounded-md overflow-hidden">
                    <Image src={displayBgUrl} alt="Preview Latar" layout="fill" objectFit="cover" />
                </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="flowerSeparatorUrl">URL Gambar Ornamen Bunga</Label>
            <Input 
              id="flowerSeparatorUrl" 
              placeholder="https://..."
              {...register('flowerSeparatorUrl')}
            />
            {errors.flowerSeparatorUrl && <p className="text-destructive text-sm">{errors.flowerSeparatorUrl.message}</p>}
            {displayFlowerSeparatorUrl && (
                <div className="mt-4 relative w-48 h-24 border rounded-md overflow-hidden">
                    <Image src={displayFlowerSeparatorUrl} alt="Preview Ornamen Bunga" layout="fill" objectFit="contain" />
                </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="loadingGifUrl">URL GIF Animasi Pemuatan</Label>
            <Input 
              id="loadingGifUrl" 
              placeholder="https://..."
              {...register('loadingGifUrl')}
            />
            {errors.loadingGifUrl && <p className="text-destructive text-sm">{errors.loadingGifUrl.message}</p>}
            {displayLoadingGifUrl && (
                <div className="mt-4 relative w-32 h-32 border rounded-md overflow-hidden">
                    <Image src={displayLoadingGifUrl} alt="Preview GIF Pemuatan" layout="fill" objectFit="contain" />
                </div>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function GiftSettingsForm({ weddingId }: { weddingId: string }) {
  const { firestore } = useFirebase();
  const detailsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'weddings', weddingId);
  }, [firestore, weddingId]);

  const { data: weddingDetails, isLoading } = useDoc<WeddingDetails>(detailsDocRef);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<WeddingDetails>({
    resolver: zodResolver(weddingDetailsSchema),
    values: weddingDetails ?? defaultWeddingDetails,
  });

  const danaQrImageUrl = watch('danaQrImageUrl');
  const displayDanaQrUrl = getGoogleDriveFileUrl(danaQrImageUrl);
  
  if (isLoading) {
    return <p>Loading settings...</p>
  }
  
  const onSubmit = async (data: WeddingDetails) => {
    if (!detailsDocRef) return;
    try {
      await setDoc(detailsDocRef, data, { merge: true });

      toast({
        title: "Success!",
        description: "Gift settings have been updated."
      })
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Could not update settings.",
        variant: 'destructive',
      })
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Hadiah</CardTitle>
        <CardDescription>Atur informasi rekening bank dan dompet digital untuk hadiah pernikahan.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium">Bank (BCA)</h3>
                <div className="space-y-2">
                    <Label htmlFor="bcaAccountName">Nama Pemilik Rekening</Label>
                    <Input id="bcaAccountName" {...register('bcaAccountName')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bcaAccountNumber">Nomor Rekening</Label>
                    <Input id="bcaAccountNumber" {...register('bcaAccountNumber')} />
                </div>
              </div>
              <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium">Dompet Digital (DANA)</h3>
                <div className="space-y-2">
                    <Label htmlFor="danaName">Nama Akun</Label>
                    <Input id="danaName" {...register('danaName')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="danaNumber">Nomor Telepon</Label>
                    <Input id="danaNumber" {...register('danaNumber')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="danaQrImageUrl">URL Gambar QR Code</Label>
                    <Input id="danaQrImageUrl" {...register('danaQrImageUrl')} placeholder="https://..." />
                    {displayDanaQrUrl && <div className="mt-2 relative w-32 h-32 border rounded-md overflow-hidden"><Image src={displayDanaQrUrl} alt="Preview QR" layout="fill" objectFit="contain" /></div>}
                </div>
              </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan Hadiah'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

const photoSchema = z.object({
    url: z.string().url("URL gambar tidak valid.").or(z.literal('')),
    description: z.string().min(1, "Deskripsi diperlukan."),
    quote: z.string().optional(),
    createdAt: z.any().optional(),
});

const gallerySchema = z.object({
  photos: z.array(photoSchema),
});


function GalleryForm() {
    const { firestore } = useFirebase();
    const photosQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'photos'), orderBy('createdAt', 'asc'));
    }, [firestore]);

    const { data: photosData, isLoading } = useCollection<Photo>(photosQuery);

    const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<z.infer<typeof gallerySchema>>({
        resolver: zodResolver(gallerySchema),
        defaultValues: { photos: [] },
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "photos",
    });

    React.useEffect(() => {
        if (photosData) {
            reset({ photos: photosData });
        }
    }, [photosData, reset]);

    const onSave = async (data: z.infer<typeof gallerySchema>) => {
        if (!firestore) return;

        try {
            // This is a simple approach. For complex scenarios, you might want to batch writes.
            for (const [index, photo] of data.photos.entries()) {
                const docRef = doc(firestore, 'photos', fields[index].id);
                await setDoc(docRef, { 
                    ...photo, 
                    // Keep existing createdAt or set a new one if it's a new photo
                    createdAt: (photosData && photosData[index]?.createdAt) || Timestamp.now() 
                }, { merge: true });
            }
            
            toast({
                title: 'Sukses!',
                description: 'Galeri berhasil diperbarui.',
            });
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'Tidak dapat menyimpan galeri.',
                variant: 'destructive',
            });
        }
    };
    
    const onAdd = () => {
       if (!firestore) return;
        const newPhotoData = { 
          url: '', 
          description: 'Foto baru', 
          quote: '',
          createdAt: Timestamp.now()
        };
        addDoc(collection(firestore, 'photos'), newPhotoData)
          .then(() => {
             toast({ title: 'Foto ditambahkan', description: 'Sebuah kolom foto baru telah ditambahkan. Isi detailnya dan simpan.' });
          })
          .catch(e => {
            console.error(e);
            toast({ title: 'Error', description: 'Gagal menambahkan foto baru.', variant: 'destructive' });
          });
    };

    const onDelete = async (photoId: string, index: number) => {
        if (!firestore) return;
        
        const isNewUnsavedItem = !photosData?.some(p => p.id === photoId);
        if (isNewUnsavedItem) {
             remove(index);
             return;
        }

        if (confirm('Anda yakin ingin menghapus foto ini?')) {
            try {
                await deleteDoc(doc(firestore, 'photos', photoId));
                remove(index); // remove from form state
                toast({
                    title: 'Dihapus!',
                    description: 'Foto telah dihapus dari galeri.',
                    variant: 'destructive'
                });
            } catch (error) {
                console.error(error);
                toast({
                    title: 'Error',
                    description: 'Tidak dapat menghapus foto.',
                    variant: 'destructive',
                });
            }
        }
    };


    if (isLoading) {
        return <p>Memuat galeri...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pengaturan Galeri</CardTitle>
                <CardDescription>Atur foto dan kutipan yang akan ditampilkan di galeri "Our Moments".</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSave)} className="space-y-6">
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                                <h4 className="font-medium">Foto {index + 1}</h4>
                                <div className="space-y-1">
                                    <Label>URL Gambar</Label>
                                    <Input {...register(`photos.${index}.url`)} placeholder="https://..." />
                                    {errors.photos?.[index]?.url && <p className="text-destructive text-sm">{errors.photos[index].url?.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label>Deskripsi (untuk Alt Text)</Label>
                                    <Input {...register(`photos.${index}.description`)} placeholder="Contoh: Momen pre-wedding kami" />
                                     {errors.photos?.[index]?.description && <p className="text-destructive text-sm">{errors.photos[index].description?.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label>Kutipan (Opsional)</Label>
                                    <Textarea {...register(`photos.${index}.quote`)} placeholder="Kutipan yang akan tampil di bawah foto" />
                                </div>
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => onDelete(field.id, index)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onAdd}>
                            Tambah Foto
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Galeri'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}


function RsvpList() {
    const { firestore } = useFirebase();
    const rsvpsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'sindi_rsvps'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: rsvps, isLoading } = useCollection<Rsvp>(rsvpsQuery);

    if (isLoading) {
        return <p className="text-center p-8">Loading RSVPs...</p>;
    }
    
    if (!rsvps || rsvps.length === 0) {
        return <p className="text-center p-8">No RSVPs received yet.</p>;
    }

    const attendingCount = rsvps.filter(r => r.attending === 'yes').length;
    const notAttendingCount = rsvps.length - attendingCount;

    return (
        <div>
            <div className="flex items-center gap-4 mb-4 text-sm">
                <p>Total Responses: <span className="font-bold">{rsvps.length}</span></p>
                <p>Attending: <span className="font-bold text-green-600">{attendingCount}</span></p>
                <p>Not Attending: <span className="font-bold text-red-600">{notAttendingCount}</span></p>
            </div>
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Dikirim Pada</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rsvps.map((rsvp) => (
                            <TableRow key={rsvp.id}>
                                <TableCell className="font-medium">{rsvp.name}</TableCell>
                                <TableCell>
                                    <Badge variant={rsvp.attending === 'yes' ? 'default' : 'destructive'} className={rsvp.attending === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {rsvp.attending === 'yes' ? 'Hadir' : 'Tidak Hadir'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{rsvp.createdAt ? format((rsvp.createdAt as unknown as Timestamp).toDate(), "PPpp") : '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

function GuestbookList() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const guestbookCollectionName = 'sindi_guestbook_messages';
    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, guestbookCollectionName), orderBy('createdAt', 'desc'));
    }, [firestore, guestbookCollectionName]);

    const { data: messages, isLoading } = useCollection<GuestbookMessage>(messagesQuery);
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    const [isReplying, setIsReplying] = useState<{ [key: string]: boolean }>({});

    const handleReplySubmit = async (messageId: string) => {
        if (!firestore || !replyText[messageId] || !user) return;

        setIsReplying(prevState => ({ ...prevState, [messageId]: true }));
        const messageDocRef = doc(firestore, guestbookCollectionName, messageId);

        try {
            await updateDoc(messageDocRef, {
                adminReply: replyText[messageId],
                adminReplierName: user.displayName || 'mempelai'
            });
            toast({
                title: "Balasan Terkirim",
                description: "Balasan Anda telah disimpan.",
            });
            setReplyText(prev => ({ ...prev, [messageId]: '' }));
        } catch (error) {
            console.error("Error sending reply: ", error);
            toast({
                title: "Error",
                description: "Gagal mengirim balasan.",
                variant: "destructive",
            });
        } finally {
            setIsReplying(prevState => ({ ...prevState, [messageId]: false }));
        }
    };


    if (isLoading) {
        return <p className="text-center p-8">Loading messages...</p>;
    }

    if (!messages || messages.length === 0) {
        return <p className="text-center p-8">No guestbook messages yet.</p>;
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/4">Dari</TableHead>
                        <TableHead className="w-1/2">Pesan & Balasan</TableHead>
                        <TableHead className="w-1/4">Dikirim Pada</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {messages.map((msg) => (
                        <TableRow key={msg.id} className="align-top">
                            <TableCell className="font-medium">{msg.name}</TableCell>
                            <TableCell className="space-y-4">
                                <div className="max-w-sm whitespace-pre-wrap">{msg.message}</div>
                                
                                {msg.adminReply && (
                                    <div className="p-3 bg-accent/50 rounded-md border-l-4 border-primary">
                                        <p className="font-semibold text-sm text-primary">Balasan dari {msg.adminReplierName || 'mempelai'}:</p>
                                        <p className="text-sm text-foreground/80">{msg.adminReply}</p>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={msg.adminReply ? "Ubah balasan..." : "Tulis balasan..."}
                                        value={replyText[msg.id!] || ''}
                                        onChange={(e) => setReplyText(prev => ({ ...prev, [msg.id!]: e.target.value }))}
                                        disabled={isReplying[msg.id!]}
                                    />
                                    <Button 
                                        onClick={() => handleReplySubmit(msg.id!)} 
                                        disabled={!replyText[msg.id!] || isReplying[msg.id!]}
                                    >
                                        {isReplying[msg.id!] ? 'Mengirim...' : 'Balas'}
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell>{msg.createdAt ? format((msg.createdAt as unknown as Timestamp).toDate(), "PPpp") : '-'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}


export function SindiAdminDashboard() {
  const weddingId = 'sindi';
  return (
    <div className="min-h-screen bg-background">
        <header className="bg-accent/50 border-b">
            <div className="container mx-auto px-4 md:px-6 py-4">
                <h1 className="text-2xl font-bold font-headline text-primary">Admin Dashboard</h1>
                <p className="text-muted-foreground">Sindi & Darsono's Wedding</p>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-6">
            <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-7 max-w-4xl">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="display">Tampilan</TabsTrigger>
                    <TabsTrigger value="flowers">Bingkai Bunga</TabsTrigger>
                    <TabsTrigger value="gallery">Galeri</TabsTrigger>
                    <TabsTrigger value="gifts">Hadiah</TabsTrigger>
                    <TabsTrigger value="rsvps">RSVPs</TabsTrigger>
                    <TabsTrigger value="guestbook">Guestbook</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-6">
                   <WeddingDetailsForm weddingId={weddingId} />
                </TabsContent>
                 <TabsContent value="display" className="mt-6">
                   <DisplaySettingsForm weddingId={weddingId} />
                </TabsContent>
                 <TabsContent value="flowers" className="mt-6">
                   <FlowerFrameSettingsForm weddingId={weddingId} />
                </TabsContent>
                 <TabsContent value="gallery" className="mt-6">
                   <GalleryForm />
                </TabsContent>
                <TabsContent value="gifts" className="mt-6">
                    <GiftSettingsForm weddingId={weddingId} />
                </TabsContent>
                <TabsContent value="rsvps" className="mt-6">
                   <RsvpList />
                </TabsContent>
                <TabsContent value="guestbook" className="mt-6">
                    <GuestbookList />
                </TabsContent>
            </Tabs>
        </main>
    </div>
  );
}

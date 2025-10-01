

'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  BookHeart,
  ArrowLeft,
  Users,
  MessageSquareQuote,
  MessageSquareReply,
  Check,
  Trash2,
  Clock,
  Settings,
  ShieldCheck,
  PlusCircle,
  Image as ImageIcon,
  Music,
  Type
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { WeddingInfo, GalleryImage, StoryTimelineItem } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// --- Data Types ---
interface RsvpEntry {
  id: string;
  name: string;
  guests: number;
  attendance: string;
  timestamp: any;
}

interface GuestbookMessage {
  id: string;
  name: string;
  message: string;
  timestamp: any;
  status: 'pending' | 'approved';
  reply?: {
    from: string;
    text: string;
    timestamp: any;
  };
}

interface CombinedEntry {
  id: string;
  name: string;
  guests: number;
  message?: string;
  rsvpTimestamp: any;
  messageTimestamp?: any;
  reply?: GuestbookMessage['reply'];
}

// --- Schemas ---
const storyTimelineItemSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
});


const weddingInfoSchema = z.object({
  brideName: z.string().min(1, "Nama mempelai wanita wajib diisi"),
  groomName: z.string().min(1, "Nama mempelai pria wajib diisi"),
  brideBio: z.string().optional(),
  groomBio: z.string().optional(),
  ceremonyDate: z.string().min(1, "Tanggal akad wajib diisi"),
  ceremonyTime: z.string().min(1, "Waktu akad wajib diisi"),
  ceremonyLocation: z.string().min(1, "Lokasi akad wajib diisi"),
  ceremonyMapUrl: z.string().url("URL Peta tidak valid").or(z.literal('')),
  receptionDate: z.string().min(1, "Tanggal resepsi wajib diisi"),
  receptionTime: z.string().min(1, "Waktu resepsi wajib diisi"),
  receptionLocation: z.string().min(1, "Lokasi resepsi wajib diisi"),
  receptionMapUrl: z.string().url("URL Peta tidak valid").or(z.literal('')),
  isMusicEnabled: z.boolean().optional(),
  backgroundMusicUrl: z.string().url("URL Musik tidak valid").or(z.literal('')),
  invitedFamilies: z.array(z.string()).optional(),
  coverImageUrl: z.string().url("URL Gambar tidak valid").or(z.literal('')),
  storyTimeline: z.array(storyTimelineItemSchema).optional(),
  coverFont: z.string().optional(),
});

const galleryImageSchema = z.object({
  imageUrl: z.string().url("URL Gambar tidak valid"),
});

type WeddingInfoFormValues = z.infer<typeof weddingInfoSchema>;
type GalleryImageFormValues = z.infer<typeof galleryImageSchema>;


// --- Reply Dialog Component ---
function ReplyDialog({
  message,
  weddingInfo,
  onReplySent,
}: {
  message: GuestbookMessage;
  weddingInfo: Partial<WeddingInfo>;
  onReplySent: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [replyText, setReplyText] = useState('');
  const [replyFrom, setReplyFrom] = useState(weddingInfo.brideName || 'Anya');

  useEffect(() => {
    // Set default reply from to bride's name when component loads
    setReplyFrom(weddingInfo.brideName || 'Anya');
  }, [weddingInfo]);

  const handleSendReply = async () => {
    if (!replyText) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Teks balasan tidak boleh kosong.',
      });
      return;
    }

    try {
      const docRef = doc(db, 'upd_guestbook', message.id);
      await updateDoc(docRef, {
        status: 'approved',
        reply: {
          from: replyFrom,
          text: replyText,
          timestamp: new Date(),
        },
      });
      logActivity(user, `Membalas dan menyetujui ucapan dari ${message.name}`);
      toast({
        title: 'Balasan Terkirim',
        description: 'Ucapan telah disetujui dan balasan akan ditampilkan.',
      });
      onReplySent();
    } catch (error) {
      console.error('Gagal mengirim balasan:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengirim balasan.' });
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Balas Ucapan dari {message.name}</DialogTitle>
        <DialogDescription>
          <p className="mt-2 italic border-l-4 pl-4">"{message.message}"</p>
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Balas sebagai:</Label>
          <RadioGroup
            value={replyFrom}
            onValueChange={(value) => setReplyFrom(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={weddingInfo.brideName || 'Anya'} id="from-bride" />
              <Label htmlFor="from-bride">{weddingInfo.brideName || 'Anya'}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={weddingInfo.groomName || 'Loid'} id="from-groom" />
              <Label htmlFor="from-groom">{weddingInfo.groomName || 'Loid'}</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reply-text">Teks Balasan:</Label>
          <Textarea
            id="reply-text"
            placeholder="Tulis balasan Anda di sini..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSendReply}>Kirim Balasan & Setujui</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// --- Moderation Tab Component ---
function ModerationContent({
  messages,
  isLoading,
  onApprove,
  onDelete,
  onReply,
}: {
  messages: GuestbookMessage[];
  isLoading: boolean;
  onApprove: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
  onReply: (message: GuestbookMessage) => void;
}) {
  return (
    <div className="space-y-6">
      {isLoading ? (
        <p>Memuat ucapan...</p>
      ) : messages.length > 0 ? (
        messages.map((msg) => (
          <div
            key={msg.id}
            className="p-4 border rounded-lg flex flex-col md:flex-row md:items-start md:justify-between gap-4"
          >
            <div>
              <p className="font-bold text-lg text-primary">{msg.name}</p>
              <p className="italic text-muted-foreground mt-2">"{msg.message}"</p>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {msg.timestamp
                  ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true, locale: id })
                  : ''}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="destructive" onClick={() => onDelete(msg.id, msg.name)}>
                <Trash2 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Hapus</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReply(msg)}>
                <MessageSquareReply className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Balas</span>
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onApprove(msg.id, msg.name)}
              >
                <Check className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Setujui</span>
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-10">
          Tidak ada ucapan yang menunggu moderasi.
        </p>
      )}
    </div>
  );
}

// --- Guestbook Tab Component ---
function GuestbookContent({
  entries,
  isLoading,
}: {
  entries: CombinedEntry[];
  isLoading: boolean;
}) {
  return (
    <ScrollArea className="h-[65vh] pr-4">
      <div className="space-y-6">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-muted/50 rounded-lg">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))
        ) : entries.length > 0 ? (
          entries.map((entry) => (
            <div key={entry.id} className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex justify-between items-start">
                <p className="font-bold text-primary text-lg">{entry.name}</p>
                <div className="text-xs text-muted-foreground text-right">
                  Konfirmasi:{' '}
                  {entry.rsvpTimestamp
                    ? formatDistanceToNow(entry.rsvpTimestamp.toDate(), {
                        addSuffix: true,
                        locale: id,
                      })
                    : ''}
                </div>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Users className="h-4 w-4" />
                <span>
                  Konfirmasi hadir <span className="font-bold">{entry.guests}</span> orang.
                </span>
              </div>
              {entry.message && (
                <div className="flex items-start gap-3 mt-2 text-sm p-3 bg-background rounded-md">
                  <MessageSquareQuote className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="italic">"{entry.message}"</p>
                </div>
              )}
              {entry.reply && (
                <div className="flex items-start gap-3 mt-3 text-sm p-3 bg-accent/10 rounded-md border-l-4 border-accent">
                  <MessageSquareReply className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                  <div className="w-full">
                    <p className="font-bold text-accent">{entry.reply.from}</p>
                    <p className="italic">"{entry.reply.text}"</p>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-10">
            Belum ada tamu yang mengonfirmasi kehadiran.
          </p>
        )}
      </div>
    </ScrollArea>
  );
}

// --- Settings Tab Component ---
function SettingsContent({
    weddingInfo,
    onSave,
}: {
    weddingInfo: Partial<WeddingInfo>;
    onSave: (data: WeddingInfoFormValues) => void;
}) {
    const form = useForm<WeddingInfoFormValues>({
        resolver: zodResolver(weddingInfoSchema),
        defaultValues: {
            brideName: '',
            groomName: '',
            brideBio: '',
            groomBio: '',
            ceremonyDate: '',
            ceremonyTime: '',
            ceremonyLocation: '',
            ceremonyMapUrl: '',
            receptionDate: '',
            receptionTime: '',
            receptionLocation: '',
            receptionMapUrl: '',
            isMusicEnabled: false,
            backgroundMusicUrl: '',
            invitedFamilies: [],
            coverImageUrl: '',
            storyTimeline: [],
            coverFont: 'serif',
        },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "storyTimeline",
    });
    
    // Custom field for textarea
    const [invitedFamiliesText, setInvitedFamiliesText] = useState('');

    useEffect(() => {
        const fullWeddingInfo = {
            ...form.getValues(), // Keep default values for controlled components
            ...weddingInfo, // Overwrite with fetched data
        };
        form.reset(fullWeddingInfo);
        
        if (weddingInfo.invitedFamilies) {
            setInvitedFamiliesText(weddingInfo.invitedFamilies.join('\n'));
        } else {
            setInvitedFamiliesText('');
        }

    }, [weddingInfo, form]);
    
    const handleFormSubmit = (data: WeddingInfoFormValues) => {
        const familiesArray = invitedFamiliesText.split('\n').map(name => name.trim()).filter(name => name);
        onSave({ ...data, invitedFamilies: familiesArray });
    };

    return (
      <ScrollArea className="h-[65vh] pr-4">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Informasi Mempelai</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <FormField control={form.control} name="brideName" render={({ field }) => (
                            <FormItem><FormLabel>Nama Mempelai Wanita</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="groomName" render={({ field }) => (
                            <FormItem><FormLabel>Nama Mempelai Pria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="brideBio" render={({ field }) => (
                            <FormItem><FormLabel>Bio Mempelai Wanita</FormLabel><FormControl><Input placeholder="Putri dari Bapak & Ibu..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="groomBio" render={({ field }) => (
                            <FormItem><FormLabel>Bio Mempelai Pria</FormLabel><FormControl><Input placeholder="Putra dari Bapak & Ibu..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium">Turut Mengundang</h3>
                    <div className="mt-2 space-y-2">
                        <Label htmlFor="invitedFamilies">Nama Keluarga</Label>
                        <Textarea 
                            id="invitedFamilies"
                            placeholder="Keluarga Bapak Fulan (baris baru)&#x0a;Keluarga Ibu Fulanah"
                            value={invitedFamiliesText}
                            onChange={(e) => setInvitedFamiliesText(e.target.value)}
                            rows={4}
                        />
                        <FormDescription>
                            Masukkan satu nama keluarga per baris.
                        </FormDescription>
                    </div>
                </div>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium">Akad Nikah</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <FormField control={form.control} name="ceremonyDate" render={({ field }) => (
                            <FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input placeholder="Sabtu, 28 Desember 2024" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="ceremonyTime" render={({ field }) => (
                            <FormItem><FormLabel>Waktu</FormLabel><FormControl><Input placeholder="09:00 - 10:00 WIB" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="ceremonyLocation" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Lokasi</FormLabel><FormControl><Input placeholder="Gedung KUA, Jakarta" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="ceremonyMapUrl" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>URL Google Maps</FormLabel><FormControl><Input placeholder="https://maps.app.goo.gl/..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>
                <Separator />
                 <div>
                    <h3 className="text-lg font-medium">Resepsi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                         <FormField control={form.control} name="receptionDate" render={({ field }) => (
                            <FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input placeholder="Sabtu, 28 Desember 2024" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="receptionTime" render={({ field }) => (
                            <FormItem><FormLabel>Waktu</FormLabel><FormControl><Input placeholder="11:00 - 14:00 WIB" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="receptionLocation" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Lokasi</FormLabel><FormControl><Input placeholder="Balai Kartini, Jakarta" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="receptionMapUrl" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>URL Google Maps</FormLabel><FormControl><Input placeholder="https://maps.app.goo.gl/..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>
                <Separator />
                 <div>
                    <h3 className="text-lg font-medium">Perjalanan Kisah</h3>
                    <div className="space-y-4 mt-2">
                        {fields.map((item, index) => (
                            <div key={item.id} className="p-4 border rounded-lg space-y-2 relative">
                                <FormField control={form.control} name={`storyTimeline.${index}.date`} render={({ field }) => (
                                    <FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input placeholder="14 Februari 2020" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`storyTimeline.${index}.title`} render={({ field }) => (
                                    <FormItem><FormLabel>Judul Momen</FormLabel><FormControl><Input placeholder="Pertama Bertemu" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name={`storyTimeline.${index}.description`} render={({ field }) => (
                                    <FormItem><FormLabel>Deskripsi Singkat</FormLabel><FormControl><Textarea placeholder="Ceritakan momen ini..." {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => append({ date: '', title: '', description: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Momen Cerita
                        </Button>
                    </div>
                </div>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium">Tampilan Undangan</h3>
                     <div className="space-y-4 mt-2">
                        <FormField
                            control={form.control}
                            name="coverImageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL Gambar Latar Cover</FormLabel>
                                    <FormControl><Input placeholder="https://images.unsplash.com/..." {...field} /></FormControl>
                                    <FormDescription>Gunakan gambar dengan orientasi potret (vertikal) untuk hasil terbaik.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="coverFont"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Font Nama di Cover</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih gaya font" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="serif">Serif (Formal)</SelectItem>
                                            <SelectItem value="Great Vibes">Great Vibes (Tulisan Sambung)</SelectItem>
                                            <SelectItem value="Sacramento">Sacramento (Santai)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium">Pengaturan Musik Latar</h3>
                    <div className="space-y-4 mt-2">
                        <FormField
                            control={form.control}
                            name="isMusicEnabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Aktifkan Musik Latar</FormLabel>
                                        <FormDescription>Jika aktif, musik akan otomatis diputar saat undangan dibuka.</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="backgroundMusicUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL File Musik (MP3)</FormLabel>
                                    <FormControl><Input placeholder="https://example.com/musik.mp3" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
            </form>
        </Form>
      </ScrollArea>
    );
}

// --- Gallery Tab Component ---
function GalleryContent() {
    const { user, transformGoogleDriveUrl } = useAuth();
    const { toast } = useToast();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<GalleryImageFormValues>({
        resolver: zodResolver(galleryImageSchema),
        defaultValues: { imageUrl: '' },
    });

    useEffect(() => {
        const q = query(collection(db, "upd_gallery_images"), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedImages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
            setImages(fetchedImages);
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    const onAddImageSubmit = async (data: GalleryImageFormValues) => {
        try {
            await addDoc(collection(db, "upd_gallery_images"), {
                imageUrl: data.imageUrl,
                createdAt: serverTimestamp(),
            });
            logActivity(user, `Menambahkan gambar baru ke galeri.`);
            toast({ title: 'Gambar Ditambahkan', description: 'Gambar baru berhasil ditambahkan ke galeri.' });
            form.reset();
        } catch (error) {
            console.error("Gagal menambahkan gambar:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menambahkan gambar.' });
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        try {
            await deleteDoc(doc(db, "upd_gallery_images", imageId));
            logActivity(user, `Menghapus gambar dari galeri (ID: ${imageId}).`);
            toast({ title: 'Gambar Dihapus', description: 'Gambar telah dihapus dari galeri.' });
        } catch (error) {
            console.error("Gagal menghapus gambar:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus gambar.' });
        }
    };

    return (
        <ScrollArea className="h-[65vh] pr-4">
            <div className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddImageSubmit)} className="space-y-4 p-4 border rounded-lg">
                        <h3 className="text-lg font-medium">Tambah Gambar Baru</h3>
                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL Gambar</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <FormDescription>Salin dan tempel URL gambar di sini.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            {form.formState.isSubmitting ? 'Menambahkan...' : 'Tambah ke Galeri'}
                        </Button>
                    </form>
                </Form>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-lg" />)
                    ) : images.length > 0 ? (
                        images.map(image => (
                            <div key={image.id} className="relative group aspect-square">
                                <Image
                                    src={transformGoogleDriveUrl(image.imageUrl)}
                                    alt="Gallery image"
                                    fill
                                    className="object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Hapus Gambar Ini?</AlertDialogTitle>
                                                <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteImage(image.id)}>Hapus</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-muted-foreground py-10">Galeri masih kosong.</p>
                    )}
                </div>
            </div>
        </ScrollArea>
    );
}

// --- Main Admin Page Component ---
export default function UpdAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for Guestbook
  const [combinedEntries, setCombinedEntries] = useState<CombinedEntry[]>([]);
  const [isGuestbookLoading, setIsGuestbookLoading] = useState(true);

  // State for Moderation
  const [pendingMessages, setPendingMessages] = useState<GuestbookMessage[]>([]);
  const [isModerationLoading, setIsModerationLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<GuestbookMessage | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  
  // State for Settings
  const [weddingInfo, setWeddingInfo] = useState<Partial<WeddingInfo>>({});


  // Effect for Guestbook Data
  useEffect(() => {
    const rsvpQuery = query(
      collection(db, 'upd_rsvps'),
      where('attendance', '==', 'Hadir'),
      orderBy('timestamp', 'desc')
    );
    const guestbookQuery = query(
      collection(db, 'upd_guestbook'),
      where('status', '==', 'approved'),
      orderBy('timestamp', 'desc')
    );

    const unsubRsvp = onSnapshot(
      rsvpQuery,
      (rsvpSnapshot) => {
        const rsvps = rsvpSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RsvpEntry));

        const unsubGuestbook = onSnapshot(
          guestbookQuery,
          (guestbookSnapshot) => {
            const messages = guestbookSnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as GuestbookMessage)
            );
            const messageMap = new Map(messages.map((msg) => [msg.name, msg]));

            const combined = rsvps.map((rsvp) => {
              const correspondingMessage = messageMap.get(rsvp.name);
              return {
                id: rsvp.id,
                name: rsvp.name,
                guests: rsvp.guests,
                message: correspondingMessage?.message,
                rsvpTimestamp: rsvp.timestamp,
                messageTimestamp: correspondingMessage?.timestamp,
                reply: correspondingMessage?.reply,
              };
            });

            setCombinedEntries(combined);
            setIsGuestbookLoading(false);
          },
          (error) => {
            console.error('Gagal mengambil data buku tamu:', error);
            setIsGuestbookLoading(false);
          }
        );

        return () => unsubGuestbook();
      },
      (error) => {
        console.error('Gagal mengambil data RSVP:', error);
        setIsGuestbookLoading(false);
      }
    );

    return () => unsubRsvp();
  }, []);
  
  // Effect for Moderation Data
  useEffect(() => {
    const q = query(
      collection(db, 'upd_guestbook'),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as GuestbookMessage)
        );
        setPendingMessages(messages);
        setIsModerationLoading(false);
      },
      (error) => {
        console.error('Gagal mengambil pesan tertunda:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Gagal memuat pesan untuk moderasi.',
        });
        setIsModerationLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);
  
  // Effect for Settings Data
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "upd_settings", "weddingInfo"), (doc) => {
        if (doc.exists()) {
            setWeddingInfo(doc.data());
        }
    });
    return () => unsubSettings();
  }, []);


  // Moderation action handlers
  const handleApprove = async (messageId: string, name: string) => {
    try {
      const docRef = doc(db, 'upd_guestbook', messageId);
      await updateDoc(docRef, { status: 'approved' });
      logActivity(user, `Menyetujui ucapan dari ${name}`);
      toast({ title: 'Disetujui', description: 'Ucapan akan ditampilkan di buku tamu.' });
    } catch (error) {
      console.error('Gagal menyetujui pesan:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyetujui pesan.' });
    }
  };

  const handleDelete = async (messageId: string, name: string) => {
    try {
      const docRef = doc(db, 'upd_guestbook', messageId);
      await deleteDoc(docRef);
      logActivity(user, `Menghapus ucapan dari ${name}`);
      toast({ title: 'Dihapus', description: 'Ucapan telah dihapus secara permanen.' });
    } catch (error: any) {
      console.error('Gagal menghapus pesan:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus pesan.' });
    }
  };

  const openReplyDialog = (message: GuestbookMessage) => {
    setSelectedMessage(message);
    setIsReplyDialogOpen(true);
  };
  
  // Settings save handler
  const handleSaveSettings = async (data: WeddingInfoFormValues) => {
    try {
        const docRef = doc(db, "upd_settings", "weddingInfo");
        await setDoc(docRef, data, { merge: true });
        logActivity(user, `Memperbarui pengaturan undangan.`);
        toast({ title: 'Pengaturan Disimpan', description: 'Informasi pernikahan telah diperbarui.'});
    } catch (error) {
        console.error("Gagal menyimpan pengaturan:", error);
        toast({ variant: "destructive", title: "Error", description: 'Gagal menyimpan pengaturan.'});
    }
  }


  return (
    <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="py-4 px-6 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
          <Button asChild variant="outline">
            <Link href="/upd/hani">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Undangan
            </Link>
          </Button>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl" style={{ fontFamily: 'serif' }}>
                Dasbor Admin Undangan
              </CardTitle>
              <CardDescription>
                Kelola buku tamu, moderasi ucapan, dan pengaturan untuk pernikahan {weddingInfo.brideName || 'Anya'} & {weddingInfo.groomName || 'Loid'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="guestbook" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="guestbook">
                    <BookHeart className="h-4 w-4 mr-2" />
                    Buku Tamu
                  </TabsTrigger>
                  <TabsTrigger value="moderation">
                     <ShieldCheck className="h-4 w-4 mr-2" />
                    Moderasi ({pendingMessages.length})
                  </TabsTrigger>
                  <TabsTrigger value="gallery">
                     <ImageIcon className="h-4 w-4 mr-2" />
                    Galeri
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                     <Settings className="h-4 w-4 mr-2" />
                    Pengaturan
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="guestbook" className="mt-6">
                  <GuestbookContent entries={combinedEntries} isLoading={isGuestbookLoading} />
                </TabsContent>
                <TabsContent value="moderation" className="mt-6">
                  <ModerationContent
                    messages={pendingMessages}
                    isLoading={isModerationLoading}
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                    onReply={openReplyDialog}
                  />
                </TabsContent>
                 <TabsContent value="gallery" className="mt-6">
                    <GalleryContent />
                </TabsContent>
                <TabsContent value="settings" className="mt-6">
                    <SettingsContent weddingInfo={weddingInfo} onSave={handleSaveSettings} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
      {selectedMessage && (
        <ReplyDialog message={selectedMessage} weddingInfo={weddingInfo} onReplySent={() => setIsReplyDialogOpen(false)} />
      )}
    </Dialog>
  );
}



'use client';

import { useState, useEffect, useRef } from 'react';
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
  Type,
  Upload,
  CalendarIcon,
  Album,
  Heart,
  CalendarDays,
  CoupleIcon,
  Quote,
  Edit,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format as formatDate, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { WeddingInfo, Quote as QuoteType } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const INVITATION_ID = 'type-01';

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
  id: string; // rsvp id
  guestbookId?: string;
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
  brideCoverPhotoUrl: z.string().optional(),
  groomCoverPhotoUrl: z.string().optional(),
  brideStoryUrl: z.string().optional(),
  groomStoryUrl: z.string().optional(),
  ceremonyDate: z.string().min(1, "Tanggal akad wajib diisi"),
  ceremonyTime: z.string().min(1, "Waktu akad wajib diisi"),
  ceremonyLocation: z.string().min(1, "Lokasi akad wajib diisi"),
  ceremonyMapUrl: z.string().url("URL Peta tidak valid").or(z.literal('')),
  receptionDate: z.string().min(1, "Tanggal resepsi wajib diisi"),
  receptionTime: z.string().min(1, "Waktu resepsi wajib diisi"),
  receptionLocation: z.string().min(1, "Lokasi resepsi wajib diisi"),
  receptionMapUrl: z.string().url("URL Peta tidak valid").or(z.literal('')),
  isMusicEnabled: z.boolean().optional(),
  backgroundMusicUrl: z.string().optional(),
  invitedFamilies: z.array(z.string()).optional(),
  coverImageUrl: z.string().optional(),
  coverOpeningImageUrl: z.string().optional(),
  mainBackgroundUrl: z.string().optional(),
  dividerOrnamentUrl: z.string().optional(),
  flowerAsset2Url: z.string().optional(),
  flowerAsset3Url: z.string().optional(),
  flowerAsset4Url: z.string().optional(),
  flowerAsset5Url: z.string().optional(),
  storyTimeline: z.array(storyTimelineItemSchema).optional(),
  coverFont: z.string().optional(),
  countdownTargetDate: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
  danaName: z.string().optional(),
  danaNumber: z.string().optional(),
  danaQrCodeUrl: z.string().optional(),
  danaLogoUrl: z.string().optional(),
  giftThankYouMessage: z.string().optional(),
});

const quoteSchema = z.object({
    imageUrl: z.string().min(1, "Gambar wajib diunggah"),
    text: z.string().min(1, "Teks kutipan wajib diisi"),
});


type WeddingInfoFormValues = z.infer<typeof weddingInfoSchema>;
type QuoteFormValues = z.infer<typeof quoteSchema>;


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
  const [replyFrom, setReplyFrom] = useState(weddingInfo.brideName || 'Mempelai Wanita');

  useEffect(() => {
    // Set default reply from to bride's name when component loads
    setReplyFrom(weddingInfo.brideName || 'Mempelai Wanita');
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
      const docRef = doc(db, `invitations/${INVITATION_ID}/guestbook`, message.id);
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
              <RadioGroupItem value={weddingInfo.brideName || 'Mempelai Wanita'} id="from-bride" />
              <Label htmlFor="from-bride">{weddingInfo.brideName || 'Mempelai Wanita'}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={weddingInfo.groomName || 'Mempelai Pria'} id="from-groom" />
              <Label htmlFor="from-groom">{weddingInfo.groomName || 'Mempelai Pria'}</Label>
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
  onDelete,
}: {
  entries: CombinedEntry[];
  isLoading: boolean;
  onDelete: (entry: CombinedEntry) => void;
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
            <div key={entry.id} className="p-4 bg-muted/50 rounded-lg border relative group">
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Entri Buku Tamu?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini akan menghapus konfirmasi kehadiran (RSVP) dan ucapan dari "{entry.name}" secara permanen. Ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(entry)}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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

// --- FileUploader Component ---
function FileUploader({ onUploadSuccess, label, accept, isUploading, directory }: { onUploadSuccess: (filePath: string) => void; label: string; accept: string; isUploading: boolean; directory?: string; }) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (directory) {
            formData.append('directory', directory);
        }

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal mengunggah file.');
            }

            const { filePath } = await response.json();
            onUploadSuccess(filePath);
            toast({ title: 'Sukses', description: `File untuk ${label} berhasil diunggah.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };
    
    return (
        <div className="space-y-2">
           <Label>{label}</Label>
            <div className="flex items-center gap-4">
                <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept={accept}
                    disabled={isUploading}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Mengunggah...' : 'Pilih File'}
                </Button>
                <FormDescription>Gunakan file {accept}.</FormDescription>
            </div>
        </div>
    );
}

function QuoteForm({ onFormSubmit, quote }: { onFormSubmit: () => void; quote?: QuoteType }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const isEditMode = !!quote;

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema),
        defaultValues: quote ? { imageUrl: quote.imageUrl, text: quote.text } : { imageUrl: '', text: '' },
    });

    useEffect(() => {
        if (quote) {
            form.reset({ imageUrl: quote.imageUrl, text: quote.text });
        }
    }, [quote, form]);

    const handleFileUpload = (filePath: string) => {
        form.setValue('imageUrl', filePath, { shouldValidate: true, shouldDirty: true });
        setIsUploading(false);
    };

    const onSubmit = async (data: QuoteFormValues) => {
        try {
            if (isEditMode) {
                await updateDoc(doc(db, `invitations/${INVITATION_ID}/quotes`, quote.id), { ...data });
                logActivity(user, `Memperbarui quote: ${data.text.substring(0, 20)}...`);
            } else {
                await addDoc(collection(db, `invitations/${INVITATION_ID}/quotes`), { ...data, createdAt: serverTimestamp() });
                logActivity(user, `Menambahkan quote baru: ${data.text.substring(0, 20)}...`);
            }
            toast({ title: 'Sukses!', description: 'Quote telah disimpan.' });
            onFormSubmit();
        } catch (error) {
            console.error("Gagal menyimpan quote:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan quote.' });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FileUploader
                    onUploadSuccess={handleFileUpload}
                    label="Unggah Gambar"
                    accept="image/png, image/jpeg, image/webp"
                    isUploading={isUploading}
                />
                {form.watch('imageUrl') && (
                    <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                        <Image src={form.watch('imageUrl')!} alt="Preview" layout="fill" objectFit="cover" />
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Teks Kutipan</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Tuliskan kutipan Anda di sini..." {...field} rows={4} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                    {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Quote'}
                </Button>
            </form>
        </Form>
    );
}

// --- Quote Section Tab Component ---
function QuoteContent() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [quotes, setQuotes] = useState<QuoteType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<QuoteType | undefined>();

    useEffect(() => {
        const q = query(collection(db, `invitations/${INVITATION_ID}/quotes`), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedQuotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuoteType));
            setQuotes(fetchedQuotes);
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    const handleEditClick = (quote: QuoteType) => {
        setEditingQuote(quote);
        setIsFormOpen(true);
    };

    const handleAddNewClick = () => {
        setEditingQuote(undefined);
        setIsFormOpen(true);
    };
    
    const handleDeleteQuote = async (quoteId: string) => {
        try {
            await deleteDoc(doc(db, `invitations/${INVITATION_ID}/quotes`, quoteId));
            logActivity(user, `Menghapus quote (ID: ${quoteId})`);
            toast({ title: 'Quote Dihapus' });
        } catch (error) {
            console.error("Gagal menghapus quote:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus quote.' });
        }
    };


    return (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Manajemen Quote</h3>
                    <Button onClick={handleAddNewClick} size="sm"><PlusCircle className="mr-2 h-4 w-4"/> Tambah Quote Baru</Button>
                </div>
                {isLoading ? (
                    <p>Memuat...</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Gambar</TableHead>
                                <TableHead>Kutipan</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotes.length > 0 ? quotes.map((quote) => (
                                <TableRow key={quote.id}>
                                    <TableCell>
                                        <div className="relative w-24 h-16 rounded-md overflow-hidden">
                                            <Image src={quote.imageUrl} alt="Quote" layout="fill" objectFit="cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate italic">"{quote.text}"</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(quote)}><Edit className="h-4 w-4"/></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Hapus Quote Ini?</AlertDialogTitle>
                                                    <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteQuote(quote.id)}>Hapus</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">Belum ada quote.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingQuote ? 'Ubah Quote' : 'Tambah Quote Baru'}</DialogTitle>
                </DialogHeader>
                <QuoteForm onFormSubmit={() => setIsFormOpen(false)} quote={editingQuote} />
            </DialogContent>
        </Dialog>
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
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<WeddingInfoFormValues>({
        resolver: zodResolver(weddingInfoSchema),
        defaultValues: {
            brideName: '',
            groomName: '',
            brideBio: '',
            groomBio: '',
            brideCoverPhotoUrl: '',
            groomCoverPhotoUrl: '',
            brideStoryUrl: '',
            groomStoryUrl: '',
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
            coverOpeningImageUrl: '',
            mainBackgroundUrl: '',
            dividerOrnamentUrl: '',
            flowerAsset2Url: '',
            flowerAsset3Url: '',
            flowerAsset4Url: '',
            flowerAsset5Url: '',
            storyTimeline: [],
            coverFont: 'serif',
            countdownTargetDate: '',
            bankName: '',
            accountNumber: '',
            accountHolderName: '',
            danaName: '',
            danaNumber: '',
            danaQrCodeUrl: '',
            danaLogoUrl: '',
            giftThankYouMessage: 'Terima kasih atas gift yang telah diberikan semoga Alloh membalas kebaikan',
        },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "storyTimeline",
    });
    
    const [invitedFamiliesText, setInvitedFamiliesText] = useState('');
    
    const handleFileUpload = (fieldName: keyof WeddingInfoFormValues) => (filePath: string) => {
      form.setValue(fieldName, filePath, { shouldValidate: true, shouldDirty: true });
      setIsUploading(false);
    };

    useEffect(() => {
        const fullWeddingInfo = {
            ...form.getValues(),
            ...weddingInfo,
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
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                           <FileUploader onUploadSuccess={handleFileUpload('brideCoverPhotoUrl')} label="Foto Mempelai Wanita" accept="image/png, image/jpeg" isUploading={isUploading} />
                           <FileUploader onUploadSuccess={handleFileUpload('groomCoverPhotoUrl')} label="Foto Mempelai Pria" accept="image/png, image/jpeg" isUploading={isUploading} />
                        </div>
                         <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                           <FileUploader onUploadSuccess={handleFileUpload('brideStoryUrl')} label="Video Story Mempelai Wanita" accept="video/mp4" isUploading={isUploading} />
                           <FileUploader onUploadSuccess={handleFileUpload('groomStoryUrl')} label="Video Story Mempelai Pria" accept="video/mp4" isUploading={isUploading} />
                        </div>
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
                    <h3 className="text-lg font-medium">Amplop Digital</h3>
                    <div className="space-y-4 mt-2 p-4 border rounded-lg">
                        <h4 className="font-semibold text-md">Transfer Bank</h4>
                        <FormField control={form.control} name="bankName" render={({ field }) => (
                            <FormItem><FormLabel>Nama Bank</FormLabel><FormControl><Input placeholder="cth., Bank Central Asia (BCA)" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="accountNumber" render={({ field }) => (
                            <FormItem><FormLabel>Nomor Rekening</FormLabel><FormControl><Input placeholder="1234567890" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                            <FormItem><FormLabel>Nama Pemilik Rekening</FormLabel><FormControl><Input placeholder="A/n John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <div className="space-y-4 mt-4 p-4 border rounded-lg">
                        <h4 className="font-semibold text-md">E-Wallet (DANA)</h4>
                        <FileUploader onUploadSuccess={handleFileUpload('danaLogoUrl')} label="Gambar Logo DANA (PNG)" accept="image/png" isUploading={isUploading} />
                        <FormField control={form.control} name="danaName" render={({ field }) => (
                            <FormItem><FormLabel>Nama Akun DANA</FormLabel><FormControl><Input placeholder="A/n John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="danaNumber" render={({ field }) => (
                            <FormItem><FormLabel>Nomor DANA</FormLabel><FormControl><Input placeholder="081234567890" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FileUploader onUploadSuccess={handleFileUpload('danaQrCodeUrl')} label="Gambar QR Code DANA" accept="image/png, image/jpeg" isUploading={isUploading} />
                    </div>
                     <div className="space-y-4 mt-4">
                        <FormField control={form.control} name="giftThankYouMessage" render={({ field }) => (
                            <FormItem><FormLabel>Pesan Terima Kasih</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium">Tampilan Undangan</h3>
                     <div className="space-y-4 mt-2">
                        <FileUploader onUploadSuccess={handleFileUpload('coverImageUrl')} label="Gambar Latar Sampul" accept="image/png, image/jpeg" isUploading={isUploading} />
                        <FileUploader onUploadSuccess={handleFileUpload('mainBackgroundUrl')} label="Gambar Latar Utama (Dalam Undangan)" accept="image/png, image/jpeg" isUploading={isUploading} />
                        <FileUploader onUploadSuccess={handleFileUpload('dividerOrnamentUrl')} label="Ornamen Pembatas Bagian" accept="image/png, image/webp" isUploading={isUploading} />
                        <FileUploader onUploadSuccess={handleFileUpload('coverOpeningImageUrl')} label="Gambar Ornament Pembuka (PNG)" accept="image/png, image/webp" isUploading={isUploading} />
                        <Separator />
                        <div className="p-4 border rounded-lg space-y-4">
                            <h4 className="font-semibold text-md">Aset Bingkai Bunga (PNG Transparan)</h4>
                            <FileUploader onUploadSuccess={handleFileUpload('flowerAsset2Url')} label="Aset Bunga 2 (Tumpukan Kanan Atas)" accept="image/png" isUploading={isUploading} />
                            <FileUploader onUploadSuccess={handleFileUpload('flowerAsset3Url')} label="Aset Bunga 3 (Tumpukan Kanan Atas)" accept="image/png" isUploading={isUploading} />
                            <FileUploader onUploadSuccess={handleFileUpload('flowerAsset4Url')} label="Aset Bunga 4 (Tumpukan Kanan Atas)" accept="image/png" isUploading={isUploading} />
                            <FileUploader onUploadSuccess={handleFileUpload('flowerAsset5Url')} label="Aset Bunga 5 (Tumpukan Kanan Atas)" accept="image/png" isUploading={isUploading} />
                        </div>
                        <Separator />
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
                         <FormField
                            control={form.control}
                            name="countdownTargetDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Tanggal Target Hitung Mundur</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value ? (
                                                formatDate(new Date(field.value), "PPP", { locale: id })
                                            ) : (
                                                <span>Pilih tanggal</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value ? new Date(field.value) : undefined}
                                            onSelect={(date) => field.onChange(date?.toISOString())}
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>Kosongkan jika tidak ingin menampilkan hitung mundur.</FormDescription>
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
                         <FileUploader onUploadSuccess={handleFileUpload('backgroundMusicUrl')} label="File Musik Latar" accept=".mp3, audio/mpeg" isUploading={isUploading} />
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
      collection(db, `invitations/${INVITATION_ID}/rsvps`),
      where('attendance', '==', 'Hadir')
    );
    const guestbookQuery = query(
      collection(db, `invitations/${INVITATION_ID}/guestbook`),
      where('status', '==', 'approved')
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
                guestbookId: correspondingMessage?.id,
                name: rsvp.name,
                guests: rsvp.guests,
                message: correspondingMessage?.message,
                rsvpTimestamp: rsvp.timestamp,
                messageTimestamp: correspondingMessage?.timestamp,
                reply: correspondingMessage?.reply,
              };
            });

            // Sort client-side
            combined.sort((a, b) => b.rsvpTimestamp.toMillis() - a.rsvpTimestamp.toMillis());

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
      collection(db, `invitations/${INVITATION_ID}/guestbook`),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as GuestbookMessage)
        );
        // Sort client-side
        messages.sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis());
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
    const unsubSettings = onSnapshot(doc(db, `invitations/${INVITATION_ID}/settings`, "weddingInfo"), (doc) => {
        if (doc.exists()) {
            setWeddingInfo(doc.data());
        }
    });
    return () => unsubSettings();
  }, []);


  // Moderation action handlers
  const handleApprove = async (messageId: string, name: string) => {
    try {
      const docRef = doc(db, `invitations/${INVITATION_ID}/guestbook`, messageId);
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
      const docRef = doc(db, `invitations/${INVITATION_ID}/guestbook`, messageId);
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
        const docRef = doc(db, `invitations/${INVITATION_ID}/settings`, "weddingInfo");
        await setDoc(docRef, data, { merge: true });
        logActivity(user, `Memperbarui pengaturan undangan.`);
        toast({ title: 'Pengaturan Disimpan', description: 'Informasi pernikahan telah diperbarui.'});
    } catch (error) {
        console.error("Gagal menyimpan pengaturan:", error);
        toast({ variant: "destructive", title: "Error", description: 'Gagal menyimpan pengaturan.'});
    }
  }

  const handleDeleteGuestbookEntry = async (entry: CombinedEntry) => {
    try {
        // Delete RSVP entry
        await deleteDoc(doc(db, `invitations/${INVITATION_ID}/rsvps`, entry.id));
        
        // Delete guestbook message if it exists
        if (entry.guestbookId) {
            await deleteDoc(doc(db, `invitations/${INVITATION_ID}/guestbook`, entry.guestbookId));
        }
        
        logActivity(user, `Menghapus entri buku tamu dari ${entry.name}`);
        toast({ title: 'Entri Dihapus', description: `Entri untuk ${entry.name} telah dihapus.` });
    } catch (error) {
        console.error("Gagal menghapus entri buku tamu:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus entri.' });
    }
  };


  return (
    <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="py-4 px-6 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
          <Button asChild variant="outline">
            <Link href={`/upd/${INVITATION_ID}`}>
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
                Kelola buku tamu, moderasi ucapan, dan pengaturan untuk pernikahan {weddingInfo.brideName || 'Mempelai Wanita'} & {weddingInfo.groomName || 'Mempelai Pria'}.
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
                  <TabsTrigger value="quote">
                     <Quote className="h-4 w-4 mr-2" />
                    Quote
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                     <Settings className="h-4 w-4 mr-2" />
                    Pengaturan
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="guestbook" className="mt-6">
                  <GuestbookContent entries={combinedEntries} isLoading={isGuestbookLoading} onDelete={handleDeleteGuestbookEntry} />
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
                <TabsContent value="quote" className="mt-6">
                    <QuoteContent />
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


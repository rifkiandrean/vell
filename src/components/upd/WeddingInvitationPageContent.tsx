

'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BookHeart, Calendar, Clock, Gift, Heart, Mail, MapPin, Users, MessageSquareReply, Home, GalleryHorizontal, Music, VolumeX, X } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import type { WeddingInfo, GalleryImage } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { transformGoogleDriveUrl } from '@/lib/google-drive';


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

const fontMap: { [key: string]: string } = {
  'serif': "'Playfair Display', serif",
  'Great Vibes': "'Great Vibes', cursive",
  'Sacramento': "'Sacramento', cursive",
};


function GuestNameDisplay({ guest, fontStyle }: { guest: string | null; fontStyle: React.CSSProperties }) {
  if (!guest) {
    return null;
  }

  return (
    <div className="mt-4 text-center">
      <p className="text-lg md:text-xl">Kepada Yth. Bpk/Ibu/Saudara/i</p>
      <p className="text-2xl md:text-3xl font-bold mt-1" style={fontStyle}>{guest}</p>
      <p className="text-xs text-white/70 mt-2">Mohon maaf apabila ada kesalahan penulisan nama/gelar</p>
    </div>
  );
}

function AdminReplyForm({ messageId }: { messageId: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !user) return;
        setIsReplying(true);

        try {
            const docRef = doc(db, 'upd_guestbook', messageId);
            await updateDoc(docRef, {
                reply: {
                    from: user.displayName || user.email, // Use display name, fallback to email
                    text: replyText,
                    timestamp: new Date(),
                },
            });
            toast({ title: 'Balasan Terkirim', description: 'Balasan Anda telah ditampilkan.' });
            setReplyText('');
        } catch (error) {
            console.error('Gagal mengirim balasan:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengirim balasan.' });
        } finally {
            setIsReplying(false);
        }
    };
    
    if (!user) return null;

    return (
        <form onSubmit={handleReplySubmit} className="mt-3 pt-3 border-t flex items-start gap-3">
             <MessageSquareReply className="h-4 w-4 mt-2 shrink-0 text-accent" />
            <div className="w-full space-y-2">
                <Textarea 
                    placeholder="Tulis balasan Anda sebagai mempelai..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="text-sm"
                    rows={2}
                />
                <Button type="submit" size="sm" disabled={isReplying || !replyText.trim()}>
                    {isReplying ? 'Mengirim...' : 'Balas'}
                </Button>
            </div>
        </form>
    );
}

function FloatingNav({ onScroll, onToggleMusic, isMusicPlaying }: { onScroll: (id: string) => void; onToggleMusic: () => void; isMusicPlaying: boolean; }) {
  const navItems = [
    { id: 'couple', label: 'Home', icon: Home },
    { id: 'events', label: 'Acara', icon: Calendar },
    { id: 'gallery', label: 'Galeri', icon: GalleryHorizontal },
    { id: 'guestbook', label: 'Buku Tamu', icon: BookHeart },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-center gap-3">
        <button onClick={onToggleMusic} className="bg-background/80 backdrop-blur-sm p-3 rounded-full shadow-lg border hover:bg-muted">
            {isMusicPlaying ? <VolumeX className="h-5 w-5" /> : <Music className="h-5 w-5" />}
        </button>
        {navItems.map(item => (
             <button key={item.id} onClick={() => onScroll(item.id)} className="bg-background/80 backdrop-blur-sm p-3 rounded-full shadow-lg border hover:bg-muted">
                <item.icon className="h-5 w-5" />
             </button>
        ))}
    </div>
  );
}

function StoryViewer({ videoUrl, onClose }: { videoUrl: string | null; onClose: () => void }) {
    if (!videoUrl) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 text-white bg-black/50 rounded-full p-2"
            >
                <X className="h-6 w-6" />
            </button>
            <div className="relative w-full max-w-sm h-full max-h-[80vh] rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <video
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    controls
                    playsInline
                />
            </div>
        </motion.div>
    );
}

export function WeddingInvitationPageContent({ initialWeddingInfo }: { initialWeddingInfo: WeddingInfo }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const guest = searchParams.get('tamu');
  const guestName = guest || 'Tamu Undangan';

  const [isOpened, setIsOpened] = useState(false);
  const [rsvp, setRsvp] = useState({ name: guestName, attendance: '', guests: 1 });
  const [guestbook, setGuestbook] = useState({ name: guestName, message: '' });
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [guestbookSubmitted, setGuestbookSubmitted] = useState(false);
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo>(initialWeddingInfo);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [storyVideoUrl, setStoryVideoUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Set initial state from props
    setWeddingInfo(initialWeddingInfo);
    if (audioRef.current && initialWeddingInfo.isMusicEnabled && initialWeddingInfo.backgroundMusicUrl) {
        audioRef.current.src = initialWeddingInfo.backgroundMusicUrl;
        audioRef.current.load();
    }
  }, [initialWeddingInfo]);


  useEffect(() => {
    setRsvp(prev => ({ ...prev, name: guestName }));
    setGuestbook(prev => ({ ...prev, name: guestName }));

    if (guestName && guestName !== 'Tamu Undangan') {
        const checkStatus = async () => {
            // Check RSVP status
            const rsvpQuery = query(collection(db, "upd_rsvps"), where("name", "==", guestName));
            const rsvpSnapshot = await getDocs(rsvpQuery);
            if (!rsvpSnapshot.empty) {
                setRsvpSubmitted(true);
            }
            // Check guestbook status
            const guestbookQuery = query(collection(db, "upd_guestbook"), where("name", "==", guestName));
            const guestbookSnapshot = await getDocs(guestbookQuery);
            if (!guestbookSnapshot.empty) {
                setGuestbookSubmitted(true);
            }
        };
        checkStatus();
    }
  }, [guestName]);

  useEffect(() => {
    // Guestbook messages listener
    const qGuestbook = query(
        collection(db, "upd_guestbook"), 
        where("status", "==", "approved"),
        orderBy("timestamp", "desc")
    );
    const unsubGuestbook = onSnapshot(qGuestbook, (querySnapshot) => {
      const messages: GuestbookMessage[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as GuestbookMessage);
      });
      setGuestbookMessages(messages);
      setIsLoadingMessages(false);
    });

    // --- Gallery Images Caching Logic ---
    const galleryCacheKey = 'upd-gallery-cache';

    // 1. Try to load from localStorage first
    try {
        const cachedGallery = localStorage.getItem(galleryCacheKey);
        if (cachedGallery) {
            setGalleryImages(JSON.parse(cachedGallery));
        }
    } catch (error) {
        console.warn("Could not read gallery from localStorage", error);
    }
    
    // 2. Set up Firestore listener to get fresh data and update cache
    const qGallery = query(collection(db, "upd_gallery_images"), orderBy("createdAt", "asc"));
    const unsubGallery = onSnapshot(qGallery, (snapshot) => {
      const images: GalleryImage[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
      setGalleryImages(images); // Update state for immediate view
      try {
          // Update localStorage for next visit
          localStorage.setItem(galleryCacheKey, JSON.stringify(images));
      } catch (error) {
          console.warn("Could not save gallery to localStorage", error);
      }
    });


    return () => {
        unsubGuestbook();
        unsubGallery();
    };
  }, []);
  
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleMusic = () => {
    if (!audioRef.current || !weddingInfo.isMusicEnabled) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const handleOpenInvitation = () => {
    setIsOpened(true);
    if (audioRef.current && weddingInfo.isMusicEnabled) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      setIsMusicPlaying(true);
    }
    scrollToSection('couple');
  };

  const handleShowStory = (videoUrl?: string) => {
    if (videoUrl) {
      setStoryVideoUrl(transformGoogleDriveUrl(videoUrl));
    }
  };


  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvp.attendance) {
        toast({ title: "Konfirmasi Kehadiran", description: "Mohon pilih status kehadiran Anda.", variant: "destructive" });
        return;
    }
    try {
        await addDoc(collection(db, "upd_rsvps"), {
            name: rsvp.name,
            attendance: rsvp.attendance,
            guests: rsvp.attendance === 'Hadir' ? rsvp.guests : 0,
            timestamp: serverTimestamp()
        });
        toast({
        title: 'Terima Kasih!',
        description: 'Konfirmasi kehadiran Anda telah kami terima.',
        });
        setRsvpSubmitted(true);
    } catch (error) {
        console.error("Gagal mengirim RSVP:", error);
        toast({ title: 'Error', description: 'Gagal mengirim konfirmasi. Silakan coba lagi.', variant: "destructive" });
    }
  };

  const handleGuestbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     try {
        await addDoc(collection(db, "upd_guestbook"), {
            name: guestbook.name,
            message: guestbook.message,
            timestamp: serverTimestamp(),
            status: 'pending' // Default status is pending
        });
        toast({
        title: 'Ucapan Diterima!',
        description: 'Terima kasih! Ucapan Anda akan ditampilkan setelah disetujui.',
        });
        setGuestbookSubmitted(true);
        setGuestbook(prev => ({ ...prev, message: '' }));
    } catch (error) {
        console.error("Gagal mengirim ucapan:", error);
        toast({ title: 'Error', description: 'Gagal mengirim ucapan. Silakan coba lagi.', variant: "destructive" });
    }
  };

  const coverImage = weddingInfo.coverImageUrl ? transformGoogleDriveUrl(weddingInfo.coverImageUrl) : "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1920&auto=format&fit=crop";
  const coverFontStyle: React.CSSProperties = {
    fontFamily: fontMap[weddingInfo.coverFont || 'serif'] || 'serif',
  };


  return (
    <div className="bg-background text-foreground relative font-sans">
      <audio ref={audioRef} loop preload="auto">
        <source src={weddingInfo.backgroundMusicUrl || "/sounds/open-invitation.mp3"} type="audio/mpeg" />
      </audio>

      <AnimatePresence>
        {!isOpened && (
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="fixed inset-0 bg-background z-50 flex items-center justify-center text-center"
          >
            <div className="relative h-screen w-full flex items-center justify-center text-center text-white overflow-hidden">
              <Image
                src={coverImage}
                alt="Couple"
                fill
                className="object-cover -z-10 brightness-50"
              />
              <div className="relative flex flex-col items-center p-4">
                <p className="text-lg md:text-xl tracking-wider">The Wedding Of</p>
                <h1 className="text-5xl md:text-8xl font-extrabold my-4" style={coverFontStyle}>
                  {weddingInfo.brideName} & {weddingInfo.groomName}
                </h1>
                <GuestNameDisplay guest={guest} fontStyle={coverFontStyle} />
                <Button onClick={handleOpenInvitation} className="mt-8 gap-2" size="lg">
                  <Mail className="h-5 w-5" />
                  Buka Undangan
                </Button>
              </div>
              <div className="absolute bottom-6 text-center text-xs text-white/70 w-full px-4">
                <p>&copy; 2024 Dibuat dengan <Heart className="inline h-3 w-3" /> oleh VELL</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        
      <AnimatePresence>
        {isOpened && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
                <FloatingNav onScroll={scrollToSection} onToggleMusic={toggleMusic} isMusicPlaying={isMusicPlaying} />
            </motion.div>
        )}
      </AnimatePresence>
      
       <AnimatePresence>
        {storyVideoUrl && (
            <StoryViewer videoUrl={storyVideoUrl} onClose={() => setStoryVideoUrl(null)} />
        )}
      </AnimatePresence>

      <div id="main-invitation" className={isOpened ? 'block' : 'hidden'}>
        <main className="container mx-auto px-4 py-16 sm:py-24 space-y-24">
            <section id="couple" className="text-center">
                <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'serif' }}>بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                    Dengan penuh rasa syukur, kami mengundang Anda untuk menjadi bagian dari hari bahagia kami.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
                    <div className="flex flex-col items-center">
                        <button onClick={() => handleShowStory(weddingInfo.brideStoryUrl)} className="relative cursor-pointer group">
                             <div className={cn("relative w-[250px] h-[250px] rounded-full p-1", weddingInfo.brideStoryUrl ? "bg-primary" : "bg-white")}>
                                <Image src="https://picsum.photos/seed/bride/400/400" alt="Bride" width={250} height={250} className="rounded-full shadow-lg object-cover w-full h-full" data-ai-hint="bride" />
                             </div>
                             <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                 {weddingInfo.brideStoryUrl && <p className="text-white opacity-0 group-hover:opacity-100 font-semibold">Lihat Story</p>}
                             </div>
                        </button>
                        <h3 className="text-3xl font-bold mt-4" style={{ fontFamily: 'serif' }}>{weddingInfo.brideName}</h3>
                        <p className="text-muted-foreground mt-2">{weddingInfo.brideBio}</p>
                    </div>
                    <div className="flex flex-col items-center">
                         <button onClick={() => handleShowStory(weddingInfo.groomStoryUrl)} className="relative cursor-pointer group">
                             <div className={cn("relative w-[250px] h-[250px] rounded-full p-1", weddingInfo.groomStoryUrl ? "bg-primary" : "bg-white")}>
                                <Image src="https://picsum.photos/seed/groom/400/400" alt="Groom" width={250} height={250} className="rounded-full shadow-lg object-cover w-full h-full" data-ai-hint="groom" />
                            </div>
                            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                 {weddingInfo.groomStoryUrl && <p className="text-white opacity-0 group-hover:opacity-100 font-semibold">Lihat Story</p>}
                             </div>
                        </button>
                        <h3 className="text-3xl font-bold mt-4" style={{ fontFamily: 'serif' }}>{weddingInfo.groomName}</h3>
                        <p className="text-muted-foreground mt-2">{weddingInfo.groomBio}</p>
                    </div>
                </div>
            </section>


            <section id="events" className="text-center">
            <h2 className="text-4xl font-bold mb-12" style={{ fontFamily: 'serif' }}>Detail Acara</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Card className="text-center hover:shadow-xl transition-shadow">
                <CardHeader>
                    <CardTitle className="text-3xl" style={{ fontFamily: 'serif' }}>Akad Nikah</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-center gap-3"><Calendar /><span>{weddingInfo.ceremonyDate}</span></div>
                    <div className="flex items-center justify-center gap-3"><Clock /><span>{weddingInfo.ceremonyTime}</span></div>
                    <div className="flex items-center justify-center gap-3"><MapPin /><span>{weddingInfo.ceremonyLocation}</span></div>
                    {weddingInfo.ceremonyMapUrl && (
                        <Button variant="outline" asChild><a href={weddingInfo.ceremonyMapUrl} target="_blank" rel="noopener noreferrer">Lihat Peta</a></Button>
                    )}
                </CardContent>
                </Card>
                <Card className="text-center hover:shadow-xl transition-shadow">
                <CardHeader>
                    <CardTitle className="text-3xl" style={{ fontFamily: 'serif' }}>Resepsi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-center gap-3"><Calendar /><span>{weddingInfo.receptionDate}</span></div>
                    <div className="flex items-center justify-center gap-3"><Clock /><span>{weddingInfo.receptionTime}</span></div>
                    <div className="flex items-center justify-center gap-3"><MapPin /><span>{weddingInfo.receptionLocation}</span></div>
                     {weddingInfo.receptionMapUrl && (
                        <Button variant="outline" asChild><a href={weddingInfo.receptionMapUrl} target="_blank" rel="noopener noreferrer">Lihat Peta</a></Button>
                    )}
                </CardContent>
                </Card>
            </div>
            </section>

             <blockquote className="max-w-3xl mx-auto text-center italic border-l-4 pl-4">
                <p className="text-muted-foreground">"Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."</p>
                <footer className="mt-2 text-sm font-semibold">QS. Ar-Rum: 21</footer>
            </blockquote>

            {weddingInfo.storyTimeline && weddingInfo.storyTimeline.length > 0 && (
              <section id="story" className="text-center">
                <h2 className="text-4xl font-bold mb-12" style={{ fontFamily: 'serif' }}>Perjalanan Kisah Kami</h2>
                <div className="relative max-w-2xl mx-auto">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
                  {weddingInfo.storyTimeline.map((item, index) => (
                    <div key={index} className="relative pl-12 mb-12">
                      <div className="absolute left-4 top-1 -translate-x-1/2 bg-background p-1 rounded-full border-2 border-primary">
                          <div className="h-3 w-3 bg-primary rounded-full"></div>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-primary text-sm">{item.date}</p>
                        <h3 className="text-2xl font-semibold mt-1" style={{ fontFamily: 'serif' }}>{item.title}</h3>
                        <p className="text-muted-foreground mt-2 text-sm">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section id="gallery" className="text-center">
                <h2 className="text-4xl font-bold mb-12" style={{ fontFamily: 'serif' }}>Galeri Momen</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {galleryImages.length > 0 ? (
                        galleryImages.map((image) => (
                            <div key={image.id} className="aspect-square relative rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform">
                                <Image src={transformGoogleDriveUrl(image.imageUrl)} alt={`Gallery image`} fill className="object-cover" />
                            </div>
                        ))
                    ) : (
                        [...Array(8)].map((_, i) => (
                           <div key={i} className="aspect-square relative rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform">
                                <Image src={`https://picsum.photos/seed/wedding-${i}/400/400`} alt={`Gallery image ${i+1}`} fill className="object-cover" data-ai-hint="wedding couple" />
                            </div>
                        ))
                    )}
                </div>
            </section>

            {guest && (
              <>
                {weddingInfo.invitedFamilies && weddingInfo.invitedFamilies.length > 0 && (
                    <section id="families" className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'serif' }}>Turut Mengundang</h2>
                        <div className="space-y-2 text-muted-foreground">
                            {weddingInfo.invitedFamilies.map((family, index) => (
                                <p key={index} className="text-lg">{family}</p>
                            ))}
                        </div>
                    </section>
                )}
                
                <section id="rsvp" className="max-w-xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-12" style={{ fontFamily: 'serif' }}>Konfirmasi Kehadiran</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2"><Heart /> RSVP</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {rsvpSubmitted ? (
                                <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-md border border-green-300 dark:border-green-700">
                                    <p className="font-semibold text-green-800 dark:text-green-200">Terima kasih atas konfirmasi kehadiran Anda!</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Kepada <span className="font-bold">{guestName}</span>, mohon konfirmasikan kehadiran Anda di bawah ini.
                                    </p>
                                    <form onSubmit={handleRsvpSubmit} className="space-y-6 text-left">
                                        <div className="space-y-2">
                                            <Label>Konfirmasi Kehadiran</Label>
                                            <RadioGroup value={rsvp.attendance} onValueChange={(value) => setRsvp({ ...rsvp, attendance: value })} className="flex space-x-4">
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="Hadir" id="attend" /><Label htmlFor="attend">Hadir</Label></div>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="Tidak Hadir" id="not-attend" /><Label htmlFor="not-attend">Tidak Hadir</Label></div>
                                            </RadioGroup>
                                        </div>
                                        {rsvp.attendance === 'Hadir' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="rsvp-guests">Jumlah Tamu (termasuk Anda)</Label>
                                                <Input id="rsvp-guests" type="number" min="1" value={rsvp.guests} onChange={(e) => setRsvp({ ...rsvp, guests: parseInt(e.target.value, 10) })} />
                                            </div>
                                        )}
                                        <Button type="submit" className="w-full">Kirim Konfirmasi</Button>
                                    </form>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section id="guestbook" className="max-w-xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-12" style={{ fontFamily: 'serif' }}>Buku Tamu</h2>
                    <div className="flex justify-center mb-4">
                        <Button asChild variant="outline">
                            <Link href="/upd/hani/admin/login">
                               <BookHeart className="h-4 w-4 mr-2" /> 
                               Lihat Buku Tamu &amp; Kehadiran
                            </Link>
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2"><BookHeart /> Kirim Ucapan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {guestbookSubmitted ? (
                                 <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/50 rounded-md border border-blue-300 dark:border-blue-700">
                                    <p className="font-semibold text-blue-800 dark:text-blue-200">Terima kasih, ucapan Anda akan ditampilkan setelah disetujui.</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Kepada <span className="font-bold">{guestName}</span>, sampaikan doa dan ucapan terbaik Anda untuk kedua mempelai.
                                    </p>
                                    <form onSubmit={handleGuestbookSubmit} className="space-y-4 text-left">
                                        <div className="space-y-2">
                                            <Label htmlFor="guestbook-message">Ucapan &amp; Doa</Label>
                                            <Textarea id="guestbook-message" placeholder="Tuliskan ucapan dan doa terbaik Anda untuk kami..." value={guestbook.message} onChange={(e) => setGuestbook({ ...guestbook, message: e.target.value })} required />
                                        </div>
                                        <Button type="submit" className="w-full">Kirim Ucapan</Button>
                                    </form>
                                </>
                            )}
                        </CardContent>
                    </Card>

                     <div className="mt-12 space-y-6 max-h-96 overflow-y-auto pr-4 text-left">
                        {isLoadingMessages ? (
                            <p>Memuat ucapan...</p>
                        ) : guestbookMessages.length > 0 ? (
                            guestbookMessages.map((msg) => (
                            <div key={msg.id} className="p-4 bg-muted/50 rounded-lg border">
                                <p className="font-bold text-primary">{msg.name}</p>
                                <p className="text-sm mt-1 italic">"{msg.message}"</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true, locale: id }) : ''}
                                </p>
                                {msg.reply && (
                                    <div className="mt-3 pt-3 border-t flex items-start gap-3">
                                        <MessageSquareReply className="h-4 w-4 mt-1 shrink-0 text-accent" />
                                        <div>
                                            <p className="font-bold text-accent">{msg.reply.from}</p>
                                            <p className="text-sm italic">"{msg.reply.text}"</p>
                                        </div>
                                    </div>
                                )}
                                {user && !msg.reply && <AdminReplyForm messageId={msg.id} />}
                            </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground">Jadilah yang pertama mengirimkan ucapan!</p>
                        )}
                    </div>
                </section>
              </>
            )}
        </main>

        <footer className="text-center py-12 bg-muted">
            <p className="text-muted-foreground">Terima kasih atas doa restu Anda.</p>
            <p className="text-2xl mt-2 font-bold" style={{ fontFamily: 'serif' }}>{weddingInfo.brideName} & {weddingInfo.groomName}</p>
            <div className="flex justify-center mt-4">
                <p className="text-xs text-muted-foreground">&copy; 2024 Dibuat dengan <Heart className="inline h-4 w-4" /> oleh VELL</p>
            </div>
        </footer>
      </div>
    </div>
  );
}

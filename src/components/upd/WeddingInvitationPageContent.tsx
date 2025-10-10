

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BookHeart, Calendar, Clock, Gift, Heart, Mail, MapPin, Users, MessageSquareReply, Home, GalleryHorizontal, Music, VolumeX, X, User as CoupleIcon, CalendarDays, Album, ChevronDown, Send, ArrowRight, Copy, QrCode, User } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import type { WeddingInfo, Quote } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";


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

const AnimatedSection: React.FC<{children: React.ReactNode, id: string, className?: string}> = ({ children, id, className }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px 0px" });

    return (
        <section ref={ref} id={id} className={className}>
            <div style={{
                transform: isInView ? "none" : "translateY(50px)",
                opacity: isInView ? 1 : 0,
                transition: "all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) 0.3s"
            }}>
                {children}
            </div>
        </section>
    );
};

function GuestNameDisplay({ guest, fontStyle }: { guest: string | null; fontStyle: React.CSSProperties }) {
  if (!guest) {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
      className="mt-4 text-center"
    >
      <p className="text-sm md:text-base text-upd-primary/80 tracking-widest">{guest ? 'Kepada Yth. Bapak/Ibu/Saudara/i' : ''}</p>
      <p className="text-2xl md:text-4xl font-bold mt-2 text-upd-primary" style={fontStyle}>{guest}</p>
    </motion.div>
  );
}


function FloatingNav({ onScroll, onToggleMusic, isMusicPlaying }: { onScroll: (id: string) => void; onToggleMusic: () => void; isMusicPlaying: boolean; }) {
  const navItems = [
    { id: 'couple', icon: CoupleIcon },
    { id: 'events', icon: CalendarDays },
    { id: 'guestbook', icon: BookHeart },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4">
        <div className="flex items-center gap-2 bg-upd-primary/90 backdrop-blur-sm p-2 rounded-full shadow-lg border border-upd-primary-foreground/10">
            <button onClick={onToggleMusic} className="bg-upd-primary-foreground/10 text-upd-primary-foreground p-3 rounded-full hover:bg-upd-primary-foreground/20 transition-colors">
                {isMusicPlaying ? <VolumeX className="h-5 w-5" /> : <Music className="h-5 w-5" />}
            </button>
             <div className="h-6 w-px bg-upd-primary-foreground/20"></div>
            {navItems.map(item => (
                <button key={item.id} onClick={() => onScroll(item.id)} className="text-upd-primary-foreground p-3 rounded-full hover:bg-upd-primary-foreground/20 transition-colors">
                    <item.icon className="h-5 w-5" />
                </button>
            ))}
        </div>
    </div>
  );
}

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
    const [isClient, setIsClient] = useState(false);
    const [timeLeft, setTimeLeft] = useState({
        Hari: '00',
        Jam: '00',
        Menit: '00',
        Detik: '00',
    });

     useEffect(() => {
        setIsClient(true);
    }, []);

    const calculateTimeLeft = () => {
        if (!targetDate) return {};
        const difference = +new Date(targetDate) - +new Date();
        let newTimeLeft = {};

        if (difference > 0) {
            newTimeLeft = {
                Hari: Math.floor(difference / (1000 * 60 * 60 * 24)),
                Jam: Math.floor((difference / (1000 * 60 * 60)) % 24),
                Menit: Math.floor((difference / 1000 / 60) % 60),
                Detik: Math.floor((difference / 1000) % 60),
            };
        }
        return newTimeLeft;
    };
    
    useEffect(() => {
        if (!isClient) return;
        
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft() as any);
        }, 1000);

        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClient, targetDate]);

    if (!isClient) {
        return (
             <div className="flex justify-center gap-4 md:gap-8 my-8">
                {Object.keys(timeLeft).map((interval) => (
                     <div key={interval} className="flex flex-col items-center p-2 bg-background/20 rounded-lg w-20">
                        <span className="text-2xl md:text-4xl font-bold">00</span>
                        <span className="text-xs uppercase">{interval}</span>
                    </div>
                ))}
            </div>
        );
    }

    const timerComponents: JSX.Element[] = [];
    Object.keys(timeLeft).forEach((interval) => {
        if (!(timeLeft as any)[interval] && (timeLeft as any)[interval] !== 0) {
            return;
        }

        timerComponents.push(
            <div key={interval} className="flex flex-col items-center p-2 bg-background/20 rounded-lg w-20">
                <span className="text-2xl md:text-4xl font-bold">{String((timeLeft as any)[interval]).padStart(2, '0')}</span>
                <span className="text-xs uppercase">{interval}</span>
            </div>
        );
    });

    return (
        <div className="flex justify-center gap-4 md:gap-8 my-8">
            {timerComponents.length ? timerComponents : <span>Waktunya Telah Tiba!</span>}
        </div>
    );
};


export function WeddingInvitationPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const invitationId = useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 1 && pathSegments[0] === 'upd') {
        return pathSegments[1];
    }
    return 'type-01';
  }, [pathname]);

  const guest = searchParams.get('to');
  const guestName = guest || 'Tamu Undangan';

  const [isOpened, setIsOpened] = useState(false);
  const [rsvp, setRsvp] = useState({ name: guestName, attendance: '', guests: 1 });
  const [guestbook, setGuestbook] = useState({ name: guestName, message: '' });
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [guestbookSubmitted, setGuestbookSubmitted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);


  const audioRef = useRef<HTMLAudioElement | null>(null);
  
    useEffect(() => {
        setIsClient(true);
        const requestFS = () => {
            if (typeof window !== 'undefined' && !document.fullscreenElement) {
                const element = document.documentElement;
                if (element.requestFullscreen) {
                    element.requestFullscreen().catch(err => {
                        console.log(`Gagal mengaktifkan mode layar penuh: '\${err.message}' ('\${err.name}')`);
                    });
                }
            }
        };
        requestFS();
    }, []);

    useEffect(() => {
        const unsubWeddingInfo = onSnapshot(doc(db, `invitations/${invitationId}/settings`, "weddingInfo"), (docSnap) => {
            if (docSnap.exists()) {
                setWeddingInfo(docSnap.data() as WeddingInfo);
            }
            setIsLoading(false);
        });

        const qQuotes = query(collection(db, `invitations/${invitationId}/quotes`), orderBy("createdAt", "asc"));
        const unsubQuotes = onSnapshot(qQuotes, (snapshot) => {
            setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote)));
        });

        return () => {
            unsubWeddingInfo();
            unsubQuotes();
        };
    }, [invitationId]);

   useEffect(() => {
    if (typeof window !== 'undefined') {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
        }
        if (weddingInfo?.backgroundMusicUrl && audioRef.current.src !== weddingInfo.backgroundMusicUrl) {
            audioRef.current.src = weddingInfo.backgroundMusicUrl;
            audioRef.current.load(); // Make sure the new source is loaded
        }
    }
}, [weddingInfo?.backgroundMusicUrl]);


  useEffect(() => {
    setRsvp(prev => ({ ...prev, name: guestName }));
    setGuestbook(prev => ({ ...prev, name: guestName }));

    if (guestName && guestName !== 'Tamu Undangan') {
        const checkStatus = async () => {
            const rsvpQuery = query(collection(db, `invitations/${invitationId}/rsvps`), where("name", "==", guestName));
            const rsvpSnapshot = await getDocs(rsvpQuery);
            if (!rsvpSnapshot.empty) setRsvpSubmitted(true);
            
            const guestbookQuery = query(collection(db, `invitations/${invitationId}/guestbook`), where("name", "==", guestName));
            const guestbookSnapshot = await getDocs(guestbookQuery);
            if (!guestbookSnapshot.empty) setGuestbookSubmitted(true);
        };
        checkStatus();
    }
  }, [guestName, invitationId]);

  useEffect(() => {
    const qGuestbook = query(
        collection(db, `invitations/${invitationId}/guestbook`), 
        where("status", "==", "approved"),
        orderBy("timestamp", "desc")
    );
    const unsubGuestbook = onSnapshot(qGuestbook, (snapshot) => {
      setGuestbookMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuestbookMessage)));
      setIsLoadingMessages(false);
    });

    return () => { unsubGuestbook(); };
  }, [invitationId]);
  
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleMusic = () => {
    if (!audioRef.current || !weddingInfo?.isMusicEnabled) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const handleOpenInvitation = () => {
    setIsOpened(true);
    if (weddingInfo?.isMusicEnabled && audioRef.current) {
        audioRef.current.play().catch(e => console.error("Gagal memulai audio:", e));
        setIsMusicPlaying(true);
    }
    scrollToSection('couple');
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvp.attendance) {
        toast({ title: "Konfirmasi Kehadiran", description: "Mohon pilih status kehadiran Anda.", variant: "destructive" });
        return;
    }
    try {
        await addDoc(collection(db, `invitations/${invitationId}/rsvps`), {
            name: rsvp.name,
            attendance: rsvp.attendance,
            guests: rsvp.attendance === 'Hadir' ? rsvp.guests : 0,
            timestamp: serverTimestamp()
        });
        toast({ title: 'Terima Kasih!', description: 'Konfirmasi kehadiran Anda telah kami terima.' });
        setRsvpSubmitted(true);
    } catch (error) {
        console.error("Gagal mengirim RSVP:", error);
        toast({ title: 'Error', description: 'Gagal mengirim konfirmasi. Silakan coba lagi.', variant: "destructive" });
    }
  };

  const handleGuestbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     try {
        await addDoc(collection(db, `invitations/${invitationId}/guestbook`), {
            name: guestbook.name,
            message: guestbook.message,
            timestamp: serverTimestamp(),
            status: 'pending'
        });
        toast({ title: 'Ucapan Diterima!', description: 'Terima kasih! Ucapan Anda akan ditampilkan setelah disetujui.' });
        setGuestbookSubmitted(true);
        setGuestbook(prev => ({ ...prev, message: '' }));
    } catch (error) {
        console.error("Gagal mengirim ucapan:", error);
        toast({ title: 'Error', description: 'Gagal mengirim ucapan. Silakan coba lagi.', variant: "destructive" });
    }
  };

  const handleCopyToClipboard = (text: string, type: 'rekening' | 'nomor') => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Berhasil Disalin', description: `Nomor ${type} berhasil disalin ke clipboard.` });
  };

  if (isLoading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-background">Memuat undangan...</div>;
  }

  if (!weddingInfo) {
    return <div className="fixed inset-0 flex items-center justify-center bg-background">Gagal memuat informasi undangan.</div>;
  }


  const mainBgImage = weddingInfo.mainBackgroundUrl;

  const coverFontStyle: React.CSSProperties = {
    fontFamily: fontMap[weddingInfo.coverFont || 'serif'] || 'serif',
  };


  return (
    <div className="w-full overflow-x-hidden font-sans text-sm md:text-base leading-relaxed text-foreground">
        {isOpened && <FloatingNav onScroll={scrollToSection} onToggleMusic={toggleMusic} isMusicPlaying={isMusicPlaying} />}
        {isClient && weddingInfo.backgroundMusicUrl && <audio ref={audioRef} loop preload="auto"></audio>}
        
        <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pindai untuk Membayar dengan DANA</DialogTitle>
                </DialogHeader>
                {weddingInfo.danaQrCodeUrl && (
                    <div className="relative aspect-square w-full">
                        <Image src={weddingInfo.danaQrCodeUrl} alt="DANA QR Code" fill objectFit="contain"/>
                    </div>
                )}
            </DialogContent>
        </Dialog>

        <AnimatePresence>
        {!isOpened && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden p-8" onContextMenu={(e) => e.preventDefault()}>
            
            {/* Background Layer */}
            {weddingInfo.coverImageUrl && (
                <div className="absolute inset-0 z-0">
                    <Image
                        src={weddingInfo.coverImageUrl}
                        alt="Wedding cover background"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            )}
            
            {/* Ornament Layers */}
             {/* Top Left Flower Stack */}
            <div className="absolute top-0 left-0 w-1/3 md:w-1/4 h-auto transform -scale-x-100">
                 {weddingInfo.flowerAsset2Url && (
                    <motion.div initial={{ opacity: 0, x: -50, y: -50 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1.6, duration: 1.5, ease: "easeOut" }} className="absolute top-0 left-0 w-full animate-sway-2">
                        <Image src={weddingInfo.flowerAsset2Url} alt="Flower 2" width={400} height={400} className="w-full h-auto" />
                    </motion.div>
                )}
                {weddingInfo.flowerAsset3Url && (
                    <motion.div initial={{ opacity: 0, x: -50, y: -50 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1.7, duration: 1.5, ease: "easeOut" }} className="absolute top-0 left-0 w-full animate-sway-3">
                        <Image src={weddingInfo.flowerAsset3Url} alt="Flower 3" width={400} height={400} className="w-full h-auto" />
                    </motion.div>
                )}
                {weddingInfo.flowerAsset4Url && (
                    <motion.div initial={{ opacity: 0, x: -50, y: -50 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1.8, duration: 1.5, ease: "easeOut" }} className="absolute top-0 left-0 w-full animate-sway-4">
                        <Image src={weddingInfo.flowerAsset4Url} alt="Flower 4" width={400} height={400} className="w-full h-auto" />
                    </motion.div>
                )}
                {weddingInfo.flowerAsset5Url && (
                    <motion.div initial={{ opacity: 0, x: -50, y: -50 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1.9, duration: 1.5, ease: "easeOut" }} className="absolute top-0 left-0 w-full">
                        <Image src={weddingInfo.flowerAsset5Url} alt="Flower 5" width={400} height={400} className="w-full h-auto" />
                    </motion.div>
                )}
            </div>

            {/* Top Right Flower Stack */}
            <div className="absolute top-0 right-0 w-1/3 md:w-1/4 h-auto">
                 {weddingInfo.flowerAsset2Url && (
                    <motion.div initial={{ opacity: 0, x: 50, y: -50 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1.6, duration: 1.5, ease: "easeOut" }} className="absolute top-0 right-0 w-full animate-sway-2">
                        <Image src={weddingInfo.flowerAsset2Url} alt="Flower 2" width={400} height={400} className="w-full h-auto" />
                    </motion.div>
                )}
                {weddingInfo.flowerAsset3Url && (
                    <motion.div initial={{ opacity: 0, x: 50, y: -50 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1.7, duration: 1.5, ease: "easeOut" }} className="absolute top-0 right-0 w-full animate-sway-3">
                        <Image src={weddingInfo.flowerAsset3Url} alt="Flower 3" width={400} height={400} className="w-full h-auto" />
                    </motion.div>
                )}
                {weddingInfo.flowerAsset4Url && (
                    <motion.div initial={{ opacity: 0, x: 50, y: -50 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1.8, duration: 1.5, ease: "easeOut" }} className="absolute top-0 right-0 w-full animate-sway-4">
                        <Image src={weddingInfo.flowerAsset4Url} alt="Flower 4" width={400} height={400} className="w-full h-auto" />
                    </motion.div>
                )}
                {weddingInfo.flowerAsset5Url && (
                    <motion.div initial={{ opacity: 0, x: 50, y: -50 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1.9, duration: 1.5, ease: "easeOut" }} className="absolute top-0 right-0 w-full">
                        <Image src={weddingInfo.flowerAsset5Url} alt="Flower 5" width={400} height={400} className="w-full h-auto" />
                    </motion.div>
                )}
            </div>
            
            {/* Content Layer */}
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-between">
                
                {/* Ornament at the top */}
                <div className="w-full flex-shrink-0 pt-8">
                     <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.1, duration: 0.8 }}
                    >
                        {weddingInfo.coverOpeningImageUrl && <Image src={weddingInfo.coverOpeningImageUrl} alt="Ornament" width={700} height={700} className="object-contain mx-auto w-[550px] md:w-[700px]" />}
                    </motion.div>
                </div>

                {/* Text content in the middle/bottom */}
                <div className="flex flex-col justify-end text-center flex-grow w-full pb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-center text-upd-primary"
                    >
                        <p className="tracking-widest">The Wedding Of</p>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="text-upd-primary text-4xl md:text-7xl flex flex-col items-center"
                        style={coverFontStyle}
                    >
                        <span>{weddingInfo.brideName}</span>
                        <span className="text-3xl md:text-5xl my-1">&amp;</span>
                        <span>{weddingInfo.groomName}</span>
                    </motion.div>
                    
                    <GuestNameDisplay guest={guest} fontStyle={coverFontStyle} />

                    <motion.button
                        onClick={handleOpenInvitation}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                        transition={{ opacity: { delay: 1.2, duration: 0.8 }, scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }}
                        className="inline-flex items-center gap-3 text-sm font-semibold tracking-wider bg-upd-primary text-upd-primary-foreground py-2 px-6 rounded-full shadow-lg mx-auto mt-8"
                    >
                        <Mail className="h-4 w-4" /> Buka Undangan
                    </motion.button>
                </div>
            </div>
            </div>
        )}
        </AnimatePresence>
        
        <div id="main-invitation" className={cn("relative w-full min-h-screen overflow-y-auto", isOpened ? 'block' : 'hidden')}>
            <div className="fixed inset-0 z-0">
                {mainBgImage && <Image src={mainBgImage} alt="background" fill className="object-cover" />}
            </div>

            {/* Ornament Layers for Inner Section */}
            {isOpened && (
              <>
                <div className="fixed top-0 left-0 w-1/3 md:w-1/4 h-auto z-20 pointer-events-none transform -scale-x-100">
                    {weddingInfo.flowerAsset2Url && <div className="absolute top-0 left-0 w-full animate-sway-2"><Image src={weddingInfo.flowerAsset2Url} alt="Flower 2" width={400} height={400} className="w-full h-auto" /></div>}
                    {weddingInfo.flowerAsset3Url && <div className="absolute top-0 left-0 w-full animate-sway-3"><Image src={weddingInfo.flowerAsset3Url} alt="Flower 3" width={400} height={400} className="w-full h-auto" /></div>}
                    {weddingInfo.flowerAsset4Url && <div className="absolute top-0 left-0 w-full animate-sway-4"><Image src={weddingInfo.flowerAsset4Url} alt="Flower 4" width={400} height={400} className="w-full h-auto" /></div>}
                    {weddingInfo.flowerAsset5Url && <div className="absolute top-0 left-0 w-full"><Image src={weddingInfo.flowerAsset5Url} alt="Flower 5" width={400} height={400} className="w-full h-auto" /></div>}
                </div>
                <div className="fixed top-0 right-0 w-1/3 md:w-1/4 h-auto z-20 pointer-events-none">
                    {weddingInfo.flowerAsset2Url && <div className="absolute top-0 right-0 w-full animate-sway-2"><Image src={weddingInfo.flowerAsset2Url} alt="Flower 2" width={400} height={400} className="w-full h-auto" /></div>}
                    {weddingInfo.flowerAsset3Url && <div className="absolute top-0 right-0 w-full animate-sway-3"><Image src={weddingInfo.flowerAsset3Url} alt="Flower 3" width={400} height={400} className="w-full h-auto" /></div>}
                    {weddingInfo.flowerAsset4Url && <div className="absolute top-0 right-0 w-full animate-sway-4"><Image src={weddingInfo.flowerAsset4Url} alt="Flower 4" width={400} height={400} className="w-full h-auto" /></div>}
                    {weddingInfo.flowerAsset5Url && <div className="absolute top-0 right-0 w-full"><Image src={weddingInfo.flowerAsset5Url} alt="Flower 5" width={400} height={400} className="w-full h-auto" /></div>}
                </div>
              </>
            )}
            
            <div className="relative z-10">
                <header className="min-h-screen flex flex-col items-center justify-center text-center p-4 text-foreground">
                    <AnimatedSection id="header-content" className="w-full">
                        <p className="tracking-widest">The Wedding Of</p>
                        <h1 className="text-5xl md:text-8xl my-4 flex flex-col items-center" style={{ fontFamily: "'Great Vibes', cursive" }}>
                           <span>{weddingInfo.brideName}</span>
                           <span className="text-4xl md:text-6xl my-2">&amp;</span>
                           <span>{weddingInfo.groomName}</span>
                        </h1>
                        <p className="text-lg font-bold tracking-wider">{weddingInfo.receptionDate}</p>
                        {isClient && weddingInfo.countdownTargetDate && <CountdownTimer targetDate={weddingInfo.countdownTargetDate} />}
                        <div className="flex items-center justify-center gap-4 mt-8 animate-pulse-heart">
                            <Heart className="h-6 w-6"/>
                            <p>Save The Date</p>
                        </div>
                    </AnimatedSection>
                    <div className="absolute bottom-8 animate-bounce">
                        <ChevronDown className="h-8 w-8"/>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24 space-y-24">
                    <AnimatedSection id="couple" className="text-center relative">
                        {weddingInfo.coverOpeningImageUrl && <Image src={weddingInfo.coverOpeningImageUrl} alt="ornament" width={700} height={700} className="object-contain mx-auto w-[400px] h-auto md:w-[700px]" />}
                        <h3 className="text-4xl md:text-5xl mb-4 font-arabic" style={{fontFamily: "serif"}}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</h3>
                        <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4" style={{ fontFamily: "'Great Vibes', cursive" }}>Assalamualaikum Warahmatullahi Wabarakatuh</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
                            Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.
                        </p>
                        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center">
                            <div className="flex flex-col items-center">
                                {weddingInfo.brideCoverPhotoUrl && (
                                    <div className="relative w-48 h-48 rounded-full overflow-hidden mb-4 shadow-lg border-4 border-white">
                                        <Image src={weddingInfo.brideCoverPhotoUrl} alt={weddingInfo.brideName} fill className="object-cover" />
                                    </div>
                                )}
                                <h3 className="text-4xl" style={{ fontFamily: "'Great Vibes', cursive" }}>{weddingInfo.brideName}</h3>
                                <p className="text-muted-foreground mt-2">{weddingInfo.brideBio}</p>
                                {weddingInfo.brideStoryUrl && (
                                    <video key={weddingInfo.brideStoryUrl} controls className="mt-4 rounded-lg shadow-lg w-full max-w-xs">
                                        <source src={weddingInfo.brideStoryUrl} type="video/mp4" />
                                        Browser Anda tidak mendukung tag video.
                                    </video>
                                )}
                            </div>

                            <div className="text-7xl font-extralight text-upd-primary" style={{fontFamily: "'Great Vibes', cursive"}}>&amp;</div>

                            <div className="flex flex-col items-center">
                                {weddingInfo.groomCoverPhotoUrl && (
                                    <div className="relative w-48 h-48 rounded-full overflow-hidden mb-4 shadow-lg border-4 border-white">
                                        <Image src={weddingInfo.groomCoverPhotoUrl} alt={weddingInfo.groomName} fill className="object-cover" />
                                    </div>
                                )}
                                <h3 className="text-4xl" style={{ fontFamily: "'Great Vibes', cursive" }}>{weddingInfo.groomName}</h3>
                                <p className="text-muted-foreground mt-2">{weddingInfo.groomBio}</p>
                                {weddingInfo.groomStoryUrl && (
                                    <video key={weddingInfo.groomStoryUrl} controls className="mt-4 rounded-lg shadow-lg w-full max-w-xs">
                                        <source src={weddingInfo.groomStoryUrl} type="video/mp4" />
                                        Browser Anda tidak mendukung tag video.
                                    </video>
                                )}
                            </div>
                        </div>
                    </AnimatedSection>
                    
                    <AnimatedSection id="events" className="text-center">
                        {weddingInfo.dividerOrnamentUrl && <Image src={weddingInfo.dividerOrnamentUrl} alt="ornament" width={100} height={100} className="mx-auto mb-8" />}
                        <h2 className="text-4xl md:text-5xl font-bold mb-12" style={{ fontFamily: "'Great Vibes', cursive" }}>Save The Date</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="text-center bg-upd-background/50 backdrop-blur-sm border-upd-secondary hover:shadow-xl transition-shadow">
                                <CardHeader><CardTitle className="text-3xl" style={{ fontFamily: "'Great Vibes', cursive" }}>Akad Nikah</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-center gap-3"><Calendar /><span>{weddingInfo.ceremonyDate}</span></div>
                                    <div className="flex items-center justify-center gap-3"><Clock /><span>{weddingInfo.ceremonyTime}</span></div>
                                    <div className="flex items-center justify-center gap-3"><MapPin /><span>{weddingInfo.ceremonyLocation}</span></div>
                                    {weddingInfo.ceremonyMapUrl && (
                                        <Button variant="link" asChild className="text-upd-primary"><a href={weddingInfo.ceremonyMapUrl} target="_blank" rel="noopener noreferrer">Lihat Peta</a></Button>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="text-center bg-upd-background/50 backdrop-blur-sm border-upd-secondary hover:shadow-xl transition-shadow">
                                <CardHeader><CardTitle className="text-3xl" style={{ fontFamily: "'Great Vibes', cursive" }}>Resepsi</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-center gap-3"><Calendar /><span>{weddingInfo.receptionDate}</span></div>
                                    <div className="flex items-center justify-center gap-3"><Clock /><span>{weddingInfo.receptionTime}</span></div>
                                    <div className="flex items-center justify-center gap-3"><MapPin /><span>{weddingInfo.receptionLocation}</span></div>
                                    {weddingInfo.receptionMapUrl && (
                                        <Button variant="link" asChild className="text-upd-primary"><a href={weddingInfo.receptionMapUrl} target="_blank" rel="noopener noreferrer">Lihat Peta</a></Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </AnimatedSection>
                    
                    <AnimatedSection id="quote" className="text-center">
                       {quotes.length > 0 && (
                            <Carousel
                                plugins={[Autoplay({ delay: 5000 })]}
                                className="w-full max-w-3xl mx-auto"
                            >
                                <CarouselContent>
                                    {quotes.map((quote) => (
                                        <CarouselItem key={quote.id}>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="relative w-full h-[500px] mb-4">
                                                    <Image src={quote.imageUrl} alt="Quote image" fill objectFit="contain"/>
                                                </div>
                                                <p className="text-lg md:text-xl italic text-muted-foreground max-w-2xl mx-auto">
                                                    &quot;{quote.text}&quot;
                                                </p>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {quotes.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-0" />
                                        <CarouselNext className="right-0" />
                                    </>
                                )}
                            </Carousel>
                       )}
                    </AnimatedSection>
                    
                    <AnimatedSection id="gift" className="text-center">
                        {weddingInfo.dividerOrnamentUrl && <Image src={weddingInfo.dividerOrnamentUrl} alt="ornament" width={100} height={100} className="mx-auto mb-8" />}
                        <h2 className="text-4xl md:text-5xl font-bold mb-8" style={{ fontFamily: "'Great Vibes', cursive" }}>Kirim Hadiah</h2>
                        <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                            Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda kasih, Anda dapat memberi kado secara cashless.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                            {weddingInfo.bankName && weddingInfo.accountNumber && (
                                <Card className="bg-upd-background/50 backdrop-blur-sm border-upd-secondary">
                                    <CardHeader>
                                        <CardTitle className="text-2xl font-bold" style={{ fontFamily: "'Great Vibes', cursive" }}>Transfer Bank</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="font-semibold text-lg">{weddingInfo.bankName}</p>
                                        <p className="text-2xl font-mono tracking-widest bg-upd-secondary/50 py-2 px-4 rounded-md">{weddingInfo.accountNumber}</p>
                                        <p>a/n {weddingInfo.accountHolderName}</p>
                                        <Button onClick={() => handleCopyToClipboard(weddingInfo.accountNumber!, 'rekening')} className="w-full bg-upd-primary text-upd-primary-foreground hover:bg-upd-primary/90 gap-2">
                                            <Copy className="h-4 w-4" /> Salin Nomor Rekening
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                            {weddingInfo.danaName && weddingInfo.danaNumber && (
                                 <Card className="bg-upd-background/50 backdrop-blur-sm border-upd-secondary">
                                    <CardHeader>
                                        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                                            {weddingInfo.danaLogoUrl ? 
                                                <Image src={weddingInfo.danaLogoUrl} alt="DANA Logo" width={80} height={25} />
                                                : <span>DANA</span>
                                            }
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="font-semibold text-lg">{weddingInfo.danaNumber}</p>
                                        <p>a/n {weddingInfo.danaName}</p>
                                        <Button onClick={() => handleCopyToClipboard(weddingInfo.danaNumber!, 'nomor')} className="w-full bg-upd-primary text-upd-primary-foreground hover:bg-upd-primary/90 gap-2">
                                            <Copy className="h-4 w-4" /> Salin Nomor
                                        </Button>
                                        {weddingInfo.danaQrCodeUrl && (
                                            <Button variant="outline" onClick={() => setIsQrDialogOpen(true)} className="w-full gap-2">
                                                <QrCode className="h-4 w-4" /> Tampilkan QR Code
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        <p className="text-muted-foreground max-w-lg mx-auto mt-8 italic">
                            {weddingInfo.giftThankYouMessage}
                        </p>
                    </AnimatedSection>
                    
                    {weddingInfo.invitedFamilies && weddingInfo.invitedFamilies.length > 0 && (
                        <AnimatedSection id="families" className="text-center">
                            {weddingInfo.dividerOrnamentUrl && <Image src={weddingInfo.dividerOrnamentUrl} alt="ornament" width={100} height={100} className="mx-auto mb-8" />}
                            <h2 className="text-4xl md:text-5xl font-bold mb-8" style={{ fontFamily: "'Great Vibes', cursive" }}>Turut Mengundang</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 pl-12">
                                {weddingInfo.invitedFamilies.map((family, index) => (
                                    <div key={index} className="flex items-center justify-start gap-2">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                        <p className="text-lg text-muted-foreground">{family}</p>
                                    </div>
                                ))}
                            </div>
                        </AnimatedSection>
                    )}

                    <AnimatedSection id="guestbook" className="text-center">
                        {weddingInfo.dividerOrnamentUrl && <Image src={weddingInfo.dividerOrnamentUrl} alt="ornament" width={100} height={100} className="mx-auto mb-8" />}
                        <h2 className="text-4xl md:text-5xl font-bold mb-12" style={{ fontFamily: "'Great Vibes', cursive" }}>Buku Tamu</h2>
                        <Card className="max-w-lg mx-auto bg-upd-background/50 backdrop-blur-sm border-upd-secondary">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-center gap-2">Konfirmasi Kehadiran &amp; Ucapan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {rsvpSubmitted && guestbookSubmitted ? (
                                    <p className="font-semibold text-upd-primary">Terima kasih atas konfirmasi dan ucapan Anda!</p>
                                ) : (
                                    <form onSubmit={guestbookSubmitted ? handleRsvpSubmit : handleGuestbookSubmit} className="space-y-6 text-left">
                                        <div className="space-y-2">
                                            <Label htmlFor="guest-name">Nama Anda</Label>
                                            <Input id="guest-name" value={rsvp.name} onChange={(e) => {
                                                setRsvp({...rsvp, name: e.target.value});
                                                setGuestbook({...guestbook, name: e.target.value});
                                            }} required />
                                        </div>
                                        {!rsvpSubmitted && (
                                            <>
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
                                            </>
                                        )}
                                        {!guestbookSubmitted && (
                                            <div className="space-y-2">
                                                <Label htmlFor="guestbook-message">Ucapan &amp; Doa</Label>
                                                <Textarea id="guestbook-message" placeholder="Tuliskan ucapan dan doa terbaik Anda..." value={guestbook.message} onChange={(e) => setGuestbook({ ...guestbook, message: e.target.value })} required />
                                            </div>
                                        )}
                                        <Button type="submit" className="w-full bg-upd-primary text-upd-primary-foreground hover:bg-upd-primary/90 gap-2">
                                            <Send className="h-4 w-4"/> Kirim
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                        <div className="mt-12 space-y-6 max-h-[50vh] overflow-y-auto pr-4 text-left">
                            {isLoadingMessages ? (
                                <p>Memuat ucapan...</p>
                            ) : guestbookMessages.length > 0 ? (
                                guestbookMessages.map((msg) => (
                                    <div key={msg.id} className="p-4 bg-upd-secondary/30 rounded-lg border border-upd-secondary/50">
                                        <p className="font-bold text-foreground">{msg.name}</p>
                                        <p className="text-sm mt-1">"{msg.message}"</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground">Jadilah yang pertama mengirimkan ucapan!</p>
                            )}
                        </div>
                    </AnimatedSection>
                </main>

                <footer className="text-center py-16 px-4">
                    {weddingInfo.dividerOrnamentUrl && <Image src={weddingInfo.dividerOrnamentUrl} alt="ornament" width={100} height={100} className="mx-auto mb-8" />}
                    <p className="text-muted-foreground max-w-2xl mx-auto">Merupakan suatu kehormatan dan kebahagiaan bagi kami sekeluarga apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.</p>
                    <p className="text-2xl mt-8" style={{ fontFamily: "'Great Vibes', cursive" }}>Wassalamualaikum Warahmatullahi Wabarakatuh</p>
                    <p className="text-4xl mt-6" style={{ fontFamily: "'Great Vibes', cursive" }}>{weddingInfo.brideName} &amp; {weddingInfo.groomName}</p>
                    
                    <div className="mt-16 text-xs text-muted-foreground">
                        <p>&copy; 2024. Dibuat dengan ❤️ oleh</p>
                        <a href="https://vell.com" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
                            VELL
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    </div>
  );
}


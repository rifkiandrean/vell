
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Hero } from "@/components/Hero";
import { CoupleDetails } from "@/components/CoupleDetails";
import { EventDetails } from "@/components/EventDetails";
import { PhotoGallery } from "@/components/PhotoGallery";
import { WishesAndAttendance } from "@/components/WishesAndAttendance";
import { WishGenerator } from "@/components/WishGenerator";
import { Footer } from "@/components/Footer";
import { GiftSection } from "@/components/GiftSection";
import { SectionWrapper } from "@/components/SectionWrapper";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { WeddingDetails } from "@/types";
import { InvitationCover } from '@/components/InvitationCover';
import { cn } from '@/lib/utils';
import { getGoogleDriveFileUrl } from '@/lib/utils';
import { FloatingNav } from '@/components/FloatingNav';
import Image from 'next/image';
import { FlowerSeparator } from '@/components/FlowerSeparator';
import { MusicPlayer } from '@/components/MusicPlayer';
import { LoadingSpinner } from '@/components/LoadingSpinner';


const animationClasses = [
  "animate-spin-slow",
  "animate-pulse-subtle",
  "animate-swing",
  "animate-fade-in-out",
  "" // No animation for the 5th flower
];

function SindiUndanganPageClient() {
  const rsvpCollectionName = 'sindi_rsvps';
  const guestbookCollectionName = 'sindi_guestbook_messages';
  const { firestore } = useFirebase();
  const weddingId = 'sindi';

  const searchParams = useSearchParams();
  const guestName = searchParams.get('to');

  const weddingDetailsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'weddings', weddingId);
  }, [firestore, weddingId]);

  const { data: weddingDetails, isLoading } = useDoc<WeddingDetails>(weddingDetailsDocRef);

  const [isCoverOpen, setIsCoverOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const finalMusicUrl = '/uploads/musik.mp3';

  useEffect(() => {
    if (finalMusicUrl) {
      audioRef.current = new Audio(finalMusicUrl);
      audioRef.current.loop = true;
    }
  }, [finalMusicUrl]);

  const handleOpenInvitation = () => {
    setIsCoverOpen(true);
    if (audioRef.current) {
        audioRef.current.play().then(() => {
            setIsMusicPlaying(true);
        }).catch(error => {
            console.error("Audio play failed:", error);
        });
    }
  };
  
  const toggleMusic = () => {
    if (audioRef.current) {
        if (isMusicPlaying) {
            audioRef.current.pause();
            setIsMusicPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsMusicPlaying(true);
            }).catch(error => console.error("Audio play failed:", error));
        }
    }
  };

  if (isLoading || !weddingDetails) {
    return (
        <LoadingSpinner loadingGifUrl={getGoogleDriveFileUrl(weddingDetails?.loadingGifUrl)} />
    );
  }

  if (!weddingDetails) {
     return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background p-8">
            <div className="w-full max-w-4xl space-y-12 text-center">
                <p className="text-foreground/80">Detail undangan tidak ditemukan.</p>
            </div>
        </div>
    );
  }
    
    const { coupleName, eventDate, quote, coverMainImageUrl, coverBackgroundUrl, backgroundUrl, flowerFrameUrls, ...details } = weddingDetails;
    const finalBackgroundUrl = getGoogleDriveFileUrl(backgroundUrl);

    const processedDetails = {
      ...details,
      groomImageUrl: getGoogleDriveFileUrl(details.groomImageUrl),
      brideImageUrl: getGoogleDriveFileUrl(details.brideImageUrl),
      danaQrImageUrl: getGoogleDriveFileUrl(details.danaQrImageUrl),
    }

  const navItems = [
    { name: "Home", link: "#home" },
    { name: "Couple", link: "#couple" },
    { name: "Event", link: "#details" },
    { name: "Gallery", link: "#gallery" },
    { name: "Wishes", link: "#wishes" },
  ];

  const topLeftFlowers = flowerFrameUrls?.topLeft?.map(url => getGoogleDriveFileUrl(url)).filter(Boolean) as string[] || [];
  const topRightFlowers = flowerFrameUrls?.topRight?.map(url => getGoogleDriveFileUrl(url)).filter(Boolean) as string[] || [];

  return (
    <div className={cn("bg-background")}>
      <InvitationCover 
          coupleName={coupleName} 
          onOpen={handleOpenInvitation} 
          guestName={guestName} 
          mainImageUrl={getGoogleDriveFileUrl(coverMainImageUrl)}
          backgroundUrl={getGoogleDriveFileUrl(coverBackgroundUrl)}
          flowerFrameUrls={flowerFrameUrls}
          isOpen={isCoverOpen}
      />

      <div className={cn("relative transition-opacity duration-1000", isCoverOpen ? 'opacity-100' : 'opacity-0 hidden')}>
        
        {finalMusicUrl && <MusicPlayer isPlaying={isMusicPlaying} onToggle={toggleMusic} />}
        
        {finalBackgroundUrl && (
          <div className="fixed inset-0 z-0">
            <Image
              src={finalBackgroundUrl}
              alt="Wedding background"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-background/50"></div>
          </div>
        )}

        <div className="relative z-10">
          <FloatingNav navItems={navItems} />
          
          {/* Fixed Flower Frames for inside the invitation */}
          {isCoverOpen && (
            <>
              <div className="fixed top-0 -left-4 w-[100px] h-[100px] pointer-events-none transform -scale-x-100 z-40">
                {topLeftFlowers.slice(0, 5).map((url, index) => (
                    url && <Image key={`fixed-tl-${index}`} src={url} alt="Flower" layout="fill" className={`${animationClasses[index]} object-contain`} />
                ))}
              </div>
              <div className="fixed top-0 -right-4 w-[100px] h-[100px] pointer-events-none z-40">
                {topRightFlowers.slice(0, 5).map((url, index) => (
                    url && <Image key={`fixed-tr-${index}`} src={url} alt="Flower" layout="fill" className={`${animationClasses[index]} object-contain`} />
                ))}
              </div>
            </>
          )}

          <main className="flex flex-col items-center">
            <SectionWrapper id="home" className="p-0 sm:p-0 max-w-none">
              <Hero 
                coupleName={coupleName} 
                eventDate={eventDate}
                quote={quote}
                targetDate={details.countdownDate}
                targetTime={details.countdownTime}
              />
            </SectionWrapper>

            <SectionWrapper id="couple">
              <CoupleDetails details={processedDetails} />
            </SectionWrapper>
            
            <FlowerSeparator flowerUrl={details.flowerSeparatorUrl} />
            
            <SectionWrapper id="details">
              <EventDetails details={processedDetails} />
            </SectionWrapper>

            <FlowerSeparator flowerUrl={details.flowerSeparatorUrl} />

            <SectionWrapper id="gallery">
              <PhotoGallery />
            </SectionWrapper>
            
            <FlowerSeparator flowerUrl={details.flowerSeparatorUrl} />

            {(details.bcaAccountNumber || details.danaNumber) && (
                <>
                    <SectionWrapper id="gift">
                        <GiftSection details={processedDetails} />
                    </SectionWrapper>
                    <FlowerSeparator flowerUrl={details.flowerSeparatorUrl} />
                </>
            )}

            <SectionWrapper id="wishes">
                <WishesAndAttendance 
                    rsvpCollectionName={rsvpCollectionName} 
                    guestbookCollectionName={guestbookCollectionName}
                    guestName={guestName}
                />
            </SectionWrapper>
            
            <FlowerSeparator flowerUrl={details.flowerSeparatorUrl} />

            <SectionWrapper id="wish-generator">
              <WishGenerator />
            </SectionWrapper>

            <Footer coupleName={coupleName} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SindiUndanganPage() {
    return <SindiUndanganPageClient />;
}

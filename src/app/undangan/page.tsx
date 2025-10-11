
'use client';

import { useEffect } from 'react';
import { useUser, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { Hero } from "@/components/Hero";
import { EventDetails } from "@/components/EventDetails";
import { PhotoGallery } from "@/components/PhotoGallery";
import { WishesAndAttendance } from "@/components/WishesAndAttendance";
import { WishGenerator } from "@/components/WishGenerator";
import { Footer } from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { SectionWrapper } from "@/components/SectionWrapper";
import { Skeleton } from '@/components/ui/skeleton';
import type { WeddingDetails } from '@/types';

export default function UndanganPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);
  
  const rsvpCollectionName = 'rsvps';
  const guestbookCollectionName = 'guestbook_messages';
  const defaultWeddingDetails: WeddingDetails = {
    coupleName: "Aulia & Budi",
    eventDate: "Saturday, September 28, 2024",
    eventTime: "4:00 PM onwards",
    eventLocation: "The Grand Ballroom",
    eventAddress: "123 Wedding Ave, Celebration City",
    akadTitle: 'Akad Nikah',
    akadDate: 'Sabtu, 28 September 2024',
    akadTime: '08:00 - 10:00',
    akadLocation: 'Masjid Agung',
    akadAddress: 'Jl. Merdeka No. 1',
    resepsiTitle: 'Resepsi',
    resepsiDate: 'Sabtu, 28 September 2024',
    resepsiTime: '16:00 - Selesai',
    resepsiLocation: 'The Grand Ballroom',
    resepsiAddress: '123 Wedding Ave, Celebration City',
  }

  if (isUserLoading || !user) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-4xl space-y-12">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-16 w-80" />
            <Skeleton className="h-8 w-64" />
          </div>
          <p className="text-center">Mempersiapkan contoh undangan...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center">
      <Hero coupleName={defaultWeddingDetails.coupleName} eventDate={defaultWeddingDetails.eventDate} />
      
      <SectionWrapper id="details">
        <EventDetails details={defaultWeddingDetails} />
      </SectionWrapper>

      <Separator className="my-0 w-full max-w-4xl mx-auto bg-accent" />

      <SectionWrapper id="gallery">
        <PhotoGallery />
      </SectionWrapper>
      
      <Separator className="my-0 w-full max-w-4xl mx-auto bg-accent" />

      <SectionWrapper id="wishes">
        <WishesAndAttendance 
          rsvpCollectionName={rsvpCollectionName} 
          guestbookCollectionName={guestbookCollectionName} 
        />
      </SectionWrapper>
      
      <Separator className="my-0 w-full max-w-4xl mx-auto bg-accent" />

      <SectionWrapper id="wish-generator">
        <WishGenerator />
      </SectionWrapper>

      <Footer coupleName={defaultWeddingDetails.coupleName} />
    </main>
  );
}

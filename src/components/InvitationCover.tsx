'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Mail } from 'lucide-react';
import { getGoogleDriveFileUrl } from '@/lib/utils';
import type { WeddingDetails } from '@/types';


const animationClasses = [
  "animate-spin-slow",
  "animate-pulse-subtle",
  "animate-swing",
  "animate-fade-in-out",
  "" // No animation for the 5th flower
];

export function InvitationCover({ 
  coupleName, 
  onOpen, 
  guestName,
  mainImageUrl,
  backgroundUrl,
  flowerFrameUrls,
  isOpen
}: { 
  coupleName: string; 
  onOpen: () => void; 
  guestName?: string | null;
  mainImageUrl?: string | null;
  backgroundUrl?: string | null;
  flowerFrameUrls?: WeddingDetails['flowerFrameUrls'];
  isOpen: boolean;
}) {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');
  const finalMainImageUrl = getGoogleDriveFileUrl(mainImageUrl) || heroImage?.imageUrl;
  const finalBgImageUrl = getGoogleDriveFileUrl(backgroundUrl);
  
  const names = coupleName.split(' & ');
  const brideName = names[0];
  const groomName = names[1];

  if (isOpen) {
    return null;
  }
  
  const topLeftFlowers = flowerFrameUrls?.topLeft?.map(url => getGoogleDriveFileUrl(url)).filter(Boolean) as string[] || [];
  const topRightFlowers = flowerFrameUrls?.topRight?.map(url => getGoogleDriveFileUrl(url)).filter(Boolean) as string[] || [];

  return (
    <div className="fixed inset-0 z-50">
      {/* Background Image Container */}
      <div className="absolute inset-0 w-full min-h-screen">
        {finalBgImageUrl && (
          <Image
            src={finalBgImageUrl}
            alt={heroImage?.description || 'Wedding cover background'}
            data-ai-hint={heroImage?.imageHint || 'wedding background'}
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Flower Frames */}
      <div className="absolute top-0 -left-4 w-32 h-32 md:w-48 md:h-48 pointer-events-none transform -scale-x-100 z-30">
        {topLeftFlowers.slice(0, 5).map((url, index) => (
            url && <Image key={`tl-${index}`} src={url} alt="Flower" layout="fill" className={`${animationClasses[index]} object-contain`} />
        ))}
      </div>
      <div className="absolute top-0 -right-4 w-32 h-32 md:w-48 md:h-48 pointer-events-none z-30">
        {topRightFlowers.slice(0, 5).map((url, index) => (
             url && <Image key={`tr-${index}`} src={url} alt="Flower" layout="fill" className={`${animationClasses[index]} object-contain`} />
        ))}
      </div>
      
      {/* Content Container */}
      <div className="relative z-20 flex flex-col items-center w-full h-full overflow-y-auto p-4 text-center pt-8 pb-8">
        
        {finalMainImageUrl && (
          <div className="relative w-[350px] h-[350px] md:w-[400px] md:h-[400px] mb-0 mx-auto">
              <Image
                  src={finalMainImageUrl}
                  alt="Wedding Cover"
                  layout="fill"
                  objectFit="cover"
              />
          </div>
        )}

        <p className="font-sans text-base md:text-lg tracking-widest text-primary my-0">
          The Wedding Of
        </p>
        <div className="font-display text-4xl md:text-5xl text-primary leading-tight my-2">
          <h1>{brideName}</h1>
          <h2 className="text-3xl md:text-4xl">&</h2>
          <h1>{groomName}</h1>
        </div>
        
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 max-w-xs mx-auto my-0">
            <p className="font-body text-sm md:text-base text-primary/80 mb-2">
            Kepada Yth. Bapak/Ibu/Saudara/i:
            </p>
            {guestName && (
                <p className="font-headline text-xl md:text-2xl text-primary">
                    {guestName}
                </p>
            )}
            {!guestName && (
                <p className="font-body text-sm md:text-base text-primary/80">
                    Di Tempat
                </p>
            )}
        </div>

        <Button size="lg" onClick={onOpen} className="animate-pulse font-bold mt-4">
          <Mail className="mr-2 h-5 w-5" />
          Buka Undangan
        </Button>
      </div>
    </div>
  );
}

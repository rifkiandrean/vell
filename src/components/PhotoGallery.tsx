"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SectionTitle } from "./SectionTitle";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from 'firebase/firestore';
import type { Photo } from "@/types";
import { Skeleton } from "./ui/skeleton";
import { getGoogleDriveFileUrl } from "@/lib/utils";

export function PhotoGallery() {
  const { firestore } = useFirebase();
  const photosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'photos'), orderBy('createdAt', 'asc'));
  }, [firestore]);

  const { data: photos, isLoading } = useCollection<Photo>(photosQuery);

  if (isLoading) {
    return (
      <div className="w-full">
        <SectionTitle>Our Moments</SectionTitle>
        <div className="w-full max-w-2xl mx-auto">
          <Skeleton className="w-full aspect-[4/3] rounded-lg" />
          <Skeleton className="h-4 w-1/2 mt-4 mx-auto" />
        </div>
      </div>
    );
  }

  const validPhotos = photos
    ?.map(photo => ({
      ...photo,
      url: getGoogleDriveFileUrl(photo.url) || '',
    }))
    .filter(photo => photo.url);


  if (!validPhotos || validPhotos.length === 0) {
    return (
       <div className="w-full">
        <SectionTitle>Our Moments</SectionTitle>
        <p className="text-center text-foreground/60">Galeri foto akan segera hadir.</p>
       </div>
    );
  }

  return (
    <div className="w-full">
      <SectionTitle>Our Moments</SectionTitle>
      <Carousel className="w-full max-w-2xl mx-auto" opts={{ loop: true }}>
        <CarouselContent>
          {validPhotos.map((photo) => (
            <CarouselItem key={photo.id}>
              <div className="p-0">
                <Card className="overflow-hidden border-none shadow-none bg-transparent">
                  <CardContent className="p-0 aspect-[4/3] relative">
                    <Image
                      src={photo.url}
                      alt={photo.description}
                      fill
                      className="object-cover"
                    />
                  </CardContent>
                  {photo.quote && (
                    <CardFooter className="p-4 bg-transparent justify-center">
                       <p className="text-sm italic text-center text-foreground/80">"{photo.quote}"</p>
                    </CardFooter>
                  )}
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="ml-16 text-primary" />
        <CarouselNext className="mr-16 text-primary" />
      </Carousel>
    </div>
  );
}

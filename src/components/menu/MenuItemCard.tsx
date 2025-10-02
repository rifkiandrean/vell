
"use client";

import Image from 'next/image';
import type { MenuItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomizationDialog } from './CustomizationDialog';
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { transformGoogleDriveUrl } from '@/lib/google-drive';

interface MenuItemCardProps {
  menuItem: MenuItem;
}

const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

const isValidUrl = (urlString: string) => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

export function MenuItemCard({ menuItem }: MenuItemCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  let imageUrl = menuItem.image;
  if (!isValidUrl(imageUrl)) {
    const placeholder = PlaceHolderImages.find(p => p.id === imageUrl);
    if (placeholder) {
      imageUrl = placeholder.imageUrl;
    } else {
      imageUrl = ''; // Or a default fallback image URL
    }
  } else {
    imageUrl = transformGoogleDriveUrl(imageUrl);
  }


  return (
    <>
      <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={menuItem.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="object-cover"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <CardTitle className="text-xl font-headline font-bold">{menuItem.name}</CardTitle>
          <CardDescription className="mt-2">{menuItem.description}</CardDescription>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-2 p-4 pt-0">
          <p className="text-lg font-bold text-primary">{formatRupiah(menuItem.price)}</p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah
          </Button>
        </CardFooter>
      </Card>
      <CustomizationDialog
        menuItem={menuItem}
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
      />
    </>
  );
}

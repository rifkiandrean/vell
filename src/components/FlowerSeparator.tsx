'use client';

import Image from 'next/image';
import { getGoogleDriveFileUrl } from '@/lib/utils';

export function FlowerSeparator({ flowerUrl }: { flowerUrl?: string | null }) {
  const finalFlowerUrl = getGoogleDriveFileUrl(flowerUrl);

  if (!finalFlowerUrl) return <div className="w-full h-12"></div>; // Return empty space if no URL

  return (
    <div className="relative w-full h-24 flex justify-center items-center my-4">
      <div className="relative w-48 h-24">
        <Image
          src={finalFlowerUrl}
          alt="Ornamen Bunga"
          layout="fill"
          objectFit="contain"
        />
      </div>
    </div>
  );
}

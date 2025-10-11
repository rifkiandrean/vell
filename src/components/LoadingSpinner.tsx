'use client';

import Image from 'next/image';

interface LoadingSpinnerProps {
  loadingText?: string;
  loadingGifUrl?: string | null;
}

export function LoadingSpinner({ loadingText = "Memuat Undangan...", loadingGifUrl }: LoadingSpinnerProps) {
  const defaultGif = "/uploads/loading.gif"; // A default loading GIF in public/uploads
  const finalGifUrl = loadingGifUrl || defaultGif;

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-xs text-center space-y-4">
        <div className="relative w-32 h-32 mx-auto">
          <Image
            src={finalGifUrl}
            alt="Loading animation"
            layout="fill"
            objectFit="contain"
            unoptimized={true} // Important for GIFs
          />
        </div>
        <p className="text-foreground/80 animate-pulse">{loadingText}</p>
      </div>
    </div>
  );
}

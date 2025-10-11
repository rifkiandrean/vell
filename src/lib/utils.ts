import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getGoogleDriveFileUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  let fileId = null;
  
  // Handle urls like: https://drive.google.com/file/d/.../view?usp=sharing
  if (url.includes('drive.google.com/file/d/')) {
    const parts = url.split('/');
    const dIndex = parts.indexOf('d');
    if (dIndex !== -1 && parts.length > dIndex + 1) {
      fileId = parts[dIndex + 1];
    }
  } 
  // Handle urls like: https://drive.google.com/uc?id=...
  else if (url.includes('drive.google.com/uc?id=')) {
     try {
        const urlObject = new URL(url);
        fileId = urlObject.searchParams.get('id');
     } catch (e) {
        // If it's not a valid URL, it might be a direct link already
        return url;
     }
  }

  if (fileId) {
    // Check if it's an image to use the 'view' export, otherwise use 'download' for audio/other files
    const isLikelyImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || !/\..+$/.test(fileId);
    const exportAction = isLikelyImage ? 'view' : 'download';
    return `https://drive.google.com/uc?export=${exportAction}&id=${fileId}`;
  }
  
  // If it's not a recognizable Google Drive URL, return the original URL
  // This allows using direct image links from other services
  return url;
}

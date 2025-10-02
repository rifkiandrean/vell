
"use client";

import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function CafeFooter() {
  const { ersLogoUrl } = useAuth();
  const pathname = usePathname();

  // Do not render the footer on the cashier page, as it has its own layout
  if (pathname.startsWith('/ers/cafe/admin/cashier')) {
    return null;
  }

  return (
    <footer className="py-4 px-4 text-center text-xs text-muted-foreground mt-auto">
      <div className="flex flex-col items-center justify-center gap-1">
        {ersLogoUrl && (
           <Image src={ersLogoUrl} alt="VELL Logo" width={24} height={24} className="h-6 w-6 object-contain" />
        )}
        <span>Copyright © VELL</span>
        <span>Sistem Restoran Elektronik</span>
      </div>
    </footer>
  );
}

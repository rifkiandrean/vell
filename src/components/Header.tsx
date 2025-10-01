

"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import { Icons } from './icons';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { tableNumber } = useOrder();
  const { companyName, logoUrl } = useAuth();

  const formattedTableNumber = tableNumber
    ? tableNumber.charAt(0).toUpperCase() + tableNumber.slice(1)
    : '';

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center">
          {/* SidebarTrigger can be removed or repurposed if needed */}
        </div>
        <div className="flex flex-1 items-center justify-center md:justify-start">
          <div className="flex flex-col items-center md:items-start md:ml-4">
            <Link href="/ers/cafe" className="flex items-center gap-2">
               {logoUrl ? (
                <Image src={logoUrl} alt={`${companyName} logo`} width={32} height={32} className="h-6 w-6 sm:h-8 sm:w-8 object-contain" />
              ) : (
                <Icons.Coffee className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
              )}
              <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl">
                {companyName}
              </h1>
            </Link>
          </div>
        </div>
        <nav className="flex items-center justify-end gap-4 mr-4">
          {tableNumber && (
            <div className="text-sm font-semibold text-muted-foreground">
              Anda sekarang di <span className="text-primary font-bold">{formattedTableNumber}</span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

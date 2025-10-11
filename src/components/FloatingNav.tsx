
'use client';

import Link from 'next/link';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { cn } from '@/lib/utils';
import { Home, Heart, CalendarDays, GalleryVertical, BookHeart } from 'lucide-react';
import type { ReactNode } from 'react';

const iconMap: { [key: string]: ReactNode } = {
  home: <Home className="h-5 w-5" />,
  couple: <Heart className="h-5 w-5" />,
  details: <CalendarDays className="h-5 w-5" />,
  gallery: <GalleryVertical className="h-5 w-5" />,
  wishes: <BookHeart className="h-5 w-5" />,
};

export function FloatingNav({
  navItems,
}: {
  navItems: {
    name: string;
    link: string;
  }[];
}) {
  const sectionIds = navItems.map(item => item.link.substring(1));
  const activeId = useScrollSpy(sectionIds, { threshold: 0.3 });

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center justify-center gap-2 rounded-full bg-background/80 px-4 py-2 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
        {navItems.map(item => {
          const sectionId = item.link.substring(1);
          const Icon = iconMap[sectionId];
          return (
            <Link
              key={item.link}
              href={item.link}
              className={cn(
                'flex flex-col items-center justify-center h-12 w-12 rounded-full text-foreground/60 transition-all duration-300 hover:bg-accent hover:text-accent-foreground',
                {
                  'text-primary scale-110 bg-primary/10': activeId === sectionId,
                }
              )}
            >
              {Icon}
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

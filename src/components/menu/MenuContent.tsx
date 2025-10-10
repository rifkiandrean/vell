
"use client"

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import type { MenuItem, MenuItemCategory } from '@/lib/types';
import { MenuItemCard } from './MenuItemCard';
import { Skeleton } from '@/components/ui/skeleton';

interface MenuContentProps {
    selectedCategory: MenuItemCategory;
}

export function MenuContent({ selectedCategory }: MenuContentProps) {
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menu'), (snapshot) => {
        const menuList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        setMenuData(menuList);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching menu data from Firestore:", error);
        setIsLoading(false);
    });
    
    return () => unsub();
  }, []);

  const filteredMenu = menuData.filter(item => item.category === selectedCategory);

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight mb-6 hidden md:block">{selectedCategory}</h2>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {filteredMenu.length > 0 ? (
            filteredMenu.map(item => (
              <MenuItemCard key={item.id} menuItem={item} />
            ))
          ) : (
            <p className="text-muted-foreground col-span-full">Tidak ada item menu di kategori ini.</p>
          )}
        </div>
      )}
    </div>
  );
}


function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[128px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-col items-center pt-2 gap-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    </div>
  )
}

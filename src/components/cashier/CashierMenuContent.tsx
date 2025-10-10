
"use client"

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import type { MenuItem, MenuItemCategory } from '@/lib/types';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
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
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/5" />
      </div>
    </div>
  )
}

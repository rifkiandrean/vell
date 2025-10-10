

"use client"

import * as React from 'react';
import type { MenuItemCategory, MenuCategorySetting } from '@/lib/types';
import * as LucideIcons from 'lucide-react';
import { Icons } from '@/components/icons';
import { MenuContent } from './CashierMenuContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '../ui/scroll-area';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { HelpCircle } from 'lucide-react';

const getIconComponent = (iconName: string, fallback: React.ElementType = HelpCircle): React.ElementType => {
    if (iconName in Icons) {
        return Icons[iconName as keyof typeof Icons];
    }
    if (iconName in LucideIcons) {
        return (LucideIcons as any)[iconName];
    }
    return fallback;
};


export function CashierMenu() {
  const [categories, setCategories] = React.useState<MenuCategorySetting[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [defaultCategory, setDefaultCategory] = React.useState<string | undefined>();

  React.useEffect(() => {
    const q = query(collection(db, "menu_categories"), orderBy("order"));
    const unsub = onSnapshot(q, (snapshot) => {
        const fetchedCategories = snapshot.docs
            .map(doc => doc.data() as MenuCategorySetting)
            .filter(cat => cat.visible);
        setCategories(fetchedCategories);
        if (fetchedCategories.length > 0) {
            setDefaultCategory(fetchedCategories[0].name);
        }
        setIsLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-card rounded-lg border h-full flex flex-col">
        {isLoading ? (
             <div className="p-4 border-b">
                <Skeleton className="h-10 w-full" />
             </div>
        ) : (
        <Tabs defaultValue={defaultCategory} className="flex-grow flex flex-col">
            <div className="p-4 border-b sticky top-0 bg-card z-10">
              <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                  <TabsList>
                      {categories.map((category) => {
                           const IconComponent = getIconComponent(category.icon);
                           return (
                            <TabsTrigger key={category.name} value={category.name} className="gap-2">
                               <IconComponent className="h-4 w-4"/> {category.label}
                           </TabsTrigger>
                           )
                      })}
                  </TabsList>
              </ScrollArea>
            </div>
            
            <div className="flex-grow overflow-auto">
                <ScrollArea className="h-full">
                    <div className="p-4 pt-4">
                        {categories.map((category) => (
                        <TabsContent key={category.name} value={category.name}>
                            <MenuContent selectedCategory={category.name} />
                        </TabsContent>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </Tabs>
        )}
    </div>
  );
}

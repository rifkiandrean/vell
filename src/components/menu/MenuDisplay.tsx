

"use client"

import * as React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { MenuItemCategory, MenuCategorySetting, ShopStatus, PromoSlide, PromoSettings } from '@/lib/types';
import * as LucideIcons from 'lucide-react';
import { Icons } from '@/components/icons';
import { Header } from '@/components/Header';
import { OrderPanel } from '@/components/order/OrderPanel';
import { MenuContent } from './MenuContent';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { HelpCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";


const getIconComponent = (iconName: string, fallback: React.ElementType = HelpCircle): React.ElementType => {
    if (iconName in Icons) {
        return Icons[iconName as keyof typeof Icons];
    }
    if (iconName in LucideIcons) {
        return (LucideIcons as any)[iconName];
    }
    return fallback;
};


function AccordionMenu({ shopStatus }: { shopStatus: ShopStatus | null }) {
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
        <div className="flex flex-col h-full">
            <main className="flex-1 overflow-y-auto">
                {shopStatus && !shopStatus.isOpen ? (
                    <ClosedDisplay />
                ) : isLoading ? (
                     <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                <Accordion type="single" collapsible defaultValue={defaultCategory} className="w-full">
                    {categories.map((category) => {
                        const IconComponent = getIconComponent(category.icon);
                        return (
                        <AccordionItem value={category.name} key={category.name}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <IconComponent className="h-5 w-5"/>
                                    <span className="text-lg font-semibold">{category.label}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <MenuContent selectedCategory={category.name} />
                            </AccordionContent>
                        </AccordionItem>
                    )})}
                </Accordion>
                )}
            </main>
        </div>
    );
}

const ClosedDisplay = () => (
    <div className="flex flex-col items-center justify-center text-center h-full min-h-[50vh]">
        <Clock className="w-20 h-20 text-primary mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-primary">Maaf, Kafe Sudah Tutup</h1>
        <p className="mt-2 text-lg text-muted-foreground">Mohon maaf kafe sudah tutup / close order, Silahkan datang lagi besok !</p>
    </div>
)

interface MenuDisplayProps {
  shopStatus: ShopStatus | null;
}


export function MenuDisplay({ shopStatus }: MenuDisplayProps) {
  const [promoSlides, setPromoSlides] = React.useState<PromoSlide[]>([]);
  const [promoSettings, setPromoSettings] = React.useState<PromoSettings>({});
  
  React.useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "promoSettings"), (docSnap) => {
        if (docSnap.exists()) {
            setPromoSettings(docSnap.data() as PromoSettings);
        } else {
            setPromoSettings({});
        }
    });

    const q = query(collection(db, "promo_slides"), orderBy("order", "asc"));
    const unsubSlides = onSnapshot(q, (snapshot) => {
        const slides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoSlide));
        setPromoSlides(slides);
    });

    return () => {
        unsubSettings();
        unsubSlides();
    };
  }, []);

  const renderBanner = () => {
    if (promoSettings.promoBannerEnabled && promoSlides.length > 0) {
        const staticBgUrl = promoSettings.promoBannerBackgroundUrl || null;
        
        return (
            <div className="relative w-full mb-8 rounded-lg overflow-hidden shadow-lg">
                {staticBgUrl && <Image src={staticBgUrl} alt="Promo Background" fill className="object-cover -z-10" />}
                <div className="absolute inset-0 bg-black/30 -z-10" />

                <Carousel
                    plugins={[
                        Autoplay({
                            delay: 3000,
                            stopOnInteraction: true,
                        }),
                    ]}
                    className="w-full"
                >
                    <CarouselContent>
                        {promoSlides.map((slide) => {
                            const productImageUrl = slide.productImageUrl || null;

                            const BannerContent = (
                                <div className="relative aspect-[3/1] w-full block">
                                    <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-white">
                                        <div className="flex items-center w-full">
                                            {productImageUrl && (
                                                <div className="w-1/2 flex justify-center items-center">
                                                    <Image src={productImageUrl} alt={slide.title || "Produk Promo"} width={200} height={200} className="object-contain drop-shadow-2xl h-40 sm:h-48 md:h-64 w-auto" />
                                                </div>
                                            )}
                                            <div className={productImageUrl ? "w-1/2 text-left" : "w-full text-center"}>
                                                {slide.title && <h2 className="text-xl sm:text-2xl md:text-4xl font-bold tracking-tight drop-shadow-md">{slide.title}</h2>}
                                                {slide.description && <p className="mt-2 text-xs sm:text-sm md:text-lg max-w-md drop-shadow-md">{slide.description}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );

                            return (
                                <CarouselItem key={slide.id}>
                                    {slide.linkUrl ? (
                                        <Link href={slide.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
                                            {BannerContent}
                                        </Link>
                                    ) : (
                                        <figure className="block">{BannerContent}</figure>
                                    )}
                                </CarouselItem>
                            )
                        })}
                    </CarouselContent>
                </Carousel>
            </div>
        );
    }
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        {shopStatus && !shopStatus.isOpen ? (
          <div className="flex items-center justify-center h-full">
            <ClosedDisplay />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">
            <div className="lg:col-span-2">
              {renderBanner()}
              <AccordionMenu shopStatus={shopStatus} />
            </div>
            <div className="hidden lg:block lg:sticky lg:top-24 h-fit">
              <OrderPanel />
            </div>
          </div>
        )}
      </main>
      <div className="lg:hidden p-4">
        <OrderPanel />
      </div>
    </div>
  );
}

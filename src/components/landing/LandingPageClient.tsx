

'use client';

import { Mountain, Utensils, Laptop, Heart, Newspaper, HelpCircle, Check, X, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { LandingPageContent, Post, HeroSlide, PricingPackage } from '@/lib/types';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import * as LucideIcons from 'lucide-react';
import { Icons } from '../icons';
import { cn } from '@/lib/utils';
import { transformGoogleDriveUrl } from '@/lib/google-drive';

// Create a client-side compatible Post type where Timestamps are strings
export type ClientPost = Omit<Post, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};


interface LandingPageClientProps {
    content: LandingPageContent;
    posts: ClientPost[];
    heroSlides: HeroSlide[];
    pricingPackages: PricingPackage[];
}

export function LandingPageClient({ content, posts, heroSlides, pricingPackages }: LandingPageClientProps) {

  const product1IconUrl = content.product1IconUrl ? transformGoogleDriveUrl(content.product1IconUrl) : null;
  const product2IconUrl = content.product2IconUrl ? transformGoogleDriveUrl(content.product2IconUrl) : null;
  const vellLogoUrl = content.vellLogoUrl ? transformGoogleDriveUrl(content.vellLogoUrl) : null;
  
  const packageColors = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

  const socialLinks = [
    { name: 'Instagram', url: content.instagramUrl, iconUrl: content.instagramIconUrl },
    { name: 'TikTok', url: content.tiktokUrl, iconUrl: content.tiktokIconUrl },
    { name: 'Facebook', url: content.facebookUrl, iconUrl: content.facebookIconUrl },
    { name: 'Twitter', url: content.twitterUrl, iconUrl: content.twitterIconUrl },
  ].filter(link => link.url && link.iconUrl);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b sticky top-0 z-50">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          {vellLogoUrl ? (
            <Image src={vellLogoUrl} alt={content.brandName || "VELL Logo"} width={24} height={24} className="h-6 w-6 object-contain" />
          ) : (
            <Mountain className="h-6 w-6" />
          )}
          <span className="ml-2 text-xl font-bold tracking-tight text-black">{content.brandName || "VELL"}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-4">
           <Button variant="ghost" asChild>
              <Link href="#products" prefetch={false}>
                Produk
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#pricing" prefetch={false}>
                Harga
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#news" prefetch={false}>
                News
              </Link>
            </Button>
          <Link href="/admin/login" prefetch={false}>
             <Button variant="default" size="icon">
                <LogIn className="h-5 w-5" />
                <span className="sr-only">Login</span>
             </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full relative">
            <Carousel
                opts={{ loop: true }}
                plugins={[ Autoplay({ delay: 5000, stopOnInteraction: false }) ]}
                className="w-full"
            >
                <CarouselContent>
                    {heroSlides.map((slide) => (
                        <CarouselItem key={slide.id}>
                            <div className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center">
                                <Image
                                    src={transformGoogleDriveUrl(slide.imageUrl)}
                                    alt={slide.title}
                                    fill
                                    className="object-cover brightness-50"
                                    data-ai-hint={slide.imageHint}
                                    priority={slide.order === 0}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                                    <div className="max-w-3xl mx-auto">
                                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-white drop-shadow-md">
                                            {slide.title}
                                        </h1>
                                        <p className="max-w-[700px] text-gray-200 md:text-xl mt-4 drop-shadow-md">
                                            {slide.subtitle}
                                        </p>
                                         <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center mt-8">
                                            <Link
                                                href="#products"
                                                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                                prefetch={false}
                                            >
                                                Lihat Produk
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>

        <section id="news" className="w-full py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">News</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Berita & Update Terbaru</h2>
              </div>
            </div>
            <Carousel
                opts={{ align: "start", loop: posts.length > 3 }}
                plugins={[ Autoplay({ delay: 4000, stopOnInteraction: true }) ]}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                {posts.map((post) => (
                    <CarouselItem key={post.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                       <Link href={`/posts/${post.slug}`} className="block group">
                          <Card className="overflow-hidden h-full flex flex-row items-center transition-all group-hover:shadow-lg p-3 gap-3">
                              <div className="relative aspect-square w-16 h-16 rounded-md overflow-hidden shrink-0">
                                  <Image
                                      src={transformGoogleDriveUrl(post.imageUrl) || 'https://picsum.photos/seed/news/150/150'}
                                      alt={post.title}
                                      fill
                                      className="object-cover"
                                  />
                              </div>
                              <div className="flex flex-col">
                                  <h3 className="text-sm font-semibold leading-tight line-clamp-2">{post.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(post.createdAt), 'd MMM yyyy', { locale: id })}
                                  </p>
                              </div>
                          </Card>
                        </Link>
                    </CarouselItem>
                ))}
                </CarouselContent>
            </Carousel>
          </div>
        </section>
        
        <section id="products" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                 <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">{content.productsSectionTitle || "Produk Kami"}</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{content.productsSectionSubtitle || "Solusi Digital untuk Bisnis Anda"}</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {content.productsSectionSubtitle || "Lihat bagaimana kami telah membantu bisnis seperti milik Anda untuk berkembang."}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-center gap-8 md:gap-12">
                  <div className="w-48 h-48 shrink-0 mx-auto">
                    {product1IconUrl ? (
                        <Image src={product1IconUrl} alt="Product 1 Icon" width={192} height={192} className="w-full h-full object-contain" />
                    ) : (
                        <Utensils className="w-full h-full text-primary"/>
                    )}
                  </div>
                  <div className="grid gap-2 text-center md:text-left">
                    <h3 className="text-2xl font-bold">{content.product1Title || "Sistem Restoran Digital"}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto md:mx-0">
                      {content.product1Description || "Aplikasi manajemen kafe lengkap dengan pemesanan via QR, sistem kasir, monitor dapur, dan panel admin untuk manajemen stok, menu, serta laporan keuangan."}
                    </p>
                    <div className="mt-4">
                        <Link href={content.product1Link || "/cafe"} prefetch={false}>
                            <Button variant="outline">Lihat Demo</Button>
                        </Link>
                    </div>
                  </div>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12">
               <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-8 md:gap-12">
                    <div className="grid gap-2 text-center md:text-left order-2 md:order-1">
                        <h3 className="text-2xl font-bold">{content.product2Title || "Undangan Pernikahan Digital"}</h3>
                        <p className="text-muted-foreground max-w-md mx-auto md:mx-0">
                            {content.product2Description || "Sistem undangan pernikahan digital modern dan interaktif. Fitur termasuk detail acara, galeri foto, cerita cinta, buku tamu digital, dan konfirmasi kehadiran (RSVP)."}
                        </p>
                         <div className="mt-4">
                            <Link href={content.product2Link || "/upd/hani"} prefetch={false}>
                                <Button variant="outline">Lihat Contoh</Button>
                            </Link>
                        </div>
                    </div>
                     <div className="w-48 h-48 shrink-0 mx-auto order-1 md:order-2">
                        {product2IconUrl ? (
                            <Image src={product2IconUrl} alt="Product 2 Icon" width={192} height={192} className="w-full h-full object-contain" />
                        ) : (
                            <Heart className="w-full h-full text-primary"/>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                 <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Harga</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Paket Harga yang Transparan</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Pilih paket yang paling sesuai dengan kebutuhan Anda.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3">
              {pricingPackages.map((pkg, index) => {
                const colorVar = packageColors[index % packageColors.length];
                const cardStyle = { '--card-color': `hsl(var(${colorVar}))` } as React.CSSProperties;
                const isPopular = pkg.isPopular;
                
                const whatsappNumber = "6282115123431";
                const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pkg.price);
                const message = `Hallo kak, Bolehkan saya memesan ${pkg.name} dengan harga ${formattedPrice} ?`;
                const encodedMessage = encodeURIComponent(message);
                const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;


                return (
                    <Card key={pkg.id} className={cn("flex flex-col", isPopular ? "border-2 border-primary shadow-lg" : "")}>
                    {isPopular && (
                        <div className="bg-primary text-primary-foreground text-sm font-semibold text-center py-1 rounded-t-lg">
                        Paling Populer
                        </div>
                    )}
                    <CardHeader className="items-center text-center">
                        <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                        <div className="text-4xl font-bold text-primary">
                            {formattedPrice}
                        </div>
                        <p className="text-sm text-muted-foreground">{pkg.pricePeriod}</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                        <ul className="space-y-3 text-sm">
                        {pkg.features.map((feature, i) => {
                            const isExcluded = feature.startsWith('!');
                            const featureText = isExcluded ? feature.substring(1) : feature;
                            return (
                                <li key={i} className={cn("flex items-start gap-3", isExcluded && "text-muted-foreground/60 line-through")}>
                                    {isExcluded ? (
                                        <X className="h-5 w-5 text-muted-foreground/50 mt-px flex-shrink-0" />
                                    ) : (
                                        <Check className="h-5 w-5 mt-px flex-shrink-0 text-primary" />
                                    )}
                                    <span className="text-foreground">{featureText}</span>
                                </li>
                            )
                        })}
                        </ul>
                         <Button asChild className="bg-primary text-primary-foreground">
                            <Link href={whatsappUrl} target="_blank">Pilih Paket</Link>
                        </Button>
                    </CardContent>
                    </Card>
                );
              })}
            </div>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-4 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 {content.brandName || "VELL"}. Semua Hak Cipta Dilindungi.</p>
        <nav className="sm:ml-auto flex items-center gap-4 sm:gap-6">
            {socialLinks.map((link) => (
                <Link key={link.name} href={link.url!} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                    <Image
                        src={transformGoogleDriveUrl(link.iconUrl!)}
                        alt={`${link.name} icon`}
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                    />
                </Link>
            ))}
             <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                Syarat & Ketentuan
            </Link>
            <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                Kebijakan Privasi
            </Link>
        </nav>
      </footer>
    </div>
  );
}


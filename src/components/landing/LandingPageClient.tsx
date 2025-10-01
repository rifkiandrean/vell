
'use client';

import { Mountain, Utensils, Laptop, Heart, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { LandingPageContent, Post } from '@/lib/types';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Create a client-side compatible Post type where Timestamps are strings
export type ClientPost = Omit<Post, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};


interface LandingPageClientProps {
    content: LandingPageContent;
    posts: ClientPost[];
}

export function LandingPageClient({ content, posts }: LandingPageClientProps) {

  const transformGoogleDriveUrl = (url: string): string => {
      if (!url || !url.includes('drive.google.com')) {
          return url;
      }
      const match = url.match(/file\/d\/([^/]+)/);
      if (match && match[1]) {
          return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
      return url;
  };

  const heroSlides = [
    {
      title: content.heroTitle || "Elektronik Restoran Sistem Modern untuk Bisnis Anda",
      subtitle: content.heroSubtitle || "VELL menyediakan solusi lengkap dari Point-of-Sale (POS), manajemen inventaris, hingga analitik penjualan untuk membawa restoran Anda ke level berikutnya.",
      imageUrl: content.heroImageUrl ? transformGoogleDriveUrl(content.heroImageUrl) : "https://picsum.photos/seed/restaurant-system/1200/800",
      imageHint: "restaurant system"
    },
    {
      title: "Manajemen Kafe Menjadi Mudah",
      subtitle: "Aplikasi manajemen kafe lengkap dengan pemesanan via QR, sistem kasir, monitor dapur, dan panel admin untuk manajemen stok, menu, serta laporan keuangan.",
      imageUrl: content.portfolioImageUrl1 ? transformGoogleDriveUrl(content.portfolioImageUrl1) : "https://picsum.photos/seed/badia-kopi/1200/800",
      imageHint: "coffee shop"
    },
    {
      title: "Undangan Pernikahan Digital Interaktif",
      subtitle: "Sistem undangan pernikahan digital modern dan interaktif. Fitur termasuk detail acara, galeri foto, cerita cinta, buku tamu digital, dan konfirmasi kehadiran (RSVP).",
      imageUrl: content.portfolioImageUrl2 ? transformGoogleDriveUrl(content.portfolioImageUrl2) : "https://picsum.photos/seed/wedding-invitation/1200/800",
      imageHint: "wedding invitation"
    },
  ];

  const portfolioImageUrl1 = content.portfolioImageUrl1 ? transformGoogleDriveUrl(content.portfolioImageUrl1) : "https://picsum.photos/seed/badia-kopi/600/400";
  const portfolioImageUrl2 = content.portfolioImageUrl2 ? transformGoogleDriveUrl(content.portfolioImageUrl2) : "https://picsum.photos/seed/wedding-invitation/600/400";


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b sticky top-0 z-50">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Mountain className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold tracking-tight text-primary">{content.brandName || "VELL"}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary" prefetch={false}>
            Fitur
          </Link>
          <Link href="#portfolio" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary" prefetch={false}>
            Portofolio
          </Link>
          <Link href="#news" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary" prefetch={false}>
            News
          </Link>
          <Link href="/admin/login" prefetch={false}>
             <Button>Login</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full relative">
            <Carousel
                opts={{ loop: true }}
                plugins={[ Autoplay({ delay: 5000, stopOnInteraction: false }) ]}
            >
                <CarouselContent>
                    {heroSlides.map((slide, index) => (
                        <CarouselItem key={index}>
                            <div className="relative w-full h-[60vh] md:h-[70vh]">
                                <Image
                                    src={slide.imageUrl}
                                    alt={slide.title}
                                    fill
                                    className="object-cover brightness-50"
                                    data-ai-hint={slide.imageHint}
                                />
                                <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-4">
                                    <div className="max-w-3xl">
                                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-white drop-shadow-md">
                                            {slide.title}
                                        </h1>
                                        <p className="max-w-[700px] text-gray-200 md:text-xl mt-4 drop-shadow-md">
                                            {slide.subtitle}
                                        </p>
                                         <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center mt-8">
                                            <Link
                                                href="#features"
                                                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                                prefetch={false}
                                            >
                                                Pelajari Fitur
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
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Fitur Utama</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Solusi Lengkap untuk Semua Kebutuhan</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {content.featuresSubtitle}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-2 text-center p-6 rounded-lg transition-all hover:bg-muted/50 hover:shadow-lg">
                <Utensils className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Manajemen Pesanan & POS</h3>
                <p className="text-muted-foreground">Sistem kasir yang intuitif, terintegrasi dengan manajemen meja, dapur, dan pelayan secara real-time.</p>
              </div>
              <div className="grid gap-2 text-center p-6 rounded-lg transition-all hover:bg-muted/50 hover:shadow-lg">
                <Laptop className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Admin Panel Komprehensif</h3>
                <p className="text-muted-foreground">Kelola menu, inventaris, vendor, dan keuangan dengan analitik mendalam untuk pengambilan keputusan.</p>
              </div>
              <div className="grid gap-2 text-center p-6 rounded-lg transition-all hover:bg-muted/50 hover:shadow-lg">
                <Mountain className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Skalabilitas & Kustomisasi</h3>
                <p className="text-muted-foreground">Mendukung satu atau banyak cabang. Sistem dapat disesuaikan dengan branding dan kebutuhan unik bisnis Anda.</p>
              </div>
            </div>
          </div>
        </section>
        <section id="portfolio" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Portofolio Kami</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {content.portfolioSubtitle}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-8 py-12 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center space-y-4">
                <div className="grid gap-2">
                  <h3 className="text-2xl font-bold flex items-center gap-2"><Utensils className="h-6 w-6"/>BADIA KOPI</h3>
                  <p className="text-muted-foreground">
                    Aplikasi manajemen kafe lengkap dengan pemesanan via QR, sistem kasir, monitor dapur, dan panel admin untuk manajemen stok, menu, serta laporan keuangan.
                  </p>
                  <Link href="/cafe" prefetch={false} className="mt-2">
                    <Button variant="outline">Lihat Demo</Button>
                  </Link>
                </div>
              </div>
              <img
                src={portfolioImageUrl1}
                width="600"
                height="400"
                alt="BADIA KOPI"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full shadow-lg"
                data-ai-hint="coffee shop"
              />
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-8 py-12 lg:grid-cols-2 lg:gap-16">
               <img
                src={portfolioImageUrl2}
                width="600"
                height="400"
                alt="Undangan Pernikahan Digital"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full shadow-lg lg:order-last"
                data-ai-hint="wedding invitation"
              />
              <div className="flex flex-col justify-center space-y-4">
                <div className="grid gap-2">
                  <h3 className="text-2xl font-bold flex items-center gap-2"><Heart className="h-6 w-6"/>Undangan Pernikahan Digital</h3>
                  <p className="text-muted-foreground">
                    Sistem undangan pernikahan digital modern dan interaktif. Fitur termasuk detail acara, galeri foto, cerita cinta, buku tamu digital, dan konfirmasi kehadiran (RSVP).
                  </p>
                  <Link href="/upd/hani" prefetch={false} className="mt-2">
                    <Button variant="outline">Lihat Contoh</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="news" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                 <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">News & Updates</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Berita & Informasi Terbaru</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Ikuti perkembangan terbaru dari kami dan industri.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              {posts.map((post) => (
                <Card key={post.id} className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className="p-0">
                    <Link href={`/posts/${post.slug}`} className="block relative h-48 w-full">
                       <Image
                          src={post.imageUrl || 'https://picsum.photos/seed/news/600/400'}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-lg font-bold leading-tight">{post.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {post.createdAt ? format(new Date(post.createdAt), 'd MMMM yyyy', { locale: id }) : ''}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                     <Link href={`/posts/${post.slug}`} className="w-full">
                        <Button variant="outline" className="w-full">Baca Selengkapnya</Button>
                     </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 {content.brandName || "VELL"}. Semua Hak Cipta Dilindungi.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
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

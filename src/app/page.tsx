
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { AuthForm } from '@/components/AuthForm';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';


export default function Home() {
  const router = useRouter();
  const { user } = useUser();

  const handleRegisterSuccess = () => {
    // After registration, the user still needs to log in.
    // The AuthForm automatically switches to the login tab.
    // We can show a toast or just let the user log in.
  }

  const handleLoginSuccess = () => {
    router.push('/undangan/sindi/admin');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 md:px-6">
          <div className="mr-4 flex items-center">
            <Link href="/" className="font-bold text-2xl text-primary font-headline">Vell</Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-auto">
            <Link href="/undangan" className="text-foreground/80 hover:text-foreground transition-colors">
              Lihat Contoh
            </Link>
            <Link href="/undangan/list" className="text-foreground/80 hover:text-foreground transition-colors">
              Daftar Undangan
            </Link>
            {user ? (
               <Button asChild>
                <Link href="/undangan/sindi/admin">Dasbor Admin</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="#register">Buat Undangan</Link>
              </Button>
            )}
          </nav>
          <div className="md:hidden ml-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="grid gap-6 text-lg font-medium mt-12">
                  <Link href="/undangan" className="text-foreground/80 hover:text-foreground transition-colors">
                    Lihat Contoh
                  </Link>
                   <Link href="/undangan/list" className="text-foreground/80 hover:text-foreground transition-colors">
                    Daftar Undangan
                  </Link>
                  {user ? (
                    <Link href="/undangan/sindi/admin" className="text-foreground/80 hover:text-foreground transition-colors">
                      Dasbor Admin
                    </Link>
                  ) : (
                    <Link href="#register" className="text-foreground/80 hover:text-foreground transition-colors">
                      Buat Undangan
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-20 md:py-24 lg:py-32 xl:py-48 bg-accent/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline text-primary">
                  Buat Undangan Pernikahan Digital Anda
                </h1>
                <p className="mx-auto max-w-[700px] text-foreground/80 text-base sm:text-lg md:text-xl">
                  Cepat, mudah, dan personal. Mulai gratis dan bagikan momen bahagia Anda.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                    <Link href="#register">
                        Mulai Sekarang
                    </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {!user && (
          <section id="register" className="w-full py-16 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="mx-auto max-w-lg">
                <AuthForm onLoginSuccess={handleLoginSuccess} />
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-accent/30">
        <p className="text-xs text-foreground/60">&copy; {new Date().getFullYear()} Vell. All Rights Reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

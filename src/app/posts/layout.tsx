
import { Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-4 px-6 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
         <div className="container mx-auto flex justify-between items-center">
             <Link href="/" className="flex items-center justify-center" prefetch={false}>
                <Mountain className="h-6 w-6" />
                <span className="ml-2 text-xl font-bold tracking-tight text-foreground">VELL</span>
            </Link>
            <Button asChild variant="outline">
                <Link href="/">
                    Kembali ke Beranda
                </Link>
            </Button>
         </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

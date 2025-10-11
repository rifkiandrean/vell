
'use client';

import Link from 'next/link';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { WeddingDetails } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionWrapper } from '@/components/SectionWrapper';
import { SectionTitle } from '@/components/SectionTitle';

function WeddingList() {
    const { firestore } = useFirebase();
    const weddingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'weddings'));
    }, [firestore]);

    const { data: weddings, isLoading } = useCollection<WeddingDetails & { id: string }>(weddingsQuery);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="flex justify-end">
                            <Skeleton className="h-10 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!weddings || weddings.length === 0) {
        return <p className="text-center text-foreground/60 mt-8">Belum ada undangan yang dibuat.</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weddings.map((wedding) => (
                <Card key={wedding.id} className="flex flex-col">
                    <CardHeader className="flex-grow">
                        <CardTitle>{wedding.coupleName}</CardTitle>
                        <CardDescription>{wedding.eventDate}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-end">
                        <Button asChild>
                            <Link href={`/undangan/${wedding.id}`}>Lihat Undangan</Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function WeddingListPage() {
  return (
    <div className="min-h-screen bg-background">
         <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4 md:px-6">
            <div className="mr-4 flex items-center">
                <Link href="/" className="font-bold text-2xl text-primary font-headline">Vell</Link>
            </div>
            </div>
        </header>
        <main>
            <SectionWrapper>
                <SectionTitle>Daftar Undangan</SectionTitle>
                <WeddingList />
            </SectionWrapper>
        </main>
    </div>
  );
}

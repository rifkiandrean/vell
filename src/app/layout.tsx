

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { OrderProvider } from '@/context/OrderContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LandingPageContent } from '@/lib/types';


async function getWebsiteSettings(): Promise<{title: string, vellLogoUrl?: string}> {
    try {
        const docRef = doc(db, "settings", "landingPage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as LandingPageContent;
            return {
                title: data.websiteTitle || "VELL - Elektronik Restoran Sistem",
                vellLogoUrl: data.vellLogoUrl || "/favicon.ico"
            };
        }
    } catch (error) {
        console.error("Error fetching website title:", error);
    }
    return { title: "VELL - Elektronik Restoran Sistem", vellLogoUrl: '/favicon.ico' };
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWebsiteSettings();
  return {
    title: settings.title,
    description: "Solusi lengkap dari Point-of-Sale (POS), manajemen inventaris, hingga analitik penjualan untuk membawa restoran Anda ke level berikutnya.",
    icons: {
      icon: settings.vellLogoUrl || '/favicon.ico',
    },
  };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Poppins:wght@300;400;500;600;700&family=Great+Vibes&family=Sacramento&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-body">
        <Suspense fallback={<div>Loading...</div>}>
           <AuthProvider companyName={'BADIA KOPI'}>
                <SettingsProvider>
                  <OrderProvider>
                    {children}
                  </OrderProvider>
                </SettingsProvider>
            </AuthProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}

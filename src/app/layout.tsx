
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from 'react';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Digital Invitation',
  description: 'A digital invitation platform by VELL.',
};

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
      <body className="antialiased font-sans">
        <Suspense fallback={<div>Loading...</div>}>
           <AuthProvider>
              {children}
            </AuthProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}

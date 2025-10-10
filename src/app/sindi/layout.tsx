

import * as React from 'react';
import type {Metadata} from 'next';
import '../globals.css';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { WeddingInfo } from '@/lib/types';
import Head from 'next/head';

async function getWeddingInfoForMeta(): Promise<Partial<WeddingInfo>> {
    try {
        const weddingInfoRef = doc(db, "invitations/sindi/settings", "weddingInfo");
        const weddingInfoSnap = await getDoc(weddingInfoRef);
        if (weddingInfoSnap.exists()) {
            return weddingInfoSnap.data() as Partial<WeddingInfo>;
        }
    } catch (error) {
        console.error("Error fetching wedding info for metadata:", error);
    }
    return {
        brideName: "Mempelai Wanita",
        groomName: "Mempelai Pria",
    };
}


export async function generateMetadata(): Promise<Metadata> {
  const weddingInfo = await getWeddingInfoForMeta();
  return {
    title: `The Wedding of ${weddingInfo.brideName} & ${weddingInfo.groomName}`,
    description: `Kami mengundang Anda untuk merayakan hari bahagia kami.`,
  };
}


export default async function UpdLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <main className="antialiased font-sans">
        <Head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />
        </Head>
        {children}
    </main>
  );
}

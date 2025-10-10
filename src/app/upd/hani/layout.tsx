

import type {Metadata} from 'next';
import '../../globals.css';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { WeddingInfo } from '@/lib/types';
import Head from 'next/head';

async function getWeddingInfo(): Promise<WeddingInfo> {
    try {
        const docRef = doc(db, "upd_settings", "weddingInfo");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            // Return the fetched data, ensuring all fields are present
            const data = docSnap.data() as Partial<WeddingInfo>;
            return {
                brideName: data.brideName || 'Mempelai Wanita',
                groomName: data.groomName || 'Mempelai Pria',
                brideBio: data.brideBio || '',
                groomBio: data.groomBio || '',
                brideStoryUrl: data.brideStoryUrl || '',
                groomStoryUrl: data.groomStoryUrl || '',
                ceremonyDate: data.ceremonyDate || '',
                ceremonyTime: data.ceremonyTime || '',
                ceremonyLocation: data.ceremonyLocation || '',
                ceremonyMapUrl: data.ceremonyMapUrl || '',
                receptionDate: data.receptionDate || '',
                receptionTime: data.receptionTime || '',
                receptionLocation: data.receptionLocation || '',
                receptionMapUrl: data.receptionMapUrl || '',
                isMusicEnabled: data.isMusicEnabled || false,
                backgroundMusicUrl: data.backgroundMusicUrl || '',
                invitedFamilies: data.invitedFamilies || [],
                coverImageUrl: data.coverImageUrl || '',
                storyTimeline: data.storyTimeline || [],
                coverFont: data.coverFont || 'serif',
            };
        }
    } catch (error) {
        console.error("Error fetching wedding info:", error);
    }
    // Return a default structure if fetch fails or doc doesn't exist
    return {
        brideName: "Mempelai",
        groomName: "Pria",
        brideBio: "",
        groomBio: "",
        brideStoryUrl: "",
        groomStoryUrl: "",
        ceremonyDate: "Segera Hadir",
        ceremonyTime: "",
        ceremonyLocation: "",
        ceremonyMapUrl: "",
        receptionDate: "Segera Hadir",
        receptionTime: "",
        receptionLocation: "",
        receptionMapUrl: "",
        isMusicEnabled: false,
        backgroundMusicUrl: "",
        invitedFamilies: [],
        coverImageUrl: "",
        storyTimeline: [],
        coverFont: 'serif',
    };
}

export async function generateMetadata(): Promise<Metadata> {
  const weddingInfo = await getWeddingInfo();
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
        {children}
    </main>
  );
}

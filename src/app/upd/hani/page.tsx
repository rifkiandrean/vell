

// This is a SERVER component. It can be async.
import { Suspense } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WeddingInfo } from '@/lib/types';
import { WeddingInvitationPageContent } from '@/components/upd/WeddingInvitationPageContent';

async function getWeddingInfo(): Promise<WeddingInfo> {
    try {
        const docRef = doc(db, "upd_settings", "weddingInfo");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as Partial<WeddingInfo>;
            return {
                brideName: data.brideName || 'Mempelai Wanita',
                groomName: data.groomName || 'Mempelai Pria',
                brideBio: data.brideBio || '',
                groomBio: data.groomBio || '',
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
    };
}


export default async function WeddingInvitationPage() {
  const weddingInfo = await getWeddingInfo();
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* WeddingInvitationPageContent is a Client Component that receives server-fetched data as props */}
      <WeddingInvitationPageContent initialWeddingInfo={weddingInfo} />
    </Suspense>
  );
}

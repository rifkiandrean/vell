

import type {Metadata} from 'next';
import '../../globals.css';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { WeddingInfo } from '@/lib/types';
import Head from 'next/head';

async function getWeddingInfo(): Promise<WeddingInfo> {
    try {
        const docRef = doc(db, "invitations/type-01/settings", "weddingInfo");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as Partial<WeddingInfo>;
            return {
                brideName: data.brideName || 'Mempelai Wanita',
                groomName: data.groomName || 'Mempelai Pria',
                brideBio: data.brideBio || '',
                groomBio: data.groomBio || '',
                brideCoverPhotoUrl: data.brideCoverPhotoUrl || '',
                groomCoverPhotoUrl: data.groomCoverPhotoUrl || '',
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
                mainBackgroundUrl: data.mainBackgroundUrl || '',
                dividerOrnamentUrl: data.dividerOrnamentUrl || '',
                coverOpeningImageUrl: data.coverOpeningImageUrl || '',
                flowerAsset2Url: data.flowerAsset2Url || '',
                flowerAsset3Url: data.flowerAsset3Url || '',
                flowerAsset4Url: data.flowerAsset4Url || '',
                flowerAsset5Url: data.flowerAsset5Url || '',
                storyTimeline: data.storyTimeline || [],
                coverFont: data.coverFont || 'serif',
                countdownTargetDate: data.countdownTargetDate || '',
                bankName: data.bankName || '',
                accountNumber: data.accountNumber || '',
                accountHolderName: data.accountHolderName || '',
                danaName: data.danaName || '',
                danaNumber: data.danaNumber || '',
                danaQrCodeUrl: data.danaQrCodeUrl || '',
                danaLogoUrl: data.danaLogoUrl || '',
                giftThankYouMessage: data.giftThankYouMessage || 'Terima kasih atas perhatiannya.',
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
        brideCoverPhotoUrl: "",
        groomCoverPhotoUrl: "",
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
        mainBackgroundUrl: "",
        dividerOrnamentUrl: "",
        coverOpeningImageUrl: "",
        flowerAsset2Url: '',
        flowerAsset3Url: '',
        flowerAsset4Url: '',
        flowerAsset5Url: '',
        storyTimeline: [],
        coverFont: 'serif',
        countdownTargetDate: '',
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        danaName: '',
        danaNumber: '',
        danaQrCodeUrl: '',
        danaLogoUrl: '',
        giftThankYouMessage: 'Terima kasih atas perhatiannya.',
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
        <Head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />
        </Head>
        {children}
    </main>
  );
}

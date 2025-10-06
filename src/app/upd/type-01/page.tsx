

import { Suspense } from 'react';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WeddingInfo, Quote } from '@/lib/types';
import { WeddingInvitationPageContent } from '@/components/upd/WeddingInvitationPageContent';

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

async function getQuotes(): Promise<Quote[]> {
    try {
        const q = query(collection(db, "invitations/type-01/quotes"), orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);
        const quotes = querySnapshot.docs.map(doc => {
            const data = doc.data() as Omit<Quote, 'id'>;
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate().toISOString(), // Serialize timestamp
            };
        });
        return quotes;
    } catch (error) {
        console.error("Error fetching quotes:", error);
        return [];
    }
}


export default async function WeddingInvitationPage() {
  const weddingInfo = await getWeddingInfo();
  const quotes = await getQuotes();
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WeddingInvitationPageContent initialWeddingInfo={weddingInfo} initialQuotes={quotes} />
    </Suspense>
  );
}


    
export type StoryTimelineItem = {
    date: string;
    title: string;
    description: string;
};

export type Quote = {
  id: string;
  imageUrl: string;
  text: string;
  createdAt: any;
};

export type WeddingInfo = {
    brideName: string;
    groomName: string;
    brideBio: string;
    groomBio: string;
    brideCoverPhotoUrl?: string;
    groomCoverPhotoUrl?: string;
    brideStoryUrl?: string;
    groomStoryUrl?: string;
    ceremonyDate: string;
    ceremonyTime: string;
    ceremonyLocation: string;
    ceremonyMapUrl: string;
    receptionDate: string;
    receptionTime: string;
    receptionLocation: string;
    receptionMapUrl: string;
    isMusicEnabled?: boolean;
    backgroundMusicUrl?: string;
    invitedFamilies?: string[];
    coverImageUrl?: string;
    mainBackgroundUrl?: string;
    dividerOrnamentUrl?: string;
    coverOpeningImageUrl?: string;
    flowerAsset1Url?: string;
    flowerAsset2Url?: string;
    flowerAsset3Url?: string;
    flowerAsset4Url?: string;
    flowerAsset5Url?: string;
    storyTimeline?: StoryTimelineItem[];
    coverFont?: string;
    countdownTargetDate?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    danaName?: string;
    danaNumber?: string;
    danaQrCodeUrl?: string;
    danaLogoUrl?: string;
    giftThankYouMessage?: string;
};

export type GalleryImage = {
  id: string;
  imageUrl: string;
  createdAt: any;
};

export type ActivityLog = {
    id: string;
    userId: string;
    userName: string;
    action: string;
    timestamp: any; // Firestore Timestamp
    details?: Record<string, any>;
};
    

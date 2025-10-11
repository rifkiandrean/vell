import { Timestamp } from "firebase/firestore";

export type Rsvp = {
  id?: string;
  name: string;
  attending: 'yes' | 'no';
  createdAt?: Timestamp;
};

export type GuestbookMessage = {
  id?: string;
  name: string;
  message: string;
  createdAt?: Timestamp;
  adminReply?: string;
  adminReplierName?: string;
  likes?: string[];
};

export type Photo = {
  id?: string;
  url: string;
  description: string;
  quote?: string;
  createdAt?: Timestamp;
};


export type WeddingDetails = {
    coupleName: string;
    eventDate: string; // Kept for Hero, can be removed if redundant
    eventTime: string; // Kept for Hero, can be removed if redundant
    eventLocation: string; // Kept for Hero, can be removed if redundant
    eventAddress: string; // Kept for Hero, can be removed if redundant
    quote?: string;
    coverMainImageUrl?: string;
    coverBackgroundUrl?: string;
    backgroundUrl?: string;
    loadingGifUrl?: string;
    brideName?: string;
    brideParents?: string;
    brideImageUrl?: string;
    groomName?: string;
    groomParents?: string;
    groomImageUrl?: string;

    // Akad Nikah Details
    akadTitle?: string;
    akadDate?: string;
    akadTime?: string;
    akadLocation?: string;
    akadAddress?: string;
    akadGoogleMapsUrl?: string;

    // Resepsi Details
    resepsiTitle?: string;
    resepsiDate?: string;
    resepsiTime?: string;
    resepsiLocation?: string;
    resepsiAddress?: string;
    resepsiGoogleMapsUrl?: string;
    
    // Countdown Details
    countdownDate?: string;
    countdownTime?: string;

    // Gift Details
    bcaAccountNumber?: string;
    bcaAccountName?: string;
    danaNumber?: string;
    danaName?: string;
    danaQrImageUrl?: string;

    // Flower Frame Details
    flowerFrameUrls?: {
        topLeft?: string[];
        topRight?: string[];
    }
    
    // Separator Flower
    flowerSeparatorUrl?: string;

}

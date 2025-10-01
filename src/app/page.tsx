

// This is a SERVER component. It can be async.
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LandingPageContent, Post as PostType, HeroSlide, PricingPackage } from '@/lib/types';
import { LandingPageClient, type ClientPost } from '@/components/landing/LandingPageClient';


// Function to fetch landing page content from Firestore
async function getLandingPageContent(): Promise<LandingPageContent> {
  try {
    const docRef = doc(db, "settings", "landingPage");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LandingPageContent;
    }
  } catch (error) {
    console.error("Error fetching landing page content:", error);
  }
  // Return default content if fetch fails or doc doesn't exist
  return {};
}

async function getRecentPosts(): Promise<ClientPost[]> {
  try {
    // Simplified query to avoid composite index requirement
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(10) // Fetch a bit more to filter client-side
    );
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostType));
    
    // Filter for published posts client-side and take the first 3
    const publishedPosts = posts.filter(post => post.isPublished).slice(0, 3);
    
    // Serialize the date objects into strings before returning
    return publishedPosts.map(post => ({
        ...post,
        createdAt: post.createdAt.toDate().toISOString(), // Convert Timestamp to ISO string
        updatedAt: post.updatedAt.toDate().toISOString(),
    }));

  } catch (error) {
    console.error("Error fetching recent posts:", error);
    return [];
  }
}

async function getHeroSlides(): Promise<HeroSlide[]> {
    try {
        const q = query(collection(db, "hero_slides"), orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            // Return default slides if Firestore is empty
            return [
                { id: "1", title: "Elektronik Restoran Sistem Modern untuk Bisnis Anda", subtitle: "VELL menyediakan solusi lengkap dari Point-of-Sale (POS), manajemen inventaris, hingga analitik penjualan untuk membawa restoran Anda ke level berikutnya.", imageUrl: "https://picsum.photos/seed/restaurant-system/1200/800", imageHint: "restaurant system", order: 0 },
                { id: "2", title: "Manajemen Kafe Menjadi Mudah", subtitle: "Aplikasi manajemen kafe lengkap dengan pemesanan via QR, sistem kasir, monitor dapur, dan panel admin untuk manajemen stok, menu, serta laporan keuangan.", imageUrl: "https://picsum.photos/seed/badia-kopi/1200/800", imageHint: "coffee shop", order: 1 },
                { id: "3", title: "Undangan Pernikahan Digital Interaktif", subtitle: "Sistem undangan pernikahan digital modern dan interaktif. Fitur termasuk detail acara, galeri foto, cerita cinta, buku tamu digital, dan konfirmasi kehadiran (RSVP).", imageUrl: "https://picsum.photos/seed/wedding-invitation/1200/800", imageHint: "wedding invitation", order: 2 },
            ];
        }
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HeroSlide));
    } catch (error) {
        console.error("Error fetching hero slides:", error);
        return [];
    }
}

async function getPricingPackages(): Promise<PricingPackage[]> {
    try {
        const q = query(collection(db, "pricing_packages"), orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return []; // Return empty if none are configured
        }
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingPackage));
    } catch (error) {
        console.error("Error fetching pricing packages:", error);
        return [];
    }
}


export default async function VellLandingPage() {
  const content = await getLandingPageContent();
  const posts = await getRecentPosts();
  const heroSlides = await getHeroSlides();
  const pricingPackages = await getPricingPackages();
  
  return <LandingPageClient content={content} posts={posts} heroSlides={heroSlides} pricingPackages={pricingPackages} />;
}

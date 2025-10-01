

// This is a SERVER component. It can be async.
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LandingPageContent, Post as PostType } from '@/lib/types';
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
  return {
    brandName: "VELL",
    heroTitle: "Elektronik Restoran Sistem Modern untuk Bisnis Anda",
    heroSubtitle: "VELL menyediakan solusi lengkap dari Point-of-Sale (POS), manajemen inventaris, hingga analitik penjualan untuk membawa restoran Anda ke level berikutnya.",
    heroImageUrl: "https://picsum.photos/seed/restaurant-system/1200/800",
    featuresSubtitle: "Dari pesanan di meja hingga laporan keuangan, sistem kami mencakup setiap aspek operasional restoran Anda.",
    portfolioSubtitle: "Lihat bagaimana kami telah membantu bisnis seperti milik Anda untuk berkembang.",
    portfolioImageUrl1: "https://picsum.photos/seed/badia-kopi/600/400",
    portfolioImageUrl2: "https://picsum.photos/seed/wedding-invitation/600/400",
  };
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

export default async function VellLandingPage() {
  const content = await getLandingPageContent();
  const posts = await getRecentPosts();
  
  return <LandingPageClient content={content} posts={posts} />;
}


import { LandingPageClient, type ClientPost } from '@/components/landing/LandingPageClient';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, orderBy, query, where, limit } from 'firebase/firestore';
import type { LandingPageContent, Post, HeroSlide, PricingPackage } from '@/lib/types';
import { Suspense } from 'react';

// Function to safely convert Firestore Timestamps to strings
const serializePost = (post: Post): ClientPost => ({
  ...post,
  createdAt: post.createdAt?.toDate().toISOString() || new Date().toISOString(),
  updatedAt: post.updatedAt?.toDate().toISOString() || new Date().toISOString(),
});


async function getLandingPageData() {
    try {
        const contentRef = doc(db, "settings", "landingPage");
        const postsQuery = query(collection(db, "posts"), where("isPublished", "==", true), orderBy("createdAt", "desc"), limit(5));
        const slidesQuery = query(collection(db, "hero_slides"), orderBy("order", "asc"));
        const packagesQuery = query(collection(db, "pricing_packages"), orderBy("order", "asc"));


        const [contentSnap, postsSnap, slidesSnap, packagesSnap] = await Promise.all([
            getDoc(contentRef),
            getDocs(postsQuery),
            getDocs(slidesQuery),
            getDocs(packagesQuery),
        ]);

        const content = contentSnap.exists() ? contentSnap.data() as LandingPageContent : {} as LandingPageContent;
        const posts = postsSnap.docs.map(doc => serializePost({ id: doc.id, ...doc.data() } as Post));
        const heroSlides = slidesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HeroSlide));
        const pricingPackages = packagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingPackage));

        return { content, posts, heroSlides, pricingPackages };
    } catch (error) {
        console.error("Failed to fetch landing page data:", error);
        return { content: {} as LandingPageContent, posts: [], heroSlides: [], pricingPackages: [] };
    }
}

export default async function LandingPage() {
  const { content, posts, heroSlides, pricingPackages } = await getLandingPageData();

  return (
     <Suspense fallback={<div>Loading...</div>}>
      <LandingPageClient content={content} posts={posts} heroSlides={heroSlides} pricingPackages={pricingPackages} />
    </Suspense>
  );
}

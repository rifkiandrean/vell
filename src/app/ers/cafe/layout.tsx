

import type {Metadata} from 'next';
import '../../globals.css';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { CompanyInfo } from '@/lib/types';
import { CafeFooter } from '@/components/CafeFooter';


async function getCompanyInfo(): Promise<CompanyInfo> {
    try {
        const docRef = doc(db, "settings", "companyInfo");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return (docSnap.data() as CompanyInfo) || { companyName: 'BADIA KOPI' };
        }
        return { companyName: 'BADIA KOPI' };
    } catch (error) {
        console.error("Error fetching company name:", error);
        return { companyName: 'BADIA KOPI' };
    }
}

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCompanyInfo();
  return {
    title: `${companyInfo.companyName} - Elektronik Restoran Sistem`,
    description: `Pesan kopi favoritmu di ${companyInfo.companyName}`,
  };
}

export default async function CafeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {children}
      </main>
      <CafeFooter />
    </div>
  );
}

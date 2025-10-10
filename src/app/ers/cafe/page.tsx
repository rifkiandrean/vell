
'use client';

import { MenuDisplay } from '@/components/menu/MenuDisplay';
import { db } from '@/lib/firebase';
import type { ShopStatus } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { Suspense, useEffect, useState } from 'react';
import { OrderProvider } from '@/context/OrderContext';

function ClientMenuDisplay({ shopStatus }: { shopStatus: ShopStatus | null }) {
  return (
    <OrderProvider>
      <MenuDisplay shopStatus={shopStatus} />
    </OrderProvider>
  );
}

async function getShopStatus() {
    try {
        const statusRef = doc(db, "settings", "shopStatus");
        const statusSnap = await getDoc(statusRef);
        return statusSnap.exists() ? (statusSnap.data() as ShopStatus) : { isOpen: true, schedule: {} } as ShopStatus;
    } catch (error) {
        console.error("Error fetching shop status:", error);
        return { isOpen: true, schedule: {} } as ShopStatus;
    }
}

export default function CafePage() {
  const [shopStatus, setShopStatus] = useState<ShopStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShopStatus().then(status => {
      setShopStatus(status);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientMenuDisplay shopStatus={shopStatus} />
    </Suspense>
  );
}

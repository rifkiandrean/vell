
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { KitchenDisplay } from '@/components/kitchen/KitchenDisplay';
import { withAuth } from '@/context/AuthContext';

function KitchenPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader showKitchenLink={false} />
      <main className="container mx-auto px-4 py-8">
        <KitchenDisplay />
      </main>
    </div>
  );
}

export default withAuth(KitchenPage);

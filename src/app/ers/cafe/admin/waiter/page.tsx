
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { WaiterDisplay } from '@/components/waiter/WaiterDisplay';
import { withAuth } from '@/context/AuthContext';

function WaiterPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <WaiterDisplay />
      </main>
    </div>
  );
}

export default withAuth(WaiterPage);

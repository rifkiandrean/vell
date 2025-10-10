
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { withAuth } from '@/context/AuthContext';

function OrdersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Manajemen Purchase Order" />
      <main className="container mx-auto px-4 py-8">
        <OrderManagement />
      </main>
    </div>
  );
}

export default withAuth(OrdersPage);

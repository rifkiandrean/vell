
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { withAuth } from '@/context/AuthContext';

function OrdersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Manajemen Purchase Order</h2>
        <OrderManagement />
      </main>
    </div>
  );
}

export default withAuth(OrdersPage);

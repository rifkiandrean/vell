
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { InventoryManagement } from '@/components/admin/InventoryManagement';
import { withAuth } from '@/context/AuthContext';

function InventoryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Manajemen Gudang</h2>
        <InventoryManagement />
      </main>
    </div>
  );
}

export default withAuth(InventoryPage);

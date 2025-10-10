
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { InventoryManagement } from '@/components/admin/InventoryManagement';
import { withAuth } from '@/context/AuthContext';

function InventoryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Manajemen Gudang" />
      <main className="container mx-auto px-4 py-8">
        <InventoryManagement />
      </main>
    </div>
  );
}

export default withAuth(InventoryPage);

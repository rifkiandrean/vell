
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { VendorManagement } from '@/components/admin/VendorManagement';
import { withAuth } from '@/context/AuthContext';

function VendorsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Manajemen Vendor</h2>
        <VendorManagement />
      </main>
    </div>
  );
}

export default withAuth(VendorsPage);

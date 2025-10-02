
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { VendorManagement } from '@/components/admin/VendorManagement';
import { withAuth } from '@/context/AuthContext';

function VendorsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Manajemen Vendor" />
      <main className="container mx-auto px-4 py-8">
        <VendorManagement />
      </main>
    </div>
  );
}

export default withAuth(VendorsPage);

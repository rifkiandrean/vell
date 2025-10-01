
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { VendorPaymentDisplay } from '@/components/admin/finance/VendorPaymentDisplay';
import { withAuth } from '@/context/AuthContext';

function VendorPaymentsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Pembayaran Vendor</h2>
        <VendorPaymentDisplay />
      </main>
    </div>
  );
}

export default withAuth(VendorPaymentsPage);

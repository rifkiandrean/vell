
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AccountingDisplay } from '@/components/accounting/AccountingDisplay';
import { withAuth } from '@/context/AuthContext';

function AccountingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Riwayat Pesanan" showAccountingLink={false} />
      <main className="container mx-auto px-4 py-8">
        <AccountingDisplay />
      </main>
    </div>
  );
}

export default withAuth(AccountingPage);

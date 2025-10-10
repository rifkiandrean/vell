
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AuditDisplay } from '@/components/admin/AuditDisplay';
import { withAuth } from '@/context/AuthContext';

function AuditPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Audit Keuangan" />
      <main className="container mx-auto px-4 py-8">
        <AuditDisplay />
      </main>
    </div>
  );
}

export default withAuth(AuditPage);

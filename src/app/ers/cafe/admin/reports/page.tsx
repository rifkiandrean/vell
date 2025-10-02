
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ReportsDisplay } from '@/components/admin/ReportsDisplay';
import { withAuth } from '@/context/AuthContext';

function ReportsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Laporan Keuangan" />
      <main className="container mx-auto px-4 py-8">
        <ReportsDisplay />
      </main>
    </div>
  );
}

export default withAuth(ReportsPage);

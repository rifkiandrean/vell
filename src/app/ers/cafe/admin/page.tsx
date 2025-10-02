
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { DashboardDisplay } from '@/components/admin/DashboardDisplay';
import { withAuth } from '@/context/AuthContext';

function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Dashboard" />
      <main className="container mx-auto px-4 py-8">
        <DashboardDisplay />
      </main>
    </div>
  );
}

export default withAuth(AdminDashboardPage);


"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { SettingsManagement } from '@/components/admin/SettingsManagement';
import { withAuth } from '@/context/AuthContext';

function SettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Pengaturan Website</h2>
        <SettingsManagement />
      </main>
    </div>
  );
}

export default withAuth(SettingsPage);

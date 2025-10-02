
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { SettingsManagement } from '@/components/admin/SettingsManagement';
import { withAuth } from '@/context/AuthContext';

function SettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Pengaturan Kafe" />
      <main className="container mx-auto px-4 py-8">
        <SettingsManagement />
      </main>
    </div>
  );
}

export default withAuth(SettingsPage);


"use client";

import { ErsAdminHeader } from '@/components/admin/ErsAdminHeader';
import { LandingPageSettings } from '@/components/admin/LandingPageSettings';
import { withAuth } from '@/context/AuthContext';

function LandingPageSettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErsAdminHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Pengaturan Landing Page</h2>
          <LandingPageSettings />
        </div>
      </main>
    </div>
  );
}

export default withAuth(LandingPageSettingsPage);

    
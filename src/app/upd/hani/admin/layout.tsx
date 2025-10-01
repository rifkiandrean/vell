'use client';

import type { Metadata } from 'next';
import '../../../globals.css';
import { withAuth } from '@/context/AuthContext';

// Metadata object cannot be used in a client component.
// We will manage the title from the page component if needed.
/*
export const metadata: Metadata = {
  title: 'Admin Dasbor | The Wedding of Anya & Loid',
  description: 'Kelola buku tamu, moderasi, dan pengaturan untuk undangan pernikahan Anda.',
};
*/

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="antialiased font-sans">
      {children}
    </main>
  );
}

export default withAuth(AdminLayout);

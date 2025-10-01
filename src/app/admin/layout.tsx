
import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'VELL ERS Admin',
  description: 'Pengaturan sistem umum untuk Elektronik Restoran Sistem.',
};

export default function ErsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
        {children}
    </div>
  );
}

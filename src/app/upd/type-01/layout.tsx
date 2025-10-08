import type { Metadata } from 'next';
import '../globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Daftar Undangan | VELL',
  description: 'Daftar semua undangan digital yang telah dibuat.',
};

export default function UpdRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider companyName="UPDT">
      <main className="antialiased font-sans">
        {children}
      </main>
    </AuthProvider>
  );
}

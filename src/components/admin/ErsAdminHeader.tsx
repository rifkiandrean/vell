
"use client";

import Link from 'next/link';
import { Button } from '../ui/button';
import { LogOut, User, Lock, Settings, Newspaper } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '../ui/dropdown-menu';
import Image from 'next/image';
import { logActivity } from '@/lib/activity-log';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ProfileManagement } from './ProfileManagement';
import { Mountain } from 'lucide-react';


export function ErsAdminHeader() {
  const { user, logout, vellLogoUrl, websiteVersion, transformGoogleDriveUrl } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (user) {
      logActivity(user, 'Logout dari sistem ERS.');
    }
    await logout();
    router.push('/admin/login');
  };
  
  const logoUrl = vellLogoUrl ? transformGoogleDriveUrl(vellLogoUrl) : null;

  return (
    <Dialog>
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="flex items-center gap-2 ml-2">
              {logoUrl && (
                  <Image src={logoUrl} alt="VELL logo" width={32} height={32} className="h-8 w-8 object-contain" />
              )}
              <div className="flex items-baseline gap-2">
                  <h1 className="text-2xl font-bold tracking-tighter text-black">VELL</h1>
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-1 md:gap-2">
            <Link href="/admin/posts" passHref>
                <Button variant="outline" size="icon">
                    <Newspaper className="h-4 w-4" />
                    <span className="sr-only">Posts</span>
                </Button>
            </Link>
            <Link href="/admin" passHref>
                <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Landing Page Settings</span>
                </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                  <span className="sr-only">Profil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Profil Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-semibold">{user?.displayName || 'Nama Pengguna'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'email@pengguna.com'}</p>
                </div>
                <DropdownMenuSeparator />
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Lock className="mr-2 h-4 w-4" />
                    <span>Ubah Password</span>
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleLogout} variant="outline" size="icon">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </nav>
        </div>
      </header>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ubah Password</DialogTitle>
          <DialogDescription>
            Ubah password Anda secara berkala untuk menjaga keamanan akun. Anda akan otomatis logout setelah berhasil.
          </DialogDescription>
        </DialogHeader>
        <ProfileManagement />
      </DialogContent>
    </Dialog>
  );
}

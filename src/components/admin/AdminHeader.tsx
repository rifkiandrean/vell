

import Link from 'next/link';
import { Button } from '../ui/button';
import { Home, Utensils, BookUser, Archive, Calculator, BarChart3, Receipt, LayoutDashboard, LogOut, CircleDollarSign, MoreHorizontal, ShoppingCart, Users, Settings, HandPlatter, FileSearch, User, Lock, ChevronDown, Banknote, CreditCard, Menu, MessageSquare, Presentation, Coffee } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '../ui/dropdown-menu';
import Image from 'next/image';
import { logActivity } from '@/lib/activity-log';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ProfileManagement } from './ProfileManagement';

interface AdminHeaderProps {
  title?: string;
  showKitchenLink?: boolean;
  showAccountingLink?: boolean;
  showInventoryLink?: boolean;
  showFoodCostLink?: boolean;
  showCashierLink?: boolean;
  showCashierName?: boolean;
}

export function AdminHeader({ title, showKitchenLink = true, showAccountingLink = true, showInventoryLink = true, showFoodCostLink = true, showCashierLink = true, showCashierName = false }: AdminHeaderProps) {
  const { user, logout, ersLogoUrl, companyName, websiteVersion } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (user) {
      logActivity(user, 'Logout dari sistem.');
    }
    await logout();
    router.push('/ers/cafe/admin/login');
  };
  
  const cashierName = user?.displayName || user?.email;

  return (
    <Dialog>
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ers/cafe/admin" className="flex items-center gap-2 ml-2">
              {ersLogoUrl && (
                  <Image src={ersLogoUrl} alt="ERS logo" width={32} height={32} className="h-8 w-8 object-contain" />
              )}
              <div className="flex items-baseline gap-2">
                  <h1 className="text-2xl font-bold tracking-tighter">ERS</h1>
                  {websiteVersion && (
                     <span className="text-xs italic text-muted-foreground">{websiteVersion}</span>
                  )}
              </div>
            </Link>
            {title && (
              <div className="hidden md:flex items-center gap-2">
                <div className="h-6 w-[1px] bg-border" />
                <h2 className="text-lg font-semibold text-muted-foreground">{title}</h2>
              </div>
            )}
          </div>

          {showCashierName && cashierName && (
              <div className="hidden lg:flex flex-1 justify-center">
                  <div className="text-sm font-semibold text-muted-foreground">
                      Kasir: <span className="font-bold text-primary">{cashierName}</span>
                  </div>
              </div>
          )}

          <nav className="flex items-center gap-1 md:gap-2">
            {showCashierLink && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden sm:inline-flex">
                    <CircleDollarSign className="mr-2 h-4 w-4" />
                    Kasir
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                   <DropdownMenuItem asChild>
                      <Link href="/ers/cafe/admin/cashier" className="flex items-center">
                          <CircleDollarSign className="mr-2 h-4 w-4" />
                          Halaman Kasir
                      </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href="/ers/cafe/admin/menu" className="flex items-center">
                          <Menu className="mr-2 h-4 w-4" />
                          Menu
                      </Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                      <Link href="/ers/cafe/admin/audit" className="flex items-center">
                        <FileSearch className="mr-2 h-4 w-4" />
                        Audit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/ers/cafe/admin/reports" className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Laporan
                      </Link>
                    </DropdownMenuItem>
                    {showAccountingLink && (
                      <DropdownMenuItem asChild>
                          <Link href="/ers/cafe/admin/accounting" className="flex items-center">
                              <BookUser className="mr-2 h-4 w-4" />
                              Riwayat
                          </Link>
                      </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
             {showInventoryLink && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden md:inline-flex">
                    <Archive className="mr-2 h-4 w-4" />
                    Gudang
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                   <DropdownMenuItem asChild>
                      <Link href="/ers/cafe/admin/inventory" className="flex items-center">
                          <Archive className="mr-2 h-4 w-4" />
                          Stok Barang
                      </Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                      <Link href="/ers/cafe/admin/orders" className="flex items-center">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Order Barang
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/ers/cafe/admin/vendors" className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Vendor
                      </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden lg:inline-flex">
                  <Banknote className="mr-2 h-4 w-4" />
                  Keuangan
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/ers/cafe/admin/expenses" className="flex items-center">
                      <Receipt className="mr-2 h-4 w-4" />
                      Beban
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/ers/cafe/admin/finance/vendor-payments" className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pembayaran Vendor
                    </Link>
                  </DropdownMenuItem>
                  {showFoodCostLink && (
                    <DropdownMenuItem asChild>
                      <Link href="/ers/cafe/admin/food-cost" className="flex items-center">
                        <Calculator className="mr-2 h-4 w-4" />
                        Analisis Food Cost
                      </Link>
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden lg:inline-flex">
                    Penyaji
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                   <DropdownMenuItem asChild>
                      <Link href="/ers/cafe/admin/barista" className="flex items-center">
                        <Coffee className="mr-2 h-4 w-4" />
                        Barista
                      </Link>
                    </DropdownMenuItem>
                  {showKitchenLink && (
                    <DropdownMenuItem asChild>
                      <Link href="/ers/cafe/admin/kitchen" className="flex items-center">
                        <Utensils className="mr-2 h-4 w-4" />
                        Dapur
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/ers/cafe/admin/waiter" className="flex items-center">
                      <HandPlatter className="mr-2 h-4 w-4" />
                      Pelayan
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Pengaturan</span>
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/ers/cafe/admin/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Pengaturan Kafe</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Presentation className="mr-2 h-4 w-4" />
                      <span>Pengaturan Landing Page</span>
                    </Link>
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>

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

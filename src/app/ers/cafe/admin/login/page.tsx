
"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { logActivity } from '@/lib/activity-log';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user, companyName, logoUrl, ersLogoUrl } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await login(email, password);
      logActivity(userCredential.user, 'Login ke sistem.');
      router.push('/ers/cafe/admin');
    } catch (error) {
      console.error(error);
      toast({
        title: "Login Gagal",
        description: "Email atau password yang Anda masukkan salah. Silakan coba lagi.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md">
           <div className="flex flex-col items-center justify-center mb-6">
              {logoUrl ? (
                  <Image src={logoUrl} alt={`${companyName} logo`} width={40} height={40} className="h-10 w-10 object-contain" />
                ) : (
                  <Icons.Coffee className="h-10 w-10 text-primary" />
              )}
              <h1 className="text-3xl font-bold tracking-tight text-primary mt-2">
                {companyName}
              </h1>
              <p className="text-muted-foreground">Admin Login</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Masukkan kredensial Anda untuk mengakses panel admin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Memproses...' : 'Login'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="py-4 px-4 text-center text-xs text-muted-foreground">
        <div className="flex flex-col items-center justify-center gap-1">
          {ersLogoUrl && (
             <Image src={ersLogoUrl} alt="VELL Logo" width={24} height={24} className="h-6 w-6 object-contain" />
          )}
          <span>Copyright © VELL</span>
          <span>Sistem Restoran Elektronik</span>
        </div>
      </footer>
    </div>
  );
}

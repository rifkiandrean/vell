

"use client";

import { useState, useEffect } from 'react';
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

export default function ErsLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user, ersLogoUrl, websiteVersion } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showVellLogo, setShowVellLogo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVellLogo(true);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await login(email, password);
      logActivity(userCredential.user, 'Login ke sistem ERS.');
      router.push('/admin');
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
              {showVellLogo && ersLogoUrl && (
                  <Image src={ersLogoUrl} alt={`VELL logo`} width={40} height={40} className="h-10 w-10 object-contain" />
              )}
              <h1 className="text-3xl font-bold tracking-tight text-primary mt-2">
                VELL
              </h1>
              <p className="text-muted-foreground">Admin Login</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Login Super Admin</CardTitle>
              <CardDescription>Masukkan kredensial Anda untuk mengakses panel admin sistem.</CardDescription>
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
          <span>Copyright 2025 © VELL</span>
          <span>DIGITAL SISTEM INFORMASI</span>
        </div>
      </footer>
    </div>
  );
}

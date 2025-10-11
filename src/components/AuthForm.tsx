'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useAuth, useUser, initiateEmailSignUp, initiateEmailSignIn } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AuthForm({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    // If a user is successfully authenticated and the onLoginSuccess callback is provided,
    // and we are not in the middle of a form submission, call the callback.
    if (user && !isUserLoading && onLoginSuccess && !isSubmitting) {
      onLoginSuccess();
    }
  }, [user, isUserLoading, onLoginSuccess, isSubmitting]);

  const handleAuthAction = async (action: 'login' | 'register', e: FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({ title: 'Error', description: 'Firebase not initialized.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (action === 'register') {
        await initiateEmailSignUp(auth, email, password);
        toast({ title: 'Registration Sent', description: 'Please check your email to verify your account.' });
        setActiveTab('login');
      } else {
        await initiateEmailSignIn(auth, email, password);
        // Do not call onLoginSuccess here directly.
        // The useEffect hook will handle it when the user state updates.
        toast({ title: 'Login Successful', description: 'Redirecting you now.' });
      }
    } catch (error: any) {
      toast({ title: 'Authentication Error', description: error.message, variant: 'destructive' });
    } finally {
      // It's important to set isSubmitting to false after a delay
      // to allow the auth state to propagate and the useEffect to run.
      // If we set it immediately, the onLoginSuccess might be called before the user object is updated.
      // A small delay is a pragmatic way to handle this.
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  return (
     <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="register">Daftar</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl font-headline">Masuk</CardTitle>
                    <CardDescription>Akses dasbor undangan Anda.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => handleAuthAction('login', e)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input id="login-email" type="email" placeholder="email@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Memproses...' : 'Masuk'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="register">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl font-headline">Daftar Sekarang</CardTitle>
                    <CardDescription>Buat akun untuk memulai undangan pernikahan impian Anda.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => handleAuthAction('register', e)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input id="name" placeholder="Nama Anda" required value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="register-email">Email</Label>
                            <Input id="register-email" type="email" placeholder="email@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="register-password">Password</Label>
                            <Input id="register-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Memproses...' : 'Buat Akun'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  )
}
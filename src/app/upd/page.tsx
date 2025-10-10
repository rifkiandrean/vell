
'use client';

import { useAuth, withAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { List, Lock, PlusCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, getDoc } from 'firebase/firestore';
import type { WeddingInfo } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getFunctions, httpsCallable } from 'firebase/functions';


const allowedEmail = 'rifkiandrean@gmail.com';

interface Invitation {
  id: string;
  title: string;
  brideName: string;
  groomName: string;
}

function CreateInvitationForm({ onInvitationCreated }: { onInvitationCreated: () => void }) {
    const { toast } = useToast();
    const [newInvitationId, setNewInvitationId] = useState('');
    const [sourceInvitationId, setSourceInvitationId] = useState('hani'); // Default to 'hani'
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateInvitation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newInvitationId.match(/^[a-z0-9-]+$/)) {
            toast({
                title: "ID Tidak Valid",
                description: "ID undangan hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).",
                variant: "destructive",
            });
            return;
        }
        
        setIsLoading(true);
        try {
            const functions = getFunctions();
            const duplicateInvitation = httpsCallable(functions, 'duplicateInvitation');
            const result = await duplicateInvitation({ newInvitationId, sourceInvitationId });
            
            toast({
                title: "Undangan Dibuat!",
                description: (result.data as any).message || `Undangan baru dengan ID '${newInvitationId}' telah berhasil dibuat.`,
            });
            onInvitationCreated();
        } catch (error: any) {
            console.error("Gagal membuat undangan:", error);
            toast({
                title: "Gagal Membuat Undangan",
                description: error.message || "Terjadi kesalahan di server.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleCreateInvitation} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="newId">ID Undangan Baru</Label>
                <Input 
                    id="newId"
                    placeholder="cth., budi-dan-siti"
                    value={newInvitationId}
                    onChange={(e) => setNewInvitationId(e.target.value)}
                    required
                />
                <p className="text-sm text-muted-foreground">Ini akan menjadi bagian dari URL. Gunakan huruf kecil, angka, dan tanda hubung.</p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="sourceId">Salin Dari Undangan</Label>
                 <Input id="sourceId" value={sourceInvitationId} disabled />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                <Copy className="mr-2 h-4 w-4" />
                {isLoading ? 'Membuat Undangan...' : 'Buat Undangan'}
            </Button>
        </form>
    )

}

function UpdListPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  useEffect(() => {
    // Listener for the 'invitations' collection
    const unsub = onSnapshot(collection(db, "invitations"), async (snapshot) => {
        if (snapshot.empty) {
            setInvitations([]);
            return;
        }

        const promises = snapshot.docs.map(async (invitationDoc) => {
            const invitationId = invitationDoc.id;
            const settingsRef = doc(db, `invitations/${invitationId}/upd_settings`, 'weddingInfo');
            
            try {
                const settingsSnap = await getDoc(settingsRef);

                let brideName = 'Mempelai Wanita';
                let groomName = 'Mempelai Pria';

                if (settingsSnap.exists()) {
                    const info = settingsSnap.data() as WeddingInfo;
                    brideName = info.brideName || brideName;
                    groomName = info.groomName || groomName;
                }

                return {
                    id: invitationId,
                    title: `The Wedding of ${brideName} & ${groomName}`,
                    brideName,
                    groomName,
                };
            } catch (error) {
                console.error(`Gagal mengambil pengaturan untuk undangan ${invitationId}:`, error);
                return null;
            }
        });

        // Wait for all details to be fetched before updating the state
        const fetchedInvitations = (await Promise.all(promises)).filter(Boolean) as Invitation[];
        setInvitations(fetchedInvitations);
    });

    // Cleanup listener on component unmount
    return () => unsub();
  }, []);


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Memverifikasi akses...</p>
      </div>
    );
  }

  if (user?.email !== allowedEmail) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                <Lock className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="mt-4">Akses Ditolak</CardTitle>
            <CardDescription>
              Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini hanya untuk administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-lg">
            <CardHeader>
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        <List />
                        Daftar Undangan Digital
                    </CardTitle>
                    <CardDescription>
                        Berikut adalah daftar semua undangan yang telah dibuat.
                    </CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah
                    </Button>
                </DialogTrigger>
            </div>
            </CardHeader>
            <CardContent>
            {invitations.length > 0 ? (
                <ul className="space-y-3">
                    {invitations.map((invite) => (
                    <li key={invite.id}>
                        <Link href={`/upd/${invite.id}`} passHref>
                        <div className="block rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent">
                            <p className="font-semibold">{invite.title}</p>
                            <p className="text-sm text-muted-foreground">/upd/{invite.id}</p>
                        </div>
                        </Link>
                    </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-muted-foreground py-4">Belum ada undangan yang dibuat.</p>
            )}
            </CardContent>
        </Card>
        </div>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Buat Undangan Baru</DialogTitle>
                <DialogDescription>
                    Buat salinan baru dari template undangan yang sudah ada.
                </DialogDescription>
            </DialogHeader>
            <CreateInvitationForm onInvitationCreated={() => setIsFormOpen(false)} />
        </DialogContent>
    </Dialog>
  );
}

export default withAuth(UpdListPage);

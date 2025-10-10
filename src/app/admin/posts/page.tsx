

"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { Post } from '@/lib/types';
import { ErsAdminHeader } from '@/components/admin/ErsAdminHeader';
import { withAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Edit, Trash2, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';

function PostsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data post:", error);
      toast({ title: "Error", description: "Gagal memuat data post.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleCreateNew = () => {
    router.push('/admin/posts/new');
  };

  const handleEdit = (postId: string) => {
    router.push(`/admin/posts/${postId}`);
  };

  const handleView = (slug: string) => {
    window.open(`/posts/${slug}`, '_blank');
  };

  const handleDelete = async (postId: string, postTitle: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      logActivity(user, `Menghapus post: ${postTitle}`);
      toast({ title: "Sukses!", description: `Post "${postTitle}" telah dihapus.` });
    } catch (error) {
      console.error("Gagal menghapus post:", error);
      toast({ title: "Error", description: "Gagal menghapus post.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErsAdminHeader title="Manajemen Post" />
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight">Manajemen Post</CardTitle>
              <CardDescription>Buat, edit, dan kelola semua post dan berita di sini.</CardDescription>
            </div>
            <Button onClick={handleCreateNew}>Buat Post Baru</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">Memuat data post...</TableCell></TableRow>
                ) : posts.length > 0 ? (
                  posts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>
                        <Badge variant={post.isPublished ? "default" : "secondary"}>
                          {post.isPublished ? "Dipublikasikan" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {post.createdAt ? format(post.createdAt.toDate(), 'd MMM yyyy', { locale: id }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(post.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleView(post.slug)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini akan menghapus post "{post.title}" secara permanen dan tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(post.id, post.title)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">Belum ada post. Klik "Buat Post Baru" untuk memulai.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default withAuth(PostsPage);

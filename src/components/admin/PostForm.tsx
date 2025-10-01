
"use client";

import { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { Post } from "@/lib/types";
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const postSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi."),
  content: z.string().min(1, "Konten wajib diisi."),
  imageUrl: z.string().url("URL gambar tidak valid.").or(z.literal('')),
  isPublished: z.boolean().default(false),
});

type PostFormValues = z.infer<typeof postSchema>;

interface PostFormProps {
  postId?: string;
}

// Function to create a URL-friendly slug from a title
const createSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
};

export function PostForm({ postId }: PostFormProps) {
  const isEditMode = !!postId;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      imageUrl: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (isEditMode && postId) {
      const fetchPost = async () => {
        const docRef = doc(db, "posts", postId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const postData = docSnap.data() as Post;
          form.reset({
            title: postData.title,
            content: postData.content,
            imageUrl: postData.imageUrl,
            isPublished: postData.isPublished,
          });
        } else {
          toast({ title: "Error", description: "Post tidak ditemukan.", variant: "destructive" });
          router.push('/admin/posts');
        }
      };
      fetchPost();
    }
  }, [postId, isEditMode, form, toast, router]);

  const onSubmit = async (data: PostFormValues) => {
    try {
      const slug = createSlug(data.title);
      const postData = {
        ...data,
        slug,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode && postId) {
        const docRef = doc(db, "posts", postId);
        await setDoc(docRef, postData, { merge: true });
        logActivity(user, `Memperbarui post: ${data.title}`);
        toast({ title: "Sukses!", description: "Post telah diperbarui." });
      } else {
        const docRef = await addDoc(collection(db, "posts"), {
          ...postData,
          createdAt: serverTimestamp(),
        });
        logActivity(user, `Membuat post baru: ${data.title}`);
        toast({ title: "Sukses!", description: "Post baru telah dibuat." });
      }
      router.push('/admin/posts');
    } catch (error) {
      console.error("Gagal menyimpan post:", error);
      toast({ title: "Error", description: "Gagal menyimpan post.", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Post" : "Buat Post Baru"}</CardTitle>
            <CardDescription>{isEditMode ? "Ubah detail post di bawah ini." : "Isi form untuk membuat post baru."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Post</FormLabel>
                  <FormControl>
                    <Input placeholder="Judul yang menarik..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konten</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tuliskan isi post di sini..." rows={15} {...field} />
                  </FormControl>
                   <FormDescription>Anda dapat menggunakan format Markdown untuk styling.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Gambar Utama</FormLabel>
                  <FormControl>
                    <Input placeholder="https://images.unsplash.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publikasikan</FormLabel>
                    <FormDescription>
                      Jika aktif, post akan langsung terlihat oleh publik.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/posts')}>
              Batal
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Buat Post"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

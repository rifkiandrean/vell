
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Post } from '@/lib/types';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

async function getPostBySlug(slug: string): Promise<Post | null> {
  const q = query(collection(db, "posts"), where("slug", "==", slug), where("isPublished", "==", true));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Post;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return {
      title: 'Post Tidak Ditemukan',
    };
  }
  return {
    title: post.title,
    description: post.content.substring(0, 160),
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto py-12">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">{post.title}</h1>
        <p className="text-muted-foreground text-lg">
          Dipublikasikan pada {post.createdAt ? format(post.createdAt.toDate(), 'd MMMM yyyy', { locale: id }) : 'N/A'}
        </p>
      </header>

      {post.imageUrl && (
        <div className="relative h-96 w-full rounded-xl overflow-hidden mb-8 shadow-lg">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div
        className="prose prose-lg dark:prose-invert mx-auto"
        dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
      />
    </article>
  );
}

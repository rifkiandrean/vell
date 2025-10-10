

"use client";

import { ErsAdminHeader } from '@/components/admin/ErsAdminHeader';
import { PostForm } from '@/components/admin/PostForm';
import { withAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';

function EditPostPage() {
  const params = useParams();
  const { id } = params;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErsAdminHeader title="Edit Post" />
      <main className="container mx-auto px-4 py-8">
        <PostForm postId={id as string} />
      </main>
    </div>
  );
}

export default withAuth(EditPostPage);



"use client";

import { ErsAdminHeader } from '@/components/admin/ErsAdminHeader';
import { PostForm } from '@/components/admin/PostForm';
import { withAuth } from '@/context/AuthContext';

function NewPostPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErsAdminHeader title="Buat Post Baru" />
      <main className="container mx-auto px-4 py-8">
        <PostForm />
      </main>
    </div>
  );
}

export default withAuth(NewPostPage);

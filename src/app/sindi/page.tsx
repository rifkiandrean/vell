

import { Suspense } from 'react';
import type { WeddingInfo, Quote } from '@/lib/types';
import { WeddingInvitationPageContent } from '@/components/upd/WeddingInvitationPageContent';

// This page now simply renders the client component.
// Data fetching is handled inside WeddingInvitationPageContent.
export default function WeddingInvitationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WeddingInvitationPageContent />
    </Suspense>
  );
}

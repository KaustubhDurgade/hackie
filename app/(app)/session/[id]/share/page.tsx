'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

// Legacy share URLs (/session/[id]/share) redirect to /share/[shareToken].
// This avoids exposing the session UUID in share links.
export default function LegacySharePage({ params }: SharePageProps) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // We can't look up the shareToken without auth here, so just show a message
    // directing users to use the proper share link from inside the session.
    // In practice, existing share links constructed before this fix may land here.
    router.replace(`/session/${id}`);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
      <p className="text-[#a8a29e] text-xs uppercase tracking-widest animate-pulse">redirecting...</p>
    </div>
  );
}

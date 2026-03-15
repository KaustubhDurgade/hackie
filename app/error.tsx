'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('[GlobalError]', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1c1917]">
      <nav className="border-b border-[#e2ddd6] bg-white px-8 py-4">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight hover:opacity-70 transition-opacity">
          hackie
        </Link>
      </nav>
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-8">
        <p className="font-display text-[#c8c1b8] text-xs tracking-widest uppercase mb-4">error</p>
        <h1 className="font-serif text-4xl font-bold text-[#1c1917] mb-3">Something went wrong.</h1>
        <p className="text-[#6b6560] text-sm mb-8 max-w-sm">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="bg-[#1c1917] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#3a3530] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-[#e2ddd6] text-[#6b6560] text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#f5f3ef] transition-colors"
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-[10px] text-[#c8c1b8] uppercase tracking-widest font-mono">
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

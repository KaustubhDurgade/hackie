'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AppError]', error.digest ?? error.message);
  }, [error]);

  // Detect specific failure types for a more helpful message
  const isAiError   = error.message?.toLowerCase().includes('groq') ||
                      error.message?.toLowerCase().includes('anthropic') ||
                      error.message?.toLowerCase().includes('llm') ||
                      error.message?.toLowerCase().includes('stream');
  const isDbError   = error.message?.toLowerCase().includes('prisma') ||
                      error.message?.toLowerCase().includes('database') ||
                      error.message?.toLowerCase().includes('connection');
  const isAuthError = error.message?.toLowerCase().includes('unauthorized') ||
                      error.message?.toLowerCase().includes('auth');

  const heading = isAiError   ? 'AI unavailable.'
                : isDbError   ? 'Database unavailable.'
                : isAuthError ? 'Not authorised.'
                : 'Something went wrong.';

  const body = isAiError
    ? "The AI service isn't responding right now. Please try again in a moment."
    : isDbError
    ? "We can't reach the database right now. Your work is safe — please try again shortly."
    : isAuthError
    ? "You don't have permission to view this page."
    : 'An unexpected error occurred. Try again or go back to the dashboard.';

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1c1917] flex flex-col items-center justify-center text-center px-8">
      <p className="font-display text-[#c8c1b8] text-xs tracking-widest uppercase mb-4">
        {isAiError ? 'ai error' : isDbError ? 'db error' : isAuthError ? '403' : 'error'}
      </p>
      <h1 className="font-serif text-4xl font-bold text-[#1c1917] mb-3">{heading}</h1>
      <p className="text-[#6b6560] text-sm mb-8 max-w-sm">{body}</p>
      <div className="flex gap-3">
        {!isAuthError && (
          <button
            onClick={reset}
            className="bg-[#1c1917] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#3a3530] transition-colors"
          >
            Try again
          </button>
        )}
        <Link
          href="/dashboard"
          className="border border-[#e2ddd6] text-[#6b6560] text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#f5f3ef] transition-colors"
        >
          Dashboard
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-[10px] text-[#c8c1b8] uppercase tracking-widest font-mono">
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}

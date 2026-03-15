'use client';

import { UserProfile } from '@clerk/nextjs';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-[#a8a29e] text-xs animate-pulse uppercase tracking-widest">loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1c1917]">
      <nav className="border-b border-[#e2ddd6] bg-white px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight hover:text-[#6b6560] transition-colors">
          hackie
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-[#a8a29e] hover:text-[#1c1917] transition-colors"
        >
          ← Dashboard
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-8">
          <p className="font-display text-xs tracking-widest uppercase text-[#a8a29e] mb-2">Settings</p>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Account</h1>
        </div>

        <UserProfile
          appearance={{
            variables: {
              colorBackground: '#ffffff',
              colorText: '#1c1917',
              colorPrimary: '#b8956a',
              borderRadius: '12px',
            },
            elements: {
              card: 'border border-[#e2ddd6] shadow-none rounded-2xl',
              headerTitle: 'font-serif text-[#1c1917]',
              headerSubtitle: 'text-[#a8a29e]',
              formButtonPrimary: 'bg-[#1c1917] hover:bg-[#3a3530] text-white rounded-xl',
              navbarButton: 'text-[#a8a29e] hover:text-[#1c1917]',
              navbarButtonActive: 'text-[#1c1917] font-semibold',
              badge: 'bg-[#b8956a]/10 text-[#b8956a]',
              formFieldInput: 'border-[#e2ddd6] rounded-xl focus:border-[#b8956a] focus:ring-[#b8956a]/20',
            },
          }}
        />
      </main>
    </div>
  );
}

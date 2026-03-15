import type { ReactNode } from 'react';

// Clerk auth is optional — guests flow through without signing in
export default function AppLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

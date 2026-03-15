import { auth } from '@clerk/nextjs/server';
import LandingPageClient from '@/components/landing/LandingPageClient';

export default async function LandingPage() {
  const { userId } = await auth();
  return <LandingPageClient userId={userId} />;
}

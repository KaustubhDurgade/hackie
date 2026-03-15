import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1c1917]">
      <nav className="border-b border-[#e2ddd6] bg-white px-8 py-4">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight hover:opacity-70 transition-opacity">
          hackie
        </Link>
      </nav>
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-8">
        <p className="font-display text-[#c8c1b8] text-xs tracking-widest uppercase mb-4">404</p>
        <h1 className="font-serif text-4xl font-bold text-[#1c1917] mb-3">Page not found.</h1>
        <p className="text-[#6b6560] text-sm mb-8 max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="bg-[#1c1917] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#3a3530] transition-colors"
        >
          Go home →
        </Link>
      </div>
    </div>
  );
}

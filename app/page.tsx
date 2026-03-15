import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';

const FEATURES = [
  {
    n: '01',
    title: 'Honest feasibility',
    desc: "We tell you what you CAN build in your time window — not what you wish you could. With your actual team and actual tools.",
  },
  {
    n: '02',
    title: 'Live visual map',
    desc: 'Watch your project blueprint build itself in real-time as you chat. Features, architecture, data flow — one canvas.',
  },
  {
    n: '03',
    title: 'Ready to code',
    desc: "Get a working boilerplate at the end — frontend, backend, auth, and DB already wired together. Not a to-do list.",
  },
];

const STEPS = [
  { n: '01', label: 'Tell me about your hackathon',   sub: 'Track, time limit, team size, tools. 30 seconds.' },
  { n: '02', label: 'Validate or generate your idea', sub: 'Honest feasibility. The MVP that can actually win.' },
  { n: '03', label: 'Map out your features',          sub: 'Confirm features one by one. Canvas builds itself.' },
  { n: '04', label: 'Architecture diagram',           sub: 'Frontend → backend → DB → external APIs, visualised.' },
  { n: '05', label: 'Pick your stack + get code',     sub: '3 curated boilerplate templates. Download and go.' },
  { n: '06', label: 'Design your pitch',              sub: 'Landing page concept + slide-by-slide deck outline.' },
];

const TRACKS = [
  'Web3', 'Climate Tech', 'HealthTech', 'Education', 'FinTech',
  'AI / ML', 'Social Impact', 'Open Track', 'Gaming', 'DevTools',
  'Mobility', 'AgriTech', 'Cybersecurity', 'Enterprise SaaS',
];

export default async function LandingPage() {
  const { userId } = await auth();
  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1c1917]">

      {/* Nav */}
      <nav className="border-b border-[#e2ddd6] px-8 py-4 flex items-center justify-between bg-white">
        <span className="font-display text-2xl font-bold tracking-tight">hackie</span>
        <div className="flex items-center gap-4">
          {userId ? (
            <>
              <Link href="/dashboard" className="text-sm text-[#6b6560] hover:text-[#1c1917] transition-colors">
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  variables: { colorBackground: '#ffffff', colorText: '#1c1917', borderRadius: '8px' },
                  elements: {
                    avatarBox: 'w-6 h-6',
                    userButtonPopoverCard: 'bg-white border border-[#e2ddd6] shadow-md rounded-xl',
                    userButtonPopoverActionButton: 'text-[#1c1917] hover:bg-[#f5f3ef] rounded-lg',
                    userButtonPopoverActionButtonText: 'text-[#1c1917] text-xs uppercase tracking-widest',
                    userButtonPopoverFooter: 'hidden',
                  },
                }}
              />
            </>
          ) : (
            <Link href="/sign-in" className="text-sm text-[#6b6560] hover:text-[#1c1917] transition-colors">
              Sign in
            </Link>
          )}
          <Link
            href="/session/new"
            className="text-sm bg-[#1c1917] text-white px-4 py-1.5 rounded-xl hover:bg-[#3a3530] transition-colors font-medium"
          >
            Start a project
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 pt-28 pb-24 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute right-[-2vw] top-1/2 -translate-y-1/2 font-display font-bold leading-none select-none pointer-events-none tracking-tighter text-[#1c1917]/[0.03]"
          style={{ fontSize: 'clamp(120px, 22vw, 340px)' }}
        >
          48h
        </div>

        <p className="text-[#a8a29e] text-xs tracking-widest uppercase mb-6 font-display">
          AI-powered hackathon co-pilot
        </p>
        <h1 className="font-serif font-bold leading-[0.92] tracking-tight mb-8 text-[#1c1917]" style={{ fontSize: 'clamp(52px, 8.5vw, 112px)' }}>
          Build a<br />
          hackathon<br />
          <em className="not-italic text-[#b8956a]">winner.</em>
        </h1>
        <p className="text-[#6b6560] text-lg max-w-lg mb-10 leading-relaxed font-serif">
          From &ldquo;we have 24 hours&rdquo; to a validated idea, feature map,
          architecture diagram, and working boilerplate — with a live visual
          blueprint the whole team can see.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/session/new"
            className="group bg-[#1c1917] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#3a3530] transition-colors inline-flex items-center gap-2"
          >
            Start hacking
            <span className="transition-transform group-hover:translate-x-1 duration-200">→</span>
          </Link>
          <span className="text-[#a8a29e] text-sm">Free to start · Save projects by signing in</span>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="border-y border-[#e2ddd6] overflow-hidden py-3 bg-[#f5f3ef]" aria-hidden="true">
        <div className="flex gap-12 animate-marquee whitespace-nowrap w-max">
          {[...TRACKS, ...TRACKS].map((track, i) => (
            <span key={i} className="font-display text-[11px] text-[#b8b0a8] uppercase tracking-[0.2em]">
              {track}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.n} className="bg-white border border-[#e2ddd6] rounded-2xl p-8 relative group overflow-hidden hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#b8956a] to-transparent rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="font-display text-[#c8c1b8] text-xs tracking-widest">{f.n}</span>
              <h3 className="font-serif text-xl font-bold mt-4 mb-3 text-[#1c1917] group-hover:text-[#1c1917] transition-colors">{f.title}</h3>
              <p className="text-[#6b6560] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[#e2ddd6]" />

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <p className="font-display text-xs tracking-widest uppercase text-[#a8a29e] mb-12">How it works</p>

        <div className="divide-y divide-[#e2ddd6]">
          {STEPS.map(step => (
            <div key={step.n} className="flex items-stretch group">
              <div className="w-14 shrink-0 flex items-start justify-start pt-5 pb-5 pr-6 border-r border-[#e2ddd6] group-hover:border-[#b8956a] transition-colors duration-300">
                <span className="font-display text-[#c8c1b8] text-xs tracking-widest group-hover:text-[#b8956a] transition-colors duration-300">
                  {step.n}
                </span>
              </div>
              <div className="flex-1 pl-8 py-5 md:flex md:items-baseline md:justify-between gap-8">
                <p className="font-serif font-bold text-base text-[#6b6560] group-hover:text-[#1c1917] transition-colors duration-200">
                  {step.label}
                </p>
                <p className="text-[#a8a29e] text-sm mt-1 md:mt-0 md:text-right shrink-0">{step.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <Link
            href="/session/new"
            className="group inline-flex items-center gap-2 bg-[#1c1917] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#3a3530] transition-colors"
          >
            Start hacking
            <span className="transition-transform group-hover:translate-x-1 duration-200">→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-[#e2ddd6] bg-white">
        <footer className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
          <span className="font-display text-sm font-bold text-[#1c1917]">hackie</span>
          <span className="text-[#a8a29e] text-xs">built at a hackathon, for hackathons</span>
        </footer>
      </div>

    </main>
  );
}

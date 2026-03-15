'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import {
  motion, useInView, useReducedMotion,
  useMotionValue, useTransform, animate,
} from 'framer-motion';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRACKS = [
  'Web3', 'Climate Tech', 'HealthTech', 'Education', 'FinTech',
  'AI / ML', 'Social Impact', 'Open Track', 'Gaming', 'DevTools',
  'Mobility', 'AgriTech', 'Cybersecurity', 'Enterprise SaaS',
];

const STEPS = [
  { n: '01', label: 'Tell me about your hackathon',   sub: 'Track, time limit, team size, tools. 30 seconds.' },
  { n: '02', label: 'Validate or generate your idea', sub: 'Honest feasibility. The MVP that can actually win.' },
  { n: '03', label: 'Map out your features',          sub: 'Confirm features one by one. Canvas builds itself.' },
  { n: '04', label: 'Architecture diagram',           sub: 'Frontend → backend → DB → external APIs, visualised.' },
  { n: '05', label: 'Pick your stack + get code',     sub: '3 curated boilerplate templates. Download and go.' },
  { n: '06', label: 'Design your pitch',              sub: 'Landing page concept + slide-by-slide deck outline.' },
];

// ─── Motion primitives ────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const stagger = (delayChildren = 0.08) => ({
  hidden:  {},
  visible: { transition: { staggerChildren: delayChildren } },
});

/** Simple fade-up on scroll */
function FadeUp({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref     = useRef(null);
  const inView  = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={fadeUp}
      initial={reduced ? 'visible' : 'hidden'}
      animate={inView || reduced ? 'visible' : 'hidden'}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Word-by-word blur+fade+rise reveal (21st.dev technique).
 * Each word slides up from blur individually with a stagger.
 */
function BlurReveal({
  children, delay = 0, className = '', color,
}: {
  children: string; delay?: number; className?: string; color?: string;
}) {
  const ref     = useRef(null);
  const inView  = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const words   = children.split(' ');

  return (
    <span ref={ref} className={cn('inline', className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={reduced ? false : { opacity: 0, filter: 'blur(8px)', y: 12 }}
          animate={inView || reduced ? { opacity: 1, filter: 'blur(0px)', y: 0 } : {}}
          transition={{ duration: 0.45, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
          style={{ marginRight: i < words.length - 1 ? '0.28em' : 0, color }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Animated count-up (21st.dev CountAnimation adapted).
 * Triggers once when scrolled into view.
 */
function CountUp({ to, suffix = '', className = '' }: { to: number; suffix?: string; className?: string }) {
  const ref     = useRef(null);
  const inView  = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const count   = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    if (!inView) return;
    const anim = animate(count, to, { duration: 1.4, ease: 'easeOut' });
    return anim.stop;
  }, [inView, to, count]);

  if (reduced) return <span ref={ref} className={className}>{to}{suffix}</span>;

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      <motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

// ─── Elegant floating pill shapes (21st.dev Shape Landing Hero) ───────────────

function ElegantShape({
  className, delay = 0, width = 400, height = 100, rotate = 0,
  gradient = 'from-[#b8956a]/20',
}: {
  className?: string; delay?: number; width?: number;
  height?: number; rotate?: number; gradient?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1, y: 0, rotate } : { opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 2.4, delay, ease: [0.23, 0.86, 0.39, 0.96], opacity: { duration: 1.2 } }}
      className={cn('absolute pointer-events-auto cursor-default group', className)}
    >
      {/* Bobbing wrapper */}
      <motion.div
        animate={reduced ? {} : { y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        /* Scale up on hover via whileHover — framer handles this independently of animate */
        whileHover={reduced ? {} : { scale: 1.06, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
        style={{ width, height }}
        className="relative"
      >
        {/* Pill base — border + shadow react via CSS hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r to-transparent',
            gradient,
            'backdrop-blur-[2px]',
            'border border-[#b8956a]/20 group-hover:border-[#b8956a]/50',
            'shadow-[0_8px_32px_0_rgba(184,149,106,0.07)] group-hover:shadow-[0_0_56px_12px_rgba(184,149,106,0.22)]',
            'transition-[box-shadow,border-color] duration-500 ease-out',
          )}
        />
        {/* Inner glow overlay — fades in on hover */}
        <div
          className="absolute -inset-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(184,149,106,0.30), transparent 60%)' }}
        />
      </motion.div>
    </motion.div>
  );
}

// ─── Feature bento: flip cards ───────────────────────────────────────────────

/**
 * 3D flip card. Front = visual illustration. Back = title + description.
 * Click anywhere to flip. Respects prefers-reduced-motion (cross-fade fallback).
 */
function FlipCard({
  n, title, desc, front,
}: { n: string; title: string; desc: string; front: React.ReactNode }) {
  const [flipped, setFlipped] = useState(false);
  const reduced = useReducedMotion();

  return (
    <motion.div
      variants={fadeUp}
      className="relative h-[300px] cursor-pointer select-none"
      style={{ perspective: 1200 }}
      onClick={() => setFlipped(f => !f)}
      role="button"
      tabIndex={0}
      aria-label={flipped ? `${title} — click to flip back` : `${title} — click to see description`}
      onKeyDown={e => e.key === 'Enter' && setFlipped(f => !f)}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ── Front ── */}
        <div
          className="absolute inset-0 bg-white border border-[#e2ddd6] rounded-2xl overflow-hidden flex flex-col"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Amber top shimmer on hover */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#b8956a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <span className="font-display text-[#c8c1b8] text-[10px] tracking-widest uppercase">{n}</span>
            <span className="text-[9px] text-[#c8c1b8] uppercase tracking-widest">tap to read →</span>
          </div>
          <div className="flex-1 px-4 pb-4 flex items-center justify-center">
            {front}
          </div>
        </div>

        {/* ── Back ── */}
        <div
          className="absolute inset-0 bg-[#1c1917] border border-[#3a3530] rounded-2xl p-7 flex flex-col justify-between overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* Amber glow */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(184,149,106,0.12) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
          <div>
            <span className="font-display text-[#6b6560] text-[10px] tracking-widest uppercase">{n}</span>
            <h3 className="font-serif text-xl font-bold mt-3 mb-3 text-white leading-snug">{title}</h3>
            <p className="text-[#a8a29e] text-sm leading-relaxed">{desc}</p>
          </div>
          <span className="text-[9px] text-[#6b6560] uppercase tracking-widest">← tap to flip back</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Card A: Mini canvas matching real HackieCanvas node styles ────────────────

function MiniCanvas() {
  // Real phase colors from lib/canvas/colors.ts
  // Phase 1 blue, phase 3 amber, phase 2 green (DatabaseNode = inverted)
  const W = 260, H = 190;

  // Node positions (centre coords used for edge routing)
  const nodes = {
    frontend: { x: 12,  y: 24,  w: 88,  h: 34, bg: '#eef4ff', border: '#6b9fdc', text: '#1e3a5f', label: 'Frontend',  step: '1', r: 10 },
    api:      { x: 12,  y: 98,  w: 88,  h: 34, bg: '#fff8ec', border: '#d4924a', text: '#5a3200', label: 'API Layer', step: '2', r: 10 },
    db:       { x: 152, y: 61,  w: 92,  h: 34, bg: '#5bbb8a', border: '#5bbb8a', text: '#ffffff', label: 'Postgres',  step: '3', r: 10 },
  };

  // Edge midpoints: frontend-right → db-left (solid), api-right → db-left (animated dashed)
  const fe = { cx: nodes.frontend.x + nodes.frontend.w, cy: nodes.frontend.y + nodes.frontend.h / 2 };
  const ap = { cx: nodes.api.x + nodes.api.w,           cy: nodes.api.y + nodes.api.h / 2 };
  const db = { cx: nodes.db.x,                          cy: nodes.db.y + nodes.db.h / 2 };

  return (
    <div className="w-full select-none" aria-hidden style={{ background: '#f5f3ef', borderRadius: 12 }}>
      <style>{`@keyframes mc-dash { to { stroke-dashoffset: -18; } }`}</style>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <pattern id="mc-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="0.8" fill="#ddd8d0" />
          </pattern>
          <marker id="arr-solid" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#6b9fdc" />
          </marker>
          <marker id="arr-anim" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#d4924a" />
          </marker>
        </defs>
        <rect width={W} height={H} fill="url(#mc-dots)" />

        {/* Solid edge: Frontend → Postgres centre */}
        <path
          d={`M${fe.cx},${fe.cy} C${fe.cx + 30},${fe.cy} ${db.cx - 32},${db.cy} ${db.cx - 2},${db.cy}`}
          fill="none" stroke="#6b9fdc" strokeWidth="1.5" markerEnd="url(#arr-solid)"
        />
        {/* Animated dashed edge: API → Postgres centre */}
        <path
          d={`M${ap.cx},${ap.cy} C${ap.cx + 30},${ap.cy} ${db.cx - 32},${db.cy} ${db.cx - 2},${db.cy}`}
          fill="none" stroke="#d4924a" strokeWidth="1.5"
          strokeDasharray="5 4" markerEnd="url(#arr-anim)"
          style={{ animation: 'mc-dash 1.2s linear infinite' }}
        />

        {/* Nodes */}
        {Object.values(nodes).map(n => (
          <g key={n.label}>
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={n.r} ry={n.r}
              fill={n.bg} stroke={n.border} strokeWidth="1.5"
              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))' }}
            />
            <circle cx={n.x + 10} cy={n.y + n.h / 2} r="6" fill={n.border} />
            <text x={n.x + 10} y={n.y + n.h / 2} textAnchor="middle"
              dominantBaseline="central" fontSize="7" fontWeight="700" fill={n.bg}>{n.step}</text>
            <text x={n.x + 22} y={n.y + n.h / 2} dominantBaseline="central" fontSize="10" fontWeight="600" fill={n.text}>
              {n.label}
            </text>
          </g>
        ))}

        {/* Edge labels */}
        <rect x="108" y={fe.cy + (db.cy - fe.cy) / 2 - 6.5} width="36" height="13" rx="3" fill="white" fillOpacity="0.9" />
        <text x="126" y={fe.cy + (db.cy - fe.cy) / 2} textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#6b6560">API call</text>
        <rect x="108" y={ap.cy - (ap.cy - db.cy) / 2 - 6.5} width="32" height="13" rx="3" fill="white" fillOpacity="0.9" />
        <text x="124" y={ap.cy - (ap.cy - db.cy) / 2} textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#6b6560">data</text>
      </svg>
    </div>
  );
}

// ── Card B: Phase tracker with real phase colors ──────────────────────────────

function MiniPhases() {
  const phases = [
    { label: 'Idea',     dot: '#6b9fdc', bg: '#eef4ff', done: true  },
    { label: 'Features', dot: '#5bbb8a', bg: '#edfaf3', done: true  },
    { label: 'Arch',     dot: '#d4924a', bg: '#fff8ec', done: true  },
    { label: 'Stack',    dot: '#9076d4', bg: '#f3eeff', done: false },
    { label: 'Pitch',    dot: '#d4688a', bg: '#ffeef5', done: false },
  ];
  // With 5 equal columns, dot centres sit at 10%, 30%, 50%, 70%, 90% of the row.
  // Full connector: left 10% → right 10%  (80% wide)
  // Completed portion covers dots 1-3: 10% → 50%  (40% wide)
  return (
    <div className="w-full px-1" aria-hidden>
      <div className="relative grid grid-cols-5">
        {/* Track line — behind dots */}
        <div className="absolute h-px bg-[#e2ddd6] pointer-events-none"
          style={{ top: 10, left: '10%', width: '80%' }} />
        {/* Completed gradient */}
        <div className="absolute h-px pointer-events-none"
          style={{ top: 10, left: '10%', width: '40%',
            background: 'linear-gradient(to right, #6b9fdc, #5bbb8a, #d4924a)' }} />

        {phases.map(p => (
          <div key={p.label} className="relative z-10 flex flex-col items-center gap-2">
            {/* Dot */}
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm"
              style={{ background: p.done ? p.dot : '#ffffff', borderColor: p.dot }}
            >
              {p.done && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {/* Label pill — same column, so always centred under its dot */}
            <div
              className="text-[8px] font-semibold text-center px-1 py-0.5 rounded-md w-full leading-tight"
              style={{
                background:  p.done ? p.bg : 'transparent',
                color:       p.done ? p.dot : '#c8c1b8',
                border:      `1px solid ${p.done ? p.dot + '40' : '#e2ddd6'}`,
              }}
            >
              {p.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card C: Code block styled like a terminal window ─────────────────────────

function MiniCode() {
  const lines = [
    { t: "import { app } from './server'",  c: '#6b9fdc' },
    { t: "app.use(authMiddleware)",           c: '#5bbb8a' },
    { t: "app.use('/api', router)",           c: '#d4924a' },
    { t: "await prisma.$connect()",           c: '#9076d4' },
    { t: "// ✓ ready to ship",               c: '#5bbb8a' },
  ];
  return (
    <div className="w-full rounded-xl overflow-hidden border border-[#3a3530] shadow-[0_4px_24px_rgba(0,0,0,0.18)]" aria-hidden>
      {/* Terminal title bar */}
      <div className="bg-[#2a2522] px-3 py-2 flex items-center gap-1.5 border-b border-[#3a3530]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[9px] text-[#6b6560] tracking-widest uppercase font-display">server.ts</span>
      </div>
      {/* Code */}
      <div className="bg-[#1c1917] px-4 py-3 font-mono">
        {lines.map((l, i) => (
          <div key={i} className="text-[10px] leading-[1.7] truncate" style={{ color: l.c }}>{l.t}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LandingPageClient({ userId }: { userId: string | null }) {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1c1917] overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#e2ddd6]/80 bg-white/80 backdrop-blur-md px-6 md:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold tracking-tight hover:opacity-70 transition-opacity">
          hackie
        </Link>
        <div className="flex items-center gap-4">
          {userId ? (
            <>
              <Link href="/dashboard" className="hidden sm:block text-sm text-[#6b6560] hover:text-[#1c1917] transition-colors">
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
            <Link href="/sign-in" className="hidden sm:block text-sm text-[#6b6560] hover:text-[#1c1917] transition-colors">
              Sign in
            </Link>
          )}
          <Link href="/session/new" className="text-sm bg-[#1c1917] text-white px-4 py-2 rounded-xl hover:bg-[#3a3530] transition-colors font-medium">
            Start hacking
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-20 pb-10 px-6 md:px-10 overflow-hidden">

        {/* Floating shapes — right half (no overflow-hidden so shadow/scale aren't clipped) */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[55%] pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(184,149,106,0.08) 0%, transparent 70%)' }} />
          <ElegantShape delay={0.2} width={520} height={130} rotate={12}  gradient="from-[#b8956a]/[0.18]" className="left-[5%]  top-[18%]" />
          <ElegantShape delay={0.4} width={380} height={95}  rotate={-10} gradient="from-[#c4a882]/[0.14]" className="right-[2%] top-[55%]" />
          <ElegantShape delay={0.3} width={260} height={70}  rotate={-6}  gradient="from-[#d4b896]/[0.12]" className="left-[20%] bottom-[12%]" />
          <ElegantShape delay={0.5} width={180} height={50}  rotate={18}  gradient="from-[#b8956a]/[0.16]" className="right-[18%] top-[12%]" />
          <ElegantShape delay={0.6} width={140} height={38}  rotate={-22} gradient="from-[#c4a882]/[0.10]" className="left-[35%] top-[8%]" />
        </div>

        {/* Gradient fade — left edge */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, #faf9f6 42%, #faf9f6cc 58%, transparent 72%)' }} />

        {/* Text content — outer div is pointer-events-none so pills behind it stay hoverable */}
        <div className="relative z-10 max-w-5xl mx-auto w-full pointer-events-none">
          <motion.div variants={stagger(0.1)} initial="hidden" animate="visible" className="max-w-xl pointer-events-auto">

            {/* Kicker */}
            <motion.p variants={fadeUp} className="font-display text-[#a8a29e] text-[11px] tracking-[0.25em] uppercase mb-6">
              AI-powered hackathon co-pilot
            </motion.p>

            {/* Headline — word-by-word blur reveal */}
            <div className="font-serif font-bold leading-[0.9] tracking-tight text-[#1c1917] mb-8" style={{ fontSize: 'clamp(56px, 9vw, 120px)' }}>
              <div className="overflow-hidden mb-1">
                <BlurReveal delay={0.1}>Build a</BlurReveal>
              </div>
              <div className="overflow-hidden mb-1">
                <BlurReveal delay={0.25}>hackathon</BlurReveal>
              </div>
              <div className="overflow-hidden">
                <BlurReveal delay={0.38} className="not-italic" color="#b8956a">winner.</BlurReveal>
              </div>
            </div>

            {/* Subtext */}
            <motion.p variants={fadeUp} className="text-[#6b6560] text-lg max-w-md mb-10 leading-relaxed font-serif">
              From &ldquo;we have 24 hours&rdquo; to a validated idea, feature map,
              architecture diagram, and working boilerplate — with a live visual
              blueprint the whole team can see.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
              <Link href="/session/new" className="group bg-[#1c1917] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#3a3530] transition-colors inline-flex items-center gap-2">
                Start hacking
                <span className="transition-transform group-hover:translate-x-1 duration-200">→</span>
              </Link>
              {!userId && (
                <span className="text-[#a8a29e] text-sm">
                  Free to start ·{' '}
                  <Link href="/sign-up" className="underline underline-offset-2 hover:text-[#1c1917] transition-colors">
                    Save projects by signing in
                  </Link>
                </span>
              )}
            </motion.div>

            {/* Stats row — animated count-up */}
            <motion.div variants={fadeUp} className="flex gap-8 mt-14 pt-8 border-t border-[#e2ddd6]">
              {[
                { to: 24, suffix: 'h', label: 'average session' },
                { to: 5,  suffix: '',  label: 'guided phases' },
                { to: 3,  suffix: '',  label: 'boilerplate stacks' },
              ].map(s => (
                <div key={s.label}>
                  <p className="font-display text-2xl font-bold text-[#1c1917]">
                    <CountUp to={s.to} suffix={s.suffix} />
                  </p>
                  <p className="text-[#a8a29e] text-xs uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Marquee strip ── */}
      <div className="border-y border-[#e2ddd6] overflow-hidden py-3 bg-[#f5f3ef]" aria-hidden="true">
        <div className="flex gap-10 whitespace-nowrap w-max" style={{ animation: 'marquee 32s linear infinite' }}>
          {[...TRACKS, ...TRACKS].map((track, i) => (
            <span key={i} className="font-display text-[10px] text-[#b8b0a8] uppercase tracking-[0.25em]">{track}</span>
          ))}
        </div>
      </div>

      {/* ── Features bento ── */}
      <section className="max-w-5xl mx-auto px-6 md:px-10 py-24">
        <FadeUp>
          <p className="font-display text-xs tracking-widest uppercase text-[#a8a29e] mb-3">What you get</p>
          <h2 className="font-serif text-4xl font-bold text-[#1c1917] mb-12 max-w-sm leading-tight">
            <BlurReveal delay={0}>Everything to ship,</BlurReveal>
            <br />
            <BlurReveal delay={0.18}>nothing extra.</BlurReveal>
          </h2>
        </FadeUp>

        <motion.div
          variants={stagger(0.1)} initial="hidden"
          whileInView="visible" viewport={{ once: true, margin: '-80px' }}
          className="grid md:grid-cols-3 gap-4"
        >
          <FlipCard n="01" title="Honest feasibility" desc="We tell you what you CAN build in your time window — not what you wish you could. With your actual team and actual tools." front={<MiniCanvas />} />
          <FlipCard n="02" title="5-phase blueprint" desc="Idea → Features → Architecture → Stack → Pitch. Each phase unlocks as you finish the last one. No skipping." front={<MiniPhases />} />
          <FlipCard n="03" title="Ready to code" desc="Get a working boilerplate at the end — frontend, backend, auth, and DB already wired together. Not a to-do list." front={<MiniCode />} />
        </motion.div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-[#e2ddd6]" />

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-6 md:px-10 py-24">
        <FadeUp>
          <p className="font-display text-xs tracking-widest uppercase text-[#a8a29e] mb-14">How it works</p>
        </FadeUp>

        <div className="divide-y divide-[#e2ddd6]">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="flex items-stretch group cursor-default"
                whileHover={{ x: 6, transition: { duration: 0.2 } }}
              >
                <div className="w-14 shrink-0 flex items-start justify-start pt-5 pb-5 pr-6 border-r border-[#e2ddd6] group-hover:border-[#b8956a] transition-colors duration-300">
                  <span className="font-display text-[#c8c1b8] text-[10px] tracking-widest group-hover:text-[#b8956a] transition-colors duration-300">
                    {step.n}
                  </span>
                </div>
                <div className="flex-1 pl-8 py-5 md:flex md:items-baseline md:justify-between gap-8">
                  <p className="font-serif font-bold text-base text-[#6b6560] group-hover:text-[#1c1917] transition-colors duration-200">
                    {step.label}
                  </p>
                  <p className="text-[#a8a29e] text-sm mt-1 md:mt-0 md:text-right shrink-0">{step.sub}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="max-w-5xl mx-auto px-6 md:px-10 pb-24">
        <FadeUp>
          <div className="relative bg-[#1c1917] rounded-3xl px-10 py-16 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <ElegantShape delay={0}   width={340} height={90} rotate={15}  gradient="from-[#b8956a]/[0.12]" className="right-[-4%] top-[-20%]" />
              <ElegantShape delay={0.2} width={220} height={60} rotate={-8}  gradient="from-[#c4a882]/[0.08]"  className="right-[15%] bottom-[-10%]" />
            </div>
            <p className="font-display text-[#6b6560] text-[11px] tracking-widest uppercase mb-4 relative z-10">ready?</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6 max-w-lg leading-tight relative z-10">
              Your next hackathon starts in{' '}
              <span style={{ color: '#b8956a' }}>30 seconds.</span>
            </h2>
            <p className="text-[#6b6560] text-base mb-10 max-w-md leading-relaxed relative z-10">
              No account needed to start. Just your idea, your team size, and your time limit.
            </p>
            <Link href="/session/new" className="group inline-flex items-center gap-2 bg-white text-[#1c1917] text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#f5f3ef] transition-colors relative z-10">
              Start hacking
              <span className="transition-transform group-hover:translate-x-1 duration-200">→</span>
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <div className="border-t border-[#e2ddd6] bg-white">
        <footer className="max-w-5xl mx-auto px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm font-bold text-[#1c1917]">hackie</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-[#a8a29e] text-xs hover:text-[#1c1917] transition-colors">Privacy</Link>
            <Link href="/terms"   className="text-[#a8a29e] text-xs hover:text-[#1c1917] transition-colors">Terms</Link>
            <span className="text-[#c8c1b8] text-xs hidden sm:block">built at a hackathon, for hackathons</span>
          </div>
        </footer>
      </div>

    </main>
  );
}

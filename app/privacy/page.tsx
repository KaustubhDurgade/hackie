import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy · hackie',
  description: 'Privacy Policy for hackie — the AI-powered hackathon co-pilot.',
};

const EFFECTIVE_DATE = 'March 15, 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1c1917]">
      <nav className="border-b border-[#e2ddd6] bg-white px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight hover:opacity-70 transition-opacity">
          hackie
        </Link>
        <Link href="/" className="text-sm text-[#6b6560] hover:text-[#1c1917] transition-colors">
          ← Back
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-8 py-16">
        <p className="font-display text-xs tracking-widest uppercase text-[#a8a29e] mb-3">Legal</p>
        <h1 className="font-serif text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-[#a8a29e] text-sm mb-12">Effective {EFFECTIVE_DATE}</p>

        <div className="space-y-10 text-[#3a3530]">

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">1. What we collect</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li><strong>Account data</strong> — name and email when you sign up via Clerk</li>
              <li><strong>Session data</strong> — hackathon context you provide (track, team size, time limit, skills)</li>
              <li><strong>Chat messages</strong> — your messages and AI responses, stored to enable persistence across reloads</li>
              <li><strong>Canvas data</strong> — node and edge snapshots for your project map</li>
              <li><strong>Usage data</strong> — token counts per session (no full content analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">2. How we use it</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li>To deliver the Service — restore your sessions, render your canvas, generate AI responses</li>
              <li>To enforce token budgets and rate limits</li>
              <li>To allow you to share your project with teammates via a share link</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              We do not sell your data, use it for advertising, or share it with third parties except as described below.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">3. Third-party services</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li><strong>Clerk</strong> — handles authentication. Your email and name are stored by Clerk under their privacy policy.</li>
              <li><strong>Supabase</strong> — hosts our PostgreSQL database in a secure, access-controlled environment.</li>
              <li><strong>Groq / Anthropic</strong> — your messages are sent to these AI providers to generate responses. They are subject to their respective data processing agreements.</li>
              <li><strong>Vercel</strong> — hosts the application. Logs may contain IP addresses and request metadata.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">4. Data retention</h2>
            <p className="text-sm leading-relaxed">
              Guest sessions expire after 7 days. Authenticated sessions are retained until you delete them or request account deletion. You may request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">5. Cookies</h2>
            <p className="text-sm leading-relaxed">
              We use only essential cookies required for authentication (Clerk session cookies). We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">6. Security</h2>
            <p className="text-sm leading-relaxed">
              Sessions are protected by either Clerk-authenticated user IDs or randomly-generated guest tokens. Share links use opaque tokens that do not expose session UUIDs. All traffic is encrypted in transit via HTTPS.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">7. Your rights</h2>
            <p className="text-sm leading-relaxed">
              You have the right to access, correct, or delete your personal data. To exercise these rights, contact us via the home page. If you are in the EU/EEA, you also have the right to lodge a complaint with your supervisory authority.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">8. Children</h2>
            <p className="text-sm leading-relaxed">
              The Service is not directed at children under 13. We do not knowingly collect personal data from children under 13.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">9. Changes</h2>
            <p className="text-sm leading-relaxed">
              We may update this policy. We will update the effective date above when we do.
            </p>
          </section>

        </div>
      </main>

      <div className="border-t border-[#e2ddd6] bg-white">
        <footer className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
          <span className="font-display text-sm font-bold text-[#1c1917]">hackie</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-[#a8a29e] text-xs hover:text-[#1c1917] transition-colors">Privacy</Link>
            <Link href="/terms"   className="text-[#a8a29e] text-xs hover:text-[#1c1917] transition-colors">Terms</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

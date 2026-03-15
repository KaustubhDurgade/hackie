import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service · hackie',
  description: 'Terms of Service for hackie — the AI-powered hackathon co-pilot.',
};

const EFFECTIVE_DATE = 'March 15, 2026';

export default function TermsPage() {
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
        <h1 className="font-serif text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-[#a8a29e] text-sm mb-12">Effective {EFFECTIVE_DATE}</p>

        <div className="prose-like space-y-10 text-[#3a3530]">

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">1. Acceptance</h2>
            <p className="text-sm leading-relaxed">
              By accessing or using hackie (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">2. What hackie does</h2>
            <p className="text-sm leading-relaxed">
              hackie is an AI-powered planning tool that helps hackathon teams scope ideas, map features, design architecture, and generate starter code. The AI outputs are suggestions — you are responsible for reviewing and validating them before use.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">3. Your account</h2>
            <p className="text-sm leading-relaxed">
              You may use hackie as a guest (session data expires after 7 days) or by creating an account via Clerk. You are responsible for keeping your credentials secure. You must be at least 13 years old to use this Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">4. Acceptable use</h2>
            <p className="text-sm leading-relaxed mb-3">You agree not to:</p>
            <ul className="text-sm leading-relaxed space-y-1.5 list-disc pl-5">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the API</li>
              <li>Submit content that is harmful, illegal, or violates third-party rights</li>
              <li>Circumvent rate limits or token budgets through automated means</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">5. Intellectual property</h2>
            <p className="text-sm leading-relaxed">
              You retain ownership of any content you submit. By using the Service, you grant us a limited licence to process your inputs solely to provide the Service. AI-generated outputs are provided as-is with no copyright claim from us — use them freely in your projects.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">6. Token budgets and availability</h2>
            <p className="text-sm leading-relaxed">
              Each session has a token budget. Once exhausted, you will need to start a new session. We do not guarantee uninterrupted service and may modify or discontinue features at any time.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">7. Disclaimers</h2>
            <p className="text-sm leading-relaxed">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind. AI-generated plans, code, and architectural suggestions may contain errors. We are not responsible for any decisions made based on AI outputs.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">8. Limitation of liability</h2>
            <p className="text-sm leading-relaxed">
              To the maximum extent permitted by law, hackie and its creators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">9. Changes</h2>
            <p className="text-sm leading-relaxed">
              We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#1c1917] mb-3">10. Contact</h2>
            <p className="text-sm leading-relaxed">
              Questions? Reach us via the link on the home page.
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

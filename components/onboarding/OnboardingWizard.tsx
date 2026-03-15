'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: 'Required',
  2: 'Encouraged',
  3: 'Optional',
};

export function OnboardingWizard() {
  const router    = useRouter();
  const [step, setStep]       = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [step1Error, setStep1Error] = useState('');

  const [track, setTrack]         = useState('');
  const [timeLimitHrs, setTime]   = useState<number>(24);
  const [teamSize, setTeamSize]   = useState<number>(2);
  const [skillsText, setSkillsText] = useState('');
  const [toolsText, setToolsText]   = useState('');
  const [judges, setJudges] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const guestToken = localStorage.getItem('hackie_guest_token') ?? nanoid(24);
      localStorage.setItem('hackie_guest_token', guestToken);

      const judgeList = judges.split('\n').map(j => j.trim()).filter(Boolean);
      const toolList  = toolsText.split(/[\n,]/).map(t => t.trim()).filter(Boolean);

      const res  = await fetch('/api/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          track:        track || undefined,
          timeLimitHrs,
          teamSize,
          skillsText:   skillsText || undefined,
          tools:        { hackathon: toolList, personal: [] },
          judges:       judgeList,
          guestToken,
        }),
      });
      const data = await res.json();
      if (data.guestToken) localStorage.setItem('hackie_guest_token', data.guestToken);
      router.push(`/session/${data.sessionId}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const inputCls = 'bg-white border-[#e2ddd6] text-[#1c1917] placeholder:text-[#c8c1b8] focus:border-[#b8956a] focus-visible:ring-1 focus-visible:ring-[#b8956a] rounded-xl text-sm';

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10">
          {([1, 2, 3] as Step[]).map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={cn(
                'w-7 h-7 flex items-center justify-center text-xs font-display font-bold border-2 rounded-full transition-colors',
                step === s ? 'border-[#1c1917] text-[#1c1917] bg-white' :
                step >  s ? 'border-[#b8956a] text-[#b8956a] bg-white' :
                             'border-[#e2ddd6] text-[#c8c1b8] bg-white'
              )}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={cn('h-0.5 w-10 rounded-full', step > s ? 'bg-[#b8956a]' : 'bg-[#e2ddd6]')} />}
            </div>
          ))}
          <span className="ml-auto font-display text-[10px] tracking-widest uppercase text-[#a8a29e]">
            {STEP_LABELS[step]}
          </span>
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h1 className="font-serif text-4xl font-bold tracking-tight mb-1 text-[#1c1917]">Let&apos;s build.</h1>
              <p className="text-[#6b6560] text-sm">Tell me about your hackathon.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="track" className="block text-xs text-[#6b6560] uppercase tracking-widest mb-1.5">Track / Theme</label>
                <Input id="track" value={track} onChange={e => setTrack(e.target.value)}
                  placeholder="e.g. AI for Good, FinTech, Open" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="time-limit" className="block text-xs text-[#6b6560] uppercase tracking-widest mb-1.5">Time limit (hrs)</label>
                  <Input id="time-limit" type="number" min={1} max={168} value={timeLimitHrs}
                    onChange={e => setTime(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-[#6b6560] uppercase tracking-widest mb-1.5">Team size</label>
                  <div className="flex items-center gap-3 h-10">
                    <button
                      onClick={() => setTeamSize(Math.max(1, teamSize - 1))}
                      disabled={teamSize <= 1}
                      aria-label="Decrease team size"
                      className="w-8 h-8 border border-[#e2ddd6] text-[#6b6560] hover:border-[#b8956a] hover:text-[#b8956a] rounded-lg transition-colors text-sm bg-white disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                    <span className="text-[#1c1917] font-display font-bold w-4 text-center">{teamSize}</span>
                    <button
                      onClick={() => setTeamSize(Math.min(10, teamSize + 1))}
                      disabled={teamSize >= 10}
                      aria-label="Increase team size"
                      className="w-8 h-8 border border-[#e2ddd6] text-[#6b6560] hover:border-[#b8956a] hover:text-[#b8956a] rounded-lg transition-colors text-sm bg-white disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                  </div>
                </div>
              </div>
            </div>

            {step1Error && (
              <p className="text-[#c0392b] text-xs">{step1Error}</p>
            )}
            <div className="flex justify-end">
              <button onClick={() => {
                if (!track.trim()) { setStep1Error('Track / Theme is required.'); return; }
                if (!timeLimitHrs || timeLimitHrs < 1) { setStep1Error('Time limit must be at least 1 hour.'); return; }
                setStep1Error('');
                setStep(2);
              }}
                className="bg-[#1c1917] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#3a3530] transition-colors">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-4xl font-bold tracking-tight mb-1 text-[#1c1917]">Your toolkit.</h2>
              <p className="text-[#6b6560] text-sm">The more I know, the better I can tailor your plan.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs text-[#6b6560] uppercase tracking-widest mb-1.5">Team skills</label>
                <Textarea
                  value={skillsText}
                  onChange={e => setSkillsText(e.target.value)}
                  placeholder="e.g. React, TypeScript, Python/ML, some iOS, strong on UI design"
                  rows={3}
                  className={cn(inputCls, 'resize-none')}
                />
                <p className="text-[10px] text-[#a8a29e] mt-1 uppercase tracking-widest">Languages, frameworks, experience level</p>
              </div>

              <div>
                <label className="block text-xs text-[#6b6560] uppercase tracking-widest mb-1.5">Available tools & APIs</label>
                <Textarea
                  value={toolsText}
                  onChange={e => setToolsText(e.target.value)}
                  placeholder="e.g. OpenAI API, AWS credits, Stripe, Figma, Arduino"
                  rows={2}
                  className={cn(inputCls, 'resize-none')}
                />
                <p className="text-[10px] text-[#a8a29e] mt-1 uppercase tracking-widest">Hackathon-provided APIs, personal hardware, design tools</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="text-[#a8a29e] hover:text-[#1c1917] text-sm transition-colors">Back</button>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="text-[#a8a29e] hover:text-[#1c1917] text-sm transition-colors">Skip</button>
                <button onClick={() => setStep(3)}
                  className="bg-[#1c1917] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#3a3530] transition-colors">
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-4xl font-bold tracking-tight mb-1 text-[#1c1917]">Know your judges.</h2>
              <p className="text-[#6b6560] text-sm">Optional — helps me tailor what will impress them.</p>
            </div>

            <div>
              <label className="block text-xs text-[#6b6560] uppercase tracking-widest mb-1.5">Judges (one per line)</label>
              <Textarea
                placeholder={"Jane Smith - Partner at a16z, AI/ML focus\nBob Lee - CTO at FinTech startup"}
                value={judges}
                onChange={e => setJudges(e.target.value)}
                rows={4}
                className={cn(inputCls, 'resize-none')}
              />
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="text-[#a8a29e] hover:text-[#1c1917] text-sm transition-colors">Back</button>
              <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={loading} className="text-[#a8a29e] hover:text-[#1c1917] text-sm transition-colors">
                  Skip
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="bg-[#1c1917] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#3a3530] transition-colors disabled:opacity-40">
                  {loading ? 'Starting...' : 'Start hacking'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

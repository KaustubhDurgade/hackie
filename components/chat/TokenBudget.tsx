'use client';

import { cn } from '@/lib/utils';

interface TokenBudgetProps {
  tokensUsed: number;
  tokenBudget: number;
}

export function TokenBudget({ tokensUsed, tokenBudget }: TokenBudgetProps) {
  const pct = Math.min(100, (tokensUsed / tokenBudget) * 100);

  return (
    <div className="px-4 py-2 border-t border-[#e2ddd6]">
      <div className="flex justify-between text-[10px] text-[#a8a29e] mb-1 uppercase tracking-widest">
        <span>tokens</span>
        <span className={cn(pct >= 80 ? 'text-[#c4875a]' : '')}>
          {tokensUsed.toLocaleString()} / {tokenBudget.toLocaleString()}
        </span>
      </div>
      <div className="h-1 bg-[#ede9e3] rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500 rounded-full', pct >= 95 ? 'bg-[#c4875a]' : pct >= 80 ? 'bg-[#d4a870]' : 'bg-[#b8956a]')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct >= 80 && (
        <p className="text-[10px] text-[#c4875a] mt-1">
          {pct >= 95 ? 'Budget nearly exhausted.' : 'Approaching limit.'}
        </p>
      )}
    </div>
  );
}

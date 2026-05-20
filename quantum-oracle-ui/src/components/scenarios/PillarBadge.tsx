import { cn } from '@/lib/utils';
import type { Pillar } from './types';

const PILLAR_STYLES: Record<Pillar, string> = {
  Prove: 'border-[rgb(var(--cyan))]/40 bg-[rgba(0,200,255,0.08)] text-[rgb(var(--cyan))]',
  Protect: 'border-[rgb(var(--green))]/40 bg-[rgba(0,255,156,0.08)] text-[rgb(var(--green))]',
  Randomize: 'border-[rgb(var(--amber))]/40 bg-[rgba(255,180,0,0.08)] text-[rgb(var(--amber))]',
};

export function PillarBadge({ pillar, className }: { pillar: Pillar; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[2px] border text-[10px] uppercase tracking-[0.12em] font-mono',
        PILLAR_STYLES[pillar],
        className,
      )}
    >
      {pillar}
    </span>
  );
}

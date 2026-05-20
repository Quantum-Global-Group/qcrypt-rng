import Link from 'next/link';
import { PillarBridgeCallout } from '@/components/scenarios/PillarBridgeCallout';
import { ScenarioShell } from '@/components/scenarios/ScenarioShell';
import { SCENARIOS } from '@/components/scenarios/scenarioData';
import { PillarBadge } from '@/components/scenarios/PillarBadge';

export const metadata = {
  title: 'qcrypt-rng // scenarios',
  description: 'Flagship scenario guides — lottery, sealed bid, committee selection.',
};

export default function ScenariosHubPage() {
  return (
    <ScenarioShell title="Flagship scenario guides" subtitle="Prove · Protect · Randomize">
      <PillarBridgeCallout />

      <p className="text-sm text-[rgb(var(--fg-dim))] font-mono leading-relaxed">
        Step-by-step composed journeys. Each scenario links to existing dashboard tabs and blockchain
        pillar pages — no automated wizards; gaps are marked honestly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {SCENARIOS.map((s) => {
          const pillars = [...new Set(s.steps.flatMap((step) => step.pillars))];
          return (
            <Link
              key={s.id}
              href={`/scenarios/${s.slug}`}
              className="section p-5 hover:border-[rgb(var(--green))]/40 transition-colors group"
            >
              <div className="text-[10px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))] mb-2">
                {s.subtitle}
              </div>
              <h2 className="text-sm font-mono font-semibold text-[rgb(var(--fg))] group-hover:text-[rgb(var(--green))] transition-colors">
                {s.title}
              </h2>
              <p className="text-[11px] text-[rgb(var(--fg-dim))] mt-2 leading-relaxed font-mono">
                {s.goal}
              </p>
              <div className="flex flex-wrap gap-1 mt-4">
                {pillars.map((p) => (
                  <PillarBadge key={p} pillar={p} />
                ))}
              </div>
              <div className="mt-4 text-[11px] text-[rgb(var(--green))] font-mono uppercase tracking-wider">
                {s.steps.length} steps →
              </div>
            </Link>
          );
        })}
      </div>
    </ScenarioShell>
  );
}

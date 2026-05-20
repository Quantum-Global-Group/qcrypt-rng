import Link from 'next/link';
import { PillarBadge } from './PillarBadge';
import type { ScenarioDef, ScenarioStep } from './types';

function StepCard({ step, index }: { step: ScenarioStep; index: number }) {
  return (
    <article className="section p-5 space-y-4">
      <div className="flex items-start gap-4">
        <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-[2px] border border-[rgb(var(--border))] text-sm font-mono text-[rgb(var(--green))]">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-mono font-semibold text-[rgb(var(--fg))]">{step.title}</h3>
            {step.manual && (
              <span className="chip chip-amber text-[10px] uppercase tracking-wider">manual</span>
            )}
            {step.gap && (
              <span className="chip chip-amber text-[10px] uppercase tracking-wider">gap</span>
            )}
          </div>

          <p className="text-xs text-[rgb(var(--fg-dim))] leading-relaxed font-mono">{step.description}</p>

          <div className="flex flex-wrap gap-1.5">
            {step.pillars.map((p) => (
              <PillarBadge key={p} pillar={p} />
            ))}
          </div>

          {step.routes.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))]">
                Open in UI
              </div>
              <div className="flex flex-wrap gap-2">
                {step.routes.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="btn-ghost text-[11px] px-2.5 py-1"
                  >
                    {r.label} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {step.endpoints && step.endpoints.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))]">
                API
              </div>
              <ul className="space-y-1">
                {step.endpoints.map((ep) => (
                  <li key={ep}>
                    <code className="text-[11px] text-[rgb(var(--green))]">{ep}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.gap && (
            <p className="text-[11px] text-[rgb(var(--amber))] font-mono border-l-2 border-[rgb(var(--amber))]/50 pl-3">
              Gap: {step.gap}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ScenarioStepList({ scenario }: { scenario: ScenarioDef }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--fg))] font-mono leading-relaxed">{scenario.goal}</p>
      <div className="space-y-3">
        {scenario.steps.map((step, i) => (
          <StepCard key={step.title} step={step} index={i} />
        ))}
      </div>

      {scenario.gaps.length > 0 && (
        <section className="section p-5 space-y-3 border-[rgb(var(--amber))]/30">
          <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-[rgb(var(--amber))]">
            Known gaps (M3)
          </h3>
          <ul className="space-y-2">
            {scenario.gaps.map((g) => (
              <li key={g} className="text-xs text-[rgb(var(--fg-dim))] font-mono leading-relaxed flex gap-2">
                <span className="text-[rgb(var(--amber))] shrink-0">▸</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

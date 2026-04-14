'use client';

import { cn } from '@/lib/utils';
import { CopyButton, DownloadButton } from '@/components/ui';

/* ─── shared primitives (exported for reuse in page components) ────────────── */

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-widest text-outline">
      {children}
    </span>
  );
}

export function ArtifactRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-outline-variant/10 last:border-0">
      <SectionLabel>{label}</SectionLabel>
      {typeof value === 'string' ? (
        <span
          className={cn(
            'text-right text-[11px] text-on-surface-variant break-all max-w-[65%]',
            mono && 'font-mono',
          )}
        >
          {value}
        </span>
      ) : (
        value
      )}
    </div>
  );
}

/* ─── types ────────────────────────────────────────────────────────────────── */

interface ArtifactSection {
  title: string;
  rows: Array<{ label: string; value: string; mono?: boolean }>;
}

export interface EvidencePanelProps {
  claim: string;
  proves: string[];
  doesNotProve: string[];
  artifactSections?: ArtifactSection[];
  status?: { type: 'success' | 'error'; label: string; detail?: string };
  verifySteps?: string[];
  verifyAction?: { label: string; onClick: () => void };
  nextAction?: { label: string; description: string; onClick: () => void };
  exportData?: string;
  exportFilename?: string;
  failureNote?: string;
  emptyLabel?: string;
  children?: React.ReactNode;
  /** In split layouts (e.g. two-column Protect), disable sticky so scroll regions behave correctly */
  embed?: boolean;
}

/* ─── panel ────────────────────────────────────────────────────────────────── */

export function AnalystEvidencePanel({
  claim,
  proves,
  doesNotProve,
  artifactSections,
  status,
  verifySteps,
  verifyAction,
  nextAction,
  exportData,
  exportFilename = 'evidence.json',
  failureNote,
  emptyLabel = 'Run the operation to see results',
  children,
  embed = false,
}: EvidencePanelProps) {
  const hasResults = !!artifactSections?.length || !!status;

  return (
    <div
      className={cn(
        'space-y-4',
        embed ? 'relative' : 'sticky top-[4.5rem]',
      )}
    >
      {/* ── claim & scope (always visible) ──────────────────────────────────── */}
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-5">
        <div className="space-y-3">
          <div>
            <SectionLabel>Cryptographic claim</SectionLabel>
            <p className="mt-1 text-[12px] leading-relaxed text-on-surface">
              {claim}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SectionLabel>Proves</SectionLabel>
              <ul className="mt-1 space-y-0.5">
                {proves.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-1.5 text-[11px] text-on-surface-variant"
                  >
                    <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionLabel>Does not prove</SectionLabel>
              <ul className="mt-1 space-y-0.5">
                {doesNotProve.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-1.5 text-[11px] text-outline"
                  >
                    <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-outline/40" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── results ─────────────────────────────────────────────────────────── */}
      {hasResults ? (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-5 space-y-4">
          {/* status banner */}
          {status && (
            <div
              className={cn(
                'rounded-lg border px-4 py-3',
                status.type === 'success'
                  ? 'border-primary/25 bg-primary/5'
                  : 'border-error/25 bg-error/5',
              )}
            >
              <span
                className={cn(
                  'font-mono text-[12px] font-semibold',
                  status.type === 'success' ? 'text-primary' : 'text-error',
                )}
              >
                {status.label}
              </span>
              {status.detail && (
                <p className="mt-0.5 font-mono text-[10px] text-on-surface-variant">
                  {status.detail}
                </p>
              )}
            </div>
          )}

          {/* artifact sections */}
          {artifactSections?.map((section, i) => (
            <div
              key={section.title}
              className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <SectionLabel>{section.title}</SectionLabel>
                {i === 0 && exportData && (
                  <div className="flex gap-2">
                    <CopyButton value={exportData} label="Copy JSON" />
                    <DownloadButton
                      content={exportData}
                      filename={exportFilename}
                      label="Export"
                    />
                  </div>
                )}
              </div>
              {section.rows.map((row) => (
                <ArtifactRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  mono={row.mono ?? true}
                />
              ))}
            </div>
          ))}

          {/* failure note */}
          {failureNote && (
            <div className="rounded-lg border border-error/10 bg-error/5 px-4 py-2.5">
              <SectionLabel>If tampered</SectionLabel>
              <p className="mt-1 text-[11px] text-error/80">{failureNote}</p>
            </div>
          )}

          {/* inline children (tamper demo, etc.) */}
          {children}

          {/* verification procedure */}
          {verifySteps && verifySteps.length > 0 && (
            <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4">
              <SectionLabel>Third-party verification</SectionLabel>
              <ol className="mt-2 space-y-1.5">
                {verifySteps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-start gap-2 text-[11px] text-on-surface-variant"
                  >
                    <span className="font-mono text-[10px] text-outline shrink-0 w-4 text-right">
                      {i + 1}.
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              {verifyAction && (
                <button
                  type="button"
                  onClick={verifyAction.onClick}
                  className="btn-ghost mt-3 text-primary font-mono text-[11px]"
                >
                  {verifyAction.label} →
                </button>
              )}
            </div>
          )}

          {/* next action cross-link */}
          {nextAction && (
            <button
              type="button"
              onClick={nextAction.onClick}
              className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <span className="font-mono text-[11px] font-medium text-primary">
                {nextAction.label}
              </span>
              <p className="mt-0.5 text-[10px] text-on-surface-variant">
                {nextAction.description}
              </p>
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-5">
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-outline-variant/25">
            <span className="font-mono text-[11px] text-outline/50">
              {emptyLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

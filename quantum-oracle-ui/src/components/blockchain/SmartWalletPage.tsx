'use client';

import { useState } from 'react';
import { assessQuantumThreat, createBlockchainWallet, simulateBlockchainAttack } from '@/utils/api';
import { CopyButton } from '@/components/ui';
import { cn } from '@/lib/utils';

type WalletMode = 'both' | 'vulnerable' | 'quantum-safe';
type SimTarget = 'RSA-2048' | 'ECDSA-256' | 'RSA-4096' | 'ECDSA-384';
type Tab = 'wallet' | 'shor';

const TABS: { id: Tab; label: string }[] = [
  { id: 'wallet', label: 'Create Wallet' },
  { id: 'shor',   label: "Shor's Simulation" },
];

const SIM_TARGETS: { id: SimTarget; label: string }[] = [
  { id: 'RSA-2048',  label: 'RSA-2048' },
  { id: 'RSA-4096',  label: 'RSA-4096' },
  { id: 'ECDSA-256', label: 'ECDSA-256' },
  { id: 'ECDSA-384', label: 'ECDSA-384' },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-widest text-outline">{children}</span>
  );
}

function OutputRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-outline-variant/10 last:border-0">
      <Label>{label}</Label>
      <span className="text-right font-mono text-[11px] text-on-surface-variant break-all max-w-[65%]">{value}</span>
    </div>
  );
}

function RiskChip({ level }: { level: string }) {
  const l = level?.toLowerCase();
  const cls =
    l === 'critical' || l === 'high'
      ? 'chip chip-degraded'
      : l === 'medium'
      ? 'chip chip-info'
      : 'chip chip-verified';
  return <span className={cls}>{level}</span>;
}

export function SmartWalletPage() {
  const [tab, setTab] = useState<Tab>('wallet');

  // Wallet state
  const [walletMode, setWalletMode] = useState<WalletMode>('both');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletResult, setWalletResult] = useState<Record<string, unknown> | null>(null);

  // Shor simulation state
  const [simTarget, setSimTarget] = useState<SimTarget>('RSA-2048');
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null);
  const [threatResult, setThreatResult] = useState<Record<string, unknown> | null>(null);

  const createWallet = async () => {
    setWalletError(null);
    setWalletLoading(true);
    try {
      const res = await createBlockchainWallet(walletMode);
      setWalletResult(res.data);
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : 'Wallet creation failed');
    } finally {
      setWalletLoading(false);
    }
  };

  const runSimulation = async () => {
    setSimError(null);
    setSimLoading(true);
    try {
      const [attack, threat] = await Promise.all([
        simulateBlockchainAttack(simTarget as 'RSA-2048' | 'ECDSA-256', true),
        assessQuantumThreat(simTarget),
      ]);
      setSimResult(attack.data);
      setThreatResult(threat.data as Record<string, unknown>);
    } catch (e) {
      setSimError(e instanceof Error ? e.message : 'Simulation failed');
    } finally {
      setSimLoading(false);
    }
  };

  const assessment = threatResult && (threatResult.assessment as Record<string, unknown> | undefined);

  // Flatten wallet result for display
  const walletSections: { title: string; fields: [string, string][] }[] = [];
  if (walletResult) {
    for (const [key, val] of Object.entries(walletResult)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const fields = Object.entries(val as Record<string, unknown>)
          .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
          .map(([k, v]) => [k, String(v)] as [string, string]);
        if (fields.length) walletSections.push({ title: key.replace(/_/g, ' '), fields });
      } else if (typeof val === 'string' || typeof val === 'number') {
        if (!walletSections[0]) walletSections.push({ title: 'summary', fields: [] });
        walletSections[0].fields.push([key.replace(/_/g, ' '), String(val)]);
      }
    }
  }

  return (
    <div className="w-full space-y-6 text-on-surface">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded px-4 py-1.5 font-mono text-[11px] font-medium transition-colors',
              tab === t.id ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Create Wallet tab */}
      {tab === 'wallet' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-6 lg:col-span-5">
            <section>
              <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                01 · Wallet type
              </h2>
              <div className="flex flex-col gap-2">
                {(
                  [
                    { id: 'both',         label: 'Both',         sub: 'Classical + quantum-safe side by side' },
                    { id: 'vulnerable',   label: 'Classical',    sub: 'ECDSA secp256k1 / P-256' },
                    { id: 'quantum-safe', label: 'Quantum-safe', sub: 'Dilithium — immune to Shor\'s algorithm' },
                  ] as { id: WalletMode; label: string; sub: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWalletMode(opt.id)}
                    className={cn(
                      'rounded-lg border px-4 py-3 text-left transition-colors',
                      walletMode === opt.id
                        ? 'border-primary bg-primary/10'
                        : 'border-outline-variant/25 bg-surface-container-low hover:border-outline-variant/40 hover:bg-surface-container',
                    )}
                  >
                    <div className="font-headline text-sm font-semibold text-on-surface">{opt.label}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-on-surface-variant">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              disabled={walletLoading}
              onClick={createWallet}
              className="btn-primary w-full"
            >
              {walletLoading ? 'Creating…' : 'Create wallet'}
            </button>

            {walletError && (
              <p className="font-mono text-[12px] text-error" role="alert">{walletError}</p>
            )}
          </div>

          <aside className="lg:col-span-7">
            <div className="sticky top-[4.5rem] rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6">
              <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">Output</h2>
              <p className="mb-4 text-[13px] leading-relaxed text-on-surface-variant">
                Wallet addresses and key material appear here. Treat private keys as secrets — never expose them outside a test environment.
              </p>

              {walletResult ? (
                <div className="space-y-4">
                  {walletSections.map((section) => (
                    <div key={section.title} className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-outline capitalize">{section.title}</span>
                        <CopyButton
                          value={section.fields.map(([k, v]) => `${k}: ${v}`).join('\n')}
                          label="Copy"
                        />
                      </div>
                      {section.fields.map(([k, v]) => (
                        <OutputRow key={k} label={k} value={
                          v.length > 40 ? (
                            <span className="text-[10px] break-all leading-relaxed">{v.slice(0, 48)}…</span>
                          ) : v
                        } />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-outline-variant/25">
                  <span className="font-mono text-[11px] text-outline/50">Create a wallet to see output</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Shor's Simulation tab */}
      {tab === 'shor' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-6 lg:col-span-5">
            <section>
              <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                01 · Target algorithm
              </h2>
              <div className="flex flex-wrap gap-2">
                {SIM_TARGETS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSimTarget(t.id)}
                    className={cn(
                      'rounded-md border px-3.5 py-2 font-mono text-xs transition-colors',
                      simTarget === t.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-outline-variant/50 hover:bg-surface-container hover:text-on-surface',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest/60 p-4 text-[13px] leading-relaxed text-on-surface-variant">
              Shor's algorithm runs on a fault-tolerant quantum computer to factor large integers and solve discrete logarithm problems — breaking RSA and ECDSA. The simulation calculates the exact logical qubit count required and estimated timeline based on current hardware projections.
            </div>

            <button
              type="button"
              disabled={simLoading}
              onClick={runSimulation}
              className="btn-primary w-full"
            >
              {simLoading ? 'Simulating…' : 'Run simulation'}
            </button>

            {simError && (
              <p className="font-mono text-[12px] text-error" role="alert">{simError}</p>
            )}
          </div>

          <aside className="lg:col-span-7">
            <div className="sticky top-[4.5rem] rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5">
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">Threat assessment</h2>

              {assessment ? (
                <>
                  <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-1">
                    <OutputRow label="Algorithm" value={String(threatResult?.algorithm ?? simTarget)} />
                    <OutputRow label="Risk level" value={<RiskChip level={String(assessment.risk_level ?? '')} />} />
                    <OutputRow label="Status" value={String(assessment.status ?? '—')} />
                    <OutputRow label="Logical qubits to break" value={
                      <span className="font-semibold text-error font-mono">{String(assessment.qubits_to_break ?? '—')}</span>
                    } />
                    <OutputRow label="Time to break" value={String(assessment.time_to_break ?? '—')} />
                    <OutputRow label="Recommendation" value={String(assessment.recommendation ?? '—')} />
                  </div>

                  {simResult && typeof simResult === 'object' && (
                    <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-outline">Attack simulation</span>
                      {Object.entries(simResult)
                        .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
                        .slice(0, 8)
                        .map(([k, v]) => (
                          <OutputRow key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-outline-variant/25">
                  <span className="font-mono text-[11px] text-outline/50">Run simulation to see threat assessment</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

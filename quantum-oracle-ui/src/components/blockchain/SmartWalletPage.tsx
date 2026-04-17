'use client';

import { useState, useCallback } from 'react';
import { assessQuantumThreat, createBlockchainWallet, simulateBlockchainAttack } from '@/utils/api';
import { CopyButton } from '@/components/ui';
import { cn } from '@/lib/utils';

type WalletMode = 'both' | 'vulnerable' | 'quantum-safe';
type SimTarget = 'RSA-2048' | 'ECDSA-256' | 'RSA-4096' | 'ECDSA-384';

const TARGETS: SimTarget[] = ['RSA-2048', 'ECDSA-256', 'RSA-4096', 'ECDSA-384'];

interface WalletData {
  address?: string;
  public_key?: string;
  algorithm?: string;
  quantum_safe?: boolean;
  vulnerable_address?: string;
  quantum_safe_address?: string;
  [key: string]: unknown;
}

export function SmartWalletPage() {
  const [walletMode, setWalletMode] = useState<WalletMode>('both');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const [simTarget, setSimTarget] = useState<SimTarget>('RSA-2048');
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const [threatAlg, setThreatAlg] = useState('RSA-2048');
  const [threatResult, setThreatResult] = useState<{ risk_level: string; recommendation: string; time_to_break: string } | null>(null);
  const [threatLoading, setThreatLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const createWallet = useCallback(async () => {
    setWalletLoading(true);
    setError(null);
    try {
      const res = await createBlockchainWallet(walletMode);
      setWalletData(res.data as WalletData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wallet creation failed');
    } finally {
      setWalletLoading(false);
    }
  }, [walletMode]);

  const simulate = useCallback(async () => {
    setSimLoading(true);
    setError(null);
    try {
      const res = await simulateBlockchainAttack(simTarget as 'RSA-2048' | 'ECDSA-256', true);
      setSimResult(res.data as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    } finally {
      setSimLoading(false);
    }
  }, [simTarget]);

  const assessThreat = useCallback(async () => {
    setThreatLoading(true);
    setError(null);
    try {
      const res = await assessQuantumThreat(threatAlg);
      const assessment = res.data?.assessment;
      if (assessment) {
        setThreatResult({
          risk_level: String(assessment.risk_level),
          recommendation: String(assessment.recommendation),
          time_to_break: String(assessment.time_to_break),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Threat assessment failed');
    } finally {
      setThreatLoading(false);
    }
  }, [threatAlg]);

  const riskColor = (r: string) =>
    r?.toUpperCase().includes('CRITICAL') ? 'text-red-400' :
    r?.toUpperCase().includes('HIGH') ? 'text-orange-400' :
    r?.toUpperCase().includes('MED') ? 'text-yellow-400' :
    'text-green-400';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white">Quantum-Safe Wallet Simulator</h2>
        <p className="text-sm text-slate-400 mt-1">
          Create wallets, simulate Shor-algorithm attacks, and assess algorithm risk.
        </p>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>}

      {/* ─ Create wallet ─ */}
      <section className="space-y-3 p-4 rounded-lg border border-slate-700/40 bg-slate-900/50">
        <h3 className="text-sm font-semibold text-white">Create Wallet</h3>
        <div className="flex gap-2 flex-wrap">
          {(['both', 'vulnerable', 'quantum-safe'] as WalletMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setWalletMode(m)}
              className={cn(
                'px-3 py-1 rounded text-xs border transition-colors capitalize',
                walletMode === m
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-400',
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={createWallet}
          disabled={walletLoading}
          className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {walletLoading ? 'Creating…' : 'Create Wallet'}
        </button>
        {walletData && (
          <div className="space-y-2 mt-2">
            {(['vulnerable_address', 'quantum_safe_address', 'address', 'public_key', 'algorithm'] as const).map((k) => {
              const v = walletData[k];
              if (!v) return null;
              return (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-36 shrink-0 capitalize">{k.replace(/_/g, ' ')}</span>
                  <code className="flex-1 text-xs font-mono text-slate-200 bg-slate-800/60 rounded px-2 py-1 break-all">
                    {String(v)}
                  </code>
                  <CopyButton value={String(v)} />
                </div>
              );
            })}
            {walletData.quantum_safe !== undefined && (
              <p className={cn('text-xs font-semibold mt-1', walletData.quantum_safe ? 'text-green-400' : 'text-red-400')}>
                {walletData.quantum_safe ? '✓ Quantum-safe' : '✗ Vulnerable to quantum attack'}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ─ Attack simulation ─ */}
      <section className="space-y-3 p-4 rounded-lg border border-slate-700/40 bg-slate-900/50">
        <h3 className="text-sm font-semibold text-white">Shor Algorithm Attack Simulation</h3>
        <div className="flex gap-2 flex-wrap">
          {TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => setSimTarget(t)}
              className={cn(
                'px-3 py-1 rounded text-xs border transition-colors',
                simTarget === t
                  ? 'border-red-500 bg-red-500/10 text-red-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-400',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={simulate}
          disabled={simLoading}
          className="px-4 py-2 rounded bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {simLoading ? 'Simulating…' : 'Simulate Attack'}
        </button>
        {simResult && (
          <div className="text-xs space-y-1 mt-2 text-slate-300">
            {Object.entries(simResult).slice(0, 6).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-slate-500 w-40 shrink-0 capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="font-mono break-all">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─ Threat assessment ─ */}
      <section className="space-y-3 p-4 rounded-lg border border-slate-700/40 bg-slate-900/50">
        <h3 className="text-sm font-semibold text-white">Quantum Threat Assessment</h3>
        <input
          value={threatAlg}
          onChange={(e) => setThreatAlg(e.target.value)}
          placeholder="Algorithm name (e.g. RSA-2048)"
          className="w-full rounded border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={assessThreat}
          disabled={threatLoading || !threatAlg.trim()}
          className="px-4 py-2 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {threatLoading ? 'Assessing…' : 'Assess Threat'}
        </button>
        {threatResult && (
          <div className="space-y-1 text-sm mt-2">
            <p className={cn('font-semibold', riskColor(threatResult.risk_level))}>
              Risk: {threatResult.risk_level}
            </p>
            <p className="text-slate-400 text-xs">Time to break: {threatResult.time_to_break}</p>
            <p className="text-slate-300 text-xs">{threatResult.recommendation}</p>
          </div>
        )}
      </section>
    </div>
  );
}

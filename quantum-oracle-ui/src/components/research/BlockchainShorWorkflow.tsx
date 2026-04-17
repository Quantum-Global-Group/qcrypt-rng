'use client';

import { useState, useCallback } from 'react';
import {
  createBlockchainWallet,
  signData,
  simulateBlockchainAttack,
  assessQuantumThreat,
} from '@/utils/api';
import { Panel, PanelHeader, PanelBody, MonoOut } from '@/components/research/shared';
import { cn } from '@/lib/utils';

type WfLoading = 'idle' | 'wallet' | 'sign' | 'attack' | 'full';

interface WfState {
  vulnerableAddress: string;
  quantumSafeAddress: string;
  signature: string;
  attackResult: string;
  riskLevel: string;
}

const ATTACK_TARGETS = ['RSA-2048', 'ECDSA-256', 'RSA-4096', 'ECDSA-384'] as const;

export function BlockchainShorWorkflow() {
  const [loading, setLoading] = useState<WfLoading>('idle');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<Partial<WfState>>({});
  const [target, setTarget] = useState<string>('ECDSA-256');
  const [message, setMessage] = useState('Quantum-safe transaction payload — block 9182');

  const step = useCallback(
    async (which: 'wallet' | 'sign' | 'attack') => {
      setLoading(which);
      setError(null);
      try {
        if (which === 'wallet') {
          const res = await createBlockchainWallet('both');
          const d = res.data as Record<string, unknown>;
          setState((p) => ({
            ...p,
            vulnerableAddress: String(d.vulnerable_address ?? d.address ?? 'N/A'),
            quantumSafeAddress: String(d.quantum_safe_address ?? d.address ?? 'N/A'),
          }));
        } else if (which === 'sign') {
          const res = await signData(message, 'HMAC-SHA256');
          const d = res.data;
          setState((p) => ({ ...p, signature: String(d?.signature ?? '') }));
        } else {
          const [attackRes, threatRes] = await Promise.all([
            simulateBlockchainAttack(target as 'RSA-2048' | 'ECDSA-256', true),
            assessQuantumThreat(target),
          ]);
          const atk = attackRes.data as Record<string, unknown>;
          const risk = String(threatRes.data?.assessment?.risk_level ?? 'UNKNOWN');
          const summary = [
            `Target: ${target}`,
            `Status: ${atk.status ?? 'simulated'}`,
            `Time to break: ${atk.time_to_break ?? threatRes.data?.assessment?.time_to_break ?? 'N/A'}`,
            `Risk level: ${risk}`,
            `Recommendation: ${threatRes.data?.assessment?.recommendation ?? ''}`,
          ].join('\n');
          setState((p) => ({ ...p, attackResult: summary, riskLevel: risk }));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Step failed');
      } finally {
        setLoading('idle');
      }
    },
    [message, target],
  );

  const runFull = useCallback(async () => {
    setLoading('full');
    setError(null);
    setState({});
    try {
      const wRes = await createBlockchainWallet('both');
      const d = wRes.data as Record<string, unknown>;
      const va = String(d.vulnerable_address ?? d.address ?? 'N/A');
      const qsa = String(d.quantum_safe_address ?? d.address ?? 'N/A');

      const sRes = await signData(message, 'HMAC-SHA256');
      const sig = String(sRes.data?.signature ?? '');

      const [atkRes, thrRes] = await Promise.all([
        simulateBlockchainAttack(target as 'RSA-2048' | 'ECDSA-256', true),
        assessQuantumThreat(target),
      ]);
      const atk = atkRes.data as Record<string, unknown>;
      const risk = String(thrRes.data?.assessment?.risk_level ?? 'UNKNOWN');
      const summary = [
        `Target: ${target}`,
        `Status: ${atk.status ?? 'simulated'}`,
        `Time to break: ${atk.time_to_break ?? thrRes.data?.assessment?.time_to_break ?? 'N/A'}`,
        `Risk level: ${risk}`,
        `Recommendation: ${thrRes.data?.assessment?.recommendation ?? ''}`,
      ].join('\n');

      setState({ vulnerableAddress: va, quantumSafeAddress: qsa, signature: sig, attackResult: summary, riskLevel: risk });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Workflow failed');
    } finally {
      setLoading('idle');
    }
  }, [message, target]);

  const busy = loading !== 'idle';

  const riskColor = (r?: string) =>
    !r ? 'text-slate-400' :
    r.includes('CRITICAL') ? 'text-red-400' :
    r.includes('HIGH') ? 'text-orange-400' :
    r.includes('MED') ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Blockchain + Shor Attack Workflow</h2>
        <p className="text-sm text-slate-400 mt-1">
          Step-by-step demonstration: create both a vulnerable and quantum-safe wallet,
          sign a transaction, then simulate a Shor-algorithm break against the classical key.
        </p>
      </div>

      {/* Config */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1 flex-1 min-w-48">
          <div className="text-xs text-slate-500">Message / Transaction Payload</div>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={busy}
            className="w-full rounded border border-slate-600 bg-slate-800/60 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Attack Target</div>
          <div className="flex gap-1">
            {ATTACK_TARGETS.map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                disabled={busy}
                className={cn(
                  'px-2.5 py-1 rounded text-xs border transition-colors',
                  target === t
                    ? 'border-red-500 bg-red-500/10 text-red-300'
                    : 'border-slate-600 text-slate-400 hover:border-slate-400',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={runFull}
          disabled={busy}
          className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {loading === 'full' ? 'Running…' : 'Run Full Workflow'}
        </button>
        <span className="text-slate-600 self-center">or step-by-step:</span>
        {(['wallet', 'sign', 'attack'] as const).map((s) => (
          <button
            key={s}
            onClick={() => step(s)}
            disabled={busy}
            className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm transition-colors capitalize"
          >
            {loading === s ? '…' : s}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Results */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <PanelHeader>
            <span className="text-sm font-medium text-white">Wallet Addresses</span>
          </PanelHeader>
          <PanelBody className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Vulnerable (ECDSA)</div>
              <MonoOut value={state.vulnerableAddress ?? ''} placeholder="Run wallet step…" rows={2} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Quantum-Safe (DILITHIUM)</div>
              <MonoOut value={state.quantumSafeAddress ?? ''} placeholder="Run wallet step…" rows={2} />
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <span className="text-sm font-medium text-white">Transaction Signature</span>
          </PanelHeader>
          <PanelBody>
            <MonoOut value={state.signature ?? ''} placeholder="Run sign step…" rows={5} />
          </PanelBody>
        </Panel>

        <Panel className="md:col-span-2">
          <PanelHeader>
            <span className="text-sm font-medium text-white">Shor Attack Simulation</span>
            {state.riskLevel && (
              <span className={cn('text-xs font-semibold', riskColor(state.riskLevel))}>
                {state.riskLevel}
              </span>
            )}
          </PanelHeader>
          <PanelBody>
            <MonoOut value={state.attackResult ?? ''} placeholder="Run attack step…" rows={6} />
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

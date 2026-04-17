'use client';

import { useState, useCallback } from 'react';
import { createVrfSeed, vrfProve, vrfReveal, vrfVerify } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useBlockchain } from './BlockchainContext';
import { AnalystEvidencePanel, SectionLabel } from './AnalystEvidencePanel';

type Phase = 'idle' | 'seed' | 'prove' | 'reveal' | 'verify' | 'done';

interface VrfState {
  requestId: string;
  commitment: string;
  alpha: string;
  output: string;
  seed: string;
  valid: boolean;
}

export function RandomizeFairness() {
  const { network } = useBlockchain();

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [vrf, setVrf] = useState<Partial<VrfState>>({});
  const [alphaInput, setAlphaInput] = useState('block_1234_fairness_seed');

  const runVrfFlow = useCallback(async () => {
    setError(null);
    setVrf({});

    try {
      // 1. Seed
      setPhase('seed');
      const seedRes = await createVrfSeed(network.id);
      if (!seedRes.data) throw new Error('VRF seed failed');
      const { request_id, commitment } = seedRes.data;
      setVrf({ requestId: request_id, commitment });

      // 2. Prove
      setPhase('prove');
      const alpha = alphaInput.trim() || 'fairness_input';
      const proveRes = await vrfProve(request_id, alpha);
      if (!proveRes.data) throw new Error('VRF prove failed');
      const { output } = proveRes.data;
      setVrf((p) => ({ ...p, alpha, output }));

      // 3. Reveal
      setPhase('reveal');
      const revealRes = await vrfReveal(request_id);
      if (!revealRes.data) throw new Error('VRF reveal failed');
      const { seed } = revealRes.data;
      setVrf((p) => ({ ...p, seed }));

      // 4. Verify
      setPhase('verify');
      const verRes = await vrfVerify({ commitment, alpha, output, seed });
      const valid = verRes.data?.valid ?? false;

      setVrf((p) => ({ ...p, valid } as VrfState));
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setPhase('idle');
    }
  }, [network.id, alphaInput]);

  const phases: Phase[] = ['seed', 'prove', 'reveal', 'verify'];
  const phaseIdx = phases.indexOf(phase);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Verifiable Randomness (VRF)</h2>
        <p className="text-sm text-slate-400 mt-1">
          Commit → Prove → Reveal workflow for tamper-proof on-chain fairness on{' '}
          <span className="text-white">{network.name}</span>.
        </p>
      </div>

      <div className="space-y-2">
        <SectionLabel>Alpha Input (public seed / block hash)</SectionLabel>
        <input
          value={alphaInput}
          onChange={(e) => setAlphaInput(e.target.value)}
          className="w-full rounded border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="block_1234_fairness_seed"
        />
      </div>

      <button
        onClick={runVrfFlow}
        disabled={phase !== 'idle' && phase !== 'done'}
        className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {phase === 'idle' || phase === 'done' ? 'Run VRF Flow' : 'Running…'}
      </button>

      {/* Phase progress */}
      {phase !== 'idle' && (
        <div className="flex gap-5 text-xs">
          {phases.map((p, i) => (
            <span
              key={p}
              className={cn(
                'capitalize',
                i < phaseIdx ? 'text-green-400' :
                i === phaseIdx ? 'text-indigo-400 animate-pulse' :
                'text-slate-600',
              )}
            >
              {p}{i < phaseIdx && ' ✓'}
            </span>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {phase === 'done' && vrf.valid !== undefined && (
        <div className="space-y-3">
          <p className={cn('text-sm font-semibold', vrf.valid ? 'text-green-400' : 'text-red-400')}>
            {vrf.valid ? '✓ VRF Output Verified' : '✗ VRF Verification Failed'}
          </p>
          <AnalystEvidencePanel
            title="VRF Proof Record"
            fields={[
              { label: 'Request ID', value: vrf.requestId ?? '' },
              { label: 'Commitment (publish on-chain before reveal)', value: vrf.commitment ?? '' },
              { label: 'Alpha Input', value: vrf.alpha ?? '' },
              { label: 'VRF Output (verifiable random value)', value: vrf.output ?? '', downloadFilename: 'vrf_output.txt' },
              { label: 'Revealed Seed', value: vrf.seed ?? '' },
            ]}
          />
        </div>
      )}
    </div>
  );
}

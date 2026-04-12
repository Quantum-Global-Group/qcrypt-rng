'use client';

import { useState, useCallback } from 'react';
import {
  ResearchHeader,
  Panel,
  PanelHeader,
  PanelBody,
  Field,
  RunButton,
  GhostButton,
  MonoOut,
  Chip,
  MetaRow,
  SectionDivider,
} from '@/components/research/shared';
import { useExperimentLog } from '@/hooks/useExperimentLog';
import { createVrfSeed, vrfProve, vrfReveal, vrfVerify } from '@/utils/api';

export default function ResearchVrfPage() {
  const { add } = useExperimentLog();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [commitment, setCommitment] = useState<string | null>(null);
  const [alpha, setAlpha] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [seed, setSeed] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const [vC, setVC] = useState('');
  const [vA, setVA] = useState('');
  const [vO, setVO] = useState('');
  const [vS, setVS] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean } | null>(null);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSeed = useCallback(async () => {
    setError(null);
    setOutput(null);
    setSeed(null);
    setRevealed(false);
    setLoading('seed');
    const t0 = performance.now();
    try {
      const r = await createVrfSeed();
      setRequestId(r.data.request_id);
      setCommitment(r.data.commitment);
      add('vrf_seed', '/research/vrf', {
        request_id: r.data.request_id,
        commitment: r.data.commitment,
      }, performance.now() - t0);
      (window as unknown as Record<string, () => void>).__researchIncrOps?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'VRF seed failed');
    } finally {
      setLoading(null);
    }
  }, [add]);

  const onProve = useCallback(async () => {
    if (!requestId || !alpha.trim()) return;
    setError(null);
    setLoading('prove');
    const t0 = performance.now();
    try {
      const r = await vrfProve(requestId, alpha.trim());
      setOutput(r.data.output);
      add('vrf_prove', '/research/vrf', {
        request_id: requestId,
        alpha: alpha.trim(),
        output: r.data.output,
      }, performance.now() - t0);
      (window as unknown as Record<string, () => void>).__researchIncrOps?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'VRF prove failed');
    } finally {
      setLoading(null);
    }
  }, [requestId, alpha, add]);

  const onReveal = useCallback(async () => {
    if (!requestId) return;
    setError(null);
    setLoading('reveal');
    const t0 = performance.now();
    try {
      const r = await vrfReveal(requestId);
      setSeed(r.data.seed);
      setRevealed(true);
      add('vrf_reveal', '/research/vrf', {
        request_id: requestId,
        seed: r.data.seed,
      }, performance.now() - t0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'VRF reveal failed');
    } finally {
      setLoading(null);
    }
  }, [requestId, add]);

  const onVerify = useCallback(async () => {
    setError(null);
    setVerifyResult(null);
    setLoading('verify');
    const t0 = performance.now();
    try {
      const r = await vrfVerify({
        commitment: vC.trim(),
        alpha: vA.trim(),
        output: vO.trim(),
        seed: vS.trim(),
      });
      setVerifyResult(r.data);
      add('vrf_verify', '/research/vrf', {
        commitment: vC.trim(),
        alpha: vA.trim(),
        valid: r.data.valid,
      }, performance.now() - t0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verify failed');
    } finally {
      setLoading(null);
    }
  }, [vC, vA, vO, vS, add]);

  return (
    <div className="page-enter min-w-0">
      <ResearchHeader
        eyebrow="Primitive · VRF"
        title="VRF / Commitment"
        description="Quantum-backed VRF seed, prove, and reveal. Verify a proof offline using commitment, alpha, output, and seed."
      />

      {error && (
        <div className="mb-4 font-mono text-[10px] text-error border border-error/30 px-3 py-2 rounded-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 items-start">
        <Panel>
          <PanelHeader title="Commit–reveal flow" />
          <PanelBody>
            <RunButton onClick={onSeed} loading={loading === 'seed'}>
              Step 1 — Create seed / commitment
            </RunButton>
            {commitment && (
              <div className="mt-3 space-y-2">
                <MetaRow label="Request ID" value={requestId ?? undefined} />
                <Field label="Commitment">
                  <MonoOut value={commitment} minHeight="40px" copyable highlight="primary" />
                </Field>
                <Field label="Alpha (input)">
                  <input value={alpha} onChange={(e) => setAlpha(e.target.value)} placeholder="e.g. round id" />
                </Field>
                <div className="flex gap-2">
                  <RunButton onClick={onProve} loading={loading === 'prove'} disabled={!requestId}>
                    Step 2 — Prove
                  </RunButton>
                  <RunButton onClick={onReveal} loading={loading === 'reveal'} disabled={!requestId}>
                    Step 3 — Reveal
                  </RunButton>
                </div>
                {output && (
                  <Field label="VRF output">
                    <MonoOut value={output} minHeight="36px" copyable />
                  </Field>
                )}
                {revealed && seed && (
                  <Field label="Revealed seed">
                    <MonoOut value={seed} minHeight="36px" copyable highlight="secondary" />
                  </Field>
                )}
              </div>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Verify proof" right={<Chip variant="info">Independent check</Chip>} />
          <PanelBody>
            <Field label="Commitment">
              <input value={vC} onChange={(e) => setVC(e.target.value)} placeholder="0x…" />
            </Field>
            <Field label="Alpha">
              <input value={vA} onChange={(e) => setVA(e.target.value)} />
            </Field>
            <Field label="Output">
              <input value={vO} onChange={(e) => setVO(e.target.value)} />
            </Field>
            <Field label="Seed">
              <input value={vS} onChange={(e) => setVS(e.target.value)} />
            </Field>
            <GhostButton
              onClick={() => {
                if (commitment) setVC(commitment);
                if (alpha) setVA(alpha);
                if (output) setVO(output);
                if (seed) setVS(seed);
              }}
            >
              Fill from flow
            </GhostButton>
            <div className="mt-2">
              <RunButton onClick={onVerify} loading={loading === 'verify'}>
                Verify
              </RunButton>
            </div>
            {verifyResult && (
              <>
                <SectionDivider />
                <Chip variant={verifyResult.valid ? 'verified' : 'degraded'}>
                  {verifyResult.valid ? 'VALID' : 'INVALID'}
                </Chip>
              </>
            )}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

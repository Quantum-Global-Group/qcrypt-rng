'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import {
  createBlockchainWallet,
  signBlockchainTransaction,
  simulateBlockchainAttack,
  type ShorSimTarget,
} from '@/utils/api';
import { Panel, PanelHeader, PanelBody, MonoOut } from '@/components/research/shared';
import { cn } from '@/lib/utils';

type WfLoading = 'idle' | 'wallet' | 'sign' | 'attack' | 'full';

async function sha256HexCanonical(obj: Record<string, unknown>): Promise<string> {
  const s = JSON.stringify(obj, Object.keys(obj).sort());
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function pickAddr(w: Record<string, unknown> | undefined, key: 'vulnerable' | 'quantum_safe'): string | null {
  if (!w || typeof w !== 'object') return null;
  const block = w[key] as Record<string, unknown> | undefined;
  const a = block?.address;
  return typeof a === 'string' ? a : null;
}

const TARGETS: { id: ShorSimTarget; label: string }[] = [
  { id: 'ECDSA-256', label: 'ECDSA-256 (matches demo tx)' },
  { id: 'RSA-2048', label: 'RSA-2048' },
  { id: 'ECDSA-384', label: 'ECDSA-384' },
  { id: 'RSA-4096', label: 'RSA-4096' },
  { id: 'DILITHIUM3', label: 'DILITHIUM3 (attack fails)' },
];

export function BlockchainShorWorkflow() {
  const [attackTarget, setAttackTarget] = useState<ShorSimTarget>('ECDSA-256');
  const [loading, setLoading] = useState<WfLoading>('idle');
  const [err, setErr] = useState<string | null>(null);

  const [walletJson, setWalletJson] = useState('');
  const [signJson, setSignJson] = useState('');
  const [attackJson, setAttackJson] = useState('');
  const [proofHex, setProofHex] = useState<string | null>(null);

  const stepCreateWallet = useCallback(async () => {
    setErr(null);
    setLoading('wallet');
    setProofHex(null);
    try {
      const res = await createBlockchainWallet('both');
      setWalletJson(JSON.stringify(res, null, 2));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Wallet step failed');
    } finally {
      setLoading('idle');
    }
  }, []);

  const stepSign = useCallback(async () => {
    setErr(null);
    setLoading('sign');
    setProofHex(null);
    try {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(walletJson) as Record<string, unknown>;
      } catch {
        throw new Error('Create wallets first (valid JSON required).');
      }
      const data = parsed.data as Record<string, unknown> | undefined;
      const fromA = pickAddr(data, 'vulnerable');
      const toA = pickAddr(data, 'quantum_safe');
      if (!fromA || !toA) throw new Error('Could not read vulnerable / quantum_safe addresses from wallet response.');

      const res = await signBlockchainTransaction({
        from_address: fromA,
        to_address: toA,
        amount: 1,
        signature_type: 'both',
      });
      setSignJson(JSON.stringify(res, null, 2));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign step failed');
    } finally {
      setLoading('idle');
    }
  }, [walletJson]);

  const stepAttack = useCallback(async () => {
    setErr(null);
    setLoading('attack');
    setProofHex(null);
    try {
      const res = await simulateBlockchainAttack(attackTarget, true);
      setAttackJson(JSON.stringify(res, null, 2));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Attack simulation failed');
    } finally {
      setLoading('idle');
    }
  }, [attackTarget]);

  const runFull = useCallback(async () => {
    setErr(null);
    setLoading('full');
    setProofHex(null);
    setWalletJson('');
    setSignJson('');
    setAttackJson('');
    try {
      const w = await createBlockchainWallet('both');
      setWalletJson(JSON.stringify(w, null, 2));

      const data = w.data as Record<string, unknown>;
      const fromA = pickAddr(data, 'vulnerable');
      const toA = pickAddr(data, 'quantum_safe');
      if (!fromA || !toA) throw new Error('Wallet response missing addresses.');

      const s = await signBlockchainTransaction({
        from_address: fromA,
        to_address: toA,
        amount: 1,
        signature_type: 'both',
      });
      setSignJson(JSON.stringify(s, null, 2));

      const a = await simulateBlockchainAttack(attackTarget, true);
      setAttackJson(JSON.stringify(a, null, 2));

      const tx = (s.data as Record<string, unknown>)?.transaction as Record<string, unknown> | undefined;
      const sim = (a.data as Record<string, unknown>)?.simulation as Record<string, unknown> | undefined;
      const result = sim?.result as Record<string, unknown> | undefined;

      const proofInput: Record<string, unknown> = {
        workflow: 'shor_blockchain_v1',
        request_ids: { wallet: w.request_id, tx: s.request_id, attack: a.request_id },
        addresses: { from: fromA, to: toA },
        attack_target: attackTarget,
        attack_status: result?.status ?? null,
        tx_nonce: tx?.nonce ?? null,
      };
      setProofHex(await sha256HexCanonical(proofInput));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Full workflow failed');
    } finally {
      setLoading('idle');
    }
  }, [attackTarget]);

  const busy = loading !== 'idle';

  return (
    <div className="space-y-6">
      <p className="text-[13px] leading-relaxed text-on-surface-variant max-w-3xl">
        Guided demo: create classical and post-quantum wallets, sign a transaction with both vulnerable (ECDSA) and
        quantum-safe (Dilithium) paths, then run the API&apos;s Shor attack simulation. The digest binds wallet IDs,
        addresses, transaction nonce, and attack outcome for a reproducible audit trail (same as the{' '}
        <Link href="/blockchain/wallet" className="text-primary underline hover:text-primary/90">
          Smart Wallet
        </Link>{' '}
        lab, orchestrated here as one flow).
      </p>

      {err && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 font-mono text-[12px] text-error" role="alert">
          {err}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void runFull()}
          className="btn-primary font-mono text-[11px]"
        >
          {loading === 'full' ? 'Running full workflow…' : 'Run full workflow'}
        </button>
        <span className="font-mono text-[10px] text-outline">or run each step:</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="md:col-span-1">
          <PanelHeader
            title="① Create wallets"
            right={
              <button
                type="button"
                disabled={busy}
                onClick={() => void stepCreateWallet()}
                className={cn(
                  'chip chip-info font-mono text-[10px]',
                  busy ? 'opacity-50' : 'hover:bg-primary/20',
                )}
              >
                {loading === 'wallet' ? '…' : 'POST'}
              </button>
            }
          />
          <PanelBody>
            <MonoOut value={walletJson || undefined} placeholder="/blockchain/create-wallet (both)" minHeight="140px" copyable />
          </PanelBody>
        </Panel>

        <Panel className="md:col-span-1">
          <PanelHeader
            title="② Sign transaction"
            right={
              <button
                type="button"
                disabled={busy || !walletJson}
                onClick={() => void stepSign()}
                className={cn(
                  'chip chip-info font-mono text-[10px]',
                  busy || !walletJson ? 'opacity-50' : 'hover:bg-primary/20',
                )}
              >
                {loading === 'sign' ? '…' : 'POST'}
              </button>
            }
          />
          <PanelBody>
            <MonoOut value={signJson || undefined} placeholder="/blockchain/sign-transaction" minHeight="140px" copyable />
          </PanelBody>
        </Panel>

        <Panel className="md:col-span-1">
          <PanelHeader
            title="③ Shor simulation"
            right={
              <button
                type="button"
                disabled={busy}
                onClick={() => void stepAttack()}
                className={cn(
                  'chip chip-info font-mono text-[10px]',
                  busy ? 'opacity-50' : 'hover:bg-secondary/30',
                )}
              >
                {loading === 'attack' ? '…' : 'POST'}
              </button>
            }
          />
          <PanelBody className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {TARGETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAttackTarget(t.id)}
                  className={cn(
                    'rounded border px-2 py-1 font-mono text-[10px] transition-colors',
                    attackTarget === t.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/50',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <MonoOut value={attackJson || undefined} placeholder="/blockchain/simulate-attack" minHeight="140px" copyable />
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="④ Workflow proof (SHA-256)" />
        <PanelBody className="space-y-2">
          <p className="text-[12px] text-on-surface-variant">
            After <strong className="font-medium text-on-surface">Run full workflow</strong>, a canonical JSON bundle is
            hashed in the browser (request ids, addresses, attack target, status, tx nonce).
          </p>
          <MonoOut
            value={proofHex ?? undefined}
            placeholder="Run full workflow to produce digest_hex"
            minHeight="52px"
            copyable
            highlight="secondary"
          />
        </PanelBody>
      </Panel>
    </div>
  );
}

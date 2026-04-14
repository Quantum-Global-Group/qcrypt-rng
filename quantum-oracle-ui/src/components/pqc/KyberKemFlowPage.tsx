'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Binary, FlaskConical, KeyRound } from 'lucide-react';
import { kemDecapsulate, kemEncapsulate, kemGenerate } from '@/utils/api';
import type { KemDecapsulateResponse, KemEncapsulateResponse, KemKeypairResponse } from '@/types';
import { cn } from '@/lib/utils';

type KyberAlg = 'KYBER512' | 'KYBER768' | 'KYBER1024';
type Encoding = 'base64' | 'hex';

const STEPS = [
  { n: 1, title: 'Generate', sub: 'Create Kyber keypair' },
  { n: 2, title: 'Encapsulate', sub: 'Derive shared secret from public key' },
  { n: 3, title: 'Decapsulate', sub: 'Recover shared secret with private key' },
];

export function KyberKemFlowPage({ researchLayout = false }: { researchLayout?: boolean }) {
  const [algorithm, setAlgorithm] = useState<KyberAlg>('KYBER768');
  const [encoding, setEncoding] = useState<Encoding>('base64');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [keypair, setKeypair] = useState<KemKeypairResponse | null>(null);
  const [encap, setEncap] = useState<KemEncapsulateResponse | null>(null);
  const [decap, setDecap] = useState<KemDecapsulateResponse | null>(null);

  const runGenerate = async () => {
    setError(null);
    setLoading(true);
    setEncap(null);
    setDecap(null);
    try {
      const res = await kemGenerate(algorithm, encoding);
      setKeypair(res.data);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generate failed');
    } finally {
      setLoading(false);
    }
  };

  const runEncapsulate = async () => {
    if (!keypair?.public_key) return;
    setError(null);
    setLoading(true);
    try {
      const res = await kemEncapsulate(keypair.public_key, algorithm, encoding);
      setEncap(res.data);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encapsulate failed');
    } finally {
      setLoading(false);
    }
  };

  const runDecapsulate = async () => {
    if (!keypair?.private_key || !encap?.ciphertext) return;
    setError(null);
    setLoading(true);
    try {
      const res = await kemDecapsulate(encap.ciphertext, keypair.private_key, algorithm, encoding);
      setDecap(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decapsulate failed');
    } finally {
      setLoading(false);
    }
  };

  const match = encap && decap ? encap.shared_secret === decap.shared_secret : null;

  return (
    <div
      className={cn(
        'min-h-full text-on-surface',
        researchLayout ? 'w-full space-y-8' : 'w-full py-8 pb-14',
      )}
    >
      {!researchLayout && (
        <header className="page-enter border-b border-outline-variant/15 pb-8">
          <p className="font-label text-[11px] font-medium uppercase tracking-[0.08em] text-outline">Kyber · KEM</p>
          <h1 className="mt-2 font-headline text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
            Kyber encapsulation flow
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            Three-step workflow aligned with{' '}
            <code className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[11px] text-primary">
              /api/v2/pqc/kem/*
            </code>{' '}
            endpoints: create a Kyber keypair, encapsulate a shared secret to a ciphertext, then decapsulate with the
            private key to recover the same secret.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/pqc"
              className="inline-flex items-center gap-2 rounded-md border border-outline-variant/25 bg-surface-container/60 px-3 py-2 text-[13px] text-on-surface transition-colors hover:border-primary/35 hover:bg-surface-container-high"
            >
              <Binary className="h-4 w-4 text-outline" strokeWidth={1.75} aria-hidden />
              <span className="font-medium">PQC workspace</span>
              <span className="text-on-surface-variant">· Full suite</span>
            </Link>
            <Link
              href="/pqc/keys"
              className="inline-flex items-center gap-2 rounded-md border border-outline-variant/25 bg-surface-container/60 px-3 py-2 text-[13px] text-on-surface transition-colors hover:border-primary/35 hover:bg-surface-container-high"
            >
              <KeyRound className="h-4 w-4 text-outline" strokeWidth={1.75} aria-hidden />
              <span className="font-medium">Key generation</span>
              <span className="text-on-surface-variant">· Other PQC keys</span>
            </Link>
            <Link
              href="/research/pqc/kem"
              className="inline-flex items-center gap-2 rounded-md border border-outline-variant/25 bg-surface-container/60 px-3 py-2 text-[13px] text-on-surface transition-colors hover:border-primary/35 hover:bg-surface-container-high"
            >
              <FlaskConical className="h-4 w-4 text-outline" strokeWidth={1.75} aria-hidden />
              <span className="font-medium">ML-KEM lab</span>
              <span className="text-on-surface-variant">· Research</span>
            </Link>
          </div>
        </header>
      )}

      {/* Parameters bar */}
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-outline mb-2">
              Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as KyberAlg)}
              className="field"
            >
              <option value="KYBER512">KYBER512</option>
              <option value="KYBER768">KYBER768</option>
              <option value="KYBER1024">KYBER1024</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-outline mb-2">
              Encoding
            </label>
            <div className="flex gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1">
              {(['base64', 'hex'] as const).map((enc) => (
                <button
                  key={enc}
                  type="button"
                  onClick={() => setEncoding(enc)}
                  className={cn(
                    'flex-1 rounded py-1.5 font-mono text-[11px] font-medium px-3 transition-colors',
                    encoding === enc
                      ? 'bg-primary/15 text-primary'
                      : 'text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  {enc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 font-mono text-[12px] text-error" role="alert">
          {error}
        </div>
      )}

      {/* 3-column step grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Step 1 — Generate */}
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold transition-colors',
                step > 1 ? 'bg-primary/20 text-primary' : step === 1 ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-outline',
              )}
            >
              1
            </span>
            <div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                {STEPS[0].title}
              </div>
              <div className="font-mono text-[11px] text-on-surface-variant">{STEPS[0].sub}</div>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={runGenerate}
            className="btn-primary w-full"
          >
            {loading && step === 1 ? 'Working…' : 'Generate keypair'}
          </button>

          {keypair ? (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest/40 p-6 space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-outline">Result</p>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline">Algorithm</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">{keypair.algorithm}</span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline">Public key</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {keypair.public_key.slice(0, 32)}…
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline">Private key</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {keypair.private_key.slice(0, 32)}…
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-outline-variant/25">
              <span className="font-mono text-[11px] text-outline/50">Generate to see keypair</span>
            </div>
          )}
        </div>

        {/* Step 2 — Encapsulate */}
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold transition-colors',
                step > 2 ? 'bg-primary/20 text-primary' : step === 2 ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-outline',
              )}
            >
              2
            </span>
            <div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                {STEPS[1].title}
              </div>
              <div className="font-mono text-[11px] text-on-surface-variant">{STEPS[1].sub}</div>
            </div>
          </div>

          <button
            type="button"
            disabled={loading || !keypair}
            onClick={runEncapsulate}
            className="btn-secondary w-full"
          >
            {loading && step === 2 ? 'Working…' : 'Encapsulate'}
          </button>

          {encap ? (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest/40 p-6 space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-outline">Result</p>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline">Ciphertext</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {encap.ciphertext.slice(0, 32)}…
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline">Shared secret</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {encap.shared_secret.slice(0, 24)}…
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-outline-variant/25">
              <span className="font-mono text-[11px] text-outline/50">
                {keypair ? 'Click Encapsulate' : 'Complete step 1 first'}
              </span>
            </div>
          )}
        </div>

        {/* Step 3 — Decapsulate */}
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold transition-colors',
                decap ? 'bg-primary/20 text-primary' : step === 3 ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-outline',
              )}
            >
              3
            </span>
            <div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                {STEPS[2].title}
              </div>
              <div className="font-mono text-[11px] text-on-surface-variant">{STEPS[2].sub}</div>
            </div>
          </div>

          <button
            type="button"
            disabled={loading || !keypair || !encap}
            onClick={runDecapsulate}
            className="btn-secondary w-full"
          >
            {loading && step === 3 ? 'Working…' : 'Decapsulate'}
          </button>

          {decap ? (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest/40 p-6 space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-outline">Result</p>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline">Shared secret</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {decap.shared_secret.slice(0, 32)}…
                </span>
              </div>
              {match !== null && (
                <div className="flex items-start justify-between gap-4 py-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-outline">Match</span>
                  <span>
                    {match ? (
                      <span className="chip chip-verified">Match</span>
                    ) : (
                      <span className="chip chip-degraded">Mismatch</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-outline-variant/25">
              <span className="font-mono text-[11px] text-outline/50">
                {encap ? 'Click Decapsulate' : 'Complete step 2 first'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

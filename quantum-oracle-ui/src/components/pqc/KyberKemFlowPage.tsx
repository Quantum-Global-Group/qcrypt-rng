'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Binary,
  BookOpen,
  FlaskConical,
  KeyRound,
  Link2,
  Lock,
  Unlock,
} from 'lucide-react';
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

  const preClass =
    'max-h-52 overflow-auto rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4 font-mono text-[11px] leading-relaxed text-on-surface-variant';

  const panelClass = cn(
    'rounded-xl border border-outline-variant/20 bg-surface-container-low/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
    researchLayout ? 'p-6 md:p-8' : 'p-5 md:p-6',
  );

  const stepperCard = (s: (typeof STEPS)[0]) => (
    <div
      key={s.n}
      className={cn(
        'flex min-h-[5.5rem] min-w-0 flex-1 items-start gap-4 rounded-xl border px-4 py-4 transition-colors sm:min-w-[160px]',
        step === s.n
          ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(0,212,168,0.2)]'
          : 'border-outline-variant/25 bg-surface-container-low hover:border-outline-variant/40',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold',
          step >= s.n ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-outline',
        )}
      >
        {s.n}
      </span>
      <div className="min-w-0 pt-0.5">
        <div className="font-headline text-sm font-semibold tracking-tight text-on-surface">{s.title}</div>
        <div className="mt-1 font-mono text-[11px] leading-snug text-on-surface-variant">{s.sub}</div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'min-h-full text-on-surface',
        researchLayout ? 'w-full space-y-10 lg:space-y-14' : 'w-full py-8 pb-14',
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

      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:gap-4',
          researchLayout ? 'w-full' : 'mt-10',
        )}
      >
        {STEPS.map((s) => stepperCard(s))}
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12',
          researchLayout ? 'mt-10 xl:items-start' : 'mt-10',
        )}
      >
        <div className={cn('space-y-8', researchLayout ? 'xl:col-span-8' : 'lg:col-span-7')}>
          <section className={panelClass}>
            <h2 className="mb-6 font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
              Parameters
            </h2>
            <div className="flex flex-col gap-8 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-[200px] flex-1">
                <label className="mb-2 block font-label text-[10px] font-semibold uppercase tracking-wide text-outline">
                  Algorithm
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as KyberAlg)}
                  className="field w-full max-w-xs rounded-md border-outline-variant/25 bg-surface-container-lowest px-4 py-3 font-mono text-sm"
                >
                  <option value="KYBER512">KYBER512</option>
                  <option value="KYBER768">KYBER768</option>
                  <option value="KYBER1024">KYBER1024</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block font-label text-[10px] font-semibold uppercase tracking-wide text-outline">
                  Encoding
                </label>
                <div className="inline-flex gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-low p-1">
                  {(['base64', 'hex'] as const).map((enc) => (
                    <button
                      key={enc}
                      type="button"
                      onClick={() => setEncoding(enc)}
                      className={cn(
                        'rounded-md px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors',
                        encoding === enc
                          ? 'bg-primary-container text-on-primary-container shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                      )}
                    >
                      {enc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {error && (
            <p className="error-banner text-sm" role="alert">
              {error}
            </p>
          )}

          <section className={cn(panelClass, 'space-y-5')}>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden />
              <h2 className="font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Step 1 — Generate
              </h2>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={runGenerate}
              className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 normal-case tracking-normal"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden>
                key
              </span>
              {loading && step === 1 ? 'Working…' : 'Generate keypair'}
            </button>
            {keypair && (
              <pre className={preClass}>
                {JSON.stringify(
                  {
                    algorithm: keypair.algorithm,
                    public_key: `${keypair.public_key.slice(0, 48)}…`,
                    private_key: `${keypair.private_key.slice(0, 48)}…`,
                  },
                  null,
                  2,
                )}
              </pre>
            )}
          </section>

          <section className={cn(panelClass, 'space-y-5')}>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-secondary" strokeWidth={1.75} aria-hidden />
              <h2 className="font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Step 2 — Encapsulate
              </h2>
            </div>
            <p className="text-[13px] leading-relaxed text-on-surface-variant">
              Uses the generated public key to produce a ciphertext and shared secret (sender side).
            </p>
            <button
              type="button"
              disabled={loading || !keypair}
              onClick={runEncapsulate}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-secondary-container px-8 py-3 text-sm font-semibold text-on-secondary-container transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Lock className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Encapsulate
            </button>
            {encap && (
              <pre className={preClass}>
                {JSON.stringify(
                  {
                    ciphertext: `${encap.ciphertext.slice(0, 40)}…`,
                    shared_secret: `${encap.shared_secret.slice(0, 24)}…`,
                  },
                  null,
                  2,
                )}
              </pre>
            )}
          </section>

          <section className={cn(panelClass, 'space-y-5')}>
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
              <h2 className="font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Step 3 — Decapsulate
              </h2>
            </div>
            <p className="text-[13px] leading-relaxed text-on-surface-variant">
              Recipient uses the private key and ciphertext to recover the shared secret; it should match Step 2.
            </p>
            <button
              type="button"
              disabled={loading || !keypair || !encap}
              onClick={runDecapsulate}
              className="btn-secondary inline-flex items-center justify-center gap-2 px-8 py-3 normal-case tracking-normal"
            >
              <Unlock className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Decapsulate
            </button>
            {decap && (
              <>
                <pre className={preClass}>
                  {JSON.stringify({ shared_secret: `${decap.shared_secret.slice(0, 32)}…` }, null, 2)}
                </pre>
                {match !== null && (
                  <p
                    className={cn(
                      'font-mono text-sm',
                      match ? 'text-primary' : 'text-error',
                    )}
                  >
                    {match ? 'Shared secrets match.' : 'Shared secrets differ — check algorithm/encoding.'}
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        <aside className={cn(researchLayout ? 'xl:col-span-4' : 'lg:col-span-5')}>
          <div className="sticky top-24 space-y-6 rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:p-7">
            <div>
              <h2 className="font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                API endpoints
              </h2>
              <ul className="mt-4 space-y-3 font-mono text-[11px] text-on-surface-variant">
                <li className="break-all">
                  <span className="text-primary">POST</span>{' '}
                  <code className="text-on-surface">/api/v2/pqc/kem/generate</code>
                </li>
                <li className="break-all">
                  <span className="text-primary">POST</span>{' '}
                  <code className="text-on-surface">/api/v2/pqc/kem/encapsulate</code>
                </li>
                <li className="break-all">
                  <span className="text-primary">POST</span>{' '}
                  <code className="text-on-surface">/api/v2/pqc/kem/decapsulate</code>
                </li>
              </ul>
            </div>

            <div className="border-t border-outline-variant/15 pt-6">
              <h2 className="font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                Related tools
              </h2>
              <ul className="mt-4 space-y-3 text-[14px] leading-snug text-on-surface-variant">
                <li>
                  <Link href="/research/pqc/hybrid" className="font-medium text-primary underline-offset-2 hover:underline">
                    Hybrid KEM (Kyber + X25519)
                  </Link>
                </li>
                <li>
                  <Link href="/research/pqc/signatures" className="font-medium text-primary underline-offset-2 hover:underline">
                    Signature schemes
                  </Link>
                </li>
                <li>
                  <Link href="/pqc" className="font-medium text-primary underline-offset-2 hover:underline">
                    PQC workspace
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api" className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-2 hover:underline">
                    <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                    API reference
                  </Link>
                </li>
              </ul>
            </div>

            {!researchLayout && (
              <Link
                href="/pqc"
                className="inline-flex items-center gap-2 border-t border-outline-variant/15 pt-6 text-sm font-medium text-primary transition-colors hover:text-primary/90"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Back to PQC workspace
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

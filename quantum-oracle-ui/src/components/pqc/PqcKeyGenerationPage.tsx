'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Binary, FlaskConical, KeyRound } from 'lucide-react';
import { CopyButton } from '@/components/ui';
import { generatePQCKey } from '@/utils/api';
import type { GeneratePqcResponse } from '@/types';

type Encoding = 'base64' | 'hex';

const FAMILIES: {
  id: string;
  label: string;
  sub: string;
  algorithms: { id: string; label: string; kem?: boolean }[];
}[] = [
  {
    id: 'lattice',
    label: 'Lattice',
    sub: 'Kyber, Dilithium, Falcon',
    algorithms: [
      { id: 'KYBER768', label: 'Kyber-768', kem: true },
      { id: 'DILITHIUM3', label: 'Dilithium-3' },
      { id: 'FALCON1024', label: 'Falcon-1024' },
      { id: 'FALCON512', label: 'Falcon-512' },
    ],
  },
  {
    id: 'hash',
    label: 'Hash-based',
    sub: 'SPHINCS+',
    algorithms: [{ id: 'SPHINCS+-SHA2-128F', label: 'SPHINCS+ SHA2-128f' }],
  },
  {
    id: 'other',
    label: 'Other NIST PQC',
    sub: 'NTRU, SABER',
    algorithms: [
      { id: 'NTRU-HPS-2048-509', label: 'NTRU-HPS-2048-509' },
      { id: 'SABER-SABER', label: 'SABER' },
    ],
  },
];

export function PqcKeyGenerationPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const [familyId, setFamilyId] = useState(FAMILIES[0].id);
  const [algorithm, setAlgorithm] = useState('DILITHIUM3');
  const [encoding, setEncoding] = useState<Encoding>('base64');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratePqcResponse['data'] | null>(null);

  const family = FAMILIES.find((f) => f.id === familyId) ?? FAMILIES[0];
  const selectedMeta = family.algorithms.find((a) => a.id === algorithm);

  const onGenerate = async () => {
    if (selectedMeta?.kem) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await generatePQCKey(algorithm, encoding);
      setResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Key generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full w-full pb-14 text-on-surface">
      {!hideHeader && (
        <header className="page-enter border-b border-outline-variant/15 pb-8">
          <p className="font-label text-[11px] font-medium uppercase tracking-[0.08em] text-outline">
            Post-quantum cryptography
          </p>
          <h1 className="mt-2 font-headline text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
            Key generation
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            Pick a NIST PQC family and algorithm, choose an encoding, then generate an export-ready keypair for signing or
            non-KEM use cases. Kyber (KEM) is handled in a dedicated flow so you can encapsulate and decapsulate in one
            place —{' '}
            <Link href="/pqc/kem" className="font-medium text-primary underline-offset-2 hover:underline">
              open Kyber KEM
            </Link>
            .
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
              href="/pqc/kem"
              className="inline-flex items-center gap-2 rounded-md border border-outline-variant/25 bg-surface-container/60 px-3 py-2 text-[13px] text-on-surface transition-colors hover:border-primary/35 hover:bg-surface-container-high"
            >
              <KeyRound className="h-4 w-4 text-outline" strokeWidth={1.75} aria-hidden />
              <span className="font-medium">Kyber KEM</span>
              <span className="text-on-surface-variant">· Encap / decap</span>
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

      <div className={`grid gap-10 lg:grid-cols-12 lg:gap-12 ${hideHeader ? '' : 'mt-10'}`}>
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-8 lg:col-span-7">
          <section aria-labelledby="step-family">
            <h2 id="step-family" className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
              01 · Algorithm family
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {FAMILIES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFamilyId(f.id);
                    const first = f.algorithms[0];
                    setAlgorithm(first.id);
                  }}
                  className={`rounded-lg border px-4 py-3.5 text-left transition-colors ${
                    familyId === f.id
                      ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(0,212,168,0.25)]'
                      : 'border-outline-variant/25 bg-surface-container-low hover:border-outline-variant/40 hover:bg-surface-container'
                  }`}
                >
                  <div className="font-headline text-sm font-semibold text-on-surface">{f.label}</div>
                  <div className="mt-1 font-mono text-[10px] text-on-surface-variant">{f.sub}</div>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="step-algo">
            <h2 id="step-algo" className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
              02 · Algorithm
            </h2>
            <div className="flex flex-wrap gap-2">
              {family.algorithms.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAlgorithm(a.id)}
                  className={`rounded-md border px-3.5 py-2 font-mono text-xs transition-colors ${
                    algorithm === a.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-outline-variant/50 hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {a.label}
                  {a.kem ? ' · KEM' : ''}
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="step-encoding">
            <h2 id="step-encoding" className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
              03 · Encoding
            </h2>
            <div className="flex gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1 w-fit">
              {(['base64', 'hex'] as const).map((enc) => (
                <button
                  key={enc}
                  type="button"
                  onClick={() => setEncoding(enc)}
                  className={`flex-1 rounded py-1.5 font-mono text-[11px] font-medium px-4 transition-colors ${
                    encoding === enc
                      ? 'bg-primary/15 text-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {enc}
                </button>
              ))}
            </div>
          </section>

          {selectedMeta?.kem ? (
            <div
              className="rounded-xl border border-dashed border-tertiary/35 bg-tertiary/5 px-4 py-4 text-sm leading-relaxed text-on-surface-variant"
              role="status"
            >
              <strong className="font-medium text-on-surface">Kyber</strong> keypairs are created in the{' '}
              <Link href="/pqc/kem" className="font-medium text-primary underline-offset-2 hover:underline">
                Kyber KEM flow
              </Link>{' '}
              so encapsulation and decapsulation stay in one workspace.
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                disabled={loading}
                onClick={onGenerate}
                className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 normal-case tracking-normal"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden>
                  key
                </span>
                {loading ? 'Generating…' : 'Generate keypair'}
              </button>
              {error && (
                <p className="text-sm text-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-[4.5rem] flex flex-col gap-5 rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div>
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">Output</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">
                Public and private key material appears here after generation. Copy or use in downstream tools — treat
                private keys as secrets.
              </p>
            </div>

            {result ? (
              <div className="space-y-4 border-t border-outline-variant/15 pt-4 font-mono text-[11px] text-on-surface-variant">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    <span className="text-outline">algorithm</span> · {result.algorithm}
                  </span>
                  <span>
                    <span className="text-outline">nist_level</span> · {result.nist_level}
                  </span>
                </div>
                {result.key_sizes && (
                  <p>
                    <span className="text-outline">sizes</span> · pub {result.key_sizes.public_key_bytes} / priv{' '}
                    {result.key_sizes.private_key_bytes} bytes
                  </p>
                )}
                <div className="space-y-3 rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-outline">Public</span>
                    <CopyButton value={result.public_key} label="Copy" />
                  </div>
                  <p className="max-h-32 overflow-auto break-all text-[10px] leading-relaxed text-secondary">{result.public_key}</p>
                  <div className="flex items-start justify-between gap-2 border-t border-outline-variant/10 pt-3">
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-outline">Private</span>
                    <CopyButton value={result.private_key} label="Copy" />
                  </div>
                  <p className="max-h-32 overflow-auto break-all text-[10px] leading-relaxed text-on-surface">{result.private_key}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-outline-variant/25">
                <span className="font-mono text-[11px] text-outline/50">Generated keys will appear here.</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

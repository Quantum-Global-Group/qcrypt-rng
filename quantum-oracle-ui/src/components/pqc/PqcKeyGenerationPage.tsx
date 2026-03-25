'use client';

import Link from 'next/link';
import { useState } from 'react';
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

export function PqcKeyGenerationPage() {
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
    <div className="min-h-full px-6 py-8 text-on-surface lg:px-8">
      <header className="mb-8 max-w-4xl">
        <p className="font-label text-[11px] font-medium uppercase tracking-[0.05em] text-outline">Post-quantum cryptography</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Key generation</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Choose a family and algorithm, then generate a keypair. Kyber KEM uses a dedicated encapsulation flow —{' '}
          <Link href="/pqc/kem" className="text-primary hover:underline">
            open Kyber KEM
          </Link>
          .
        </p>
      </header>

      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div>
            <h2 className="mb-3 font-label text-[11px] font-bold uppercase tracking-[0.1em] text-outline">01 · Algorithm family</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {FAMILIES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFamilyId(f.id);
                    const first = f.algorithms[0];
                    setAlgorithm(first.id);
                  }}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    familyId === f.id
                      ? 'border-primary bg-primary/10 text-on-surface'
                      : 'border-outline-variant/20 bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <div className="font-headline text-sm font-bold">{f.label}</div>
                  <div className="mt-1 font-mono text-[10px] text-outline">{f.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-label text-[11px] font-bold uppercase tracking-[0.1em] text-outline">02 · Algorithm</h2>
            <div className="flex flex-wrap gap-2">
              {family.algorithms.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAlgorithm(a.id)}
                  className={`rounded border px-3 py-2 font-mono text-xs transition-colors ${
                    algorithm === a.id
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {a.label}
                  {a.kem ? ' · KEM' : ''}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-label text-[11px] font-bold uppercase tracking-[0.1em] text-outline">03 · Encoding</h2>
            <div className="flex gap-2">
              {(['base64', 'hex'] as const).map((enc) => (
                <button
                  key={enc}
                  type="button"
                  onClick={() => setEncoding(enc)}
                  className={`rounded px-4 py-2 font-mono text-xs uppercase tracking-wider ${
                    encoding === enc
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {enc}
                </button>
              ))}
            </div>
          </div>

          {selectedMeta?.kem ? (
            <div className="rounded-lg border border-tertiary/30 bg-tertiary/5 p-4 text-sm text-on-surface-variant">
              Kyber keypairs are generated in the{' '}
              <Link href="/pqc/kem" className="font-medium text-primary hover:underline">
                Kyber KEM flow
              </Link>{' '}
              so you can encapsulate and decapsulate in one place.
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                disabled={loading}
                onClick={onGenerate}
                className="flex items-center gap-2 rounded bg-primary-container px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary-container transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">key</span>
                {loading ? 'Generating…' : 'Generate keypair'}
              </button>
              {error && <span className="text-sm text-error">{error}</span>}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4 rounded-lg border border-outline-variant/10 bg-surface-container-low p-5">
            <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Output</h2>
            {result ? (
              <div className="space-y-3 font-mono text-[10px] text-on-surface-variant">
                <p>
                  <span className="text-outline">algorithm</span> · {result.algorithm}
                </p>
                <p>
                  <span className="text-outline">nist_level</span> · {result.nist_level}
                </p>
                {result.key_sizes && (
                  <p>
                    <span className="text-outline">sizes</span> · pub {result.key_sizes.public_key_bytes} / priv{' '}
                    {result.key_sizes.private_key_bytes}
                  </p>
                )}
                <div className="max-h-48 overflow-auto rounded border border-outline-variant/10 bg-surface-container-lowest p-2">
                  <p className="break-all text-secondary">pk: {result.public_key.slice(0, 120)}…</p>
                  <p className="mt-2 break-all">sk: {result.private_key.slice(0, 120)}…</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-outline">Generated keys appear here.</p>
            )}
            <Link href="/pqc" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              PQC workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

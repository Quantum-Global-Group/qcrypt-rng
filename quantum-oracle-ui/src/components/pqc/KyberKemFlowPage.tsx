'use client';

import Link from 'next/link';
import { useState } from 'react';
import { kemDecapsulate, kemEncapsulate, kemGenerate } from '@/utils/api';
import type { KemDecapsulateResponse, KemEncapsulateResponse, KemKeypairResponse } from '@/types';

type KyberAlg = 'KYBER512' | 'KYBER768' | 'KYBER1024';
type Encoding = 'base64' | 'hex';

const STEPS = [
  { n: 1, title: 'Generate', sub: 'Create Kyber keypair' },
  { n: 2, title: 'Encapsulate', sub: 'Derive shared secret from public key' },
  { n: 3, title: 'Decapsulate', sub: 'Recover shared secret with private key' },
];

export function KyberKemFlowPage() {
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

  const match =
    encap && decap ? encap.shared_secret === decap.shared_secret : null;

  return (
    <div className="min-h-full px-6 py-8 text-on-surface lg:px-8">
      <header className="mb-8 max-w-4xl">
        <p className="font-label text-[11px] font-medium uppercase tracking-[0.05em] text-outline">Kyber · KEM</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Kyber encapsulation flow</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Three-step workflow aligned with <code className="font-mono text-xs text-primary">/pqc/kem/*</code> endpoints: generate a keypair,
          encapsulate to a ciphertext + shared secret, then decapsulate with the secret key.
        </p>
      </header>

      <div className="mx-auto mb-10 flex max-w-3xl flex-wrap gap-4">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className={`flex flex-1 min-w-[140px] items-center gap-3 rounded-lg border px-4 py-3 ${
              step === s.n ? 'border-primary bg-primary/5' : 'border-outline-variant/15 bg-surface-container-low'
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                step >= s.n ? 'bg-secondary/20 text-secondary' : 'bg-surface-container-high text-outline'
              }`}
            >
              {s.n}
            </span>
            <div>
              <div className="font-headline text-sm font-bold">{s.title}</div>
              <div className="font-mono text-[10px] text-outline">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-5">
            <h2 className="mb-4 font-label text-[11px] font-bold uppercase tracking-[0.1em] text-outline">Parameters</h2>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="mb-1 block text-[10px] uppercase text-outline">Algorithm</label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as KyberAlg)}
                  className="rounded border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 font-mono text-sm text-on-surface"
                >
                  <option value="KYBER512">KYBER512</option>
                  <option value="KYBER768">KYBER768</option>
                  <option value="KYBER1024">KYBER1024</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase text-outline">Encoding</label>
                <div className="flex gap-2">
                  {(['base64', 'hex'] as const).map((enc) => (
                    <button
                      key={enc}
                      type="button"
                      onClick={() => setEncoding(enc)}
                      className={`rounded px-3 py-2 font-mono text-xs uppercase ${
                        encoding === enc
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {enc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="space-y-4 rounded-lg border border-outline-variant/10 bg-surface-container-low p-5">
            <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Step 1 — Generate</h2>
            <button
              type="button"
              disabled={loading}
              onClick={runGenerate}
              className="flex items-center gap-2 rounded bg-primary-container px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary-container disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              {loading && step === 1 ? '…' : 'Generate keypair'}
            </button>
            {keypair && (
              <pre className="max-h-40 overflow-auto rounded border border-outline-variant/10 bg-surface-container-lowest p-3 font-mono text-[10px] text-on-surface-variant">
                {JSON.stringify(
                  { algorithm: keypair.algorithm, public_key: `${keypair.public_key.slice(0, 48)}…`, private_key: `${keypair.private_key.slice(0, 48)}…` },
                  null,
                  2,
                )}
              </pre>
            )}
          </div>

          <div className="space-y-4 rounded-lg border border-outline-variant/10 bg-surface-container-low p-5">
            <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Step 2 — Encapsulate</h2>
            <button
              type="button"
              disabled={loading || !keypair}
              onClick={runEncapsulate}
              className="rounded bg-secondary/20 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-secondary disabled:opacity-40"
            >
              Encapsulate
            </button>
            {encap && (
              <pre className="max-h-36 overflow-auto rounded border border-outline-variant/10 bg-surface-container-lowest p-3 font-mono text-[10px]">
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
          </div>

          <div className="space-y-4 rounded-lg border border-outline-variant/10 bg-surface-container-low p-5">
            <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Step 3 — Decapsulate</h2>
            <button
              type="button"
              disabled={loading || !keypair || !encap}
              onClick={runDecapsulate}
              className="rounded bg-surface-container-high px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface disabled:opacity-40"
            >
              Decapsulate
            </button>
            {decap && (
              <>
                <pre className="max-h-24 overflow-auto rounded border border-outline-variant/10 bg-surface-container-lowest p-3 font-mono text-[10px]">
                  {JSON.stringify({ shared_secret: `${decap.shared_secret.slice(0, 32)}…` }, null, 2)}
                </pre>
                {match !== null && (
                  <p className={`font-mono text-xs ${match ? 'text-secondary' : 'text-error'}`}>
                    {match ? 'Shared secrets match.' : 'Shared secrets differ — check algorithm/encoding.'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4 rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-5">
            <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-outline">Quick links</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pqc/keys" className="text-primary hover:underline">
                  Key generation (all algorithms)
                </Link>
              </li>
              <li>
                <Link href="/pqc" className="text-primary hover:underline">
                  PQC workspace
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="text-primary hover:underline">
                  API reference
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

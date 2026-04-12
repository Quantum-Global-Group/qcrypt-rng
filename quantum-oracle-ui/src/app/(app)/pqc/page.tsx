'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowUpRight,
  Binary,
  FlaskConical,
  KeyRound,
  Layers,
  Shield,
  Sparkles,
} from 'lucide-react';
import { PqcBusinessCapabilities } from '@/components/pqc/PqcBusinessCapabilities';
import { PqcEntropyCapabilities } from '@/components/pqc/PqcEntropyCapabilities';
import { Protect } from '@/components/Protect';
import { QuantumRNG } from '@/components/QuantumRNG';

type Tab = 'protect' | 'generate';

const DEEP_LINKS = [
  {
    href: '/pqc/keys',
    label: 'Key generation',
    hint: 'Export-ready keypairs',
  },
  {
    href: '/pqc/kem',
    label: 'Kyber KEM',
    hint: 'Encapsulate / decapsulate',
  },
  {
    href: '/research/pqc/hybrid',
    label: 'Hybrid PQC',
    hint: 'Combined classical + PQC',
  },
  {
    href: '/research/pqc/benchmarks',
    label: 'Benchmarks',
    hint: 'Latency & throughput',
  },
] as const;

export default function PqcSuitePage() {
  const [tab, setTab] = useState<Tab>('protect');

  return (
    <div className="min-h-full w-full pb-12 text-on-surface">
      {/* Product story */}
      <header className="page-enter border-b border-outline-variant/15 pb-8">
        <p className="font-label text-[11px] font-medium uppercase tracking-[0.08em] text-outline">
          Post-quantum cryptography
        </p>
        <h1 className="mt-2 font-headline text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
          PQC Suite
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          One workspace for <strong className="font-medium text-on-surface">classical crypto you use today</strong>{' '}
          (AES, HMAC, hashing) and <strong className="font-medium text-on-surface">NIST PQC</strong> (ML-KEM, Dilithium,
          Falcon, SPHINCS+) backed by the same QCrypt APIs. All tools are accessible from the sidebar &mdash; guided
          workflows, key generation, KEM, hybrid schemes, and benchmarks.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          <li className="flex gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low/80 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Shield className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-on-surface">Protect data &amp; prove integrity</p>
              <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
                Encrypt files or text, sign with HMAC, hash passwords, then graduate to post-quantum signatures and Kyber
                KEM — all in-browser against your API.
              </p>
            </div>
          </li>
          <li className="flex gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low/80 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-on-surface">Quantum-sourced entropy</p>
              <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
                Generate bytes, keys, tokens, and oracle-backed randomness requests using the same entropy story as the
                rest of QCrypt — not a separate product.
              </p>
            </div>
          </li>
          <li className="flex gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low/80 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-tertiary/10 text-tertiary">
              <FlaskConical className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-on-surface">Deep research tools</p>
              <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
                ML-KEM, hybrid schemes, signature benchmarks, and comparative analysis &mdash; all accessible from the sidebar.
              </p>
            </div>
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          {DEEP_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group inline-flex items-center gap-2 rounded-md border border-outline-variant/25 bg-surface-container/60 px-3 py-2 text-left text-[13px] text-on-surface transition-colors hover:border-primary/40 hover:bg-surface-container-high"
            >
              <Layers className="h-4 w-4 shrink-0 text-outline group-hover:text-primary" strokeWidth={1.75} aria-hidden />
              <span>
                <span className="font-medium">{item.label}</span>
                <span className="ml-1.5 text-on-surface-variant">· {item.hint}</span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-outline opacity-70 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </header>

      {/* Mode switch */}
      <div className="mt-8">
        <p className="font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-outline">Workspace mode</p>
        <div
          className="mt-3 flex flex-col gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-low p-1 sm:flex-row sm:gap-1"
          role="tablist"
          aria-label="PQC workspace mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'protect'}
            onClick={() => setTab('protect')}
            className={`flex flex-1 items-center gap-2.5 rounded-md px-4 py-3 text-left transition-colors ${
              tab === 'protect'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Shield className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
            <span>
              <span className="block text-sm font-semibold">Data protection</span>
              <span className="mt-0.5 block text-[11px] font-normal opacity-90">
                Encrypt, sign, hash, PQC keys &amp; Kyber KEM
              </span>
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'generate'}
            onClick={() => setTab('generate')}
            className={`flex flex-1 items-center gap-2.5 rounded-md px-4 py-3 text-left transition-colors ${
              tab === 'generate'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <KeyRound className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
            <span>
              <span className="block text-sm font-semibold">Entropy &amp; keys</span>
              <span className="mt-0.5 block text-[11px] font-normal opacity-90">
                Bytes, UUIDs, passwords, tokens, oracle requests
              </span>
            </span>
          </button>
        </div>

        <div
          className="mt-4 rounded-lg border border-dashed border-outline-variant/30 bg-surface-container-lowest/40 px-4 py-3 text-[13px] text-on-surface-variant"
          role="tabpanel"
        >
          {tab === 'protect' ? (
            <p>
              <Binary className="mr-1.5 inline h-4 w-4 align-text-bottom text-primary" strokeWidth={1.75} aria-hidden />
              Use this mode for <strong className="font-medium text-on-surface">at-rest encryption</strong>,{' '}
              <strong className="font-medium text-on-surface">integrity (HMAC / hashes)</strong>, and{' '}
              <strong className="font-medium text-on-surface">post-quantum signing &amp; KEM</strong>. Nothing here
              leaves your session except via the QCrypt API you have configured.
            </p>
          ) : (
            <p>
              <Sparkles className="mr-1.5 inline h-4 w-4 align-text-bottom text-secondary" strokeWidth={1.75} aria-hidden />
              Use this mode when you need <strong className="font-medium text-on-surface">random material</strong> for
              keys, IDs, or on-chain oracle requests. Outputs are suitable for download or copy into other tools.
            </p>
          )}
        </div>
      </div>

      {tab === 'protect' ? <PqcBusinessCapabilities /> : <PqcEntropyCapabilities />}

      {/* Tools */}
      <div className="mt-8">
        {tab === 'protect' ? <Protect /> : <QuantumRNG />}
      </div>
    </div>
  );
}

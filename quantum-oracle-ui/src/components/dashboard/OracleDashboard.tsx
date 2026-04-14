'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  Link2,
  Shield,
  Zap,
} from 'lucide-react';
import { LiveEntropyOraclePanel } from '@/components/dashboard/LiveEntropyOraclePanel';
import { checkHealth } from '@/utils/api';

/* ─── section cards ─────────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    id: 'randomness',
    eyebrow: 'QRNG · ENTROPY · TOKENS',
    label: 'Randomness',
    Icon: Zap,
    accent: 'text-secondary',
    border: 'border-secondary/20 hover:border-secondary/40',
    dot: 'bg-secondary',
    ctaBorder: 'border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/15',
    badge: 'LIVE',
    badgeCls: 'chip-info',
    desc: 'Quantum-sourced entropy using real quantum circuit simulation. Generate provably random bytes, keys, UUIDs, passwords, and tokens.',
    features: [
      { label: 'Generate',         desc: 'Bytes, keys, UUIDs, passwords & tokens', href: '/oracle/request' },
      { label: 'QRNG Engine',      desc: 'Circuit configuration & output analysis', href: '/research/qrng' },
      { label: 'Entropy Analysis', desc: 'NIST SP 800-90B statistical tests',       href: '/research/entropy' },
    ],
    cta: { label: 'Generate Entropy', href: '/oracle/request' },
  },
  {
    id: 'cryptography',
    eyebrow: 'ENCRYPT · SIGN · PQC · HASH',
    label: 'Cryptography',
    Icon: Shield,
    accent: 'text-primary',
    border: 'border-primary/20 hover:border-primary/40',
    dot: 'bg-primary',
    ctaBorder: 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15',
    badge: 'LIVE',
    badgeCls: 'chip-verified',
    desc: 'Full-stack post-quantum cryptography suite — NIST-standardized algorithms for encryption, key exchange, and digital signatures.',
    features: [
      { label: 'PQC Suite',      desc: 'AES, HMAC, encrypt & sign documents',     href: '/pqc' },
      { label: 'Key Generation', desc: 'ML-KEM, ML-DSA, FN-DSA keypairs',         href: '/pqc/keys' },
      { label: 'Kyber KEM',      desc: 'FIPS 203 key encapsulation mechanism',    href: '/pqc/kem' },
      { label: 'Research Lab',   desc: 'Signatures, Hybrid PQC, Benchmarks',      href: '/research/pqc/kem' },
    ],
    cta: { label: 'Open PQC Suite', href: '/pqc' },
  },
  {
    id: 'blockchain',
    eyebrow: 'ORACLE · VRF · WALLET · CHAIN',
    label: 'Blockchain',
    Icon: Link2,
    accent: 'text-tertiary',
    border: 'border-tertiary/20 hover:border-tertiary/40',
    dot: 'bg-tertiary',
    ctaBorder: 'border-tertiary/30 bg-tertiary/10 text-tertiary hover:bg-tertiary/15',
    badge: 'TESTNET',
    badgeCls: 'chip-simulated',
    desc: 'On-chain quantum randomness delivery with verifiable random functions, commit-reveal proofs, and quantum-safe smart wallets.',
    features: [
      { label: 'Fulfillment',      desc: 'Multi-chain oracle delivery wizard',       href: '/fulfillment' },
      { label: 'VRF & Commitment', desc: 'On-chain commit-reveal proof protocol',    href: '/research/vrf' },
      { label: 'Oracle Lab',       desc: 'Oracle config, requests & proofs',         href: '/research/oracle' },
    ],
    cta: { label: 'Open Oracle', href: '/fulfillment' },
  },
  {
    id: 'intelligence',
    eyebrow: 'ALGORITHMS · AUDIT · DATASETS',
    label: 'Intelligence',
    Icon: Activity,
    accent: 'text-error',
    border: 'border-error/20 hover:border-error/40',
    dot: 'bg-error',
    ctaBorder: 'border-error/30 bg-error/10 text-error hover:bg-error/15',
    badge: 'LIVE',
    badgeCls: 'chip-verified',
    desc: 'Cryptographic algorithm analysis, performance benchmarking, and research data management for quantum-era threat assessment.',
    features: [
      { label: 'Experiment Log', desc: 'Session audit trail & export',              href: '/research/notebook' },
      { label: 'IBM Runtime',    desc: 'IBM Cloud + CRN, Shor×blockchain workflow', href: '/research/ibm-runtime' },
      { label: 'Datasets',       desc: 'Export JSON / NDJSON research data',        href: '/research/datasets' },
      { label: 'References',     desc: 'NIST standards, FIPS & academic papers',    href: '/research/refs' },
    ],
    cta: { label: 'Open Intelligence', href: '/research/notebook' },
  },
] as const;

/* ─── component ─────────────────────────────────────────────────────────────── */

export function OracleDashboard() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    let a = true;
    checkHealth().then(() => a && setApiOk(true)).catch(() => a && setApiOk(false));
    return () => { a = false; };
  }, []);

  return (
    <div className="min-w-0 text-on-surface">
      <div className="min-w-0 space-y-8 py-8 sm:py-10">

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-[5px] w-[5px] rounded-full ${apiOk ? 'bg-primary animate-pulse' : apiOk === false ? 'bg-error' : 'bg-outline/50'}`} />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-outline">
                  {apiOk ? 'All systems online' : apiOk === false ? 'System degraded' : 'Connecting…'}
                </span>
              </div>
              <h1 className="font-headline text-2xl font-light tracking-tight text-on-surface sm:text-3xl">
                Quantum Cryptography
                <span className="block text-primary">&amp; Intelligence Platform</span>
              </h1>
              <p className="mt-2 max-w-lg text-[12px] leading-relaxed text-on-surface-variant">
                Post-quantum cryptography, quantum-sourced entropy, and blockchain oracle services — NIST-standardized and research-grade.
              </p>
            </div>
          </section>

          {/* ── Section cards ────────────────────────────────────────────── */}
          <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
            {SECTIONS.map((s) => {
              const Icon = s.Icon;
              return (
                <div
                  key={s.id}
                  className={`group relative min-w-0 rounded-lg border bg-surface-container-low p-5 transition-colors ${s.border}`}
                >
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] opacity-60 ${s.accent}`}>
                        {s.eyebrow}
                      </p>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 shrink-0 ${s.accent}`} strokeWidth={1.75} />
                        <h2 className={`font-headline text-base font-semibold ${s.accent}`}>{s.label}</h2>
                      </div>
                    </div>
                    <span className={`chip shrink-0 ${s.badgeCls}`}>{s.badge}</span>
                  </div>

                  {/* Description */}
                  <p className="mb-4 text-[11px] leading-relaxed text-on-surface-variant">{s.desc}</p>

                  {/* Feature links */}
                  <div className="mb-5 space-y-1">
                    {s.features.map((f) => (
                      <Link
                        key={f.href}
                        href={f.href}
                        className="flex items-start gap-2 rounded px-1 py-1 transition-colors hover:bg-surface-container"
                      >
                        <span className={`mt-px font-mono text-[10px] opacity-60 ${s.accent}`}>▸</span>
                        <div className="min-w-0">
                          <span className="font-mono text-[10.5px] font-semibold text-on-surface">{f.label}</span>
                          <span className="font-mono text-[9px] text-outline"> — {f.desc}</span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href={s.cta.href}
                    className={`inline-flex items-center rounded border px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${s.ctaBorder}`}
                  >
                    {s.cta.label} →
                  </Link>
                </div>
              );
            })}
          </section>

          {/* ── Live entropy stream ──────────────────────────────────────── */}
          <section className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-[5px] w-[5px] rounded-full bg-secondary animate-pulse" />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-outline">
                Live Entropy Stream
              </span>
              <span className="h-px flex-1 bg-outline-variant/20" />
              <span className="font-mono text-[9px] text-outline">Quantum-sourced · Real-time</span>
            </div>
            <LiveEntropyOraclePanel />
          </section>

          {/* ── Docs strip ───────────────────────────────────────────────── */}
          <section>
            <Link
              href="/docs"
              className="group flex min-w-0 items-center justify-between gap-4 rounded-lg border border-outline-variant/15 bg-surface-container-low px-5 py-4 transition-colors hover:border-outline-variant/30 hover:bg-surface-container"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 shrink-0 text-outline group-hover:text-on-surface-variant" strokeWidth={1.75} />
                <div>
                  <div className="font-mono text-[11px] font-semibold text-on-surface">Documentation</div>
                  <div className="font-mono text-[9px] text-outline">API reference · Integration guides · SDK usage</div>
                </div>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-on-surface-variant group-hover:text-on-surface">
                Open Docs →
              </span>
            </Link>
          </section>

      </div>
    </div>
  );
}

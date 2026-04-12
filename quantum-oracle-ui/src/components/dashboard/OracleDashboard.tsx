'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { LiveEntropyOraclePanel } from '@/components/dashboard/LiveEntropyOraclePanel';
import { checkHealth, listFulfillmentRequests } from '@/utils/api';
import type { FulfillmentRequestItem } from '@/types';

const PQC: {
  title: string;
  sub: string;
  desc: string;
  lat: string;
  v: boolean;
  href: string;
  cta: string;
}[] = [
  {
    title: 'Kyber-768',
    sub: 'Lattice-based KEM',
    desc: 'NIST-standardized key encapsulation mechanism providing security against classical and quantum threats.',
    lat: '0.12ms',
    v: true,
    href: '/pqc/kem',
    cta: 'Kyber KEM',
  },
  {
    title: 'Dilithium-3',
    sub: 'Digital Signature',
    desc: 'High-performance lattice-based digital signature scheme for secure authentication and identity verification.',
    lat: '0.45ms',
    v: true,
    href: '/pqc/keys',
    cta: 'Key generation',
  },
  {
    title: 'Falcon-1024',
    sub: 'Fast-Fourier Signature',
    desc: 'Compact signature scheme utilizing NTRU lattices and fast Fourier sampling. Highly memory efficient.',
    lat: '0.88ms',
    v: false,
    href: '/research/pqc/benchmarks',
    cta: 'Benchmarks',
  },
];

const QUICK_LINKS: { href: string; label: string; accent?: boolean }[] = [
  { href: '/oracle/request', label: 'Request Randomness', accent: true },
  { href: '/pqc', label: 'PQC Suite' },
  { href: '/fulfillment', label: 'Fulfillment' },
  { href: '/research/qrng', label: 'QRNG Engine' },
  { href: '/research/entropy', label: 'Entropy Analysis' },
  { href: '/research/vrf', label: 'VRF Tools' },
];

const MOCK_LOGS = [
  { t: '14:22:01', b: 'SUCCESS', cls: 'bg-secondary/10 text-secondary', body: '7d2a...f910 requested by 0xQuantumApp_Alpha', src: 'QRNG-01' },
  { t: '14:18:55', b: 'SUCCESS', cls: 'bg-secondary/10 text-secondary', body: 'a3e1...bb24 requested by 0xSecureVault_v2', src: 'QRNG-01' },
  { t: '14:15:20', b: 'REROUTE', cls: 'bg-tertiary/10 text-tertiary', body: 'Hardware latency peak detected. Switched to Backup Entropic Sink.', src: 'QRNG-02' },
];

export function OracleDashboard() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [fulfillment, setFulfillment] = useState<FulfillmentRequestItem[]>([]);

  useEffect(() => {
    let a = true;
    checkHealth().then(() => a && setApiOk(true)).catch(() => a && setApiOk(false));
    listFulfillmentRequests()
      .then((r) => a && setFulfillment(r.data.requests?.slice(0, 5) ?? []))
      .catch(() => {});
    return () => {
      a = false;
    };
  }, []);

  const fmtReq = useCallback((r: FulfillmentRequestItem) => {
    const short = r.request_id.length > 12 ? `${r.request_id.slice(0, 6)}...${r.request_id.slice(-4)}` : r.request_id;
    return `${short} · ${r.chain} · ${r.status}`;
  }, []);

  return (
    <div className="min-w-0 text-on-surface">
      <div className="min-w-0 space-y-8 py-6 sm:py-8">
        {/* Hero */}
        <section className="flex min-w-0 flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="min-w-0">
            <h2 className="mb-2 font-headline text-3xl font-bold tracking-tight text-on-surface">Quantum Randomness Oracle</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
                  Verified Hardware Source: {apiOk ? 'ACTIVE' : apiOk === false ? 'DEGRADED' : '…'}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-outline">Ref: QRNG-NODE-7721</span>
            </div>
          </div>
        </section>

        {/* Quick links — gateway to all platform features */}
        <section className="flex min-w-0 flex-wrap gap-2">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.accent
                  ? 'flex items-center gap-2 rounded bg-primary-container px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary-container transition-all active:scale-95'
                  : 'rounded bg-surface-container-high px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:bg-surface-container-highest'
              }
            >
              {item.label}
            </Link>
          ))}
        </section>

        {/* Live entropy */}
        <LiveEntropyOraclePanel />

        {/* PQC algorithm cards */}
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
              Post-Quantum Cryptography Suite
            </h2>
            <span className="font-mono text-[9px] uppercase text-outline">Module V-0.8.2</span>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-3">
            {PQC.map((c) => (
              <div
                key={c.title}
                className="group min-w-0 rounded-lg border border-transparent bg-surface-container-low p-5 transition-colors hover:bg-surface-container"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-headline text-lg font-bold leading-tight">{c.title}</h3>
                    <p className="mt-1 font-mono text-[10px] text-outline">{c.sub}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                      c.v ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                    }`}
                  >
                    {c.v ? 'Verified' : 'Simulated'}
                  </span>
                </div>
                <p className="mb-6 text-[11px] leading-relaxed text-on-surface-variant opacity-80">{c.desc}</p>
                <div className="flex flex-col gap-3 border-t border-outline-variant/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-mono text-[10px] text-outline">Latency: {c.lat}</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={c.href}
                      className="font-label text-[10px] font-bold uppercase tracking-widest text-primary group-hover:underline"
                    >
                      {c.cta}
                    </Link>
                    <span className="text-outline-variant">&middot;</span>
                    <Link href="/pqc" className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface">
                      Workspace
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Fulfillment log */}
        <section className="min-w-0 rounded-lg bg-surface-container-lowest p-6">
          <div className="mb-6 flex items-center justify-between gap-2">
            <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
              Recent Fulfillment Operations
            </h2>
            <Link href="/fulfillment" className="font-mono text-[10px] text-outline transition-colors hover:text-on-surface">
              VIEW_ALL_LOGS
            </Link>
          </div>
          <div className="space-y-4">
            {fulfillment.length > 0
              ? fulfillment.map((r) => (
                  <div key={r.request_id} className="flex items-center gap-4 rounded px-2 py-2 transition-colors hover:bg-surface-container-low">
                    <div className="w-16 font-mono text-[10px] text-outline">
                      {r.created_at ? new Date(r.created_at).toLocaleTimeString() : '—'}
                    </div>
                    <div className="rounded bg-secondary/10 px-2 py-0.5 font-mono text-[10px] text-secondary">{r.status}</div>
                    <div className="min-w-0 flex-1 truncate font-mono text-xs text-on-surface">{fmtReq(r)}</div>
                    <div className="font-mono text-[10px] text-outline">{r.chain}</div>
                  </div>
                ))
              : MOCK_LOGS.map((row) => (
                  <div key={row.t + row.body} className="flex items-center gap-4 rounded px-2 py-2 transition-colors hover:bg-surface-container-low">
                    <div className="w-16 font-mono text-[10px] text-outline">{row.t}</div>
                    <div className={`rounded px-2 py-0.5 font-mono text-[10px] ${row.cls}`}>{row.b}</div>
                    <div className="min-w-0 flex-1 truncate font-mono text-xs text-on-surface">{row.body}</div>
                    <div className="font-mono text-[10px] text-outline">Source: {row.src}</div>
                  </div>
                ))}
          </div>
        </section>
      </div>
    </div>
  );
}

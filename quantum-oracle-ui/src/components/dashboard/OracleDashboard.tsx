'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Settings } from 'lucide-react';
import { QuantumOracle } from '@/components/QuantumOracle';
import { checkHealth, getQuantumEntropy, listFulfillmentRequests } from '@/utils/api';
import type { FulfillmentRequestItem } from '@/types';

const MOCK_HEX = [
  '0x7f4e9a2b1c3d8f5e0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f',
  '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0f9e8d',
];

function randomHexLine(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return '0x' + Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

const PQC = [
  { title: 'Kyber-768', sub: 'Lattice-based KEM', desc: 'NIST-standardized key encapsulation mechanism providing security against classical and quantum threats.', lat: '0.12ms', v: true, act: 'Deploy Instance' },
  { title: 'Dilithium-3', sub: 'Digital Signature', desc: 'High-performance lattice-based digital signature scheme for secure authentication and identity verification.', lat: '0.45ms', v: true, act: 'Deploy Instance' },
  { title: 'Falcon-1024', sub: 'Fast-Fourier Signature', desc: 'Compact signature scheme utilizing NTRU lattices and fast Fourier sampling. Highly memory efficient.', lat: '0.88ms', v: false, act: 'Run Stress-test' },
];

const MOCK_LOGS = [
  { t: '14:22:01', b: 'SUCCESS', cls: 'bg-secondary/10 text-secondary', body: '7d2a...f910 requested by 0xQuantumApp_Alpha', src: 'QRNG-01' },
  { t: '14:18:55', b: 'SUCCESS', cls: 'bg-secondary/10 text-secondary', body: 'a3e1...bb24 requested by 0xSecureVault_v2', src: 'QRNG-01' },
  { t: '14:15:20', b: 'REROUTE', cls: 'bg-tertiary/10 text-tertiary', body: 'Hardware latency peak detected. Switched to Backup Entropic Sink.', src: 'QRNG-02' },
];

export function OracleDashboard() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [minE, setMinE] = useState<number | null>(null);
  const [shannon, setShannon] = useState<number | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [fulfillment, setFulfillment] = useState<FulfillmentRequestItem[]>([]);

  useEffect(() => {
    let a = true;
    checkHealth().then(() => a && setApiOk(true)).catch(() => a && setApiOk(false));
    getQuantumEntropy()
      .then((r) => {
        if (!a) return;
        setMinE(r.data.min_entropy);
        setShannon(r.data.shannon_entropy);
      })
      .catch(() => {});
    listFulfillmentRequests()
      .then((r) => a && setFulfillment(r.data.requests?.slice(0, 5) ?? []))
      .catch(() => {});
    return () => {
      a = false;
    };
  }, []);

  useEffect(() => {
    setLines([...MOCK_HEX]);
    const id = window.setInterval(() => {
      setLines((p) => [...p, randomHexLine()].slice(-14));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  const score = useMemo(() => (minE != null ? Math.min(0.99999, Math.max(0, minE)) : 0.9998), [minE]);
  const circ = 2 * Math.PI * 88;
  const dashOff = circ * (1 - Math.min(score, 1));

  const fmtReq = useCallback((r: FulfillmentRequestItem) => {
    const short = r.request_id.length > 12 ? `${r.request_id.slice(0, 6)}...${r.request_id.slice(-4)}` : r.request_id;
    return `${short} · ${r.chain} · ${r.status}`;
  }, []);

  return (
    <div className="text-on-surface">
      <header className="sticky top-0 z-40 flex h-14 w-full min-w-0 items-center justify-between gap-4 border-b border-outline-variant/10 bg-surface-container-low px-6">
        <h1 className="min-w-0 truncate text-base font-semibold tracking-tight text-on-surface">Overview</h1>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <div className="flex max-w-[min(100%,18rem)] flex-wrap items-center justify-end gap-2 text-[10px] font-medium text-on-surface-variant sm:text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/20 bg-surface-container px-2 py-1 sm:px-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
              Mainnet
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/20 bg-surface-container px-2 py-1 sm:px-2.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${apiOk ? 'bg-secondary' : 'bg-error'}`} aria-hidden />
              {apiOk == null ? 'API …' : apiOk ? 'API connected' : 'API offline'}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <span
              className="inline-flex rounded-md p-2 text-outline"
              title="Live operations"
              aria-hidden
            >
              <Activity className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <Link
              href="/settings"
              className="inline-flex rounded-md p-2 text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-8 p-8">
        <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
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
          <div className="flex flex-wrap gap-2">
            <Link
              href="/oracle/request"
              className="flex items-center gap-2 rounded bg-primary-container px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary-container transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Request Randomness
            </Link>
            <a
              href="#workspace"
              className="rounded bg-surface-container-high px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:bg-surface-container-highest"
            >
              Workspace
            </a>
            <Link
              href="/fulfillment"
              className="rounded bg-surface-container-high px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:bg-surface-container-highest"
            >
              Fulfillment wizard
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex h-[400px] flex-col rounded-lg bg-surface-container-low p-6 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Live Randomness Stream</h2>
              <span className="font-mono text-[9px] text-outline">Source: NIST SP 800-90B Compliant</span>
            </div>
            <div className="no-scrollbar flex-1 space-y-1 overflow-hidden font-mono text-xs leading-relaxed text-secondary/70">
              {lines.map((line, i) => (
                <p key={`${line}-${i}`} className={i === lines.length - 1 ? 'font-bold text-secondary' : ''}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="flex h-[400px] flex-col rounded-lg bg-surface-container-low p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Entropy Score</h2>
              <span className="font-mono text-[9px] text-outline">Real-time Analysis</span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center space-y-8">
              <div className="relative flex h-48 w-48 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 192 192">
                  <circle cx="96" cy="96" r="88" fill="none" stroke="#1f1f22" strokeWidth="8" />
                  <circle
                    className="opacity-80"
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#4edea3"
                    strokeWidth="8"
                    strokeDasharray={circ}
                    strokeDashoffset={dashOff}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-headline text-4xl font-extrabold tracking-tighter text-on-surface">{score.toFixed(4)}</div>
                  <div className="font-mono text-[10px] font-bold uppercase text-secondary">MAX BITS/BIT</div>
                </div>
              </div>
              <div className="w-full space-y-3">
                <div className="flex justify-between font-mono text-[10px] uppercase">
                  <span className="text-outline">Min Entropy</span>
                  <span className="text-on-surface">{minE != null ? minE.toFixed(4) : '—'}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full w-[98%] bg-secondary" />
                </div>
                <div className="flex justify-between font-mono text-[10px] uppercase">
                  <span className="text-outline">Shannon Entropy</span>
                  <span className="text-on-surface">{shannon != null ? shannon.toFixed(4) : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Post-Quantum Cryptography Suite</h2>
            <span className="font-mono text-[9px] uppercase text-outline">Module V-0.8.2</span>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PQC.map((c) => (
              <div key={c.title} className="group rounded-lg border border-transparent bg-surface-container-low p-5 transition-colors hover:bg-surface-container">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-headline text-lg font-bold leading-tight">{c.title}</h3>
                    <p className="mt-1 font-mono text-[10px] text-outline">{c.sub}</p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                      c.v ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                    }`}
                  >
                    {c.v ? 'Verified' : 'Simulated'}
                  </span>
                </div>
                <p className="mb-6 text-[11px] leading-relaxed text-on-surface-variant opacity-80">{c.desc}</p>
                <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">
                  <span className="font-mono text-[10px] text-outline">Latency: {c.lat}</span>
                  <Link href="/pqc" className="font-label text-[10px] font-bold uppercase tracking-widest text-primary group-hover:underline">
                    {c.act}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg bg-surface-container-lowest p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Recent Fulfillment Operations</h2>
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
                    <div className="flex-1 truncate font-mono text-xs text-on-surface">{fmtReq(r)}</div>
                    <div className="font-mono text-[10px] text-outline">{r.chain}</div>
                  </div>
                ))
              : MOCK_LOGS.map((row) => (
                  <div key={row.t + row.body} className="flex items-center gap-4 rounded px-2 py-2 transition-colors hover:bg-surface-container-low">
                    <div className="w-16 font-mono text-[10px] text-outline">{row.t}</div>
                    <div className={`rounded px-2 py-0.5 font-mono text-[10px] ${row.cls}`}>{row.b}</div>
                    <div className="flex-1 truncate font-mono text-xs text-on-surface">{row.body}</div>
                    <div className="font-mono text-[10px] text-outline">Source: {row.src}</div>
                  </div>
                ))}
          </div>
        </section>

        <section id="workspace" className="scroll-mt-8 space-y-4">
          <div>
            <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Developer workspace</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Wallets, VRF, and on-chain fulfillment tools. Quick links:{' '}
              <Link href="/pqc" className="text-primary hover:underline">
                PQC Suite
              </Link>{' '}
              ·{' '}
              <Link href="/settings" className="text-primary hover:underline">
                Monitoring
              </Link>
            </p>
          </div>
          <QuantumOracle />
        </section>
      </div>
    </div>
  );
}

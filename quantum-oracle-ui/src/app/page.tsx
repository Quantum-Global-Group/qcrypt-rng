'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { NetworkStatus } from '@/components/NetworkStatus';
import { Protect } from '@/components/Protect';
import { QuantumOracle } from '@/components/QuantumOracle';
import { QuantumRNG } from '@/components/QuantumRNG';
import { ThreatScanner } from '@/components/ThreatScanner';
import { PillarBridgeCallout } from '@/components/scenarios/PillarBridgeCallout';
import type { PaletteCommand } from '@/components/terminal/CommandPalette';
import { checkHealth } from '@/utils/api';

type TabId = 'oracle' | 'protect' | 'generate' | 'threat' | 'network';

const TAB_ALIASES: Record<string, TabId> = {
  oracle: 'oracle',
  prove: 'oracle',
  protect: 'protect',
  rng: 'generate',
  randomize: 'generate',
  generate: 'generate',
  threat: 'threat',
  threats: 'threat',
  network: 'network',
};

function resolveTabParam(raw: string | null): TabId | null {
  if (!raw) return null;
  return TAB_ALIASES[raw.toLowerCase()] ?? null;
}

type TabDef = { id: TabId; label: string; hint: string; group: 'feature' | 'info' };

const TABS: TabDef[] = [
  { id: 'oracle',  label: 'oracle',  hint: 'VRF, PQ wallets, chain adapters',     group: 'feature' },
  { id: 'protect', label: 'protect', hint: 'encrypt, sign, KEM, hybrid schemes',  group: 'feature' },
  { id: 'generate',label: 'rng',     hint: 'bytes, keys, passwords, tokens',      group: 'feature' },
  { id: 'threat',  label: 'threats', hint: 'quantum risk intel on algorithms',    group: 'info' },
  { id: 'network', label: 'network', hint: 'nodes, peers, block heights',         group: 'info' },
];

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[rgb(var(--bg))]" />}>
      <HomeDashboardLoader />
    </Suspense>
  );
}

function HomeDashboardLoader() {
  const searchParams = useSearchParams();
  const tabKey = searchParams.get('tab') ?? 'default';
  const initialTab = resolveTabParam(searchParams.get('tab')) ?? 'oracle';
  return <HomeDashboard key={tabKey} initialTab={initialTab} />;
}

function HomeDashboard({ initialTab }: { initialTab: TabId }) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [apiHealth, setApiHealth] = useState<'loading' | 'online' | 'offline'>('loading');

  // Live health probe for the header indicator
  useEffect(() => {
    let mounted = true;
    const probe = () => {
      checkHealth()
        .then(() => mounted && setApiHealth('online'))
        .catch(() => mounted && setApiHealth('offline'));
    };
    probe();
    const id = setInterval(probe, 10_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // Number-key tab switching (1..5). The global palette + ⌘K / ? is handled
  // by AppShellFrame at the root layout level.
  const onKey = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const inField =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.getAttribute?.('contenteditable') === 'true');
    if (inField) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const idx = parseInt(e.key, 10);
    if (!Number.isNaN(idx) && idx >= 1 && idx <= TABS.length) {
      setActiveTab(TABS[idx - 1].id);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  // Register route-specific palette commands for the home dashboard.
  const commands = useMemo<PaletteCommand[]>(
    () =>
      TABS.map<PaletteCommand>((t, i) => ({
        id: `tab-${t.id}`,
        label: `switch to ${t.label}`,
        hint: t.hint,
        group: 'Dashboard',
        shortcut: String(i + 1),
        run: () => setActiveTab(t.id),
      })),
    [],
  );

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('qcrypt:palette:register', { detail: commands }));
    return () => {
      window.dispatchEvent(new CustomEvent('qcrypt:palette:unregister'));
    };
  }, [commands]);

  const openPalette = () =>
    window.dispatchEvent(new CustomEvent('qcrypt:palette:open'));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generate': return <QuantumRNG />;
      case 'protect':  return <Protect />;
      case 'threat':   return <ThreatScanner />;
      case 'oracle':   return <QuantumOracle />;
      case 'network':  return <NetworkStatus />;
      default:         return <QuantumOracle />;
    }
  };

  const feature = TABS.filter((t) => t.group === 'feature');
  const info = TABS.filter((t) => t.group === 'info');

  const healthChip =
    apiHealth === 'online'
      ? { cls: 'status-ok', text: 'OPERATIONAL' }
      : apiHealth === 'offline'
        ? { cls: 'status-critical', text: 'OFFLINE' }
        : { cls: 'status-neutral', text: 'PROBING…' };

  return (
    <div className="min-h-screen text-[rgb(var(--fg))] relative pb-10">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="border-b border-[rgb(var(--border))] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-[rgb(var(--green))] font-semibold select-none">$</span>
                <span className="text-base sm:text-lg font-semibold text-[rgb(230,255,238)] tracking-tight">
                  qcrypt-rng
                </span>
                <span className="text-[rgb(var(--fg-dim))] text-xs sm:text-sm">v2.0 · quantum-randomness-oracle</span>
                <span className="text-[rgb(var(--green))] caret ml-0.5" aria-hidden />
              </div>
              <div className="mt-1 text-[11px] tracking-wider uppercase text-[rgb(var(--fg-dim))]">
                verifiable quantum entropy · post-quantum crypto · on-chain oracle
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={openPalette}
                className="btn-ghost hidden md:inline-flex items-center gap-2"
                title="Open command palette (⌘K)"
              >
                <span className="opacity-70">search…</span>
                <span className="kbd">⌘K</span>
              </button>
              <a href="/docs" className="btn-ghost hidden sm:inline-flex">docs</a>
              <Link href="/scenarios" className="btn-ghost hidden sm:inline-flex">scenarios</Link>
              <span className={healthChip.cls}>{healthChip.text}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/92 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center overflow-x-auto scrollbar-hide -mb-px">
            {feature.map((tab, i) => (
              <TabButton
                key={tab.id}
                index={i + 1}
                tab={tab}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}

            <span className="mx-2 text-[rgb(var(--fg-dim))] select-none hidden sm:inline" aria-hidden>│</span>

            {info.map((tab, i) => (
              <TabButton
                key={tab.id}
                index={feature.length + i + 1}
                tab={tab}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}

            <span className="flex-1" />
            <span className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-wider text-[rgb(var(--fg-dim))] pr-1">
              press <span className="kbd">1</span>–<span className="kbd">{TABS.length}</span> to switch · <span className="kbd">?</span> for help
            </span>
          </div>
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
        <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))]">
          <span className="text-[rgb(var(--green))]">›</span>
          <span>module</span>
          <span className="text-[rgb(var(--fg-dim))]">{'//'}</span>
          <span className="text-[rgb(var(--fg))]">{activeTab}</span>
        </div>
        <div className="mb-5">
          <PillarBridgeCallout compact />
        </div>
        {renderTabContent()}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgb(var(--border))] mt-10 py-5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[11px] uppercase tracking-wider text-[rgb(var(--fg-dim))] font-mono">
          <span>qcrypt-rng // quantum-safe primitives for decentralized systems</span>
          <span className="hidden md:inline">build · main · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Tab button — numbered, with hover-reveal hint text.
   ───────────────────────────────────────────────────────────────────── */

const TabButton = ({
  index,
  tab,
  active,
  onClick,
}: {
  index: number;
  tab: TabDef;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`group relative px-3 py-3 text-sm font-mono whitespace-nowrap border-b-2 transition-colors ${
      active
        ? 'border-[rgb(var(--green))] text-[rgb(var(--green))]'
        : 'border-transparent text-[rgb(var(--fg-dim))] hover:text-[rgb(var(--fg))]'
    }`}
    title={tab.hint}
  >
    <span className="text-[10px] opacity-60 mr-1 align-middle">[{index}]</span>
    <span className="align-middle">{tab.label}</span>
  </button>
);

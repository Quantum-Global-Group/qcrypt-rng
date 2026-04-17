'use client';

import { useCallback, useEffect, useState } from 'react';
import { CommandPalette, type PaletteCommand } from './CommandPalette';
import { StatusBar } from './StatusBar';

/**
 * Root terminal chrome — renders the scanline/grid overlay and mounts
 * the global ⌘K command palette and live status bar on every route.
 *
 * Routes can register their own commands by dispatching the custom event
 * `qcrypt:palette:register` with { detail: PaletteCommand[] } and clean up
 * with `qcrypt:palette:unregister`.
 */
export const AppShellFrame = ({ children }: { children: React.ReactNode }) => {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [extraCommands, setExtraCommands] = useState<PaletteCommand[]>([]);

  // Global shortcut: ⌘K / Ctrl+K toggles the palette; ? opens it.
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.getAttribute?.('contenteditable') === 'true');

      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      if (inField || paletteOpen) return;
      if (e.key === '?') setPaletteOpen(true);
    },
    [paletteOpen],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  // Per-route command registration + external open/toggle
  useEffect(() => {
    const onRegister = (e: Event) => {
      const detail = (e as CustomEvent<PaletteCommand[]>).detail;
      if (Array.isArray(detail)) setExtraCommands(detail);
    };
    const onClear = () => setExtraCommands([]);
    const onOpen = () => setPaletteOpen(true);
    const onToggle = () => setPaletteOpen((v) => !v);
    window.addEventListener('qcrypt:palette:register', onRegister as EventListener);
    window.addEventListener('qcrypt:palette:unregister', onClear);
    window.addEventListener('qcrypt:palette:open', onOpen);
    window.addEventListener('qcrypt:palette:toggle', onToggle);
    return () => {
      window.removeEventListener('qcrypt:palette:register', onRegister as EventListener);
      window.removeEventListener('qcrypt:palette:unregister', onClear);
      window.removeEventListener('qcrypt:palette:open', onOpen);
      window.removeEventListener('qcrypt:palette:toggle', onToggle);
    };
  }, []);

  const baseCommands: PaletteCommand[] = [
    {
      id: 'go-home',
      label: 'goto home',
      hint: 'oracle, protect, rng, threats, network',
      group: 'Navigate',
      run: () => (window.location.href = '/'),
    },
    {
      id: 'go-docs',
      label: 'goto docs',
      hint: '/docs — api reference',
      group: 'Navigate',
      run: () => (window.location.href = '/docs'),
    },
    {
      id: 'go-blockchain-wallet',
      label: 'goto blockchain / wallet',
      hint: '/blockchain/wallet',
      group: 'Navigate',
      run: () => (window.location.href = '/blockchain/wallet'),
    },
    {
      id: 'go-blockchain-protect',
      label: 'goto blockchain / protect',
      hint: '/blockchain/protect',
      group: 'Navigate',
      run: () => (window.location.href = '/blockchain/protect'),
    },
    {
      id: 'go-blockchain-prove',
      label: 'goto blockchain / prove',
      hint: '/blockchain/prove',
      group: 'Navigate',
      run: () => (window.location.href = '/blockchain/prove'),
    },
    {
      id: 'go-blockchain-randomize',
      label: 'goto blockchain / randomize',
      hint: '/blockchain/randomize',
      group: 'Navigate',
      run: () => (window.location.href = '/blockchain/randomize'),
    },
    {
      id: 'go-blockchain-contracts',
      label: 'goto blockchain / contracts',
      hint: '/blockchain/contracts',
      group: 'Navigate',
      run: () => (window.location.href = '/blockchain/contracts'),
    },
    {
      id: 'go-pqc-kem',
      label: 'goto pqc / kem',
      hint: '/pqc/kem — Kyber KEM flow',
      group: 'Navigate',
      run: () => (window.location.href = '/pqc/kem'),
    },
    {
      id: 'go-research-shor',
      label: 'goto research / shor',
      hint: '/research/pqc/hybrid',
      group: 'Navigate',
      run: () => (window.location.href = '/research/pqc/hybrid'),
    },
    {
      id: 'go-research-ibm',
      label: 'goto research / ibm-runtime',
      hint: '/research/ibm-runtime',
      group: 'Navigate',
      run: () => (window.location.href = '/research/ibm-runtime'),
    },
    {
      id: 'copy-base-url',
      label: 'copy API base URL',
      hint: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'auto-detect',
      group: 'Actions',
      run: async () => {
        await navigator.clipboard.writeText(
          process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',
        );
      },
    },
    {
      id: 'reload',
      label: 'reload session',
      hint: 'reinitialize API detection',
      group: 'Actions',
      shortcut: '⌘R',
      run: () => window.location.reload(),
    },
  ];

  const commands = [...extraCommands, ...baseCommands];

  return (
    <>
      <div className="scan-overlay" aria-hidden />
      {children}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={commands}
      />
      <StatusBar />
    </>
  );
};

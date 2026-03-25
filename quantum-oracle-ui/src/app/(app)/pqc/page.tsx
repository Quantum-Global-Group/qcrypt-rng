'use client';

import { useState } from 'react';
import { Protect } from '@/components/Protect';
import { QuantumRNG } from '@/components/QuantumRNG';

type Tab = 'protect' | 'generate';

export default function PqcSuitePage() {
  const [tab, setTab] = useState<Tab>('protect');

  return (
    <div className="min-h-full px-6 py-8 text-on-surface lg:px-8">
      <header className="mb-6 max-w-5xl">
        <p className="font-label text-[11px] font-medium uppercase tracking-[0.05em] text-outline">Post-quantum cryptography</p>
        <h1 className="mt-1 text-2xl font-semibold text-on-surface">PQC Suite</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Data protection and key / entropy tools. Switch tabs to move between workflows.
        </p>
      </header>

      <div className="mb-6 flex max-w-5xl flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('protect')}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'protect'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          Data Protection
        </button>
        <button
          type="button"
          onClick={() => setTab('generate')}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'generate'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          Key and Entropy Tools
        </button>
      </div>

      <div className="max-w-5xl">{tab === 'protect' ? <Protect /> : <QuantumRNG />}</div>
    </div>
  );
}

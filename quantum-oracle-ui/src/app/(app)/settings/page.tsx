'use client';

import { useState } from 'react';
import { NetworkStatus } from '@/components/NetworkStatus';
import { ThreatScanner } from '@/components/ThreatScanner';

type Tab = 'threat' | 'network';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('threat');

  return (
    <div className="min-h-full px-6 py-8 text-on-surface lg:px-8">
      <header className="mb-6 max-w-5xl">
        <p className="font-label text-[11px] font-medium uppercase tracking-[0.05em] text-outline">Monitoring</p>
        <h1 className="mt-1 text-2xl font-semibold text-on-surface">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Threat intelligence and network status for platform observability.
        </p>
      </header>

      <div className="mb-6 flex max-w-5xl flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('threat')}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'threat'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          Threat Intelligence
        </button>
        <button
          type="button"
          onClick={() => setTab('network')}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'network'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          Network Status
        </button>
      </div>

      <div className="max-w-5xl">{tab === 'threat' ? <ThreatScanner /> : <NetworkStatus />}</div>
    </div>
  );
}

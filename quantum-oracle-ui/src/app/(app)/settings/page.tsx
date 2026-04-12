'use client';

import { useState } from 'react';
import { BillingUsage } from '@/components/BillingUsage';
import { NetworkStatus } from '@/components/NetworkStatus';
import { ThreatScanner } from '@/components/ThreatScanner';
import { UserModeToggle } from '@/components/settings/UserModeToggle';
import { Settings as SettingsIcon, Shield, Globe, CreditCard, User } from 'lucide-react';

type Tab = 'user' | 'threat' | 'network' | 'billing';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('user');

  return (
    <div className="min-h-full py-8 text-on-surface">
      <header className="mb-6">
        <p className="font-label text-[11px] font-medium uppercase tracking-[0.05em] text-outline">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold text-on-surface">Application Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Configure your experience, monitor threats, and track usage.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('user')}
          className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'user'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          <User className="h-4 w-4" />
          User Preferences
        </button>
        <button
          type="button"
          onClick={() => setTab('threat')}
          className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'threat'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          <Shield className="h-4 w-4" />
          Threat Intelligence
        </button>
        <button
          type="button"
          onClick={() => setTab('network')}
          className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'network'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          <Globe className="h-4 w-4" />
          Network Status
        </button>
        <button
          type="button"
          onClick={() => setTab('billing')}
          className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'billing'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Billing
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {tab === 'user' ? (
          <div className="space-y-6">
            {/* User Mode Selection */}
            <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-6">
              <h2 className="mb-2 text-lg font-semibold text-on-surface">Experience Mode</h2>
              <p className="mb-4 text-sm text-on-surface-variant">
                Choose how you want to interact with the platform. You can switch between modes at any time.
              </p>
              <UserModeToggle />
              
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-surface-container p-4">
                  <h3 className="mb-2 font-medium text-on-surface">Simple Mode</h3>
                  <ul className="space-y-1 text-sm text-on-surface-variant">
                    <li>✓ Guided wizards</li>
                    <li>✓ Plain language explanations</li>
                    <li>✓ One-click operations</li>
                    <li>✓ No technical knowledge required</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-surface-container p-4">
                  <h3 className="mb-2 font-medium text-on-surface">Developer Mode</h3>
                  <ul className="space-y-1 text-sm text-on-surface-variant">
                    <li>✓ Full API access</li>
                    <li>✓ PQC suite & blockchain oracles</li>
                    <li>✓ Advanced configuration</li>
                    <li>✓ Code examples & integrations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* API Key Management (placeholder) */}
            <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-6">
              <h2 className="mb-2 text-lg font-semibold text-on-surface">API Keys</h2>
              <p className="mb-4 text-sm text-on-surface-variant">
                Manage your API keys for programmatic access.
              </p>
              <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-dark">
                Generate API Key
              </button>
            </div>
          </div>
        ) : tab === 'threat' ? (
          <ThreatScanner />
        ) : tab === 'network' ? (
          <NetworkStatus />
        ) : (
          <BillingUsage />
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { NetworkStatus } from '@/components/NetworkStatus';
import { Protect } from '@/components/Protect';
import { QuantumOracle } from '@/components/QuantumOracle';
import { QuantumRNG } from '@/components/QuantumRNG';
import { ThreatScanner } from '@/components/ThreatScanner';
import { checkHealth } from '@/utils/api';

type TabId = 'generate' | 'protect' | 'threat' | 'oracle' | 'network';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('oracle');
  const [apiHealth, setApiHealth] = useState<'loading' | 'online' | 'offline'>('loading');

  const featureTabs: { id: TabId; label: string }[] = [
    { id: 'oracle', label: 'Blockchain Security' },
    { id: 'protect', label: 'Data Protection' },
    { id: 'generate', label: 'Key and Entropy Tools' },
  ];
  const infoTabs: { id: TabId; label: string }[] = [
    { id: 'threat', label: 'Threat Intelligence' },
    { id: 'network', label: 'Network Status' },
  ];

  useEffect(() => {
    let mounted = true;
    checkHealth()
      .then(() => mounted && setApiHealth('online'))
      .catch(() => mounted && setApiHealth('offline'));
    return () => {
      mounted = false;
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generate':
        return <QuantumRNG />;
      case 'protect':
        return <Protect />;
      case 'threat':
        return <ThreatScanner />;
      case 'oracle':
        return <QuantumOracle />;
      case 'network':
        return <NetworkStatus />;
      default:
        return <QuantumRNG />;
    }
  };

  const statusText = apiHealth === 'loading' ? 'Checking...' : apiHealth === 'online' ? 'Operational' : 'Offline';
  const statusClass =
    apiHealth === 'online'
      ? 'status-ok'
      : apiHealth === 'offline'
        ? 'status-critical'
        : 'status-neutral';

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white">QCrypt RNG</h1>
              <p className="text-slate-400 text-sm mt-0.5">Quantum Security and Blockchain Resilience Platform</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">Docs</a>
              <div className={`flex items-center space-x-2 ${statusClass}`}>
                <div className={`w-2 h-2 rounded-full ${apiHealth === 'online' ? 'bg-green-500' : apiHealth === 'offline' ? 'bg-red-400' : 'bg-gray-400'}`} />
                <span className="text-sm">{statusText}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-slate-700/50 bg-[rgb(8,12,20)]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px items-center">
            {featureTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="w-px h-6 bg-slate-600/60 mx-2 shrink-0" aria-hidden />
            {infoTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {renderTabContent()}
      </main>

      <footer className="border-t border-slate-700/50 mt-12 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center text-slate-500 text-sm">
          QCrypt RNG v2.0
        </div>
      </footer>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { BlockchainProvider } from '@/components/blockchain/BlockchainContext';
import { NetworkBar } from '@/components/blockchain/NetworkBar';

export default function BlockchainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  // e.g. "/blockchain/wallet" → "wallet"
  const segment = pathname.replace(/^\/blockchain\/?/, '').split('/')[0] || 'index';

  return (
    <BlockchainProvider>
      <NetworkBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-10 font-mono">
        <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))]">
          <span className="text-[rgb(var(--green))]">›</span>
          <span>blockchain</span>
          <span className="text-[rgb(var(--fg-dim))]">{'//'}</span>
          <span className="text-[rgb(var(--fg))]">{segment}</span>
        </div>
        {children}
      </div>
    </BlockchainProvider>
  );
}

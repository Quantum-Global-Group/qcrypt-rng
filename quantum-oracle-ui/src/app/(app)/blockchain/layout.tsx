'use client';

import type { ReactNode } from 'react';
import { BlockchainProvider } from '@/components/blockchain/BlockchainContext';
import { NetworkBar } from '@/components/blockchain/NetworkBar';

export default function BlockchainLayout({ children }: { children: ReactNode }) {
  return (
    <BlockchainProvider>
      <div className="py-7 pb-16">
        <NetworkBar />
        {children}
      </div>
    </BlockchainProvider>
  );
}

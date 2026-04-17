'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

export interface Network {
  id: string;
  name: string;
  label: string;
  color: string;
}

export const NETWORKS: Network[] = [
  { id: 'ethereum', name: 'Ethereum', label: 'ETH', color: '#627EEA' },
  { id: 'polygon',  name: 'Polygon',  label: 'POL', color: '#8247E5' },
  { id: 'solana',   name: 'Solana',   label: 'SOL', color: '#9945FF' },
  { id: 'avalanche', name: 'Avalanche', label: 'AVAX', color: '#E84142' },
];

export interface WalletInfo {
  address: string;
  wallet_type: string;
  algorithms?: string[];
}

interface BlockchainContextValue {
  network: Network;
  setNetworkId: (id: string) => void;
  wallet: WalletInfo | null;
  setWallet: (w: WalletInfo | null) => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  isSimulation: boolean;
}

const BlockchainContext = createContext<BlockchainContextValue | null>(null);

export function BlockchainProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<Network>(NETWORKS[0]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  const setNetworkId = useCallback((id: string) => {
    const n = NETWORKS.find((x) => x.id === id);
    if (n) setNetwork(n);
  }, []);

  const connectWallet = useCallback(() => {
    // Simulation mode — real MetaMask/WalletConnect wiring goes here
    setWallet({
      address: '0xSimulation' + Math.random().toString(16).slice(2, 10).toUpperCase(),
      wallet_type: 'simulation',
      algorithms: ['DILITHIUM3', 'KYBER768'],
    });
  }, []);

  const disconnectWallet = useCallback(() => setWallet(null), []);

  return (
    <BlockchainContext.Provider
      value={{ network, setNetworkId, wallet, setWallet, connectWallet, disconnectWallet, isSimulation: true }}
    >
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain(): BlockchainContextValue {
  const ctx = useContext(BlockchainContext);
  if (!ctx) throw new Error('useBlockchain must be used within BlockchainProvider');
  return ctx;
}

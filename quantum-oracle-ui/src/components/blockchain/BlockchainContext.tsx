'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/* ─── types ────────────────────────────────────────────────────────────────── */

export type NetworkId = 'simulation' | 'sepolia' | 'polygon' | 'mainnet';

export interface NetworkConfig {
  id: NetworkId;
  label: string;
  chainId: number | null; // null for simulation
  rpcHint: string;
  explorer: string | null;
  oracleAddress: string | null;
  currency: string;
  badge?: string;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

export interface BlockchainCtx {
  network: NetworkConfig;
  setNetworkId: (id: NetworkId) => void;
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isSimulation: boolean;
}

/* ─── networks ─────────────────────────────────────────────────────────────── */

export const NETWORKS: NetworkConfig[] = [
  {
    id: 'simulation',
    label: 'Simulation',
    chainId: null,
    rpcHint: 'localhost',
    explorer: null,
    oracleAddress: null,
    currency: '—',
  },
  {
    id: 'sepolia',
    label: 'Sepolia',
    chainId: 11155111,
    rpcHint: 'https://rpc.sepolia.org',
    explorer: 'https://sepolia.etherscan.io',
    oracleAddress: null, // set after deployment
    currency: 'ETH',
    badge: 'TESTNET',
  },
  {
    id: 'polygon',
    label: 'Polygon',
    chainId: 137,
    rpcHint: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    oracleAddress: null,
    currency: 'MATIC',
  },
  {
    id: 'mainnet',
    label: 'Ethereum',
    chainId: 1,
    rpcHint: 'https://mainnet.infura.io',
    explorer: 'https://etherscan.io',
    oracleAddress: null,
    currency: 'ETH',
  },
];

const NETWORK_MAP = Object.fromEntries(NETWORKS.map((n) => [n.id, n]));

/* ─── provider ─────────────────────────────────────────────────────────────── */

const Ctx = createContext<BlockchainCtx | null>(null);

export function useBlockchain(): BlockchainCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBlockchain must be inside BlockchainProvider');
  return ctx;
}

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [networkId, setNetworkId] = useState<NetworkId>('simulation');
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    chainId: null,
    balance: null,
  });

  const network = NETWORK_MAP[networkId] ?? NETWORKS[0];
  const isSimulation = networkId === 'simulation';

  // Listen for wallet account / chain changes
  useEffect(() => {
    const eth = typeof window !== 'undefined' ? (window as Record<string, unknown>).ethereum as {
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    } | undefined : undefined;
    if (!eth?.on) return;

    const onAccountsChanged = (accounts: unknown) => {
      const accts = accounts as string[];
      if (!accts.length) {
        setWallet({ connected: false, address: null, chainId: null, balance: null });
      } else {
        setWallet((prev) => ({ ...prev, address: accts[0], connected: true }));
      }
    };
    const onChainChanged = (chainId: unknown) => {
      setWallet((prev) => ({ ...prev, chainId: parseInt(chainId as string, 16) }));
    };

    eth.on('accountsChanged', onAccountsChanged);
    eth.on('chainChanged', onChainChanged);
    return () => {
      eth.removeListener?.('accountsChanged', onAccountsChanged);
      eth.removeListener?.('chainChanged', onChainChanged);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    const eth = (window as Record<string, unknown>).ethereum as {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    } | undefined;
    if (!eth) {
      alert('MetaMask or a compatible wallet is required');
      return;
    }
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      const chainId = parseInt((await eth.request({ method: 'eth_chainId' })) as string, 16);
      let balance: string | null = null;
      try {
        const raw = (await eth.request({ method: 'eth_getBalance', params: [accounts[0], 'latest'] })) as string;
        balance = (parseInt(raw, 16) / 1e18).toFixed(4);
      } catch { /* ok */ }
      setWallet({ connected: true, address: accounts[0], chainId, balance });

      // Switch chain if needed
      if (network.chainId && chainId !== network.chainId) {
        try {
          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + network.chainId.toString(16) }],
          });
        } catch { /* user rejected or chain not added */ }
      }
    } catch (e) {
      console.error('Wallet connection failed', e);
    }
  }, [network.chainId]);

  const disconnectWallet = useCallback(() => {
    setWallet({ connected: false, address: null, chainId: null, balance: null });
  }, []);

  return (
    <Ctx.Provider value={{ network, setNetworkId, wallet, connectWallet, disconnectWallet, isSimulation }}>
      {children}
    </Ctx.Provider>
  );
}

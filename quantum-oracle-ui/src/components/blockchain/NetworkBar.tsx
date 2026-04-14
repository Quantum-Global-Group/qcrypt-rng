'use client';

import { NETWORKS, useBlockchain } from './BlockchainContext';
import { cn } from '@/lib/utils';

export function NetworkBar() {
  const { network, setNetworkId, wallet, connectWallet, disconnectWallet, isSimulation } = useBlockchain();

  const shortAddr = wallet.address
    ? wallet.address.slice(0, 6) + '…' + wallet.address.slice(-4)
    : null;

  const wrongChain = !isSimulation && wallet.connected && network.chainId && wallet.chainId !== network.chainId;

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 px-5 py-3 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Network selector */}
        <div className="flex gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setNetworkId(n.id)}
              className={cn(
                'rounded px-3 py-1.5 font-mono text-[11px] font-medium transition-colors flex items-center gap-1.5',
                network.id === n.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              {n.label}
              {n.badge && (
                <span className="font-mono text-[8px] uppercase tracking-wider text-tertiary">{n.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Chain info */}
        <div className="flex items-center gap-3 text-[11px]">
          {!isSimulation && (
            <>
              <span className="font-mono text-outline">Chain {network.chainId}</span>
              <span className="font-mono text-outline">·</span>
              <span className="font-mono text-outline">{network.currency}</span>
            </>
          )}
          {isSimulation && (
            <span className="font-mono text-outline/60">No wallet required · all operations run locally</span>
          )}
        </div>

        {/* Wallet */}
        <div className="ml-auto flex items-center gap-2">
          {!isSimulation && (
            <>
              {wallet.connected ? (
                <>
                  {wrongChain && (
                    <span className="font-mono text-[10px] text-tertiary">Wrong chain</span>
                  )}
                  <span className="rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 px-2.5 py-1 font-mono text-[11px] text-secondary">
                    {shortAddr}
                  </span>
                  {wallet.balance && (
                    <span className="font-mono text-[10px] text-outline">{wallet.balance} {network.currency}</span>
                  )}
                  <button
                    type="button"
                    onClick={disconnectWallet}
                    className="font-mono text-[10px] text-outline/60 hover:text-on-surface-variant transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  Connect wallet
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { NETWORKS, useBlockchain } from './BlockchainContext';

/**
 * Terminal-themed network / wallet bar. Renders the network selector on the
 * left, an optional simulation-mode banner in the middle, and the connected
 * wallet (or a connect button) on the right.
 */
export function NetworkBar() {
  const {
    network,
    setNetworkId,
    wallet,
    connectWallet,
    disconnectWallet,
    isSimulation,
  } = useBlockchain();

  return (
    <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--bg-sunken))]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 flex-wrap font-mono text-xs">
        {/* Prompt + label */}
        <span className="text-[rgb(var(--green))] select-none">$</span>
        <span className="text-[10px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))]">
          net
        </span>

        {/* Network selector */}
        <div className="flex items-center gap-1">
          {NETWORKS.map((n) => {
            const active = n.id === network.id;
            return (
              <button
                key={n.id}
                onClick={() => setNetworkId(n.id)}
                className={
                  active
                    ? 'px-2 py-0.5 border rounded-[2px] border-[rgb(var(--green))] text-[rgb(var(--green))] bg-[rgba(0,255,156,0.06)] uppercase tracking-wider'
                    : 'px-2 py-0.5 border rounded-[2px] border-[rgb(var(--border))] text-[rgb(var(--fg-dim))] hover:text-[rgb(var(--fg))] hover:border-[rgb(var(--fg-dim))] uppercase tracking-wider transition-colors'
                }
              >
                {n.label}
              </button>
            );
          })}
        </div>

        <span className="flex-1" />

        {/* Simulation badge */}
        {isSimulation && (
          <span className="chip chip-amber uppercase tracking-[0.15em] text-[10px]">
            <span className="pulse">●</span> sim mode
          </span>
        )}

        {/* Wallet */}
        {wallet ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))]">
              wallet
            </span>
            <span className="text-[rgb(var(--green))] select-all">
              {wallet.address.slice(0, 8)}…{wallet.address.slice(-4)}
            </span>
            <button
              onClick={disconnectWallet}
              className="text-[rgb(var(--fg-dim))] hover:text-[rgb(var(--red))] transition-colors uppercase tracking-wider"
            >
              disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="btn-primary text-xs px-3 py-1"
          >
            connect wallet
          </button>
        )}
      </div>
    </div>
  );
}

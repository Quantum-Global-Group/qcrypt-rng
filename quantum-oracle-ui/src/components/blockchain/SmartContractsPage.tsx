'use client';

import { CopyButton } from '@/components/ui';

type ContractStatus = 'deployed' | 'planned' | 'deprecated';

interface ContractInfo {
  name: string;
  file: string;
  description: string;
  chain: string;
  address: string | null;
  status: ContractStatus;
  abi?: string;
  purpose: string;
}

const CONTRACTS: ContractInfo[] = [
  {
    name: 'QuantumRandomnessOracle',
    file: 'QuantumRandomnessOracle.sol',
    description: 'Primary oracle contract. Accepts randomness requests from consumer contracts, emits events for the fulfillment node, and writes the final quantum-sourced entropy on-chain via commit-reveal.',
    chain: 'Ethereum Sepolia',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    status: 'deployed',
    purpose: 'Core oracle mechanism — the on-chain entry point for all randomness requests.',
  },
  {
    name: 'OracleConsumer',
    file: 'OracleConsumer.sol',
    description: 'Example consumer contract demonstrating how to request and receive quantum randomness. Implements the IQuantumOracleConsumer interface and handles the fulfillRandomness callback.',
    chain: 'Ethereum Sepolia',
    address: '0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0',
    status: 'deployed',
    purpose: 'Integration reference — copy this pattern to add quantum randomness to your own contract.',
  },
  {
    name: 'QCryptToken',
    file: 'QCryptToken.sol',
    description: 'ERC-20 utility token for metered API access. Each cryptographic operation (generate, sign, KEM) will consume tokens, enabling trustless pay-per-use without centralized billing.',
    chain: 'Ethereum Mainnet',
    address: null,
    status: 'planned',
    purpose: 'Usage metering — every API call will be priced and settled on-chain.',
  },
];

const STATUS_CHIP: Record<ContractStatus, string> = {
  deployed:   'chip chip-verified',
  planned:    'chip chip-info',
  deprecated: 'chip chip-degraded',
};

export function SmartContractsPage() {
  return (
    <div className="w-full space-y-4 text-on-surface">
      {/* Info bar */}
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-5">
        <p className="text-[13px] leading-relaxed text-on-surface-variant">
          Deployed Solidity contracts that form the on-chain layer of QCrypt. Developers integrating quantum randomness or PQC keys into their applications target these contracts directly. All testnet deployments are on Ethereum Sepolia.
        </p>
      </div>

      {/* Contract cards */}
      <div className="space-y-4">
        {CONTRACTS.map((c) => (
          <div
            key={c.file}
            className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-4"
          >
            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-headline text-base font-semibold text-on-surface">{c.name}</h2>
                  <span className={STATUS_CHIP[c.status]}>{c.status}</span>
                  {c.chain && (
                    <span className="font-mono text-[10px] text-outline border border-outline-variant/25 rounded px-1.5 py-0.5">
                      {c.chain}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-outline/70">{c.file}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-[13px] leading-relaxed text-on-surface-variant">{c.description}</p>

            {/* Purpose callout */}
            <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest/60 px-4 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-outline">Purpose · </span>
              <span className="font-mono text-[11px] text-on-surface-variant">{c.purpose}</span>
            </div>

            {/* Address */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Address</span>
              {c.address ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[11px] text-secondary truncate">{c.address}</span>
                  <CopyButton value={c.address} label="Copy" />
                </div>
              ) : (
                <span className="font-mono text-[11px] text-outline/50 italic">Not yet deployed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';

/**
 * On-chain verification badge set — renders chain + tx hash + block height,
 * wired to the appropriate block explorer.
 *
 * Supported chain ids are intentionally loose; unknown chains still render
 * a generic badge so the UI doesn't break when the API adds more.
 */

const EXPLORERS: Record<string, { tx: (h: string) => string; block: (b: string | number) => string; name: string; color: string }> = {
  ethereum: {
    name: 'Ethereum',
    color: 'chip-cyan',
    tx: (h) => `https://etherscan.io/tx/${h}`,
    block: (b) => `https://etherscan.io/block/${b}`,
  },
  polygon: {
    name: 'Polygon',
    color: 'chip-magenta',
    tx: (h) => `https://polygonscan.com/tx/${h}`,
    block: (b) => `https://polygonscan.com/block/${b}`,
  },
  arbitrum: {
    name: 'Arbitrum',
    color: 'chip-cyan',
    tx: (h) => `https://arbiscan.io/tx/${h}`,
    block: (b) => `https://arbiscan.io/block/${b}`,
  },
  optimism: {
    name: 'Optimism',
    color: 'chip-red',
    tx: (h) => `https://optimistic.etherscan.io/tx/${h}`,
    block: (b) => `https://optimistic.etherscan.io/block/${b}`,
  },
  base: {
    name: 'Base',
    color: 'chip-cyan',
    tx: (h) => `https://basescan.org/tx/${h}`,
    block: (b) => `https://basescan.org/block/${b}`,
  },
  solana: {
    name: 'Solana',
    color: 'chip-magenta',
    tx: (h) => `https://explorer.solana.com/tx/${h}`,
    block: (b) => `https://explorer.solana.com/block/${b}`,
  },
  bitcoin: {
    name: 'Bitcoin',
    color: 'chip-amber',
    tx: (h) => `https://mempool.space/tx/${h}`,
    block: (b) => `https://mempool.space/block/${b}`,
  },
};

const truncate = (s: string, left = 6, right = 4) =>
  s.length > left + right + 3 ? `${s.slice(0, left)}…${s.slice(-right)}` : s;

export const ChainChip = ({ chain }: { chain: string }) => {
  const meta = EXPLORERS[chain.toLowerCase()];
  const color = meta?.color ?? 'chip';
  const label = meta?.name ?? chain.toUpperCase();
  return <span className={`chip ${color}`}>{label}</span>;
};

export const TxBadge = ({
  chain,
  hash,
  label = 'tx',
}: {
  chain: string;
  hash: string;
  label?: string;
}) => {
  const meta = EXPLORERS[chain.toLowerCase()];
  const href = meta ? meta.tx(hash) : undefined;
  const body: ReactNode = (
    <>
      <span className="opacity-60">{label}</span>{' '}
      <span className="font-mono">{truncate(hash, 8, 6)}</span>
      {href && <span className="ml-1 opacity-60">↗</span>}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="chip chip-green hover:!text-[rgb(230,255,238)]">
      {body}
    </a>
  ) : (
    <span className="chip">{body}</span>
  );
};

export const BlockBadge = ({
  chain,
  height,
}: {
  chain: string;
  height: string | number;
}) => {
  const meta = EXPLORERS[chain.toLowerCase()];
  const href = meta ? meta.block(height) : undefined;
  const body: ReactNode = (
    <>
      <span className="opacity-60">blk</span>{' '}
      <span className="font-mono">#{typeof height === 'number' ? height.toLocaleString() : height}</span>
      {href && <span className="ml-1 opacity-60">↗</span>}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="chip chip-cyan hover:!text-[rgb(230,255,238)]">
      {body}
    </a>
  ) : (
    <span className="chip">{body}</span>
  );
};

/** Compact row: chain + tx + optional block */
export const OnChainBadge = ({
  chain,
  tx,
  block,
  className = '',
}: {
  chain: string;
  tx?: string;
  block?: string | number;
  className?: string;
}) => (
  <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
    <ChainChip chain={chain} />
    {tx && <TxBadge chain={chain} hash={tx} />}
    {block !== undefined && <BlockBadge chain={chain} height={block} />}
  </span>
);

/** Render a list of chains as chips — handy for "Quantum oracle for: [x] [y]" */
export const ChainList = ({ chains }: { chains: string[] }) => (
  <span className="inline-flex flex-wrap gap-1.5">
    {chains.map((c) => (
      <ChainChip key={c} chain={c} />
    ))}
  </span>
);

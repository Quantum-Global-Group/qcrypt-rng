import Link from 'next/link';

/**
 * Pillar summary: unified Prove / Protect / Randomize across home dashboard,
 * blockchain subtree, and scenario guides.
 */
export function PillarBridgeCallout({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? 'section px-3 py-2.5 text-[11px] font-mono leading-relaxed'
          : 'section p-4 text-xs font-mono leading-relaxed'
      }
    >
      <div className="text-[10px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))] mb-2">
        Pillars · unified naming
      </div>
      <ul className="space-y-1.5 text-[rgb(var(--fg))]">
        <li>
          <span className="text-[rgb(var(--cyan))]">Prove</span>
          <span className="text-[rgb(var(--fg-dim))]"> · VRF, attestations, PQC signatures, chain adapters</span>
        </li>
        <li>
          <span className="text-[rgb(var(--green))]">Protect</span>
          <span className="text-[rgb(var(--fg-dim))]"> · encrypt, hash, sign, KEM, hybrid schemes</span>
        </li>
        <li>
          <span className="text-[rgb(var(--amber))]">Randomize</span>
          <span className="text-[rgb(var(--fg-dim))]"> · bytes, keys, passwords, tokens, batch oracle</span>
        </li>
      </ul>
      {!compact && (
        <p className="mt-3 text-[11px] text-[rgb(var(--fg-dim))]">
          Same pillars on every surface:{' '}
          <Link href="/blockchain/prove" className="text-[rgb(var(--cyan))] hover:underline">
            /blockchain/prove
          </Link>
          ,{' '}
          <Link href="/blockchain/protect" className="text-[rgb(var(--green))] hover:underline">
            /blockchain/protect
          </Link>
          ,{' '}
          <Link href="/blockchain/randomize" className="text-[rgb(var(--amber))] hover:underline">
            /blockchain/randomize
          </Link>
          . See{' '}
          <Link href="/scenarios" className="text-[rgb(var(--green))] hover:underline">
            scenario guides
          </Link>{' '}
          for composed workflows (lottery, sealed bid, committee).
        </p>
      )}
    </div>
  );
}

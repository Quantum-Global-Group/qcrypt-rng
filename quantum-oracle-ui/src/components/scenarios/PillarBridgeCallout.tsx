import Link from 'next/link';

/**
 * Light copy bridge: home dashboard tab names ↔ Prove / Protect / Randomize pillars.
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
        Pillar map · home tabs ↔ blockchain
      </div>
      <ul className="space-y-1.5 text-[rgb(var(--fg))]">
        <li>
          <span className="text-[rgb(var(--fg-dim))]">oracle tab</span>
          <span className="mx-2 text-[rgb(var(--fg-dim))]">→</span>
          <span className="text-[rgb(var(--cyan))]">Prove</span>
          <span className="text-[rgb(var(--fg-dim))]"> + </span>
          <span className="text-[rgb(var(--amber))]">Randomize</span>
          <span className="text-[rgb(var(--fg-dim))]"> (VRF, attestations)</span>
        </li>
        <li>
          <span className="text-[rgb(var(--fg-dim))]">protect tab</span>
          <span className="mx-2 text-[rgb(var(--fg-dim))]">→</span>
          <span className="text-[rgb(var(--green))]">Protect</span>
          <span className="text-[rgb(var(--fg-dim))]"> (encrypt, hash, sign)</span>
        </li>
        <li>
          <span className="text-[rgb(var(--fg-dim))]">rng tab</span>
          <span className="mx-2 text-[rgb(var(--fg-dim))]">→</span>
          <span className="text-[rgb(var(--amber))]">Randomize</span>
          <span className="text-[rgb(var(--fg-dim))]"> (bytes, keys, batch oracle)</span>
        </li>
      </ul>
      {!compact && (
        <p className="mt-3 text-[11px] text-[rgb(var(--fg-dim))]">
          Blockchain surfaces use pillar names directly:{' '}
          <Link href="/blockchain/prove" className="text-[rgb(var(--cyan))] hover:underline">
            Prove
          </Link>
          ,{' '}
          <Link href="/blockchain/protect" className="text-[rgb(var(--green))] hover:underline">
            Protect
          </Link>
          ,{' '}
          <Link href="/blockchain/randomize" className="text-[rgb(var(--amber))] hover:underline">
            Randomize
          </Link>
          . See{' '}
          <Link href="/scenarios" className="text-[rgb(var(--green))] hover:underline">
            scenario guides
          </Link>{' '}
          for composed workflows.
        </p>
      )}
    </div>
  );
}

import Link from 'next/link';
import { Binary, Boxes, Radio, Sparkles, Waypoints } from 'lucide-react';

/**
 * Parity with PqcBusinessCapabilities: explains entropy / RNG tools for ops & product teams.
 */
export function PqcEntropyCapabilities() {
  return (
    <section
      className="mt-8 rounded-xl border border-outline-variant/20 bg-surface-container-low/60 p-5 sm:p-6"
      aria-labelledby="pqc-entropy-capabilities-heading"
    >
      <h2
        id="pqc-entropy-capabilities-heading"
        className="font-headline text-lg font-semibold tracking-tight text-on-surface"
      >
        Entropy &amp; keys — what you can generate here
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
        Everything below draws from the <strong className="font-medium text-on-surface">same quantum-backed RNG pipeline</strong> as
        the rest of QCrypt. Use it for <strong className="font-medium text-on-surface">nonces, seeds, session material, and oracle
        commitments</strong> — then copy or download results into your own systems. For deeper PQC experiments, use the{' '}
        <Link href="/research/pqc/kem" className="text-primary underline-offset-2 hover:underline">
          ML-KEM lab
        </Link>{' '}
        or{' '}
        <Link href="/research/pqc/benchmarks" className="text-primary underline-offset-2 hover:underline">
          benchmarks
        </Link>
        .
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        <li className="flex gap-3 rounded-lg border border-outline-variant/15 bg-surface/80 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Binary className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Bytes, keys &amp; IDs</h3>
            <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
              Raw random bytes, symmetric/asymmetric key material, and RFC UUIDs — the usual building blocks for apps,
              scripts, and test environments.
            </p>
          </div>
        </li>

        <li className="flex gap-3 rounded-lg border border-outline-variant/15 bg-surface/80 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Passwords &amp; tokens</h3>
            <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
              User-facing passwords with a strength meter and URL-safe bearer tokens with expiry presets — suitable for
              bootstrapping auth in demos and internal tools (always follow your org&apos;s secret-handling policy).
            </p>
          </div>
        </li>

        <li className="flex gap-3 rounded-lg border border-outline-variant/15 bg-surface/80 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-tertiary/10 text-tertiary">
            <Radio className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Oracle &amp; batch requests</h3>
            <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
              Single and batch calls into the randomness oracle with commitments — for flows that need verifiable,
              chain-aware randomness. Pairs with{' '}
              <Link href="/fulfillment" className="text-primary underline-offset-2 hover:underline">
                Fulfillment
              </Link>{' '}
              when you move on-chain.
            </p>
          </div>
        </li>

        <li className="flex gap-3 rounded-lg border border-outline-variant/15 bg-surface/80 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-outline/20 text-on-surface-variant">
            <Boxes className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Results panel</h3>
            <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
              Everything you generate rolls into a filterable <strong className="font-medium text-on-surface">results</strong>{' '}
              list with copy and download — same pattern as a developer workbench, kept in one session.
            </p>
          </div>
        </li>
      </ul>

      <p className="mt-5 flex flex-wrap items-center gap-2 text-[13px] text-on-surface-variant">
        <Waypoints className="h-4 w-4 shrink-0 text-outline" strokeWidth={1.75} aria-hidden />
        <span>
          Need a guided flow only for keys? Open{' '}
          <Link href="/pqc/keys" className="font-medium text-primary hover:underline">
            Key generation
          </Link>
          . For Kyber-only encapsulation, use{' '}
          <Link href="/pqc/kem" className="font-medium text-primary hover:underline">
            Kyber KEM
          </Link>
          .
        </span>
      </p>
    </section>
  );
}

import { FileLock2, Fingerprint, KeySquare, Orbit } from 'lucide-react';

/**
 * Maps product capabilities to client/business outcomes and clarifies
 * “quantum” (entropy-backed material) vs “post-quantum” (PQC algorithms).
 */
export function PqcBusinessCapabilities() {
  return (
    <section
      className="mt-8 rounded-xl border border-outline-variant/20 bg-surface-container-low/60 p-5 sm:p-6"
      aria-labelledby="pqc-business-capabilities-heading"
    >
      <h2
        id="pqc-business-capabilities-heading"
        className="font-headline text-lg font-semibold tracking-tight text-on-surface"
      >
        Clients, teams &amp; “quantum level” — what this suite actually does
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
        You can run <strong className="font-medium text-on-surface">business-grade workflows</strong> here: encrypt
        documents, sign and verify data, and protect passwords for storage. Where QCrypt says{' '}
        <em>quantum</em>, we mean <strong className="font-medium text-on-surface">keys and salts drawn from the
        quantum-backed RNG</strong> (when you use default keys and quantum salt).{' '}
        <strong className="font-medium text-on-surface">Post-quantum (PQC)</strong> means NIST-style algorithms
        (Kyber, Dilithium, …) that stay strong against future quantum computers — that is separate from “quantum
        randomness,” but both live in this workspace.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        <li className="flex gap-3 rounded-lg border border-outline-variant/15 bg-surface/80 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileLock2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Encrypt documents &amp; payloads</h3>
            <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
              Use <strong className="font-medium text-on-surface">File</strong> mode for documents and attachments
              (within API limits), or <strong className="font-medium text-on-surface">Text</strong> for messages and
              API bodies. AES-GCM with optional quantum-sourced key material — suitable for internal sharing and client
              deliverables that must stay confidential in transit and at rest.
            </p>
          </div>
        </li>

        <li className="flex gap-3 rounded-lg border border-outline-variant/15 bg-surface/80 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary">
            <Fingerprint className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Sign &amp; verify for operations</h3>
            <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
              <strong className="font-medium text-on-surface">HMAC</strong> for today&apos;s integrations and audit
              trails; <strong className="font-medium text-on-surface">standalone verify</strong> for anything partners
              send you. <strong className="font-medium text-on-surface">PQC signatures</strong> (Dilithium, Falcon,
              …) for long-lived non-repudiation. <strong className="font-medium text-on-surface">Kyber KEM</strong> for
              quantum-safe shared secrets between systems.
            </p>
          </div>
        </li>

        <li className="flex gap-3 rounded-lg border border-outline-variant/15 bg-surface/80 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-tertiary/10 text-tertiary">
            <KeySquare className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Password protection for clients &amp; workforce</h3>
            <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
              <strong className="font-medium text-on-surface">Password hash</strong> mode uses PBKDF2 with tunable
              iterations and <strong className="font-medium text-on-surface">quantum-derived salt</strong> — the right
              pattern for storing customer or employee credentials (always store hashes, never plaintext passwords).
            </p>
          </div>
        </li>

        <li className="flex gap-3 rounded-lg border border-outline-variant/15 bg-surface/80 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-outline/20 text-on-surface-variant">
            <Orbit className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Quantum level, in plain terms</h3>
            <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
              Data is still encrypted with standard AES; signatures use established math. The upgrade is{' '}
              <strong className="font-medium text-on-surface">better randomness for keys/salts</strong> and optional{' '}
              <strong className="font-medium text-on-surface">post-quantum algorithms</strong> so your security story
              holds as threats evolve — not “quantum magic,” but production-oriented crypto with QCrypt&apos;s entropy
              and PQC stack.
            </p>
          </div>
        </li>
      </ul>
    </section>
  );
}

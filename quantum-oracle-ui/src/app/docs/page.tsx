import Link from 'next/link';

export const metadata = {
  title: 'qcrypt-rng // docs',
  description: 'Endpoint reference for the QCrypt RNG quantum randomness oracle.',
};

/* ── Section wrapper — phosphor header with // comment prefix ─────────── */
const S = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-[rgb(var(--green))] border-b border-[rgb(var(--border))] pb-2 flex items-center gap-2">
      <span className="text-[rgb(var(--fg-dim))]">{'//'}</span>
      <span>{title}</span>
    </h2>
    {children}
  </section>
);

/* ── Endpoint row — METHOD /path + description ────────────────────────── */
const F = ({
  name,
  endpoint,
  desc,
}: {
  name: string;
  endpoint: string;
  desc: string;
}) => {
  const match = /^(\w+)\s+(.+)$/.exec(endpoint);
  const method = match?.[1] ?? 'POST';
  const path = match?.[2] ?? endpoint;
  const methodTone =
    method === 'GET' ? 'text-[rgb(var(--cyan))]' : 'text-[rgb(var(--green))]';
  return (
    <div className="py-3 border-b border-[rgb(var(--border))]/50 last:border-0 font-mono">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-sm text-[rgb(var(--fg))]">{name}</span>
        <code className="text-xs">
          <span className={`${methodTone} uppercase font-semibold mr-1.5`}>{method}</span>
          <span className="text-[rgb(var(--fg-dim))]">{path}</span>
        </code>
      </div>
      <p className="text-xs text-[rgb(var(--fg-dim))] mt-1 leading-relaxed">{desc}</p>
    </div>
  );
};

export default function DocsPage() {
  const tabs = [
    ['Blockchain Security', 'quantum-safe wallets, VRF proofs, chain-aware randomness'],
    ['Data Protection', 'encryption, signing, hashing, post-quantum crypto'],
    ['Key & Entropy Tools', 'bytes, keys, tokens, UUIDs, passwords, batch ops'],
    ['Threat Intelligence', 'algorithm vulnerability scanning + attack sim'],
    ['Network Status', 'health, entropy quality, hardware, oracle monitoring'],
  ];

  return (
    <div className="min-h-screen text-[rgb(var(--fg))] relative pb-10">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="border-b border-[rgb(var(--border))] relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 font-mono">
              <div className="flex items-baseline gap-2">
                <span className="text-[rgb(var(--green))] select-none">$</span>
                <Link
                  href="/"
                  className="text-base sm:text-lg font-semibold text-[rgb(230,255,238)] hover:text-[rgb(var(--green))] transition-colors"
                >
                  qcrypt-rng
                </Link>
                <span className="text-[rgb(var(--fg-dim))] text-xs sm:text-sm">
                  / docs · endpoint reference
                </span>
                <span className="text-[rgb(var(--green))] caret ml-0.5" aria-hidden />
              </div>
              <div className="mt-1 text-[10px] tracking-[0.15em] uppercase text-[rgb(var(--fg-dim))]">
                api/v2 · auto-discovery 8000-8004 · override NEXT_PUBLIC_API_BASE_URL
              </div>
            </div>
            <Link href="/" className="btn-ghost">
              ← back
            </Link>
            <Link href="/scenarios" className="btn-ghost hidden sm:inline-flex">
              scenarios
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10 relative z-10">
        {/* Getting Started */}
        <S title="getting started">
          <p className="text-sm text-[rgb(var(--fg))] leading-relaxed font-mono">
            qcrypt-rng is a quantum-enhanced security platform providing
            cryptographically secure randomness, post-quantum cryptography,
            blockchain security tools, and a verifiable random function (VRF)
            oracle. The dashboard organises features into five tabs.
          </p>
          <p className="text-xs text-[rgb(var(--fg-dim))] font-mono leading-relaxed">
            For composed Prove / Protect / Randomize workflows (lottery, sealed bid, committee),
            see the{' '}
            <Link href="/scenarios" className="text-[rgb(var(--green))] hover:underline">
              scenario guides
            </Link>
            .
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {tabs.map(([title, desc]) => (
              <div key={title} className="section p-3">
                <div className="text-xs font-mono uppercase tracking-wider text-[rgb(var(--green))]">
                  {title}
                </div>
                <p className="text-[11px] text-[rgb(var(--fg-dim))] mt-1 leading-relaxed font-mono">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </S>

        {/* Blockchain Security */}
        <S title="blockchain security">
          <F name="Create Wallet Profiles" endpoint="POST /blockchain/create-wallet" desc="Generate and compare classical (ECDSA) vs quantum-safe (DILITHIUM/KYBER) blockchain wallets." />
          <F name="Quantum VRF — Create Seed" endpoint="POST /oracle/vrf/seed" desc="Generate a quantum random seed and publish a Keccak-256 commitment for verifiable randomness." />
          <F name="Quantum VRF — Prove" endpoint="POST /oracle/vrf/prove" desc="Compute a deterministic VRF output for a given input (alpha) using the quantum seed." />
          <F name="Quantum VRF — Reveal" endpoint="POST /oracle/vrf/reveal" desc="Reveal the quantum seed so third parties can independently verify VRF proofs." />
          <F name="Quantum VRF — Verify" endpoint="POST /oracle/vrf/verify" desc="Verify a VRF proof by checking commitment == H(seed) and output == H(seed || alpha)." />
        </S>

        {/* Data Protection */}
        <S title="data protection">
          <F name="Encrypt / Decrypt" endpoint="POST /protect/encrypt, /decrypt" desc="AES encryption (256-GCM, 128-GCM, 256-CBC) with quantum-generated or custom keys. Supports text and file encryption up to 10 MB." />
          <F name="File Encrypt / Decrypt" endpoint="POST /protect/encrypt-file, /decrypt-file" desc="Upload files for quantum-key encryption. Returns encrypted payload with original filename preserved." />
          <F name="Sign / Verify" endpoint="POST /protect/sign, /verify" desc="HMAC-SHA256 and HMAC-SHA512 signatures with quantum-random keys for message authentication." />
          <F name="Hash / Password Protection" endpoint="POST /protect/hash" desc="Quantum-salted hashing with SHA3-256, SHA3-512, PBKDF2-SHA256, or BLAKE2b-256. Configurable iterations for password hashing." />
          <F name="PQC Key Generation" endpoint="POST /pqc/generate" desc="Generate DILITHIUM (signature) or KYBER (key exchange) key pairs at NIST security levels 1-5." />
          <F name="PQC Sign / Verify" endpoint="POST /pqc/sign, /verify" desc="Post-quantum digital signatures using DILITHIUM. Resistant to quantum computer attacks." />
        </S>

        {/* Key & Entropy Tools */}
        <S title="key & entropy tools">
          <F name="Request Randomness" endpoint="POST /oracle/request" desc="Request quantum randomness for smart contracts with commit-reveal scheme and optional target chain." />
          <F name="Random Bytes" endpoint="POST /generate/bytes" desc="Raw quantum random bytes in hex, base64, or array format with configurable qubit count." />
          <F name="Cryptographic Keys" endpoint="POST /generate/key" desc="AES, RSA, or ECDSA keys with quantum entropy. Output in Base64, Hex, or PEM format." />
          <F name="Quantum UUID" endpoint="POST /generate/uuid" desc="RFC4122 v4 UUIDs with quantum randomness. Generate up to 50 in standard, raw, or URN format." />
          <F name="Secure Password" endpoint="POST /generate/password" desc="Quantum-random passwords with configurable character sets, ambiguous exclusion, and strength analysis." />
          <F name="Session Token" endpoint="POST /generate/token" desc="URL-safe bearer tokens with quantum entropy and configurable expiry (1h to 30d)." />
          <F name="Batch Random Bytes" endpoint="POST /generate/batch" desc="Multiple quantum random samples in a single call with optional parallel processing." />
          <F name="Batch Oracle Requests" endpoint="POST /oracle/requests/batch" desc="Multiple oracle commitments in one call with optional scheduled delivery block and target chain." />
        </S>

        {/* Threat Intelligence */}
        <S title="threat intelligence">
          <F name="Threat Scanner" endpoint="POST /pqc/threat-assessment" desc="Assess quantum vulnerability of algorithms (RSA, ECDSA, KYBER). Shows risk level, qubits to break, and recommendations." />
          <F name="Oracle Benchmark" endpoint="GET /oracle/benchmark" desc="Measure generation throughput, commitment latency, and entropy quality of the quantum oracle." />
          <F name="Simulate Quantum Attack" endpoint="POST /blockchain/simulate-attack" desc="Simulate Shor's algorithm on RSA-2048, ECDSA-256, DILITHIUM3, or KYBER768." />
          <F name="Compare Blockchains" endpoint="GET /blockchain/compare-blockchains" desc="Side-by-side comparison of vulnerable vs quantum-safe blockchain security, wallets, and transactions." />
          <F name="Mine Demonstration Block" endpoint="POST /blockchain/mine-block" desc="Mine a proof-of-work block on both vulnerable and quantum-safe demo blockchains." />
        </S>

        {/* Network Status */}
        <S title="network status">
          <F name="Platform Health" endpoint="GET /health" desc="API status, backend health, generation count, and average latency. Auto-refreshes every 15 seconds." />
          <F name="Oracle Network Info" endpoint="GET /oracle/network-info" desc="Node count, active requests, uptime, quantum hardware, entropy quality, and supported chains." />
          <F name="Quantum Entropy" endpoint="GET /quantum/entropy" desc="Detailed entropy analysis: Shannon entropy, min entropy, chi-square, autocorrelation, bit balance." />
          <F name="Quantum Stats" endpoint="GET /quantum/stats" desc="Total bytes generated, generation count, average time, pool size, backend type, and API version." />
          <F name="Hardware Devices" endpoint="GET /hardware/devices" desc="Connected quantum hardware devices, connection status, and generation counts." />
          <F name="Oracle Request Status" endpoint="GET /oracle/status/:id" desc="Look up fulfillment status of a randomness request by ID. Shows commitment, randomness, and block number." />
          <F name="Reseed Entropy Pool" endpoint="POST /quantum/reseed" desc="Force regeneration of the entropy pool with fresh quantum measurements." />
        </S>

        {/* API Quick Reference */}
        <S title="api quick reference">
          <p className="text-xs text-[rgb(var(--fg-dim))] leading-relaxed font-mono">
            All API endpoints are served under{' '}
            <code className="text-[rgb(var(--green))]">/api/v2</code>. The server
            auto-discovers on ports{' '}
            <code className="text-[rgb(var(--green))]">8000-8004</code>. Set{' '}
            <code className="text-[rgb(var(--green))]">NEXT_PUBLIC_API_BASE_URL</code>{' '}
            to override.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 pt-2 font-mono">
            {[
              ['POST /generate/bytes', 'random bytes'],
              ['POST /generate/key', 'crypto keys'],
              ['POST /generate/uuid', 'uuids'],
              ['POST /generate/password', 'passwords'],
              ['POST /generate/token', 'session tokens'],
              ['POST /generate/batch', 'batch random'],
              ['POST /protect/encrypt', 'encrypt text'],
              ['POST /protect/decrypt', 'decrypt text'],
              ['POST /protect/encrypt-file', 'encrypt file'],
              ['POST /protect/decrypt-file', 'decrypt file'],
              ['POST /protect/sign', 'hmac sign'],
              ['POST /protect/verify', 'hmac verify'],
              ['POST /protect/hash', 'hash data'],
              ['POST /pqc/generate', 'pqc key gen'],
              ['POST /pqc/sign', 'pqc sign'],
              ['POST /pqc/verify', 'pqc verify'],
              ['GET /pqc/algorithms', 'list pqc algos'],
              ['POST /pqc/threat-assessment', 'threat assess'],
              ['POST /oracle/request', 'oracle request'],
              ['POST /oracle/requests/batch', 'batch oracle'],
              ['GET /oracle/status/:id', 'request status'],
              ['GET /oracle/network-info', 'network info'],
              ['GET /oracle/benchmark', 'benchmark'],
              ['POST /oracle/vrf/seed', 'vrf seed'],
              ['POST /oracle/vrf/prove', 'vrf prove'],
              ['POST /oracle/vrf/reveal', 'vrf reveal'],
              ['POST /oracle/vrf/verify', 'vrf verify'],
              ['POST /blockchain/create-wallet', 'wallets'],
              ['POST /blockchain/simulate-attack', 'attack sim'],
              ['GET /blockchain/compare-blockchains', 'compare'],
              ['POST /blockchain/mine-block', 'mine block'],
              ['GET /quantum/entropy', 'entropy'],
              ['GET /quantum/stats', 'stats'],
              ['POST /quantum/reseed', 'reseed'],
              ['GET /hardware/devices', 'hardware'],
              ['GET /health', 'health check'],
            ].map(([ep, label]) => {
              const m = /^(\w+)\s+(.+)$/.exec(ep);
              const method = m?.[1] ?? 'POST';
              const path = m?.[2] ?? ep;
              const tone =
                method === 'GET'
                  ? 'text-[rgb(var(--cyan))]'
                  : 'text-[rgb(var(--green))]';
              return (
                <div
                  key={ep}
                  className="flex items-baseline gap-2 py-1.5 border-b border-[rgb(var(--border))]/40"
                >
                  <code className="text-[11px] shrink-0 w-60">
                    <span className={`${tone} uppercase font-semibold mr-1`}>{method}</span>
                    <span className="text-[rgb(var(--fg))]">{path}</span>
                  </code>
                  <span className="text-[11px] text-[rgb(var(--fg-dim))] uppercase tracking-wider">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </S>
      </main>

      <footer className="border-t border-[rgb(var(--border))] mt-12 py-5 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[11px] uppercase tracking-wider text-[rgb(var(--fg-dim))] font-mono">
          <span>qcrypt-rng // v2.0 · docs</span>
          <Link href="/" className="hover:text-[rgb(var(--green))] transition-colors">
            return to dashboard ›
          </Link>
        </div>
      </footer>
    </div>
  );
}

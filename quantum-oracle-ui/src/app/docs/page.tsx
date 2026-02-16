import Link from 'next/link';

export const metadata = {
  title: 'QCrypt RNG - Documentation',
  description: 'Documentation for the QCrypt RNG quantum security platform',
};

const S = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="text-xl font-bold text-white border-b border-slate-700/50 pb-2">{title}</h2>
    {children}
  </section>
);

const F = ({ name, endpoint, desc }: { name: string; endpoint: string; desc: string }) => (
  <div className="py-3 border-b border-slate-700/25 last:border-0">
    <div className="flex items-baseline gap-3 flex-wrap">
      <span className="text-base font-semibold text-white">{name}</span>
      <code className="text-xs font-mono text-indigo-400">{endpoint}</code>
    </div>
    <p className="text-sm text-slate-400 mt-1">{desc}</p>
  </div>
);

export default function DocsPage() {
  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-xl font-bold tracking-wide text-white hover:text-slate-200 transition-colors">
                QCrypt RNG
              </Link>
              <p className="text-slate-400 text-sm mt-0.5">Documentation</p>
            </div>
            <Link href="/" className="btn-secondary">Back to Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Getting Started */}
        <S title="Getting Started">
          <p className="text-sm text-slate-300 leading-relaxed">
            QCrypt RNG is a quantum-enhanced security platform that provides cryptographically secure randomness, post-quantum cryptography, blockchain security tools, and a verifiable random function (VRF) oracle. The dashboard organizes features into five tabs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[
              ['Blockchain Security', 'Quantum-safe wallets, VRF proofs, and chain-aware randomness'],
              ['Data Protection', 'Encryption, signing, hashing, and post-quantum cryptography'],
              ['Key and Entropy Tools', 'Random bytes, keys, tokens, UUIDs, passwords, and batch operations'],
              ['Threat Intelligence', 'Algorithm vulnerability scanning, attack simulation, and benchmarks'],
              ['Network Status', 'Platform health, entropy quality, hardware status, and oracle monitoring'],
            ].map(([title, desc]) => (
              <div key={title} className="section space-y-1">
                <span className="text-sm font-semibold text-white">{title}</span>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </S>

        {/* Blockchain Security */}
        <S title="Blockchain Security">
          <F name="Create Wallet Profiles" endpoint="POST /blockchain/create-wallet" desc="Generate and compare classical (ECDSA) vs quantum-safe (DILITHIUM/KYBER) blockchain wallets." />
          <F name="Quantum VRF - Create Seed" endpoint="POST /oracle/vrf/seed" desc="Generate a quantum random seed and publish a Keccak-256 commitment for verifiable randomness." />
          <F name="Quantum VRF - Prove" endpoint="POST /oracle/vrf/prove" desc="Compute a deterministic VRF output for a given input (alpha) using the quantum seed." />
          <F name="Quantum VRF - Reveal" endpoint="POST /oracle/vrf/reveal" desc="Reveal the quantum seed so third parties can independently verify VRF proofs." />
          <F name="Quantum VRF - Verify" endpoint="POST /oracle/vrf/verify" desc="Verify a VRF proof by checking commitment == H(seed) and output == H(seed || alpha)." />
        </S>

        {/* Data Protection */}
        <S title="Data Protection">
          <F name="Encrypt / Decrypt" endpoint="POST /protect/encrypt, /decrypt" desc="AES encryption (256-GCM, 128-GCM, 256-CBC) with quantum-generated or custom keys. Supports text and file encryption up to 10 MB." />
          <F name="File Encrypt / Decrypt" endpoint="POST /protect/encrypt-file, /decrypt-file" desc="Upload files for quantum-key encryption. Returns encrypted payload with original filename preserved." />
          <F name="Sign / Verify" endpoint="POST /protect/sign, /verify" desc="HMAC-SHA256 and HMAC-SHA512 signatures with quantum-random keys for message authentication." />
          <F name="Hash / Password Protection" endpoint="POST /protect/hash" desc="Quantum-salted hashing with SHA3-256, SHA3-512, PBKDF2-SHA256, or BLAKE2b-256. Configurable iterations for password hashing." />
          <F name="PQC Key Generation" endpoint="POST /pqc/generate" desc="Generate DILITHIUM (signature) or KYBER (key exchange) key pairs at NIST security levels 1-5." />
          <F name="PQC Sign / Verify" endpoint="POST /pqc/sign, /verify" desc="Post-quantum digital signatures using DILITHIUM. Resistant to quantum computer attacks." />
        </S>

        {/* Key and Entropy Tools */}
        <S title="Key and Entropy Tools">
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
        <S title="Threat Intelligence">
          <F name="Threat Scanner" endpoint="POST /pqc/threat-assessment" desc="Assess quantum vulnerability of algorithms (RSA, ECDSA, KYBER). Shows risk level, qubits to break, and recommendations." />
          <F name="Oracle Benchmark" endpoint="GET /oracle/benchmark" desc="Measure generation throughput, commitment latency, and entropy quality of the quantum oracle." />
          <F name="Simulate Quantum Attack" endpoint="POST /blockchain/simulate-attack" desc="Simulate Shor's algorithm on RSA-2048, ECDSA-256, DILITHIUM3, or KYBER768." />
          <F name="Compare Blockchains" endpoint="GET /blockchain/compare-blockchains" desc="Side-by-side comparison of vulnerable vs quantum-safe blockchain security, wallets, and transactions." />
          <F name="Mine Demonstration Block" endpoint="POST /blockchain/mine-block" desc="Mine a proof-of-work block on both vulnerable and quantum-safe demo blockchains." />
        </S>

        {/* Network Status */}
        <S title="Network Status">
          <F name="Platform Health" endpoint="GET /health" desc="API status, backend health, generation count, and average latency. Auto-refreshes every 15 seconds." />
          <F name="Oracle Network Info" endpoint="GET /oracle/network-info" desc="Node count, active requests, uptime, quantum hardware, entropy quality, and supported chains." />
          <F name="Quantum Entropy" endpoint="GET /quantum/entropy" desc="Detailed entropy analysis: Shannon entropy, min entropy, chi-square, autocorrelation, bit balance." />
          <F name="Quantum Stats" endpoint="GET /quantum/stats" desc="Total bytes generated, generation count, average time, pool size, backend type, and API version." />
          <F name="Hardware Devices" endpoint="GET /hardware/devices" desc="Connected quantum hardware devices, connection status, and generation counts." />
          <F name="Oracle Request Status" endpoint="GET /oracle/status/:id" desc="Look up fulfillment status of a randomness request by ID. Shows commitment, randomness, and block number." />
          <F name="Reseed Entropy Pool" endpoint="POST /quantum/reseed" desc="Force regeneration of the entropy pool with fresh quantum measurements." />
        </S>

        {/* API Quick Reference */}
        <S title="API Quick Reference">
          <p className="text-sm text-slate-300 leading-relaxed">
            All API endpoints are served under <code className="text-xs font-mono text-indigo-400">/api/v2</code>. The server auto-discovers on ports 8000-8004. Set <code className="text-xs font-mono text-indigo-400">NEXT_PUBLIC_API_BASE_URL</code> to override.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 pt-2">
            {[
              ['POST /generate/bytes', 'Random bytes'],
              ['POST /generate/key', 'Crypto keys'],
              ['POST /generate/uuid', 'UUIDs'],
              ['POST /generate/password', 'Passwords'],
              ['POST /generate/token', 'Session tokens'],
              ['POST /generate/batch', 'Batch random'],
              ['POST /protect/encrypt', 'Encrypt text'],
              ['POST /protect/decrypt', 'Decrypt text'],
              ['POST /protect/encrypt-file', 'Encrypt file'],
              ['POST /protect/decrypt-file', 'Decrypt file'],
              ['POST /protect/sign', 'HMAC sign'],
              ['POST /protect/verify', 'HMAC verify'],
              ['POST /protect/hash', 'Hash data'],
              ['POST /pqc/generate', 'PQC key gen'],
              ['POST /pqc/sign', 'PQC sign'],
              ['POST /pqc/verify', 'PQC verify'],
              ['GET /pqc/algorithms', 'List PQC algos'],
              ['POST /pqc/threat-assessment', 'Threat assess'],
              ['POST /oracle/request', 'Oracle request'],
              ['POST /oracle/requests/batch', 'Batch oracle'],
              ['GET /oracle/status/:id', 'Request status'],
              ['GET /oracle/network-info', 'Network info'],
              ['GET /oracle/benchmark', 'Benchmark'],
              ['POST /oracle/vrf/seed', 'VRF seed'],
              ['POST /oracle/vrf/prove', 'VRF prove'],
              ['POST /oracle/vrf/reveal', 'VRF reveal'],
              ['POST /oracle/vrf/verify', 'VRF verify'],
              ['POST /blockchain/create-wallet', 'Wallets'],
              ['POST /blockchain/simulate-attack', 'Attack sim'],
              ['GET /blockchain/compare-blockchains', 'Compare'],
              ['POST /blockchain/mine-block', 'Mine block'],
              ['GET /quantum/entropy', 'Entropy'],
              ['GET /quantum/stats', 'Stats'],
              ['POST /quantum/reseed', 'Reseed'],
              ['GET /hardware/devices', 'Hardware'],
              ['GET /health', 'Health check'],
            ].map(([ep, label]) => (
              <div key={ep} className="flex items-baseline gap-3 py-1.5 border-b border-slate-700/20">
                <code className="text-xs font-mono text-slate-300 shrink-0 w-56">{ep}</code>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </S>
      </main>

      <footer className="border-t border-slate-700/50 mt-12 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center text-slate-500 text-sm">
          QCrypt RNG v2.0
        </div>
      </footer>
    </div>
  );
}

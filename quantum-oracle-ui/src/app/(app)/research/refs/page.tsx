import Link from 'next/link';
import { ResearchHeader, Panel, PanelHeader, PanelBody } from '@/components/research/shared';

const NIST_STANDARDS = [
  {
    id: 'FIPS 203',
    full: 'NIST FIPS 203 (ML-KEM)',
    desc: 'Module-Lattice-Based Key-Encapsulation Mechanism Standard. Formerly known as CRYSTALS-Kyber. NIST post-quantum standard for key encapsulation.',
    url: 'https://csrc.nist.gov/pubs/fips/203/final',
    status: 'Final (2024)',
  },
  {
    id: 'FIPS 204',
    full: 'NIST FIPS 204 (ML-DSA)',
    desc: 'Module-Lattice-Based Digital Signature Standard. Formerly known as CRYSTALS-Dilithium. NIST post-quantum standard for digital signatures.',
    url: 'https://csrc.nist.gov/pubs/fips/204/final',
    status: 'Final (2024)',
  },
  {
    id: 'FIPS 205',
    full: 'NIST FIPS 205 (SLH-DSA)',
    desc: 'Stateless Hash-Based Digital Signature Standard. Formerly known as SPHINCS+. Hash-based signature scheme with well-understood security.',
    url: 'https://csrc.nist.gov/pubs/fips/205/final',
    status: 'Final (2024)',
  },
  {
    id: 'SP 800-90B',
    full: 'NIST SP 800-90B',
    desc: 'Recommendation for the Entropy Sources Used for Random Bit Generation. Defines entropy assessment and testing methodology used by this platform.',
    url: 'https://csrc.nist.gov/pubs/sp/800/90/b/final',
    status: 'Final (2018)',
  },
  {
    id: 'SP 800-90A',
    full: 'NIST SP 800-90A Rev.1',
    desc: 'Recommendation for Random Number Generation Using Deterministic Random Bit Generators. Defines DRBG mechanisms (CTR_DRBG, Hash_DRBG, HMAC_DRBG).',
    url: 'https://csrc.nist.gov/pubs/sp/800/90/a/r1/final',
    status: 'Final (2015)',
  },
];

const ACADEMIC_REFS = [
  {
    title: 'CRYSTALS-Kyber: A CCA-Secure Module-Lattice-Based KEM',
    authors: 'Bos et al.',
    venue: 'IEEE EuroS&P 2018',
    desc: 'Original paper describing the Kyber KEM algorithm, now standardized as ML-KEM.',
  },
  {
    title: 'CRYSTALS-Dilithium: A Lattice-Based Digital Signature Scheme',
    authors: 'Ducas et al.',
    venue: 'TCHES 2018',
    desc: 'Original paper describing the Dilithium signature scheme, now standardized as ML-DSA.',
  },
  {
    title: 'Falcon: Fast-Fourier Lattice-based Compact Signatures over NTRU',
    authors: 'Fouque et al.',
    venue: 'NIST PQC Submission 2020',
    desc: 'Fast, compact lattice signature using NTRU lattices and FFT sampling. Implemented in this platform.',
  },
  {
    title: 'SPHINCS+: A Stateless Hash-Based Signature Scheme',
    authors: 'Bernstein et al.',
    venue: 'CRYPTO 2019',
    desc: 'Conservative, hash-based signature scheme with minimal security assumptions.',
  },
  {
    title: 'Quantum Computing: An Applied Approach',
    authors: 'Hidary, J.',
    venue: 'Springer, 2019',
    desc: 'Reference text for quantum circuit design and Qiskit/Qrisp-based simulation used in this platform.',
  },
];

const PLATFORM_REFS = [
  {
    label: 'Qrisp Framework',
    desc: 'High-level quantum programming framework used for quantum circuit simulation in the QRNG engine.',
    url: 'https://qrisp.eu',
  },
  {
    label: 'Open Quantum Safe (OQS)',
    desc: 'liboqs: C library implementing post-quantum cryptographic algorithms. Used for Kyber, Dilithium, Falcon, and HQC in this platform.',
    url: 'https://openquantumsafe.org',
  },
  {
    label: 'NIST Post-Quantum Cryptography Project',
    desc: 'Standardization project for post-quantum cryptographic algorithms. Finalized in 2024 with ML-KEM, ML-DSA, and SLH-DSA.',
    url: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
  },
];

export default function RefsPage() {
  return (
    <div className="page-enter min-w-0 w-full space-y-6">
      <ResearchHeader
        eyebrow="Research · Bibliography"
        title="References"
        description="Primary standards, academic papers, and implementation references relevant to the algorithms, protocols, and entropy sources exposed in this platform."
      />

      {/* NIST Standards */}
      <Panel>
        <PanelHeader title="NIST standards" />
        <PanelBody className="space-y-0 p-0">
          {NIST_STANDARDS.map((r, i) => (
            <div
              key={r.id}
              className={`flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:gap-6 ${
                i < NIST_STANDARDS.length - 1 ? 'border-b border-outline-variant/20' : ''
              }`}
            >
              <div className="shrink-0">
                <span className="chip chip-verified font-mono">{r.id}</span>
                <div className="mt-1 font-mono text-[9px] text-outline">{r.status}</div>
              </div>
              <div className="min-w-0 space-y-1">
                <div className="font-mono text-[11px] font-semibold text-on-surface">{r.full}</div>
                <p className="text-[11px] text-on-surface-variant">{r.desc}</p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-secondary transition-colors hover:text-secondary/80"
                >
                  {r.url} ↗
                </a>
              </div>
            </div>
          ))}
        </PanelBody>
      </Panel>

      {/* Academic papers */}
      <Panel>
        <PanelHeader title="Academic papers" />
        <PanelBody className="space-y-0 p-0">
          {ACADEMIC_REFS.map((r, i) => (
            <div
              key={r.title}
              className={`px-4 py-3 ${
                i < ACADEMIC_REFS.length - 1 ? 'border-b border-outline-variant/20' : ''
              }`}
            >
              <div className="mb-0.5 flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-medium text-on-surface">{r.title}</span>
                <span className="chip chip-dim">{r.venue}</span>
              </div>
              <div className="font-mono text-[10px] text-outline">{r.authors}</div>
              <p className="mt-1 text-[11px] text-on-surface-variant">{r.desc}</p>
            </div>
          ))}
        </PanelBody>
      </Panel>

      {/* Platform / implementation references */}
      <Panel>
        <PanelHeader title="Platform & implementation" />
        <PanelBody className="space-y-0 p-0">
          {PLATFORM_REFS.map((r, i) => (
            <div
              key={r.label}
              className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-6 ${
                i < PLATFORM_REFS.length - 1 ? 'border-b border-outline-variant/20' : ''
              }`}
            >
              <div className="shrink-0 font-mono text-[11px] font-semibold text-on-surface sm:w-48">
                {r.label}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] text-on-surface-variant">{r.desc}</p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-secondary transition-colors hover:text-secondary/80"
                >
                  {r.url} ↗
                </a>
              </div>
            </div>
          ))}
        </PanelBody>
      </Panel>

      {/* Citation */}
      <Panel>
        <PanelHeader title="Citing this platform" />
        <PanelBody>
          <div className="mono-out text-[11px]">
            <span className="text-on-surface-variant">
              QCrypt Research Platform v0.1. Post-quantum cryptography and quantum randomness research infrastructure.
              Quantum Global Group, 2024–2025.
            </span>
          </div>
          <p className="mt-3 text-[11px] text-on-surface-variant">
            For per-session citation strings, see the{' '}
            <Link href="/research/notebook" className="text-primary underline">
              Experiment Log
            </Link>{' '}
            page which generates a citation with the exact export date and session ID.
          </p>
        </PanelBody>
      </Panel>
    </div>
  );
}

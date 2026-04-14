'use client';

import { useState, useCallback } from 'react';
import { encryptData, generatePQCKey, hashData, signPqc } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useBlockchain } from './BlockchainContext';
import { AnalystEvidencePanel, SectionLabel } from './AnalystEvidencePanel';

type EncAlgo = 'AES-256-GCM' | 'AES-256-CBC';

interface SealRecord {
  timestamp: string;
  enc_algorithm: string;
  sign_algorithm: string;
  ciphertext: string;
  iv: string | null;
  tag: string | null;
  key_size: number | null;
  ciphertext_hash: string;
  hash_algorithm: string;
  public_key: string;
  signature: string;
  quantum_entropy_bits: number;
}

const CLAIM_SEAL =
  'AES-256 encryption with a QRNG-derived key provides confidentiality. A Dilithium signature over the ciphertext hash proves this exact encrypted package was sealed at the stated time.';
const PROVES_SEAL = [
  'Confidentiality (AES-256)',
  'Ciphertext integrity (SHA3-256 hash)',
  'Seal binding (Dilithium signature)',
  'Quantum-sourced key material',
];
const NOT_SEAL = [
  'Real-world identity of sealer',
  'Key custody after export',
  'Plaintext authenticity',
  'On-chain inclusion',
];

const CLAIM_ESCROW =
  'SHA3-256 hash of supplied key material creates a commitment \u2014 future disclosure can be checked against this fingerprint.';
const PROVES_ESCROW = [
  'Key fingerprint at time T',
  'Commitment binding',
];
const NOT_ESCROW = [
  'Key ownership',
  'PQC signature (not signed)',
  'Real-world identity',
];

const SEAL_VERIFY_STEPS = [
  'Obtain the seal record JSON and the ciphertext blob',
  'Re-hash the ciphertext with SHA3-256',
  'Compare the hash against ciphertext_hash in the seal record',
  'Verify the Dilithium signature over the hash using the public key',
  'If valid \u2192 ciphertext was not modified since sealing',
  'Only then proceed to decrypt with the authorized key',
];

const cardShell =
  'flex min-h-0 flex-col rounded-xl border border-outline-variant/20 bg-surface-container-low/70 shadow-sm';

export function ProtectVault() {
  const { network, isSimulation, wallet } = useBlockchain();

  const [payload, setPayload] = useState('');
  const [encAlgo, setEncAlgo] = useState<EncAlgo>('AES-256-GCM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<SealRecord | null>(null);

  const [escrowKey, setEscrowKey] = useState('');
  const [escrowAlgo, setEscrowAlgo] = useState('DILITHIUM3');
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [escrowError, setEscrowError] = useState<string | null>(null);
  const [escrowRecord, setEscrowRecord] = useState<{
    algorithm: string;
    public_key: string;
    commitment: string;
    timestamp: string;
  } | null>(null);

  const handleEncryptAndSeal = async () => {
    if (!payload.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const [encRes, keypair] = await Promise.all([
        encryptData(payload, true, encAlgo),
        generatePQCKey('DILITHIUM3', 'base64'),
      ]);
      const ciphertext = encRes.data.ciphertext;
      const hashRes = await hashData({
        data: ciphertext,
        algorithm: 'SHA3-256',
        use_quantum_salt: true,
      });
      const hash = hashRes.data.hash;
      const signRes = await signPqc({
        message: hash,
        private_key: keypair.data.private_key,
        algorithm: 'DILITHIUM3',
        encoding: 'base64',
      });
      setRecord({
        timestamp: new Date().toISOString(),
        enc_algorithm: encAlgo,
        sign_algorithm: 'DILITHIUM3',
        ciphertext,
        iv: encRes.data.iv ?? null,
        tag: (encRes.data as Record<string, unknown>).tag as string ?? null,
        key_size:
          ((encRes.data as Record<string, unknown>).key_size as number) ?? 256,
        ciphertext_hash: hash,
        hash_algorithm: 'SHA3-256',
        public_key: keypair.data.public_key,
        signature: signRes.data.signature,
        quantum_entropy_bits: hashRes.data.entropy_bits ?? 256,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encrypt & seal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEscrowRegister = async () => {
    if (!escrowKey.trim()) return;
    setEscrowError(null);
    setEscrowLoading(true);
    try {
      const hashRes = await hashData({
        data: escrowKey,
        algorithm: 'SHA3-256',
        use_quantum_salt: false,
      });
      setEscrowRecord({
        algorithm: escrowAlgo,
        public_key: escrowKey,
        commitment: hashRes.data.hash,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      setEscrowError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setEscrowLoading(false);
    }
  };

  const copyCiphertextHash = useCallback(async (hash: string) => {
    await navigator.clipboard.writeText(hash);
  }, []);

  const recordJson = record ? JSON.stringify(record, null, 2) : '';

  const buildSealArtifacts = (r: SealRecord) => [
    {
      title: 'Encryption output',
      rows: [
        { label: 'Timestamp', value: r.timestamp },
        { label: 'Enc algorithm', value: r.enc_algorithm },
        {
          label: 'Key size',
          value: r.key_size ? `${r.key_size} bits` : '256 bits',
        },
        ...(r.iv
          ? [{ label: 'IV', value: r.iv.slice(0, 32) + '\u2026' }]
          : []),
        ...(r.tag
          ? [{ label: 'Auth tag', value: r.tag.slice(0, 32) + '\u2026' }]
          : []),
        {
          label: 'Ciphertext',
          value: r.ciphertext.slice(0, 44) + '\u2026',
        },
      ],
    },
    {
      title: 'Quantum-signed seal',
      rows: [
        {
          label: 'Ciphertext hash',
          value: r.ciphertext_hash.slice(0, 44) + '\u2026',
        },
        { label: 'Hash algorithm', value: r.hash_algorithm },
        { label: 'Sign algorithm', value: r.sign_algorithm },
        { label: 'Entropy bits', value: String(r.quantum_entropy_bits) },
        {
          label: 'Public key',
          value: r.public_key.slice(0, 44) + '\u2026',
        },
        {
          label: 'Signature',
          value: r.signature.slice(0, 44) + '\u2026',
        },
      ],
    },
  ];

  const buildEscrowArtifacts = (r: {
    algorithm: string;
    public_key: string;
    commitment: string;
    timestamp: string;
  }) => [
    {
      title: 'Key commitment',
      rows: [
        { label: 'Algorithm', value: r.algorithm },
        { label: 'Timestamp', value: r.timestamp },
        {
          label: 'Public key (preview)',
          value: r.public_key.slice(0, 44) + '\u2026',
        },
        { label: 'Commitment (SHA3-256)', value: r.commitment },
      ],
    },
  ];

  return (
    <div className="w-full space-y-6 text-on-surface">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8 xl:items-stretch">
        {/* ── Encrypt & Seal ───────────────────────────────────────────── */}
        <section className={cn(cardShell, 'min-h-[min(100%,720px)]')}>
          <div className="border-b border-outline-variant/10 bg-surface-container-lowest/40 px-4 py-3 sm:px-5">
            <h2 className="font-headline text-sm font-semibold text-on-surface">
              Encrypt &amp; seal
            </h2>
            <p className="mt-1 font-mono text-[11px] leading-snug text-on-surface-variant">
              QRNG-derived AES key · ciphertext hashed · Dilithium seal on the
              hash. Plaintext never appears in the export bundle.
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5">
            <div className="space-y-3 shrink-0">
              <div>
                <h3 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                  Payload
                </h3>
                <textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="Document, message, or data to encrypt and seal\u2026"
                  rows={5}
                  className="field w-full resize-y min-h-[120px] font-mono text-[12px]"
                />
                {payload ? (
                  <p className="mt-1 font-mono text-[10px] text-outline/60">
                    {payload.length} chars · {new Blob([payload]).size} bytes
                    (UTF-8)
                  </p>
                ) : null}
              </div>

              <div>
                <h3 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                  Encryption
                </h3>
                <div className="flex gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1">
                  {(['AES-256-GCM', 'AES-256-CBC'] as EncAlgo[]).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setEncAlgo(a)}
                      className={cn(
                        'flex-1 rounded px-2 py-1.5 font-mono text-[11px] font-medium transition-colors',
                        encAlgo === a
                          ? 'bg-primary/15 text-primary'
                          : 'text-on-surface-variant hover:text-on-surface',
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest/50 px-3 py-2.5">
                <SectionLabel>Key handling</SectionLabel>
                <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                  Key is QRNG-derived and not stored in the seal JSON. Protect
                  ciphertext and keys through separate secure channels.
                </p>
              </div>

              <button
                type="button"
                disabled={loading || !payload.trim()}
                onClick={handleEncryptAndSeal}
                className="btn-primary w-full"
              >
                {loading ? 'Encrypting & sealing\u2026' : 'Encrypt & seal'}
              </button>
              {error ? (
                <p className="font-mono text-[12px] text-error">{error}</p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 border-t border-outline-variant/10 pt-4 xl:max-h-[min(52vh,480px)] xl:overflow-y-auto xl:pr-1">
                <AnalystEvidencePanel
                  embed
                  claim={CLAIM_SEAL}
                  proves={PROVES_SEAL}
                  doesNotProve={NOT_SEAL}
                  artifactSections={
                    record ? buildSealArtifacts(record) : undefined
                  }
                  status={
                    record
                      ? {
                          type: 'success',
                          label: 'Sealed',
                          detail:
                            'Ciphertext integrity committed \u2014 Dilithium signature anchored',
                        }
                      : undefined
                  }
                  exportData={record ? recordJson : undefined}
                  exportFilename="seal-record.json"
                  failureNote={
                    record
                      ? 'Modifying even one byte of the ciphertext changes the SHA3-256 hash. The Dilithium signature will not verify against a different hash, so tampering with the encrypted package is detectable before decryption.'
                      : undefined
                  }
                  verifySteps={record ? SEAL_VERIFY_STEPS : undefined}
                  nextAction={
                    record
                      ? {
                          label: 'Verify this seal on Prove',
                          description:
                            'Copy the ciphertext hash and verify the Dilithium signature independently',
                          onClick: () =>
                            copyCiphertextHash(record.ciphertext_hash),
                        }
                      : undefined
                  }
                  emptyLabel="Run encrypt & seal to see the evidence pack"
                />
            </div>

            {record && !isSimulation ? (
              <div className="shrink-0 rounded-lg border border-tertiary/15 bg-tertiary/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-tertiary">
                    {network.label}
                  </span>
                  {wallet.connected ? (
                    <span className="font-mono text-[10px] text-outline">
                      Signer: {wallet.address?.slice(0, 10)}\u2026
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-outline/60 italic">
                      Connect wallet to anchor seal on-chain
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* ── Key Escrow ───────────────────────────────────────────────── */}
        <section className={cn(cardShell, 'min-h-[min(100%,720px)]')}>
          <div className="border-b border-outline-variant/10 bg-surface-container-lowest/40 px-4 py-3 sm:px-5">
            <h2 className="font-headline text-sm font-semibold text-on-surface">
              Key escrow record
            </h2>
            <p className="mt-1 font-mono text-[11px] leading-snug text-on-surface-variant">
              Hash a public key (or fingerprint string) to create a time-stamped
              commitment. No Dilithium signature on this path — verification is
              hash comparison when the key is disclosed.
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5">
            <div className="space-y-3 shrink-0">
              <div>
                <h3 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                  Public key (base64)
                </h3>
                <textarea
                  value={escrowKey}
                  onChange={(e) => setEscrowKey(e.target.value)}
                  placeholder="Paste Dilithium, Falcon, or Kyber public key material\u2026"
                  rows={5}
                  className="field w-full resize-y min-h-[100px] font-mono text-[11px]"
                />
              </div>

              <div>
                <h3 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                  Labeled as
                </h3>
                <div className="flex flex-wrap gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1">
                  {['DILITHIUM3', 'FALCON1024', 'KYBER768'].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setEscrowAlgo(a)}
                      className={cn(
                        'rounded px-3 py-1.5 font-mono text-[11px] font-medium transition-colors',
                        escrowAlgo === a
                          ? 'bg-primary/15 text-primary'
                          : 'text-on-surface-variant hover:text-on-surface',
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={escrowLoading || !escrowKey.trim()}
                onClick={handleEscrowRegister}
                className="btn-primary w-full"
              >
                {escrowLoading ? 'Registering\u2026' : 'Register commitment'}
              </button>
              {escrowError ? (
                <p className="font-mono text-[12px] text-error">
                  {escrowError}
                </p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 border-t border-outline-variant/10 pt-4 xl:max-h-[min(52vh,480px)] xl:overflow-y-auto xl:pr-1">
                <AnalystEvidencePanel
                  embed
                  claim={CLAIM_ESCROW}
                  proves={PROVES_ESCROW}
                  doesNotProve={NOT_ESCROW}
                  artifactSections={
                    escrowRecord
                      ? buildEscrowArtifacts(escrowRecord)
                      : undefined
                  }
                  status={
                    escrowRecord
                      ? {
                          type: 'success',
                          label: 'Commitment registered',
                          detail:
                            'Counterparties can verify key ownership without seeing the key',
                        }
                      : undefined
                  }
                  exportData={
                    escrowRecord
                      ? JSON.stringify(escrowRecord, null, 2)
                      : undefined
                  }
                  exportFilename="escrow-record.json"
                  emptyLabel="Register to see the commitment record"
                />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

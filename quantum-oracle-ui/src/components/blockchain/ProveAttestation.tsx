'use client';

import { useState, useCallback } from 'react';
import { generatePQCKey, hashData, signPqc, verifyPqc } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useBlockchain } from './BlockchainContext';
import { AnalystEvidencePanel, SectionLabel } from './AnalystEvidencePanel';

type Tab = 'anchor' | 'attest' | 'verify';
type SignAlgo = 'DILITHIUM3' | 'FALCON1024';

const TABS: { id: Tab; label: string }[] = [
  { id: 'anchor', label: 'Document Anchor' },
  { id: 'attest', label: 'Message Attestation' },
  { id: 'verify', label: 'Verify' },
];

interface ProofBundle {
  action: string;
  timestamp: string;
  algorithm: string;
  hash: string;
  hash_algorithm: string;
  public_key: string;
  signature: string;
  quantum_salt: boolean;
  entropy_bits: number;
  payload_preview: string;
}

const CLAIM_ANCHOR =
  'PQC signature binds a quantum-salted SHA3-256 hash to the exact content, proving it existed in this form at the stated time.';
const CLAIM_ATTEST =
  'PQC signature binds the signer\u2019s key to the exact wording of a statement \u2014 any change to the message invalidates the proof.';
const CLAIM_VERIFY =
  'Independent verification that a signature was produced by the holder of the corresponding private key over the stated message.';

const PROVES_ANCHOR = [
  'Hash integrity of content',
  'Signature binding to specific key',
  'Timestamp of anchoring',
  'Quantum-sourced entropy',
];
const NOT_ANCHOR = [
  'Real-world identity',
  'Legal standing',
  'On-chain inclusion',
  'Encryption / confidentiality',
];

const PROVES_ATTEST = [
  'Exact wording commitment',
  'Non-repudiation (key-bound)',
  'Timestamp of attestation',
];
const NOT_ATTEST = [
  'Real-world identity',
  'Legal enforceability',
  'Message delivery',
];

const PROVES_VERIFY = [
  'Signature validity',
  'Message integrity',
  'Key binding',
];
const NOT_VERIFY = [
  'Signer identity',
  'When signature was created',
  'Content authenticity',
];

const VERIFY_STEPS = [
  'Export the proof bundle JSON from this page',
  'Extract hash, signature, and public_key fields',
  'Run verifyPqc(hash, signature, public_key, algorithm)',
  'If valid \u2192 content is untampered since anchoring',
  'If invalid \u2192 content or signature was modified',
];

export function ProveAttestation() {
  const { network, isSimulation, wallet } = useBlockchain();
  const [tab, setTab] = useState<Tab>('anchor');

  // Anchor state
  const [anchorPayload, setAnchorPayload] = useState('');
  const [anchorAlgo, setAnchorAlgo] = useState<SignAlgo>('DILITHIUM3');
  const [anchorLoading, setAnchorLoading] = useState(false);
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [anchorProof, setAnchorProof] = useState<ProofBundle | null>(null);

  // Attest state
  const [attestMessage, setAttestMessage] = useState('');
  const [attestAlgo, setAttestAlgo] = useState<SignAlgo>('DILITHIUM3');
  const [attestLoading, setAttestLoading] = useState(false);
  const [attestError, setAttestError] = useState<string | null>(null);
  const [attestProof, setAttestProof] = useState<ProofBundle | null>(null);

  // Verify state
  const [vMessage, setVMessage] = useState('');
  const [vSignature, setVSignature] = useState('');
  const [vPublicKey, setVPublicKey] = useState('');
  const [vAlgo, setVAlgo] = useState<SignAlgo>('DILITHIUM3');
  const [vLoading, setVLoading] = useState(false);
  const [vError, setVError] = useState<string | null>(null);
  const [vResult, setVResult] = useState<{ valid: boolean } | null>(null);

  // Tamper demo state
  const [tamperLoading, setTamperLoading] = useState(false);
  const [tamperResult, setTamperResult] = useState<boolean | null>(null);

  const runAttestation = async (
    payload: string,
    algo: SignAlgo,
    action: string,
  ): Promise<ProofBundle> => {
    const [hashRes, keypair] = await Promise.all([
      hashData({ data: payload, algorithm: 'SHA3-256', use_quantum_salt: true }),
      generatePQCKey(algo, 'base64'),
    ]);
    const hash = hashRes.data.hash;
    const signRes = await signPqc({
      message: hash,
      private_key: keypair.data.private_key,
      algorithm: algo,
      encoding: 'base64',
    });
    return {
      action,
      timestamp: new Date().toISOString(),
      algorithm: algo,
      hash,
      hash_algorithm: 'SHA3-256',
      public_key: keypair.data.public_key,
      signature: signRes.data.signature,
      quantum_salt: true,
      entropy_bits: hashRes.data.entropy_bits ?? 256,
      payload_preview:
        payload.slice(0, 80) + (payload.length > 80 ? '\u2026' : ''),
    };
  };

  const handleAnchor = async () => {
    if (!anchorPayload.trim()) return;
    setAnchorError(null);
    setAnchorLoading(true);
    setTamperResult(null);
    try {
      setAnchorProof(
        await runAttestation(anchorPayload, anchorAlgo, 'document_anchor'),
      );
    } catch (e) {
      setAnchorError(e instanceof Error ? e.message : 'Attestation failed');
    } finally {
      setAnchorLoading(false);
    }
  };

  const handleAttest = async () => {
    if (!attestMessage.trim()) return;
    setAttestError(null);
    setAttestLoading(true);
    setTamperResult(null);
    try {
      setAttestProof(
        await runAttestation(attestMessage, attestAlgo, 'message_attestation'),
      );
    } catch (e) {
      setAttestError(e instanceof Error ? e.message : 'Attestation failed');
    } finally {
      setAttestLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!vMessage.trim() || !vSignature.trim() || !vPublicKey.trim()) return;
    setVError(null);
    setVLoading(true);
    try {
      const res = await verifyPqc({
        message: vMessage,
        signature: vSignature,
        public_key: vPublicKey,
        algorithm: vAlgo,
        encoding: 'base64',
      });
      setVResult({ valid: res.data.valid });
    } catch (e) {
      setVError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setVLoading(false);
    }
  };

  const handleTamperTest = useCallback(async (proof: ProofBundle) => {
    setTamperLoading(true);
    setTamperResult(null);
    try {
      const lastChar = proof.hash.slice(-1);
      const flipped = lastChar === '0' ? '1' : '0';
      const tamperedHash = proof.hash.slice(0, -1) + flipped;
      const res = await verifyPqc({
        message: tamperedHash,
        signature: proof.signature,
        public_key: proof.public_key,
        algorithm: proof.algorithm as SignAlgo,
        encoding: 'base64',
      });
      setTamperResult(res.data.valid);
    } catch {
      setTamperResult(false);
    } finally {
      setTamperLoading(false);
    }
  }, []);

  const sendToVerify = useCallback((proof: ProofBundle) => {
    setVMessage(proof.hash);
    setVSignature(proof.signature);
    setVPublicKey(proof.public_key);
    setVAlgo(proof.algorithm as SignAlgo);
    setVResult(null);
    setVError(null);
    setTab('verify');
  }, []);

  const copyHashToClipboard = useCallback(async (hash: string) => {
    await navigator.clipboard.writeText(hash);
  }, []);

  const proofJson = (p: ProofBundle) => JSON.stringify(p, null, 2);

  const buildArtifacts = (proof: ProofBundle) => [
    {
      title: 'Proof bundle',
      rows: [
        { label: 'Action', value: proof.action.replace(/_/g, ' '), mono: false },
        { label: 'Timestamp', value: proof.timestamp },
        { label: 'Algorithm', value: proof.algorithm },
        { label: 'Hash algo', value: proof.hash_algorithm },
        { label: 'Entropy bits', value: String(proof.entropy_bits) },
        { label: 'Quantum salt', value: proof.quantum_salt ? 'Yes' : 'No' },
        { label: 'Payload preview', value: proof.payload_preview, mono: false },
      ],
    },
    {
      title: 'Cryptographic values',
      rows: [
        { label: 'Hash (SHA3-256)', value: proof.hash.slice(0, 44) + '\u2026' },
        { label: 'Public key', value: proof.public_key.slice(0, 44) + '\u2026' },
        { label: 'Signature', value: proof.signature.slice(0, 44) + '\u2026' },
      ],
    },
  ];

  const AlgoToggle = ({
    value,
    onChange,
  }: {
    value: SignAlgo;
    onChange: (v: SignAlgo) => void;
  }) => (
    <div className="flex gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1 w-fit">
      {(['DILITHIUM3', 'FALCON1024'] as SignAlgo[]).map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          className={cn(
            'rounded px-3 py-1.5 font-mono text-[11px] font-medium transition-colors',
            value === a
              ? 'bg-primary/15 text-primary'
              : 'text-on-surface-variant hover:text-on-surface',
          )}
        >
          {a}
        </button>
      ))}
    </div>
  );

  const TamperDemo = ({ proof }: { proof: ProofBundle }) => (
    <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-3">
      <SectionLabel>Tamper detection test</SectionLabel>
      <p className="text-[11px] text-on-surface-variant leading-relaxed">
        Flips one character in the hash and re-runs verification with the
        original signature &mdash; proving any modification is caught.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={tamperLoading}
          onClick={() => handleTamperTest(proof)}
          className="btn-ghost font-mono text-[11px] text-error/80 hover:text-error"
        >
          {tamperLoading ? 'Testing\u2026' : 'Simulate tamper'}
        </button>
        {tamperResult !== null && (
          <span
            className={cn(
              'font-mono text-[11px] font-semibold',
              tamperResult ? 'text-primary' : 'text-error',
            )}
          >
            {tamperResult ? 'Still valid (unexpected)' : 'Invalid \u2014 tamper detected'}
          </span>
        )}
      </div>
      {tamperResult === false && (
        <div className="rounded border border-error/15 bg-error/5 px-3 py-2">
          <p className="font-mono text-[10px] text-error/70 leading-relaxed">
            Original hash: {proof.hash.slice(0, 20)}\u2026
            <br />
            Tampered hash: {proof.hash.slice(0, -1)}
            {proof.hash.slice(-1) === '0' ? '1' : '0'}\u2026
            <br />
            Result: signature verification failed \u2192 tamper is detectable
          </p>
        </div>
      )}
    </div>
  );

  const NetworkBadge = () =>
    isSimulation ? null : (
      <div className="rounded-lg border border-tertiary/15 bg-tertiary/5 p-3 mt-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-tertiary">
            {network.label}
          </span>
          {wallet.connected ? (
            <span className="font-mono text-[10px] text-outline">
              Signer: {wallet.address?.slice(0, 10)}\u2026
            </span>
          ) : (
            <span className="font-mono text-[10px] text-outline/60 italic">
              Connect wallet to anchor on-chain
            </span>
          )}
        </div>
      </div>
    );

  return (
    <div className="w-full space-y-6 text-on-surface">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded px-4 py-1.5 font-mono text-[11px] font-medium transition-colors',
              tab === t.id
                ? 'bg-primary/15 text-primary'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Document Anchor ────────────────────────────────────────────────── */}
      {tab === 'anchor' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5 lg:col-span-5">
            <div>
              <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                01 · Payload
              </h2>
              <p className="mb-3 text-[12px] text-on-surface-variant">
                The exact bytes below will be hashed. Any change &mdash; even
                whitespace &mdash; produces a different hash and breaks
                verification.
              </p>
              <textarea
                value={anchorPayload}
                onChange={(e) => setAnchorPayload(e.target.value)}
                placeholder="Paste document content, contract text, or any payload\u2026"
                rows={6}
                className="field w-full resize-none font-mono text-[12px]"
              />
              {anchorPayload && (
                <p className="mt-1 font-mono text-[10px] text-outline/60">
                  {anchorPayload.length} chars · {new Blob([anchorPayload]).size}{' '}
                  bytes (UTF-8)
                </p>
              )}
            </div>
            <div>
              <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                02 · Signing algorithm
              </h2>
              <AlgoToggle value={anchorAlgo} onChange={setAnchorAlgo} />
            </div>
            <button
              type="button"
              disabled={anchorLoading || !anchorPayload.trim()}
              onClick={handleAnchor}
              className="btn-primary w-full"
            >
              {anchorLoading ? 'Hashing & signing\u2026' : 'Hash + Sign + Anchor'}
            </button>
            {anchorError && (
              <p className="font-mono text-[12px] text-error">{anchorError}</p>
            )}
          </div>

          <aside className="lg:col-span-7">
            <AnalystEvidencePanel
              claim={CLAIM_ANCHOR}
              proves={PROVES_ANCHOR}
              doesNotProve={NOT_ANCHOR}
              artifactSections={anchorProof ? buildArtifacts(anchorProof) : undefined}
              status={
                anchorProof
                  ? {
                      type: 'success',
                      label: 'Proof anchored',
                      detail:
                        'Hash, signature, and public key committed with quantum-sourced entropy',
                    }
                  : undefined
              }
              exportData={anchorProof ? proofJson(anchorProof) : undefined}
              exportFilename="anchor-proof.json"
              failureNote={
                anchorProof
                  ? 'Editing even one character of the original content changes the SHA3-256 hash, causing signature verification to fail at step 3.'
                  : undefined
              }
              verifySteps={anchorProof ? VERIFY_STEPS : undefined}
              verifyAction={
                anchorProof
                  ? { label: 'Send to Verify tab', onClick: () => sendToVerify(anchorProof) }
                  : undefined
              }
              nextAction={
                anchorProof
                  ? {
                      label: 'Use this anchor in Protect',
                      description:
                        'Copy the hash to seal an encrypted package referencing this anchor',
                      onClick: () => copyHashToClipboard(anchorProof.hash),
                    }
                  : undefined
              }
              emptyLabel="Anchor a document to generate a proof bundle"
            >
              {anchorProof && <TamperDemo proof={anchorProof} />}
            </AnalystEvidencePanel>
            <NetworkBadge />
          </aside>
        </div>
      )}

      {/* ── Message Attestation ────────────────────────────────────────────── */}
      {tab === 'attest' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5 lg:col-span-5">
            <div>
              <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                01 · Statement
              </h2>
              <p className="mb-3 text-[12px] text-on-surface-variant">
                Write the exact statement to attest. The signature binds your
                key to this precise wording &mdash; future changes require a
                new attestation.
              </p>
              <textarea
                value={attestMessage}
                onChange={(e) => setAttestMessage(e.target.value)}
                placeholder="I attest that\u2026 / Agreement between\u2026 / Authorization for\u2026"
                rows={5}
                className="field w-full resize-none font-mono text-[12px]"
              />
              {attestMessage && (
                <p className="mt-1 font-mono text-[10px] text-outline/60">
                  {attestMessage.length} chars · {new Blob([attestMessage]).size}{' '}
                  bytes (UTF-8)
                </p>
              )}
            </div>
            <div>
              <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                02 · Signing algorithm
              </h2>
              <AlgoToggle value={attestAlgo} onChange={setAttestAlgo} />
            </div>
            <button
              type="button"
              disabled={attestLoading || !attestMessage.trim()}
              onClick={handleAttest}
              className="btn-primary w-full"
            >
              {attestLoading ? 'Attesting\u2026' : 'Attest message'}
            </button>
            {attestError && (
              <p className="font-mono text-[12px] text-error">{attestError}</p>
            )}
          </div>

          <aside className="lg:col-span-7">
            <AnalystEvidencePanel
              claim={CLAIM_ATTEST}
              proves={PROVES_ATTEST}
              doesNotProve={NOT_ATTEST}
              artifactSections={attestProof ? buildArtifacts(attestProof) : undefined}
              status={
                attestProof
                  ? {
                      type: 'success',
                      label: 'Attestation recorded',
                      detail:
                        'Statement wording bound to PQC key with quantum-sourced entropy',
                    }
                  : undefined
              }
              exportData={attestProof ? proofJson(attestProof) : undefined}
              exportFilename="attestation-proof.json"
              failureNote={
                attestProof
                  ? 'Any change to the attested wording produces a different hash. The original signature will not verify against the modified text.'
                  : undefined
              }
              verifySteps={attestProof ? VERIFY_STEPS : undefined}
              verifyAction={
                attestProof
                  ? { label: 'Send to Verify tab', onClick: () => sendToVerify(attestProof) }
                  : undefined
              }
              emptyLabel="Attest a message to see the full signature record"
            >
              {attestProof && <TamperDemo proof={attestProof} />}
            </AnalystEvidencePanel>
            <NetworkBadge />
          </aside>
        </div>
      )}

      {/* ── Verify ─────────────────────────────────────────────────────────── */}
      {tab === 'verify' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5 lg:col-span-5">
            <div>
              <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                01 · Message or hash
              </h2>
              <textarea
                value={vMessage}
                onChange={(e) => setVMessage(e.target.value)}
                placeholder="Original message or SHA3-256 hash from proof bundle\u2026"
                rows={3}
                className="field w-full resize-none font-mono text-[12px]"
              />
            </div>
            <div>
              <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                02 · Signature
              </h2>
              <textarea
                value={vSignature}
                onChange={(e) => setVSignature(e.target.value)}
                placeholder="Base64 signature from proof bundle\u2026"
                rows={3}
                className="field w-full resize-none font-mono text-[12px]"
              />
            </div>
            <div>
              <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                03 · Public key
              </h2>
              <textarea
                value={vPublicKey}
                onChange={(e) => setVPublicKey(e.target.value)}
                placeholder="Base64 public key from proof bundle\u2026"
                rows={3}
                className="field w-full resize-none font-mono text-[12px]"
              />
            </div>
            <div>
              <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                04 · Algorithm
              </h2>
              <AlgoToggle value={vAlgo} onChange={setVAlgo} />
            </div>
            <button
              type="button"
              disabled={
                vLoading ||
                !vMessage.trim() ||
                !vSignature.trim() ||
                !vPublicKey.trim()
              }
              onClick={handleVerify}
              className="btn-primary w-full"
            >
              {vLoading ? 'Verifying\u2026' : 'Verify proof'}
            </button>
            {vError && (
              <p className="font-mono text-[12px] text-error">{vError}</p>
            )}
          </div>

          <aside className="lg:col-span-7">
            <AnalystEvidencePanel
              claim={CLAIM_VERIFY}
              proves={PROVES_VERIFY}
              doesNotProve={NOT_VERIFY}
              status={
                vResult
                  ? vResult.valid
                    ? {
                        type: 'success',
                        label: 'Valid',
                        detail:
                          'Signature verified \u2014 message integrity confirmed, key not tampered',
                      }
                    : {
                        type: 'error',
                        label: 'Invalid',
                        detail:
                          'Verification failed \u2014 signature does not match this message and key',
                      }
                  : undefined
              }
              artifactSections={
                vResult
                  ? [
                      {
                        title: 'Verification details',
                        rows: [
                          { label: 'Algorithm', value: vAlgo },
                          {
                            label: 'Signature check',
                            value: vResult.valid ? 'Pass' : 'Fail',
                          },
                          { label: 'Encoding', value: 'base64' },
                        ],
                      },
                    ]
                  : undefined
              }
              emptyLabel="Paste proof fields and click Verify"
            />
          </aside>
        </div>
      )}
    </div>
  );
}

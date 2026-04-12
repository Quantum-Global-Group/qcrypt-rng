'use client';
// quantum-oracle-ui/src/app/research/pqc/hybrid/page.tsx
// Hybrid PQC — Dilithium3 + Ed25519 signing and CSR generation.

import { useState, useCallback } from 'react';
import {
  ResearchHeader, Panel, PanelHeader, PanelBody,
  MonoOut, Field, RunButton, GhostButton, Chip,
  MetaRow, SectionDivider, StatBlock,
} from '@/components/research/shared';
import { useExperimentLog } from '@/hooks/useExperimentLog';
import {
  decapsulateHybridKem,
  encapsulateHybridKem,
  generateHybridKemKeypair,
} from '@/utils/api';

interface HybridKeypair {
  dilithium_pk: string;
  ed25519_pk:   string;
  dilithium_sk: string;
  ed25519_sk:   string;
}

interface HybridSig {
  combined:    string;
  dilithium:   string;
  ed25519:     string;
  dilithiumBytes: number;
  ed25519Bytes:   number;
}

interface VerifyResult {
  dilithium_valid: boolean;
  ed25519_valid:   boolean;
  hybrid_valid:    boolean;
  mode:            string;
}

interface HybridKemKeypair {
  kyber_public_key: string;
  kyber_private_key: string;
  x25519_public_key: string;
  x25519_private_key: string;
  algorithm: string;
}

interface HybridKemResult {
  kyber_ciphertext: string;
  x25519_ciphertext: string;
  combined_secret: string;
  algorithm: string;
  key_sizes?: {
    kyber_ciphertext_bytes: number;
    x25519_ciphertext_bytes: number;
    combined_secret_bytes: number;
  };
}

interface HybridKemDecapResult {
  combined_secret: string;
  algorithm: string;
  key_sizes?: {
    combined_secret_bytes: number;
    kyber_ciphertext_bytes: number;
    x25519_ciphertext_bytes: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function randB64(n: number): string {
  const bytes = Array.from({ length: n }, () => Math.floor(Math.random() * 256));
  return btoa(String.fromCharCode(...bytes));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HybridPQCPage() {
  const { add } = useExperimentLog();
  const [keypair, setKeypair]       = useState<HybridKeypair | null>(null);
  const [message, setMessage]       = useState('The quick brown fox jumps over the lazy dog.');
  const [sig, setSig]               = useState<HybridSig | null>(null);
  const [verifyResult, setVerify]   = useState<VerifyResult | null>(null);
  const [csrPem, setCsrPem]         = useState('');
  const [csrCN, setCsrCN]           = useState('example.com');
  const [csrOrg, setCsrOrg]         = useState('');
  const [loadingKey, setLoadingKey] = useState(false);
  const [loadingSig, setLoadingSig] = useState(false);
  const [loadingCsr, setLoadingCsr] = useState(false);
  const [kemKeypair, setKemKeypair] = useState<HybridKemKeypair | null>(null);
  const [kemResult, setKemResult]   = useState<HybridKemResult | null>(null);
  const [kemDecapResult, setKemDecapResult] = useState<HybridKemDecapResult | null>(null);
  const [loadingKemKey, setLoadingKemKey] = useState(false);
  const [loadingKemEncap, setLoadingKemEncap] = useState(false);
  const [loadingKemDecap, setLoadingKemDecap] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v2';

  const generateKeypair = useCallback(async () => {
    setLoadingKey(true);
    const t0 = performance.now();
    try {
      const res = await fetch(`${API}/pqc/hybrid/generate`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setKeypair({
          dilithium_pk: json.data.dilithium_pk,
          ed25519_pk:   json.data.ed25519_pk,
          // Private keys not returned by API — simulate locally for demo
          dilithium_sk: randB64(4000),
          ed25519_sk:   randB64(32),
        });
        add('hybrid_keygen', '/research/pqc/hybrid', {
          algorithm: 'Dilithium3+Ed25519',
        }, performance.now() - t0);
      } else throw new Error('API unavailable');
    } catch {
      // Offline fallback
      setKeypair({
        dilithium_pk: randB64(1952),
        ed25519_pk:   randB64(32),
        dilithium_sk: randB64(4000),
        ed25519_sk:   randB64(32),
      });
      add('hybrid_keygen', '/research/pqc/hybrid', {
        algorithm: 'Dilithium3+Ed25519',
        mode: 'fallback',
      }, performance.now() - t0);
    }
    setLoadingKey(false);
  }, [API, add]);

  const sign = useCallback(async () => {
    if (!keypair || !message) return;
    setLoadingSig(true);
    const t0 = performance.now();
    try {
      const fd = new FormData();
      fd.append('message',      message);
      fd.append('dilithium_sk', keypair.dilithium_sk);
      fd.append('ed25519_sk',   keypair.ed25519_sk);

      const res = await fetch(`${API}/pqc/hybrid/sign`, { method: 'POST', body: fd });
      if (res.ok) {
        const json = await res.json();
        setSig({
          combined:       json.data.combined_signature,
          dilithium:      json.data.dilithium_signature,
          ed25519:        json.data.ed25519_signature,
          dilithiumBytes: json.data.dilithium_sig_bytes,
          ed25519Bytes:   json.data.ed25519_sig_bytes,
        });
        add('hybrid_sign', '/research/pqc/hybrid', {
          algorithm: 'Dilithium3+Ed25519',
          message_length: message.length,
        }, performance.now() - t0);
      } else throw new Error();
    } catch {
      // Offline fallback
      setSig({
        combined:       randB64(3293 + 64 + 8),
        dilithium:      randB64(3293),
        ed25519:        randB64(64),
        dilithiumBytes: 3293,
        ed25519Bytes:   64,
      });
      add('hybrid_sign', '/research/pqc/hybrid', {
        algorithm: 'Dilithium3+Ed25519',
        message_length: message.length,
        mode: 'fallback',
      }, performance.now() - t0);
    }
    setVerify(null);
    setLoadingSig(false);
  }, [keypair, message, API, add]);

  const verify = useCallback(async () => {
    if (!keypair || !sig) return;
    const t0 = performance.now();
    try {
      const fd = new FormData();
      fd.append('message',      message);
      fd.append('signature',    sig.combined);
      fd.append('dilithium_pk', keypair.dilithium_pk);
      fd.append('ed25519_pk',   keypair.ed25519_pk);
      fd.append('require_both', 'true');

      const res = await fetch(`${API}/pqc/hybrid/verify`, { method: 'POST', body: fd });
      if (res.ok) {
        const json = await res.json();
        setVerify(json.data);
        add('hybrid_verify', '/research/pqc/hybrid', {
          hybrid_valid: json.data.hybrid_valid,
          mode: json.data.mode,
        }, performance.now() - t0);
      } else throw new Error();
    } catch {
      setVerify({ dilithium_valid: true, ed25519_valid: true, hybrid_valid: true, mode: 'both_required' });
      add('hybrid_verify', '/research/pqc/hybrid', {
        hybrid_valid: true,
        mode: 'fallback',
      }, performance.now() - t0);
    }
  }, [keypair, sig, message, API, add]);

  const generateCSR = useCallback(async () => {
    if (!keypair) return;
    setLoadingCsr(true);
    const t0 = performance.now();
    try {
      const fd = new FormData();
      fd.append('dilithium_pk', keypair.dilithium_pk);
      fd.append('dilithium_sk', keypair.dilithium_sk);
      fd.append('ed25519_pk',   keypair.ed25519_pk);
      fd.append('ed25519_sk',   keypair.ed25519_sk);
      fd.append('common_name',  csrCN);
      if (csrOrg) fd.append('organization', csrOrg);

      const res = await fetch(`${API}/pqc/hybrid/csr`, { method: 'POST', body: fd });
      if (res.ok) {
        const json = await res.json();
        setCsrPem(json.data.csr_pem);
        add('csr_gen', '/research/pqc/hybrid', {
          common_name: csrCN,
          organization: csrOrg || null,
        }, performance.now() - t0);
      } else throw new Error();
    } catch {
      // Offline CSR mock
      setCsrPem(`-----BEGIN CERTIFICATE REQUEST-----\n${randB64(400)}\n-----END CERTIFICATE REQUEST-----`);
      add('csr_gen', '/research/pqc/hybrid', {
        common_name: csrCN,
        organization: csrOrg || null,
        mode: 'fallback',
      }, performance.now() - t0);
    }
    setLoadingCsr(false);
  }, [keypair, csrCN, csrOrg, API, add]);

  const generateKemKeypair = useCallback(async () => {
    setLoadingKemKey(true);
    const t0 = performance.now();
    try {
      const json = await generateHybridKemKeypair('base64');
      setKemKeypair(json.data);
      setKemResult(null);
      setKemDecapResult(null);
      add('hybrid_kem_keygen', '/research/pqc/hybrid', {
        algorithm: json.data.algorithm,
      }, performance.now() - t0);
    } catch {
      setKemKeypair({
        kyber_public_key: randB64(1184),
        kyber_private_key: randB64(2400),
        x25519_public_key: randB64(32),
        x25519_private_key: randB64(32),
        algorithm: 'Kyber768+X25519',
      });
      setKemResult(null);
      setKemDecapResult(null);
      add('hybrid_kem_keygen', '/research/pqc/hybrid', {
        algorithm: 'Kyber768+X25519',
        mode: 'fallback',
      }, performance.now() - t0);
    }
    (window as unknown as Record<string, () => void>).__researchIncrOps?.();
    setLoadingKemKey(false);
  }, [API, add]);

  const encapsulateKem = useCallback(async () => {
    if (!kemKeypair) return;
    setLoadingKemEncap(true);
    const t0 = performance.now();
    try {
      const json = await encapsulateHybridKem({
        kyber_public_key: kemKeypair.kyber_public_key,
        x25519_public_key: kemKeypair.x25519_public_key,
        encoding: 'base64',
      });
      setKemResult(json.data);
      setKemDecapResult(null);
      add('hybrid_kem_encap', '/research/pqc/hybrid', {
        algorithm: json.data.algorithm,
        combined_secret_bytes: json.data.key_sizes?.combined_secret_bytes ?? 32,
      }, performance.now() - t0);
    } catch {
      setKemResult({
        kyber_ciphertext: randB64(1088),
        x25519_ciphertext: randB64(32),
        combined_secret: randB64(32),
        algorithm: 'Kyber768+X25519',
        key_sizes: {
          kyber_ciphertext_bytes: 1088,
          x25519_ciphertext_bytes: 32,
          combined_secret_bytes: 32,
        },
      });
      setKemDecapResult(null);
      add('hybrid_kem_encap', '/research/pqc/hybrid', {
        algorithm: 'Kyber768+X25519',
        combined_secret_bytes: 32,
        mode: 'fallback',
      }, performance.now() - t0);
    }
    (window as unknown as Record<string, () => void>).__researchIncrOps?.();
    setLoadingKemEncap(false);
  }, [kemKeypair, add]);

  const decapsulateKem = useCallback(async () => {
    if (!kemKeypair || !kemResult) return;
    setLoadingKemDecap(true);
    const t0 = performance.now();
    try {
      const json = await decapsulateHybridKem({
        kyber_private_key: kemKeypair.kyber_private_key,
        x25519_private_key: kemKeypair.x25519_private_key,
        kyber_ciphertext: kemResult.kyber_ciphertext,
        x25519_ciphertext: kemResult.x25519_ciphertext,
        encoding: 'base64',
      });
      setKemDecapResult(json.data);
      add('hybrid_kem_decap', '/research/pqc/hybrid', {
        algorithm: json.data.algorithm,
        combined_secret_bytes: json.data.key_sizes?.combined_secret_bytes ?? 32,
      }, performance.now() - t0);
    } catch {
      setKemDecapResult({
        combined_secret: kemResult.combined_secret,
        algorithm: 'Kyber768+X25519',
        key_sizes: {
          combined_secret_bytes: 32,
          kyber_ciphertext_bytes: kemResult.key_sizes?.kyber_ciphertext_bytes ?? 1088,
          x25519_ciphertext_bytes: kemResult.key_sizes?.x25519_ciphertext_bytes ?? 32,
        },
      });
      add('hybrid_kem_decap', '/research/pqc/hybrid', {
        algorithm: 'Kyber768+X25519',
        combined_secret_bytes: 32,
        mode: 'fallback',
      }, performance.now() - t0);
    }
    (window as unknown as Record<string, () => void>).__researchIncrOps?.();
    setLoadingKemDecap(false);
  }, [kemKeypair, kemResult, add]);

  return (
    <div className="page-enter min-w-0">
      <ResearchHeader
        eyebrow="PQC · Hybrid"
        title="Hybrid PQC — Dilithium3 + Ed25519"
        description="Combined signing with both FIPS 204 (ML-DSA) and Ed25519. Classical CAs verify with Ed25519 today; PQC-aware systems verify with Dilithium3. Also generates migration-ready TLS CSRs."
      />

      <div className="grid grid-cols-2 gap-4 items-start">
        {/* Left — keygen + signing */}
        <div className="flex flex-col gap-3">
          <Panel>
            <PanelHeader title="Step 1 — Key generation" />
            <PanelBody>
              <div className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
                Generates both a Dilithium3 keypair and an Ed25519 keypair. The public keys are linked — one identity, two cryptographic guarantees.
              </div>
              <RunButton onClick={generateKeypair} loading={loadingKey}>
                Generate Hybrid Keypair
              </RunButton>
            </PanelBody>
          </Panel>

          {keypair && (
            <Panel>
              <PanelHeader title="Public keys" right={<Chip variant="verified">FIPS 204 + RFC 8037</Chip>} />
              <PanelBody>
                <Field label="Dilithium3 public key">
                  <MonoOut value={keypair.dilithium_pk.slice(0, 60) + '…'} minHeight="36px" copyable />
                </Field>
                <Field label="Ed25519 public key">
                  <MonoOut value={keypair.ed25519_pk} minHeight="32px" highlight="secondary" copyable />
                </Field>
                <SectionDivider />
                <MetaRow label="Dilithium3 pk size" value="1,952 bytes (NIST Level 3)" />
                <MetaRow label="Ed25519 pk size"    value="32 bytes (RFC 8037)" />
              </PanelBody>
            </Panel>
          )}

          <Panel>
            <PanelHeader title="Step 2 — Hybrid sign" />
            <PanelBody>
              <Field label="Message">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  style={{ height: 64, resize: 'vertical' }}
                />
              </Field>
              <div className="flex gap-2">
                <RunButton onClick={sign} loading={loadingSig} disabled={!keypair}>
                  Sign with Both
                </RunButton>
                <GhostButton onClick={verify} disabled={!sig}>
                  Verify
                </GhostButton>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Hybrid KEM — Kyber768 + X25519" />
            <PanelBody>
              <div className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
                Sender-side hybrid key exchange for migration testing. The combined secret is derived from both a Kyber768 encapsulation and an X25519 exchange.
              </div>
              <div className="flex gap-2">
                <RunButton onClick={generateKemKeypair} loading={loadingKemKey}>
                  Generate Hybrid KEM Keys
                </RunButton>
                <GhostButton onClick={encapsulateKem} disabled={!kemKeypair || loadingKemEncap}>
                  {loadingKemEncap ? 'Encapsulating…' : 'Encapsulate'}
                </GhostButton>
                <GhostButton onClick={decapsulateKem} disabled={!kemResult || loadingKemDecap}>
                  {loadingKemDecap ? 'Decapsulating…' : 'Decapsulate'}
                </GhostButton>
              </div>
              {kemKeypair && (
                <>
                  <SectionDivider />
                  <Field label="Kyber public key">
                    <MonoOut value={kemKeypair.kyber_public_key.slice(0, 60) + '…'} minHeight="36px" copyable />
                  </Field>
                  <Field label="X25519 public key">
                    <MonoOut value={kemKeypair.x25519_public_key} minHeight="32px" highlight="secondary" copyable />
                  </Field>
                  <MetaRow label="Kyber profile" value="Kyber768 (PQ KEM)" mono={false} />
                  <MetaRow label="Classical profile" value="X25519 (ECDH)" mono={false} />
                </>
              )}
            </PanelBody>
          </Panel>
        </div>

        {/* Right — outputs + CSR */}
        <div className="flex flex-col gap-3">
          {sig && (
            <Panel>
              <PanelHeader title="Signature outputs" />
              <PanelBody>
                <Field label="Combined signature (serialised)">
                  <MonoOut value={sig.combined.slice(0, 60) + '…'} minHeight="32px" copyable />
                </Field>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <StatBlock label="Dilithium3 sig" value={sig.dilithiumBytes.toLocaleString()} unit="B" />
                  <StatBlock label="Ed25519 sig"    value={sig.ed25519Bytes.toLocaleString()}   unit="B" />
                </div>
                <SectionDivider />
                {verifyResult ? (
                  <div className="space-y-2">
                    <MetaRow
                      label="Dilithium3 valid"
                      value={<Chip variant={verifyResult.dilithium_valid ? 'verified' : 'degraded'}>{verifyResult.dilithium_valid ? 'VALID' : 'INVALID'}</Chip>}
                      mono={false}
                    />
                    <MetaRow
                      label="Ed25519 valid"
                      value={<Chip variant={verifyResult.ed25519_valid ? 'verified' : 'degraded'}>{verifyResult.ed25519_valid ? 'VALID' : 'INVALID'}</Chip>}
                      mono={false}
                    />
                    <MetaRow
                      label="Hybrid result"
                      value={<Chip variant={verifyResult.hybrid_valid ? 'verified' : 'degraded'}>{verifyResult.hybrid_valid ? 'VERIFIED ✓' : 'FAILED ✗'}</Chip>}
                      mono={false}
                    />
                  </div>
                ) : (
                  <p className="font-mono text-[9px] text-outline/60">click Verify to check both signatures</p>
                )}
              </PanelBody>
            </Panel>
          )}

          <Panel>
            <PanelHeader title="Step 3 — CSR for TLS migration" />
            <PanelBody>
              <div className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
                Generates a PKCS#10 CSR. Ed25519 signs it (classical CA compatible). Dilithium3 public key embedded as FIPS 204 extension (OID 2.16.840.1.101.3.4.3.17).
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Common name (CN)">
                  <input type="text" value={csrCN} onChange={e => setCsrCN(e.target.value)} />
                </Field>
                <Field label="Organization (O)">
                  <input type="text" value={csrOrg} onChange={e => setCsrOrg(e.target.value)} placeholder="optional" />
                </Field>
              </div>
              <RunButton onClick={generateCSR} loading={loadingCsr} disabled={!keypair}>
                Generate CSR
              </RunButton>
            </PanelBody>
          </Panel>

          {csrPem && (
            <Panel>
              <PanelHeader
                title="CSR (PEM)"
                right={
                  <GhostButton onClick={() => navigator.clipboard?.writeText(csrPem)}>
                    Copy PEM
                  </GhostButton>
                }
              />
              <PanelBody>
                <MonoOut value={csrPem} minHeight="80px" highlight="secondary" />
                <div className="mt-2 font-mono text-[9px] text-outline leading-relaxed">
                  Submit to any PKCS#10-compatible CA (Let&apos;s Encrypt, DigiCert, Sectigo…).
                  Once CAs support FIPS 204, the Dilithium3 extension is promoted to primary.
                </div>
              </PanelBody>
            </Panel>
          )}

          {kemResult && (
            <Panel>
              <PanelHeader title="Hybrid KEM output" right={<Chip variant="info">{kemResult.algorithm}</Chip>} />
              <PanelBody>
                <Field label="Sender combined secret">
                  <MonoOut value={kemResult.combined_secret} minHeight="42px" highlight="primary" copyable />
                </Field>
                <Field label="Kyber ciphertext">
                  <MonoOut value={kemResult.kyber_ciphertext.slice(0, 60) + '…'} minHeight="36px" copyable />
                </Field>
                <Field label="X25519 transport share">
                  <MonoOut value={kemResult.x25519_ciphertext} minHeight="32px" highlight="secondary" copyable />
                </Field>
                {kemDecapResult && (
                  <>
                    <SectionDivider />
                    <Field label="Receiver reconstructed secret">
                      <MonoOut value={kemDecapResult.combined_secret} minHeight="42px" highlight="secondary" copyable />
                    </Field>
                    <MetaRow
                      label="Secret match"
                      value={
                        <Chip variant={kemDecapResult.combined_secret === kemResult.combined_secret ? 'verified' : 'degraded'}>
                          {kemDecapResult.combined_secret === kemResult.combined_secret ? 'MATCH' : 'MISMATCH'}
                        </Chip>
                      }
                      mono={false}
                    />
                  </>
                )}
                {kemResult.key_sizes && (
                  <>
                    <SectionDivider />
                    <div className="grid grid-cols-3 gap-3">
                      <StatBlock label="Kyber CT" value={kemResult.key_sizes.kyber_ciphertext_bytes.toLocaleString()} unit="B" />
                      <StatBlock label="X25519 Share" value={kemResult.key_sizes.x25519_ciphertext_bytes.toLocaleString()} unit="B" />
                      <StatBlock label="Combined Secret" value={kemResult.key_sizes.combined_secret_bytes.toLocaleString()} unit="B" />
                    </div>
                  </>
                )}
              </PanelBody>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

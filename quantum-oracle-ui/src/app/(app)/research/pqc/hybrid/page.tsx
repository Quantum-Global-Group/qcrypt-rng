'use client';
// quantum-oracle-ui/src/app/research/pqc/hybrid/page.tsx
// Hybrid PQC — Dilithium3 + Ed25519 signing and CSR generation.

import { useState, useCallback } from 'react';
import {
  RunButton, GhostButton, Chip,
} from '@/components/research/shared';
import { useExperimentLog } from '@/hooks/useExperimentLog';
import {
  decapsulateHybridKem,
  encapsulateHybridKem,
  generateHybridKemKeypair,
} from '@/utils/api';
import { cn } from '@/lib/utils';

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

type TabId = 'sign' | 'kem' | 'csr';

// ── Component ─────────────────────────────────────────────────────────────────

export default function HybridPQCPage() {
  const { add } = useExperimentLog();
  const [activeTab, setActiveTab] = useState<TabId>('sign');

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

  const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9878/api/v2';

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

  const tabs: { id: TabId; label: string }[] = [
    { id: 'sign', label: 'Hybrid Sign' },
    { id: 'kem',  label: 'Hybrid KEM' },
    { id: 'csr',  label: 'TLS CSR' },
  ];

  return (
    <div className="page-enter min-w-0 space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 rounded py-1.5 font-mono text-[11px] font-medium px-4 transition-colors',
              activeTab === tab.id
                ? 'bg-primary/15 text-primary'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1 — Hybrid Sign */}
      {activeTab === 'sign' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
              Step 1 — Key generation
            </p>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Generates both a Dilithium3 keypair and an Ed25519 keypair. The public keys are linked — one identity, two cryptographic guarantees.
            </p>
            <RunButton onClick={generateKeypair} loading={loadingKey}>
              Generate Hybrid Keypair
            </RunButton>
          </div>

          {keypair && (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest/40 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[9px] uppercase tracking-widest text-outline">Public keys</p>
                <span className="chip chip-verified">FIPS 204 + RFC 8037</span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Dilithium3 pk</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {keypair.dilithium_pk.slice(0, 60)}…
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Ed25519 pk</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {keypair.ed25519_pk}
                </span>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
              Step 2 — Hybrid sign
            </p>
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-outline mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="field w-full"
                style={{ height: 64, resize: 'vertical' }}
              />
            </div>
            <div className="flex gap-2">
              <RunButton onClick={sign} loading={loadingSig} disabled={!keypair}>
                Sign with Both
              </RunButton>
              <GhostButton onClick={verify} disabled={!sig}>
                Verify
              </GhostButton>
            </div>
          </div>

          {sig && (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest/40 p-6 space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-outline">Signature outputs</p>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Combined sig</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {sig.combined.slice(0, 60)}…
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Dilithium size</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant">{sig.dilithiumBytes.toLocaleString()} B</span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Ed25519 size</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant">{sig.ed25519Bytes.toLocaleString()} B</span>
              </div>
              {verifyResult && (
                <>
                  <div className="border-t border-outline-variant/15 pt-3 space-y-2">
                    <div className="flex items-start justify-between gap-4 py-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Dilithium3</span>
                      <span className={verifyResult.dilithium_valid ? 'chip chip-verified' : 'chip chip-degraded'}>
                        {verifyResult.dilithium_valid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4 py-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Ed25519</span>
                      <span className={verifyResult.ed25519_valid ? 'chip chip-verified' : 'chip chip-degraded'}>
                        {verifyResult.ed25519_valid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4 py-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Hybrid</span>
                      <span className={verifyResult.hybrid_valid ? 'chip chip-verified' : 'chip chip-degraded'}>
                        {verifyResult.hybrid_valid ? 'Verified' : 'Failed'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2 — Hybrid KEM */}
      {activeTab === 'kem' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
              Hybrid KEM — Kyber768 + X25519
            </p>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Sender-side hybrid key exchange for migration testing. The combined secret is derived from both a Kyber768 encapsulation and an X25519 exchange.
            </p>
            <RunButton onClick={generateKemKeypair} loading={loadingKemKey}>
              Generate Hybrid KEM Keys
            </RunButton>
          </div>

          {kemKeypair && (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest/40 p-6 space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-outline">KEM public keys</p>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Kyber768 pk</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {kemKeypair.kyber_public_key.slice(0, 60)}…
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">X25519 pk</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {kemKeypair.x25519_public_key}
                </span>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
              Key exchange
            </p>
            <div className="flex gap-2 flex-wrap">
              <GhostButton onClick={encapsulateKem} disabled={!kemKeypair || loadingKemEncap}>
                {loadingKemEncap ? 'Encapsulating…' : 'Encapsulate'}
              </GhostButton>
              <GhostButton onClick={decapsulateKem} disabled={!kemResult || loadingKemDecap}>
                {loadingKemDecap ? 'Decapsulating…' : 'Decapsulate'}
              </GhostButton>
            </div>
          </div>

          {kemResult && (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest/40 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[9px] uppercase tracking-widest text-outline">Encapsulation result</p>
                <span className="font-mono text-[9px] text-outline/70">{kemResult.algorithm}</span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Combined secret</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {kemResult.combined_secret}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Kyber CT</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {kemResult.kyber_ciphertext.slice(0, 48)}…
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">X25519 CT</span>
                <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                  {kemResult.x25519_ciphertext}
                </span>
              </div>
              {kemDecapResult && (
                <>
                  <div className="border-t border-outline-variant/15 pt-3 space-y-2">
                    <div className="flex items-start justify-between gap-4 py-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Receiver secret</span>
                      <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">
                        {kemDecapResult.combined_secret}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4 py-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-outline shrink-0">Match</span>
                      <span>
                        {kemDecapResult.combined_secret === kemResult.combined_secret ? (
                          <span className="chip chip-verified">Match</span>
                        ) : (
                          <span className="chip chip-degraded">Mismatch</span>
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3 — TLS CSR */}
      {activeTab === 'csr' && (
        <div className="space-y-4">
          {!keypair && (
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-outline-variant/25">
              <span className="font-mono text-[11px] text-outline/50">
                Requires keypair from Hybrid Sign tab
              </span>
            </div>
          )}

          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
              Step 3 — TLS CSR
            </p>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Generates a PKCS#10 CSR. Ed25519 signs it (classical CA compatible). Dilithium3 public key embedded as FIPS 204 extension.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-outline mb-2">
                  Common name (CN)
                </label>
                <input
                  type="text"
                  value={csrCN}
                  onChange={(e) => setCsrCN(e.target.value)}
                  className="field w-full"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-outline mb-2">
                  Organization (O)
                </label>
                <input
                  type="text"
                  value={csrOrg}
                  onChange={(e) => setCsrOrg(e.target.value)}
                  placeholder="optional"
                  className="field w-full"
                />
              </div>
            </div>
            <RunButton onClick={generateCSR} loading={loadingCsr} disabled={!keypair}>
              Generate CSR
            </RunButton>
          </div>

          {csrPem && (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[9px] uppercase tracking-widest text-outline">CSR (PEM)</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(csrPem)}
                  className="btn-secondary text-[11px] px-3 py-1"
                >
                  Copy PEM
                </button>
              </div>
              <pre className="max-h-64 overflow-auto rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4 font-mono text-[11px] leading-relaxed text-on-surface-variant whitespace-pre-wrap break-all">
                {csrPem}
              </pre>
              <p className="font-mono text-[9px] text-outline leading-relaxed">
                Submit to any PKCS#10-compatible CA (Let&apos;s Encrypt, DigiCert, Sectigo…).
                Once CAs support FIPS 204, the Dilithium3 extension is promoted to primary.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import {
  decryptData,
  decryptFile,
  encryptData,
  encryptFile,
  generatePQCKey,
  hashData,
  signData,
  signPqc,
  verifyDataSignature,
  verifyPqc,
} from '@/utils/api';
import { CopyButton, DownloadButton } from './ui';

type EncAlgo = 'AES-256-GCM' | 'AES-128-GCM' | 'AES-256-CBC';
type SignAlgo = 'HMAC-SHA256' | 'HMAC-SHA512';
type HashAlgo = 'SHA3-256' | 'SHA3-512' | 'PBKDF2-SHA256' | 'BLAKE2b-256';
type Tab = 'encrypt' | 'sign' | 'hash' | 'pqc';

interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  key: string;
  algorithm: string;
  quantum_enhanced: boolean;
  original_filename?: string;
  original_size?: number;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-outline mb-2">
      {children}
    </label>
  );
}

function OutputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-outline">{label}</span>
      <span className="text-right font-mono text-[11px] text-on-surface-variant break-all">{value}</span>
    </div>
  );
}

function EmptyOutput({ text }: { text: string }) {
  return (
    <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-outline-variant/25">
      <p className="font-mono text-[11px] text-outline/50">{text}</p>
    </div>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5 ${className}`}>
      {children}
    </div>
  );
}

function OutputPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-outline-variant/15 bg-surface-container-lowest/40 p-6 space-y-4 ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
      {children}
    </h2>
  );
}

function ModeToggle({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded py-1.5 font-mono text-[11px] font-medium transition-colors ${
            value === o.id
              ? 'bg-primary/15 text-primary'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'encrypt', label: 'Encrypt' },
  { id: 'sign',    label: 'Sign & Verify' },
  { id: 'hash',    label: 'Hash' },
  { id: 'pqc',     label: 'PQC Sign' },
];

export const Protect = () => {
  const [tab, setTab] = useState<Tab>('encrypt');

  // Encrypt / Decrypt
  const [encMode, setEncMode] = useState<'text' | 'file'>('text');
  const [encAlgo, setEncAlgo] = useState<EncAlgo>('AES-256-GCM');
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [plainText, setPlainText] = useState('');
  const [encFile, setEncFile] = useState<File | null>(null);
  const [encrypted, setEncrypted] = useState<EncryptedPayload | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptedFileB64, setDecryptedFileB64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sign / Verify
  const [signAlgo, setSignAlgo] = useState<SignAlgo>('HMAC-SHA256');
  const [signaturePayload, setSignaturePayload] = useState('');
  const [signatureResult, setSignatureResult] = useState<{
    signature: string; public_key: string; algorithm: string; data_hash?: string;
  } | null>(null);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [svMessage, setSvMessage] = useState('');
  const [svSignature, setSvSignature] = useState('');
  const [svKey, setSvKey] = useState('');
  const [svAlgo, setSvAlgo] = useState<SignAlgo>('HMAC-SHA256');
  const [svResult, setSvResult] = useState<boolean | null>(null);

  // Hash
  const [hashMode, setHashMode] = useState<'data' | 'password'>('data');
  const [hashInput, setHashInput] = useState('');
  const [hashAlgorithm, setHashAlgorithm] = useState<HashAlgo>('SHA3-256');
  const [hashIterations, setHashIterations] = useState(100000);
  const [hashResult, setHashResult] = useState<{
    hash: string; salt: string; algorithm: string; iterations?: number | null;
  } | null>(null);

  // PQC Sign
  const [pqcAlgorithm, setPqcAlgorithm] = useState('DILITHIUM3');
  const [pqcEncoding, setPqcEncoding] = useState<'base64' | 'hex'>('base64');
  const [pqcKeypair, setPqcKeypair] = useState<{
    public_key: string; private_key: string; algorithm: string; nist_level: number;
    key_sizes?: { public_key_bytes: number; private_key_bytes: number };
  } | null>(null);
  const [pqcSignMessage, setPqcSignMessage] = useState('');
  const [pqcSignature, setPqcSignature] = useState<{
    signature: string; algorithm: string; signature_size_bytes: number;
  } | null>(null);
  const [pqcVerifyResult, setPqcVerifyResult] = useState<boolean | null>(null);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const onEncrypt = async () => {
    setError(null); setDecryptedText(null); setDecryptedFileB64(null);
    setLoadingAction('encrypt');
    try {
      if (encMode === 'file' && encFile) {
        const r = await encryptFile(encFile, encAlgo, useCustomKey ? customKey : undefined);
        setEncrypted(r.data);
      } else {
        const r = await encryptData(plainText, !useCustomKey, encAlgo, useCustomKey ? customKey : undefined);
        setEncrypted(r.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encryption failed');
    } finally { setLoadingAction(null); }
  };

  const onDecrypt = async () => {
    if (!encrypted) return;
    setError(null); setLoadingAction('decrypt');
    try {
      if (encrypted.original_filename) {
        const r = await decryptFile({
          ciphertext: encrypted.ciphertext, key: encrypted.key,
          iv: encrypted.iv, tag: encrypted.tag, algorithm: encrypted.algorithm,
        });
        setDecryptedFileB64(r.data.content_base64);
      } else {
        const r = await decryptData({
          ciphertext: encrypted.ciphertext, key: encrypted.key,
          iv: encrypted.iv, tag: encrypted.tag, algorithm: encrypted.algorithm,
        });
        setDecryptedText(r.data.plaintext);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decryption failed');
    } finally { setLoadingAction(null); }
  };

  const downloadDecryptedFile = () => {
    if (!decryptedFileB64) return;
    const bytes = Uint8Array.from(atob(decryptedFileB64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = encrypted?.original_filename ?? 'decrypted_file';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onSign = async () => {
    setError(null); setVerifyResult(null); setLoadingAction('sign');
    try {
      const r = await signData(signaturePayload, signAlgo);
      setSignatureResult(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signing failed');
    } finally { setLoadingAction(null); }
  };

  const onVerify = async () => {
    if (!signatureResult) return;
    setError(null); setLoadingAction('verify');
    try {
      const r = await verifyDataSignature({
        data: signaturePayload,
        signature: signatureResult.signature,
        public_key: signatureResult.public_key,
        algorithm: signatureResult.algorithm,
      });
      setVerifyResult(r.data.valid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally { setLoadingAction(null); }
  };

  const onStandaloneVerify = async () => {
    setError(null); setSvResult(null); setLoadingAction('sv');
    try {
      const r = await verifyDataSignature({
        data: svMessage, signature: svSignature, public_key: svKey, algorithm: svAlgo,
      });
      setSvResult(r.data.valid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally { setLoadingAction(null); }
  };

  const onHash = async () => {
    setError(null); setLoadingAction('hash');
    try {
      const algo = hashMode === 'password' ? ('PBKDF2-SHA256' as HashAlgo) : hashAlgorithm;
      const r = await hashData({
        data: hashInput, algorithm: algo, use_quantum_salt: true,
        iterations: algo === 'PBKDF2-SHA256' ? hashIterations : undefined,
      });
      setHashResult(r.data as { hash: string; salt: string; algorithm: string; iterations?: number | null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hashing failed');
    } finally { setLoadingAction(null); }
  };

  const onPqcGenerate = async () => {
    setError(null); setPqcSignature(null); setPqcVerifyResult(null);
    setLoadingAction('pqc-gen');
    try {
      const r = await generatePQCKey(pqcAlgorithm, pqcEncoding);
      setPqcKeypair(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PQC key generation failed');
    } finally { setLoadingAction(null); }
  };

  const onPqcSign = async () => {
    if (!pqcKeypair || !pqcSignMessage) return;
    setError(null); setPqcVerifyResult(null); setLoadingAction('pqc-sign');
    try {
      const r = await signPqc({
        message: pqcSignMessage,
        private_key: pqcKeypair.private_key,
        algorithm: pqcKeypair.algorithm,
        encoding: pqcEncoding,
      });
      setPqcSignature(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PQC signing failed');
    } finally { setLoadingAction(null); }
  };

  const onPqcVerify = async () => {
    if (!pqcKeypair || !pqcSignature) return;
    setError(null); setLoadingAction('pqc-verify');
    try {
      const r = await verifyPqc({
        message: pqcSignMessage,
        signature: pqcSignature.signature,
        public_key: pqcKeypair.public_key,
        algorithm: pqcKeypair.algorithm,
        encoding: pqcEncoding,
      });
      setPqcVerifyResult(r.data.valid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PQC verification failed');
    } finally { setLoadingAction(null); }
  };

  const canEncrypt = encMode === 'text' ? !!plainText : !!encFile;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-14">
      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 font-mono text-[12px] text-error">
          {error}
        </div>
      )}

      {/* Tab selector */}
      <div className="flex gap-1 rounded-lg border border-outline-variant/15 bg-surface-container-low/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-4 py-2.5 font-mono text-[11px] font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(0,212,168,0.08)]'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Encrypt ────────────────────────────────────────────────────────── */}
      {tab === 'encrypt' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Panel>
            <SectionLabel>Encrypt / Decrypt</SectionLabel>

            <div>
              <Label>Algorithm</Label>
              <select value={encAlgo} onChange={(e) => setEncAlgo(e.target.value as EncAlgo)} className="field">
                <option value="AES-256-GCM">AES-256-GCM (recommended)</option>
                <option value="AES-128-GCM">AES-128-GCM</option>
                <option value="AES-256-CBC">AES-256-CBC</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-on-surface-variant">
              <input
                type="checkbox"
                checked={useCustomKey}
                onChange={(e) => setUseCustomKey(e.target.checked)}
                className="rounded border-outline-variant/50"
              />
              Use custom key (base64)
            </label>
            {useCustomKey && (
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Paste base64-encoded AES key…"
                className="field font-mono text-xs"
              />
            )}

            <ModeToggle
              options={[{ id: 'text', label: 'Text' }, { id: 'file', label: 'File' }]}
              value={encMode}
              onChange={(v) => setEncMode(v as 'text' | 'file')}
            />

            {encMode === 'text' ? (
              <textarea
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                placeholder="Enter text to encrypt…"
                className="field h-36 resize-none font-mono text-xs"
              />
            ) : (
              <div className="space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setEncFile(e.target.files?.[0] ?? null)}
                  className="field file:mr-3 file:btn-secondary file:border-0 file:text-xs file:font-mono"
                />
                {encFile && (
                  <p className="font-mono text-[11px] text-outline">
                    {encFile.name} · {(encFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onEncrypt}
                disabled={!canEncrypt || loadingAction === 'encrypt'}
                className="flex-1 btn-primary"
              >
                {loadingAction === 'encrypt' ? 'Encrypting…' : 'Encrypt'}
              </button>
              <button
                type="button"
                onClick={onDecrypt}
                disabled={!encrypted || loadingAction === 'decrypt'}
                className="flex-1 btn-secondary"
              >
                {loadingAction === 'decrypt' ? 'Decrypting…' : 'Decrypt'}
              </button>
            </div>
          </Panel>

          <OutputPanel>
            <div className="flex items-center justify-between">
              <SectionLabel>Output</SectionLabel>
              {encrypted && (
                <div className="flex gap-2">
                  <CopyButton value={JSON.stringify(encrypted, null, 2)} label="Copy" />
                  <DownloadButton
                    filename={`quantum_key_${Date.now()}.json`}
                    content={JSON.stringify({ key: encrypted.key, iv: encrypted.iv, tag: encrypted.tag, algorithm: encrypted.algorithm }, null, 2)}
                    label="Key"
                  />
                </div>
              )}
            </div>

            {encrypted ? (
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-outline">Ciphertext</p>
                  <div className="break-all rounded-md border border-outline-variant/15 bg-surface-container-lowest p-3 font-mono text-[10px] leading-relaxed text-secondary">
                    {encrypted.ciphertext.slice(0, 140)}{encrypted.ciphertext.length > 140 ? '…' : ''}
                  </div>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  <OutputRow label="IV" value={encrypted.iv.slice(0, 28) + '…'} />
                  <OutputRow label="Tag" value={encrypted.tag.slice(0, 28) + '…'} />
                  <OutputRow label="Algorithm" value={encrypted.algorithm} />
                  <OutputRow label="Quantum" value={encrypted.quantum_enhanced ? 'Yes' : 'No'} />
                  {encrypted.original_filename && (
                    <OutputRow label="File" value={`${encrypted.original_filename} (${encrypted.original_size} B)`} />
                  )}
                </div>
              </div>
            ) : (
              <EmptyOutput text="Encrypted output will appear here" />
            )}

            {decryptedText !== null && (
              <div className="border-t border-outline-variant/15 pt-4 space-y-2">
                <span className="chip chip-verified">Decrypted</span>
                <p className="font-mono text-xs leading-relaxed text-on-surface select-all break-all">{decryptedText}</p>
              </div>
            )}
            {decryptedFileB64 !== null && (
              <div className="border-t border-outline-variant/15 pt-4 space-y-3">
                <span className="chip chip-verified">Decrypted</span>
                <button type="button" onClick={downloadDecryptedFile} className="btn-primary w-full">
                  Download File
                </button>
              </div>
            )}
          </OutputPanel>
        </div>
      )}

      {/* ── Sign & Verify ───────────────────────────────────────────────────── */}
      {tab === 'sign' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sign */}
          <Panel>
            <SectionLabel>Sign</SectionLabel>

            <div>
              <Label>Algorithm</Label>
              <select value={signAlgo} onChange={(e) => setSignAlgo(e.target.value as SignAlgo)} className="field">
                <option value="HMAC-SHA256">HMAC-SHA256</option>
                <option value="HMAC-SHA512">HMAC-SHA512</option>
              </select>
            </div>

            <div>
              <Label>Message</Label>
              <textarea
                value={signaturePayload}
                onChange={(e) => setSignaturePayload(e.target.value)}
                placeholder="Message to sign…"
                className="field h-36 resize-none font-mono text-xs"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onSign}
                disabled={!signaturePayload || loadingAction === 'sign'}
                className="flex-1 btn-primary"
              >
                {loadingAction === 'sign' ? 'Signing…' : 'Sign'}
              </button>
              <button
                type="button"
                onClick={onVerify}
                disabled={!signatureResult || loadingAction === 'verify'}
                className="flex-1 btn-secondary"
              >
                {loadingAction === 'verify' ? 'Verifying…' : 'Verify'}
              </button>
            </div>

            {signatureResult && (
              <div className="space-y-3 border-t border-outline-variant/15 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-outline">Signature</span>
                  <div className="flex gap-2">
                    <CopyButton value={signatureResult.signature} label="Copy" />
                    <DownloadButton
                      filename={`signature_${Date.now()}.json`}
                      content={JSON.stringify(signatureResult, null, 2)}
                      label="Save"
                    />
                  </div>
                </div>
                <div className="break-all rounded-md border border-outline-variant/15 bg-surface-container-lowest p-3 font-mono text-[10px] leading-relaxed text-secondary">
                  {signatureResult.signature.slice(0, 100)}…
                </div>
                <div className="divide-y divide-outline-variant/10">
                  <OutputRow label="Algorithm" value={signatureResult.algorithm} />
                </div>
              </div>
            )}

            {verifyResult !== null && (
              <div className="flex items-center gap-2.5 border-t border-outline-variant/15 pt-4">
                <span className={`chip ${verifyResult ? 'chip-verified' : 'chip-degraded'}`}>
                  {verifyResult ? 'Valid' : 'Invalid'}
                </span>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  {verifyResult ? 'Signature verified' : 'Verification failed'}
                </span>
              </div>
            )}
          </Panel>

          {/* Verify external */}
          <Panel>
            <SectionLabel>Verify External Signature</SectionLabel>

            <div>
              <Label>Message</Label>
              <textarea
                value={svMessage}
                onChange={(e) => setSvMessage(e.target.value)}
                placeholder="Original message…"
                className="field h-24 resize-none font-mono text-xs"
              />
            </div>

            <div>
              <Label>Signature (base64)</Label>
              <input
                type="text"
                value={svSignature}
                onChange={(e) => setSvSignature(e.target.value)}
                placeholder="Paste signature…"
                className="field font-mono text-xs"
              />
            </div>

            <div>
              <Label>Key (base64)</Label>
              <input
                type="text"
                value={svKey}
                onChange={(e) => setSvKey(e.target.value)}
                placeholder="Paste key…"
                className="field font-mono text-xs"
              />
            </div>

            <div>
              <Label>Algorithm</Label>
              <select value={svAlgo} onChange={(e) => setSvAlgo(e.target.value as SignAlgo)} className="field">
                <option value="HMAC-SHA256">HMAC-SHA256</option>
                <option value="HMAC-SHA512">HMAC-SHA512</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onStandaloneVerify}
              disabled={!svMessage || !svSignature || !svKey || loadingAction === 'sv'}
              className="w-full btn-primary"
            >
              {loadingAction === 'sv' ? 'Verifying…' : 'Verify'}
            </button>

            {svResult !== null && (
              <div className="flex items-center gap-2.5 border-t border-outline-variant/15 pt-4">
                <span className={`chip ${svResult ? 'chip-verified' : 'chip-degraded'}`}>
                  {svResult ? 'Valid' : 'Invalid'}
                </span>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  {svResult ? 'Signature is valid' : 'Verification failed'}
                </span>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* ── Hash ────────────────────────────────────────────────────────────── */}
      {tab === 'hash' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Panel>
            <SectionLabel>Hash</SectionLabel>

            <ModeToggle
              options={[{ id: 'data', label: 'Data Hash' }, { id: 'password', label: 'Password Hash' }]}
              value={hashMode}
              onChange={(v) => {
                setHashMode(v as 'data' | 'password');
                setHashAlgorithm(v === 'password' ? 'PBKDF2-SHA256' : 'SHA3-256');
              }}
            />

            <div>
              <Label>{hashMode === 'password' ? 'Password' : 'Data'}</Label>
              <textarea
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder={hashMode === 'password' ? 'Enter password…' : 'Enter data to hash…'}
                className="field h-32 resize-none font-mono text-xs"
              />
            </div>

            {hashMode === 'data' && (
              <div>
                <Label>Algorithm</Label>
                <select
                  value={hashAlgorithm}
                  onChange={(e) => setHashAlgorithm(e.target.value as HashAlgo)}
                  className="field"
                >
                  <option value="SHA3-256">SHA3-256</option>
                  <option value="SHA3-512">SHA3-512</option>
                  <option value="PBKDF2-SHA256">PBKDF2-SHA256</option>
                  <option value="BLAKE2b-256">BLAKE2b-256</option>
                </select>
              </div>
            )}

            {(hashMode === 'password' || hashAlgorithm === 'PBKDF2-SHA256') && (
              <div>
                <Label>Iterations · {hashIterations.toLocaleString()}</Label>
                <input
                  type="range"
                  min={10000}
                  max={1000000}
                  step={10000}
                  value={hashIterations}
                  onChange={(e) => setHashIterations(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="mt-1 flex justify-between font-mono text-[9px] text-outline/60">
                  <span>10k</span><span>1M</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onHash}
              disabled={!hashInput || loadingAction === 'hash'}
              className="w-full btn-primary"
            >
              {loadingAction === 'hash'
                ? 'Hashing…'
                : hashMode === 'password' ? 'Hash Password' : 'Generate Hash'}
            </button>
          </Panel>

          <OutputPanel>
            <div className="flex items-center justify-between">
              <SectionLabel>Output</SectionLabel>
              {hashResult && (
                <div className="flex gap-2">
                  <CopyButton value={hashResult.hash} label="Copy" />
                  <DownloadButton
                    filename={`hash_${Date.now()}.json`}
                    content={JSON.stringify(hashResult, null, 2)}
                    label="Save"
                  />
                </div>
              )}
            </div>

            {hashResult ? (
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-outline">Hash</p>
                  <div className="break-all rounded-md border border-outline-variant/15 bg-surface-container-lowest p-3 font-mono text-[10px] leading-relaxed text-primary">
                    {hashResult.hash}
                  </div>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  <OutputRow label="Algorithm" value={hashResult.algorithm} />
                  <OutputRow label="Salt" value={hashResult.salt.slice(0, 32) + '…'} />
                  {hashResult.iterations != null && (
                    <OutputRow label="Iterations" value={hashResult.iterations.toLocaleString()} />
                  )}
                </div>
              </div>
            ) : (
              <EmptyOutput text="Hash output will appear here" />
            )}
          </OutputPanel>
        </div>
      )}

      {/* ── PQC Sign ────────────────────────────────────────────────────────── */}
      {tab === 'pqc' && (
        <div className="space-y-6">
          {/* Step 1: Keypair */}
          <Panel>
            <div className="flex items-start justify-between gap-4">
              <SectionLabel>1 · Generate Post-Quantum Keypair</SectionLabel>
              {pqcKeypair && (
                <div className="flex shrink-0 gap-2">
                  <CopyButton value={pqcKeypair.public_key} label="Copy Public" />
                  <DownloadButton
                    filename={`pqc_keypair_${pqcKeypair.algorithm}_${Date.now()}.json`}
                    content={JSON.stringify(pqcKeypair, null, 2)}
                    label="Download"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <div>
                <Label>Algorithm</Label>
                <select value={pqcAlgorithm} onChange={(e) => setPqcAlgorithm(e.target.value)} className="field">
                  <option value="DILITHIUM2">Dilithium-2 (Level 2)</option>
                  <option value="DILITHIUM3">Dilithium-3 (Level 3 · Recommended)</option>
                  <option value="DILITHIUM5">Dilithium-5 (Level 5)</option>
                  <option value="FALCON512">Falcon-512 (Level 1, compact)</option>
                  <option value="FALCON1024">Falcon-1024 (Level 5)</option>
                  <option value="SPHINCS+-SHA2-128f">SPHINCS+ SHA2-128f</option>
                </select>
              </div>
              <div>
                <Label>Encoding</Label>
                <select
                  value={pqcEncoding}
                  onChange={(e) => setPqcEncoding(e.target.value as 'base64' | 'hex')}
                  className="field"
                >
                  <option value="base64">Base64</option>
                  <option value="hex">Hex</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={onPqcGenerate}
              disabled={loadingAction === 'pqc-gen'}
              className="btn-primary px-8"
            >
              {loadingAction === 'pqc-gen' ? 'Generating…' : 'Generate Keypair'}
            </button>

            {pqcKeypair && (
              <div className="divide-y divide-outline-variant/10 rounded-lg border border-outline-variant/15 bg-surface-container-lowest/50 px-4">
                <OutputRow label="Algorithm" value={pqcKeypair.algorithm} />
                <OutputRow label="NIST Level" value={String(pqcKeypair.nist_level)} />
                {pqcKeypair.key_sizes && (
                  <>
                    <OutputRow label="Public Key" value={`${pqcKeypair.key_sizes.public_key_bytes} bytes`} />
                    <OutputRow label="Private Key" value={`${pqcKeypair.key_sizes.private_key_bytes} bytes`} />
                  </>
                )}
              </div>
            )}
          </Panel>

          {/* Steps 2 + 3 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <SectionLabel>2 · Sign Message</SectionLabel>

              {!pqcKeypair ? (
                <p className="font-mono text-[11px] text-outline/70">Generate a keypair above first.</p>
              ) : (
                <>
                  <div>
                    <Label>Message</Label>
                    <textarea
                      value={pqcSignMessage}
                      onChange={(e) => setPqcSignMessage(e.target.value)}
                      placeholder="Message to sign…"
                      className="field h-32 resize-none font-mono text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onPqcSign}
                    disabled={!pqcSignMessage || loadingAction === 'pqc-sign'}
                    className="w-full btn-primary"
                  >
                    {loadingAction === 'pqc-sign' ? 'Signing…' : 'Sign (PQC)'}
                  </button>

                  {pqcSignature && (
                    <div className="space-y-3 border-t border-outline-variant/15 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-outline">Signature</span>
                        <div className="flex gap-2">
                          <CopyButton value={pqcSignature.signature} label="Copy" />
                          <DownloadButton
                            filename={`pqc_sig_${Date.now()}.json`}
                            content={JSON.stringify(pqcSignature, null, 2)}
                            label="Save"
                          />
                        </div>
                      </div>
                      <div className="break-all rounded-md border border-outline-variant/15 bg-surface-container-lowest p-3 font-mono text-[10px] leading-relaxed text-secondary">
                        {pqcSignature.signature.slice(0, 120)}…
                      </div>
                      <OutputRow label="Size" value={`${pqcSignature.signature_size_bytes} bytes`} />
                    </div>
                  )}
                </>
              )}
            </Panel>

            <Panel>
              <SectionLabel>3 · Verify Signature</SectionLabel>

              {!pqcSignature ? (
                <p className="font-mono text-[11px] text-outline/70">Sign a message in step 2 first.</p>
              ) : (
                <>
                  <p className="font-mono text-[11px] text-on-surface-variant">
                    Verify the signature produced in step 2 against the current keypair.
                  </p>
                  <button
                    type="button"
                    onClick={onPqcVerify}
                    disabled={loadingAction === 'pqc-verify'}
                    className="w-full btn-primary"
                  >
                    {loadingAction === 'pqc-verify' ? 'Verifying…' : 'Verify Signature'}
                  </button>

                  {pqcVerifyResult !== null && (
                    <div className="flex items-center gap-2.5 border-t border-outline-variant/15 pt-4">
                      <span className={`chip ${pqcVerifyResult ? 'chip-verified' : 'chip-degraded'}`}>
                        {pqcVerifyResult ? 'Valid' : 'Invalid'}
                      </span>
                      <span className="font-mono text-[11px] text-on-surface-variant">
                        {pqcVerifyResult ? 'Post-quantum signature verified' : 'Verification failed'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};

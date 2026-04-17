'use client';

import { useState, useCallback } from 'react';
import { encryptData, generatePQCKey, hashData, signPqc } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useBlockchain } from './BlockchainContext';
import { AnalystEvidencePanel, SectionLabel } from './AnalystEvidencePanel';

type Mode = 'encrypt' | 'hash' | 'sign';

const HASH_ALGORITHMS = ['SHA3-256', 'SHA3-512', 'BLAKE2b-256'] as const;
type HashAlg = (typeof HASH_ALGORITHMS)[number];

const PQC_SIGN_ALGS = ['DILITHIUM2', 'DILITHIUM3', 'DILITHIUM5', 'FALCON512', 'FALCON1024'] as const;
type SignAlg = (typeof PQC_SIGN_ALGS)[number];

export function ProtectVault() {
  const { wallet } = useBlockchain();

  const [mode, setMode] = useState<Mode>('encrypt');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Encrypt state
  const [encryptResult, setEncryptResult] = useState<{
    ciphertext: string; key: string; iv: string; tag: string;
  } | null>(null);

  // Hash state
  const [hashAlg, setHashAlg] = useState<HashAlg>('SHA3-256');
  const [hashResult, setHashResult] = useState<{ hash: string; algorithm: string } | null>(null);

  // Sign state
  const [signAlg, setSignAlg] = useState<SignAlg>('DILITHIUM3');
  const [signResult, setSignResult] = useState<{
    signature: string; public_key: string; private_key: string;
  } | null>(null);

  const run = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === 'encrypt') {
        const res = await encryptData(input, true, 'AES-256-GCM');
        if (res.data) {
          setEncryptResult({
            ciphertext: res.data.ciphertext,
            key: res.data.key,
            iv: res.data.iv,
            tag: res.data.tag,
          });
        }
      } else if (mode === 'hash') {
        const res = await hashData({ data: input, algorithm: hashAlg, use_quantum_salt: true });
        if (res.data) setHashResult({ hash: res.data.hash, algorithm: res.data.algorithm });
      } else {
        // Generate PQC keypair, then sign
        const kpRes = await generatePQCKey(signAlg, 'base64');
        if (!kpRes.data) throw new Error('Key generation failed');
        const { public_key, private_key } = kpRes.data;
        const sigRes = await signPqc({ message: input, private_key, algorithm: signAlg, encoding: 'base64' });
        if (!sigRes.data) throw new Error('Signing failed');
        setSignResult({ signature: sigRes.data.signature, public_key, private_key });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [mode, input, hashAlg, signAlg]);

  const modes: { id: Mode; label: string }[] = [
    { id: 'encrypt', label: 'Encrypt' },
    { id: 'hash', label: 'Hash' },
    { id: 'sign', label: 'PQC Sign' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Data Protection Vault</h2>
        <p className="text-sm text-slate-400 mt-1">
          Quantum-safe encryption, hashing, and post-quantum signatures for blockchain data.
          {wallet && (
            <span className="ml-2 text-indigo-400">
              Signed by {wallet.address.slice(0, 8)}…
            </span>
          )}
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 border-b border-slate-700/50">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setError(null); }}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2',
              mode === m.id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Options */}
      {mode === 'hash' && (
        <div className="flex gap-2 flex-wrap">
          <SectionLabel className="self-center mb-0 mr-1">Algorithm</SectionLabel>
          {HASH_ALGORITHMS.map((a) => (
            <button
              key={a}
              onClick={() => setHashAlg(a)}
              className={cn(
                'px-2.5 py-1 rounded text-xs border transition-colors',
                hashAlg === a
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-400',
              )}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {mode === 'sign' && (
        <div className="flex gap-2 flex-wrap">
          <SectionLabel className="self-center mb-0 mr-1">Signature Scheme</SectionLabel>
          {PQC_SIGN_ALGS.map((a) => (
            <button
              key={a}
              onClick={() => setSignAlg(a)}
              className={cn(
                'px-2.5 py-1 rounded text-xs border transition-colors',
                signAlg === a
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-400',
              )}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="space-y-2">
        <SectionLabel>Payload</SectionLabel>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder="Enter data to protect…"
          className="w-full rounded border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      <button
        onClick={run}
        disabled={loading || !input.trim()}
        className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {loading ? 'Processing…' : mode === 'encrypt' ? 'Encrypt' : mode === 'hash' ? 'Hash' : 'Sign'}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Results */}
      {mode === 'encrypt' && encryptResult && (
        <AnalystEvidencePanel
          title="Encrypted Output"
          fields={[
            { label: 'Ciphertext', value: encryptResult.ciphertext, downloadFilename: 'ciphertext.b64' },
            { label: 'Encryption Key (AES-256)', value: encryptResult.key, downloadFilename: 'key.b64' },
            { label: 'IV', value: encryptResult.iv },
            { label: 'Auth Tag', value: encryptResult.tag },
          ]}
        />
      )}

      {mode === 'hash' && hashResult && (
        <AnalystEvidencePanel
          title="Hash Output"
          fields={[
            { label: `${hashResult.algorithm} Hash`, value: hashResult.hash, downloadFilename: 'hash.txt' },
          ]}
        />
      )}

      {mode === 'sign' && signResult && (
        <AnalystEvidencePanel
          title="PQC Signature"
          fields={[
            { label: 'Signature', value: signResult.signature, downloadFilename: 'signature.b64' },
            { label: 'Public Key', value: signResult.public_key, downloadFilename: 'pubkey.b64' },
            { label: 'Private Key (keep secret)', value: signResult.private_key, downloadFilename: 'privkey.b64' },
          ]}
        />
      )}
    </div>
  );
}

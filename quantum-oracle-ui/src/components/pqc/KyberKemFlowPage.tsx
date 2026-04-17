'use client';

import { useState, useCallback } from 'react';
import { kemDecapsulate, kemEncapsulate, kemGenerate } from '@/utils/api';
import type { KemDecapsulateResponse, KemEncapsulateResponse, KemKeypairResponse } from '@/types';
import { cn } from '@/lib/utils';

type KyberAlg = 'KYBER512' | 'KYBER768' | 'KYBER1024';
type Encoding = 'base64' | 'hex';

const ALGS: KyberAlg[] = ['KYBER512', 'KYBER768', 'KYBER1024'];

const NIST_LEVELS: Record<KyberAlg, number> = {
  KYBER512: 1,
  KYBER768: 3,
  KYBER1024: 5,
};

export function KyberKemFlowPage() {
  const [alg, setAlg] = useState<KyberAlg>('KYBER768');
  const [encoding, setEncoding] = useState<Encoding>('base64');
  const [loading, setLoading] = useState<'idle' | 'keygen' | 'encap' | 'decap'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [keypair, setKeypair] = useState<KemKeypairResponse | null>(null);
  const [encapResult, setEncapResult] = useState<KemEncapsulateResponse | null>(null);
  const [decapResult, setDecapResult] = useState<KemDecapsulateResponse | null>(null);

  const genKeypair = useCallback(async () => {
    setLoading('keygen');
    setError(null);
    setEncapResult(null);
    setDecapResult(null);
    try {
      const res = await kemGenerate(alg, encoding);
      if (!res.data) throw new Error('Key generation failed');
      setKeypair(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Key generation error');
    } finally {
      setLoading('idle');
    }
  }, [alg, encoding]);

  const encapsulate = useCallback(async () => {
    if (!keypair) return;
    setLoading('encap');
    setError(null);
    setDecapResult(null);
    try {
      const res = await kemEncapsulate({ public_key: keypair.public_key, algorithm: alg, encoding });
      if (!res.data) throw new Error('Encapsulation failed');
      setEncapResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encapsulation error');
    } finally {
      setLoading('idle');
    }
  }, [keypair, alg, encoding]);

  const decapsulate = useCallback(async () => {
    if (!keypair || !encapResult) return;
    setLoading('decap');
    setError(null);
    try {
      const res = await kemDecapsulate({
        ciphertext: encapResult.ciphertext,
        private_key: keypair.private_key,
        algorithm: alg,
        encoding,
      });
      if (!res.data) throw new Error('Decapsulation failed');
      setDecapResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decapsulation error');
    } finally {
      setLoading('idle');
    }
  }, [keypair, encapResult, alg, encoding]);

  const field = (label: string, value: string, filename?: string) => (
    <div key={label} className="space-y-1">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="flex items-start gap-2">
        <code className="flex-1 text-xs font-mono text-slate-200 break-all bg-slate-800/60 rounded px-2 py-1.5 leading-relaxed">
          {value}
        </code>
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="btn-ghost text-xs shrink-0"
        >
          Copy
        </button>
        {filename && (
          <button
            onClick={() => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([value], { type: 'text/plain' }));
              a.download = filename;
              a.click();
            }}
            className="btn-ghost text-xs shrink-0"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );

  const secretsMatch =
    decapResult && encapResult
      ? decapResult.shared_secret === encapResult.shared_secret
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Kyber KEM Flow</h2>
        <p className="text-sm text-slate-400 mt-1">
          Post-quantum Key Encapsulation Mechanism — NIST-standardised CRYSTALS-Kyber.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-1">
          {ALGS.map((a) => (
            <button
              key={a}
              onClick={() => { setAlg(a); setKeypair(null); setEncapResult(null); setDecapResult(null); }}
              disabled={loading !== 'idle'}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium border transition-colors',
                alg === a
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-400',
              )}
            >
              {a}
              <span className="ml-1 text-[10px] text-slate-500">L{NIST_LEVELS[a]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['base64', 'hex'] as Encoding[]).map((e) => (
            <button
              key={e}
              onClick={() => setEncoding(e)}
              disabled={loading !== 'idle'}
              className={cn(
                'px-2.5 py-1 rounded text-xs border transition-colors',
                encoding === e
                  ? 'border-slate-400 text-white'
                  : 'border-slate-700 text-slate-500 hover:border-slate-500',
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Step buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={genKeypair}
          disabled={loading !== 'idle'}
          className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {loading === 'keygen' ? 'Generating…' : '1 · Generate Keypair'}
        </button>
        <button
          onClick={encapsulate}
          disabled={loading !== 'idle' || !keypair}
          className="px-4 py-2 rounded bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {loading === 'encap' ? 'Encapsulating…' : '2 · Encapsulate'}
        </button>
        <button
          onClick={decapsulate}
          disabled={loading !== 'idle' || !encapResult}
          className="px-4 py-2 rounded bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {loading === 'decap' ? 'Decapsulating…' : '3 · Decapsulate'}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Results */}
      {keypair && (
        <div className="space-y-3 rounded-lg border border-slate-700/40 bg-slate-900/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Keypair — {alg} (NIST Level {keypair.nist_level})
          </div>
          {field('Public Key', keypair.public_key, 'kem_pub.b64')}
          {field('Private Key', keypair.private_key, 'kem_priv.b64')}
          <div className="flex gap-4 text-xs text-slate-500">
            <span>Pub: {keypair.key_sizes.public_key_bytes} B</span>
            <span>Priv: {keypair.key_sizes.private_key_bytes} B</span>
          </div>
        </div>
      )}

      {encapResult && (
        <div className="space-y-3 rounded-lg border border-slate-700/40 bg-slate-900/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Encapsulation Output
          </div>
          {field('Ciphertext (send to recipient)', encapResult.ciphertext, 'kem_ct.b64')}
          {field('Shared Secret (sender copy — keep private)', encapResult.shared_secret)}
        </div>
      )}

      {decapResult && (
        <div className="space-y-3 rounded-lg border border-slate-700/40 bg-slate-900/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Decapsulation Output
          </div>
          {field('Recovered Shared Secret', decapResult.shared_secret)}
          {secretsMatch !== null && (
            <p
              className={cn(
                'text-sm font-semibold',
                secretsMatch ? 'text-green-400' : 'text-red-400',
              )}
            >
              {secretsMatch
                ? '✓ Shared secrets match — key exchange successful'
                : '✗ Secrets do not match — check keys/encoding'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

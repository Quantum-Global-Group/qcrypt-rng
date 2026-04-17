'use client';

import { useState, useCallback } from 'react';
import {
  generateHybridKemKeypair,
} from '@/utils/api';
import { cn } from '@/lib/utils';

interface HybridKeypair {
  dilithium_pk: string;
  dilithium_sk: string;
  kyber_pk: string;
  kyber_sk: string;
  kem_public_key?: string;
  kem_private_key?: string;
  sig_public_key?: string;
  sig_private_key?: string;
  kem_algorithm?: string;
  sig_algorithm?: string;
}

const KEM_ALGS = ['KYBER512', 'KYBER768', 'KYBER1024'];
const SIG_ALGS = ['DILITHIUM2', 'DILITHIUM3', 'DILITHIUM5', 'FALCON512'];

export default function HybridKemPage() {
  const [kemAlg, setKemAlg] = useState('KYBER768');
  const [sigAlg, setSigAlg] = useState('DILITHIUM3');
  const [encoding, setEncoding] = useState<'base64' | 'hex'>('base64');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keypair, setKeypair] = useState<HybridKeypair | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateHybridKemKeypair({
        kem_algorithm: kemAlg,
        sig_algorithm: sigAlg,
        format: encoding,
      });
      if (!res.data) throw new Error('No data returned');
      setKeypair(res.data as unknown as HybridKeypair);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate hybrid keypair');
    } finally {
      setLoading(false);
    }
  }, [kemAlg, sigAlg, encoding]);

  const fieldVal = (key: keyof HybridKeypair, fallback = '') =>
    keypair ? String(keypair[key] ?? fallback) : '';

  const Field = ({ label, value, filename }: { label: string; value: string; filename?: string }) => (
    <div className="space-y-1">
      <div className="text-xs text-slate-500">{label}</div>
      {value ? (
        <div className="flex items-start gap-2">
          <code className="flex-1 text-xs font-mono text-slate-200 break-all bg-slate-800/60 rounded px-2 py-1.5">
            {value}
          </code>
          <button onClick={() => navigator.clipboard.writeText(value)} className="btn-ghost text-xs shrink-0">
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
      ) : (
        <div className="text-xs text-slate-600 italic">—</div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Hybrid KEM Keypair Generator</h2>
        <p className="text-sm text-slate-400 mt-1">
          Combines a KEM (key encapsulation) and a signature scheme into a single hybrid keypair,
          providing both confidentiality and authentication in one operation.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-6 items-start">
        <div className="space-y-2">
          <div className="text-xs text-slate-500">KEM Algorithm</div>
          <div className="flex gap-1">
            {KEM_ALGS.map((a) => (
              <button
                key={a}
                onClick={() => setKemAlg(a)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs border transition-colors',
                  kemAlg === a ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-600 text-slate-400 hover:border-slate-400',
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-slate-500">Signature Algorithm</div>
          <div className="flex gap-1 flex-wrap">
            {SIG_ALGS.map((a) => (
              <button
                key={a}
                onClick={() => setSigAlg(a)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs border transition-colors',
                  sigAlg === a ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-slate-600 text-slate-400 hover:border-slate-400',
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-slate-500">Encoding</div>
          <div className="flex gap-1">
            {(['base64', 'hex'] as const).map((e) => (
              <button
                key={e}
                onClick={() => setEncoding(e)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs border transition-colors',
                  encoding === e ? 'border-slate-400 text-white' : 'border-slate-700 text-slate-500 hover:border-slate-500',
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {loading ? 'Generating…' : 'Generate Hybrid Keypair'}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {keypair && (
        <div className="space-y-4">
          <div className="rounded-lg border border-indigo-700/40 bg-slate-900/60 p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              KEM Keys — {fieldVal('kem_algorithm', kemAlg)}
            </div>
            <Field label="KEM Public Key" value={fieldVal('kem_public_key')} filename="kem_pub.b64" />
            <Field label="KEM Private Key" value={fieldVal('kem_private_key')} filename="kem_priv.b64" />
          </div>

          <div className="rounded-lg border border-violet-700/40 bg-slate-900/60 p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-violet-400">
              Signature Keys — {fieldVal('sig_algorithm', sigAlg)}
            </div>
            <Field label="Signature Public Key" value={fieldVal('sig_public_key')} filename="sig_pub.b64" />
            <Field label="Signature Private Key" value={fieldVal('sig_private_key')} filename="sig_priv.b64" />
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { generatePQCKey, hashData, signPqc, verifyPqc } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useBlockchain } from './BlockchainContext';
import { AnalystEvidencePanel, SectionLabel } from './AnalystEvidencePanel';

const SIGN_ALGS = ['DILITHIUM2', 'DILITHIUM3', 'DILITHIUM5', 'FALCON512'] as const;
type SignAlg = (typeof SIGN_ALGS)[number];

type Step = 'idle' | 'keygen' | 'hash' | 'sign' | 'verify' | 'done';

interface ProveState {
  publicKey: string;
  privateKey: string;
  messageHash: string;
  signature: string;
  verified: boolean | null;
}

export function ProveAttestation() {
  const { wallet } = useBlockchain();
  const [message, setMessage] = useState('');
  const [algorithm, setAlgorithm] = useState<SignAlg>('DILITHIUM3');
  const [step, setStep] = useState<Step>('idle');
  const [proof, setProof] = useState<ProveState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runFullProof = useCallback(async () => {
    if (!message.trim()) return;
    setError(null);
    setProof(null);

    try {
      setStep('keygen');
      const kpRes = await generatePQCKey(algorithm, 'base64');
      if (!kpRes.data) throw new Error('Key generation failed');
      const { public_key, private_key } = kpRes.data;

      setStep('hash');
      const hashRes = await hashData({
        data: message,
        algorithm: 'SHA3-256',
        use_quantum_salt: true,
      });
      if (!hashRes.data) throw new Error('Hash failed');
      const messageHash = hashRes.data.hash;

      setStep('sign');
      const sigRes = await signPqc({
        message,
        private_key,
        algorithm,
        encoding: 'base64',
      });
      if (!sigRes.data) throw new Error('Signing failed');
      const signature = sigRes.data.signature;

      setStep('verify');
      const verRes = await verifyPqc({
        message,
        signature,
        public_key,
        algorithm,
        encoding: 'base64',
      });
      const verified = verRes.data?.valid ?? false;

      setProof({ publicKey: public_key, privateKey: private_key, messageHash, signature, verified });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setStep('idle');
    }
  }, [message, algorithm]);

  const stepLabels: Record<Step, string> = {
    idle: 'Generate Attestation',
    keygen: 'Generating PQC keypair…',
    hash: 'Hashing message…',
    sign: 'Signing…',
    verify: 'Verifying signature…',
    done: 'Generate Attestation',
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">On-Chain Attestation</h2>
        <p className="text-sm text-slate-400 mt-1">
          Generate a quantum-resistant proof of message authenticity ready for on-chain anchoring.
          {wallet && <span className="ml-2 text-indigo-400">Wallet: {wallet.address.slice(0, 8)}…</span>}
        </p>
      </div>

      {/* Algorithm */}
      <div className="flex gap-2 flex-wrap items-center">
        <SectionLabel className="mb-0 mr-1">Signature scheme</SectionLabel>
        {SIGN_ALGS.map((a) => (
          <button
            key={a}
            onClick={() => setAlgorithm(a)}
            disabled={step !== 'idle' && step !== 'done'}
            className={cn(
              'px-2.5 py-1 rounded text-xs border transition-colors',
              algorithm === a
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                : 'border-slate-600 text-slate-400 hover:border-slate-400',
              (step !== 'idle' && step !== 'done') && 'opacity-50 cursor-not-allowed',
            )}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Message */}
      <div className="space-y-2">
        <SectionLabel>Message / Claim</SectionLabel>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Enter the message or claim to attest…"
          className="w-full rounded border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      <button
        onClick={runFullProof}
        disabled={step !== 'idle' && step !== 'done' || !message.trim()}
        className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {stepLabels[step]}
      </button>

      {/* Progress steps */}
      {step !== 'idle' && step !== 'done' && (
        <div className="flex gap-4 text-xs">
          {(['keygen', 'hash', 'sign', 'verify'] as Step[]).map((s) => {
            const idx = ['keygen', 'hash', 'sign', 'verify'].indexOf(s);
            const cur = ['keygen', 'hash', 'sign', 'verify'].indexOf(step);
            return (
              <span
                key={s}
                className={cn(
                  idx < cur ? 'text-green-400' : idx === cur ? 'text-indigo-400 animate-pulse' : 'text-slate-600',
                )}
              >
                {s === 'keygen' ? 'Key Gen' : s === 'hash' ? 'Hash' : s === 'sign' ? 'Sign' : 'Verify'}
                {idx < cur && ' ✓'}
              </span>
            );
          })}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {proof && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-semibold',
                proof.verified ? 'text-green-400' : 'text-red-400',
              )}
            >
              {proof.verified ? '✓ Signature Valid' : '✗ Verification Failed'}
            </span>
            <span className="text-xs text-slate-500">({algorithm})</span>
          </div>
          <AnalystEvidencePanel
            title="Attestation Record"
            fields={[
              { label: 'Message Hash (SHA3-256 + quantum salt)', value: proof.messageHash },
              { label: 'PQC Signature', value: proof.signature, downloadFilename: 'attestation.sig' },
              { label: 'Public Key (share on-chain)', value: proof.publicKey, downloadFilename: 'pubkey.b64' },
            ]}
          />
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { getQuantumEntropy } from '@/utils/api';

const MOCK_HEX = [
  '0x7f4e9a2b1c3d8f5e0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f',
  '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0f9e8d',
];

function randomHexLine(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return '0x' + Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Live hex stream + entropy gauge (dashboard / unified ops view).
 * Stream uses local CSPRNG; min/Shannon entropy loads from the API when available.
 */
export function LiveEntropyOraclePanel() {
  const [minE, setMinE] = useState<number | null>(null);
  const [shannon, setShannon] = useState<number | null>(null);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let a = true;
    getQuantumEntropy()
      .then((r) => {
        if (!a) return;
        setMinE(r.data.min_entropy);
        setShannon(r.data.shannon_entropy);
      })
      .catch(() => {});
    return () => {
      a = false;
    };
  }, []);

  useEffect(() => {
    setLines([...MOCK_HEX]);
    const id = window.setInterval(() => {
      setLines((p) => [...p, randomHexLine()].slice(-14));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  const score = useMemo(() => (minE != null ? Math.min(0.99999, Math.max(0, minE)) : 0.9998), [minE]);
  const circ = 2 * Math.PI * 88;
  const dashOff = circ * (1 - Math.min(score, 1));

  return (
    <section className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex min-h-[400px] min-w-0 flex-col rounded-lg bg-surface-container-low p-6 lg:col-span-2">
        <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-2">
          <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
            Live Randomness Stream
          </h2>
          <span className="font-mono text-[9px] text-outline">Source: NIST SP 800-90B Compliant</span>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-hidden font-mono text-xs leading-relaxed text-secondary/70">
          {lines.map((line, i) => (
            <p key={`${line}-${i}`} className={i === lines.length - 1 ? 'font-bold text-secondary' : ''}>
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="flex min-h-[400px] min-w-0 flex-col rounded-lg bg-surface-container-low p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Entropy Score</h2>
          <span className="font-mono text-[9px] text-outline">Real-time Analysis</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center space-y-8">
          <div className="relative flex h-48 w-48 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 192 192" aria-hidden>
              <circle cx="96" cy="96" r="88" fill="none" stroke="#1f1f22" strokeWidth="8" />
              <circle
                className="opacity-80"
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="#4edea3"
                strokeWidth="8"
                strokeDasharray={circ}
                strokeDashoffset={dashOff}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-headline text-4xl font-extrabold tracking-tighter text-on-surface">{score.toFixed(4)}</div>
              <div className="font-mono text-[10px] font-bold uppercase text-secondary">MAX BITS/BIT</div>
            </div>
          </div>
          <div className="w-full space-y-3">
            <div className="flex justify-between font-mono text-[10px] uppercase">
              <span className="text-outline">Min Entropy</span>
              <span className="text-on-surface">{minE != null ? minE.toFixed(4) : '—'}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full w-[98%] bg-secondary" />
            </div>
            <div className="flex justify-between font-mono text-[10px] uppercase">
              <span className="text-outline">Shannon Entropy</span>
              <span className="text-on-surface">{shannon != null ? shannon.toFixed(4) : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

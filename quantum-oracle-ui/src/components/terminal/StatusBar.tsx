'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { checkHealth, getQuantumEntropy } from '@/utils/api';

/**
 * Sticky bottom status bar — live metrics for the analyst / hacker audience.
 * Shows API health, latency, entropy, pool size, block hash (session-unique),
 * session id, and a live wall clock.
 */
export const StatusBar = () => {
  const [health, setHealth] = useState<'loading' | 'online' | 'offline'>('loading');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [shannon, setShannon] = useState<number | null>(null);
  const [poolSize, setPoolSize] = useState<number | null>(null);
  const [healthLabel, setHealthLabel] = useState<string>('—');
  const [now, setNow] = useState<string>('');
  const [blockTag, setBlockTag] = useState<string>('');

  // Stable per-instance id. useId() is deterministic & lint-clean; we hash
  // it down to 8 hex chars so it looks like a session digest.
  const rawId = useId();
  const sessionId = useMemo(() => {
    let h = 2166136261 >>> 0; // FNV-1a basis
    for (let i = 0; i < rawId.length; i++) {
      h ^= rawId.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }, [rawId]);

  // Wall clock tick
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = d.getUTCHours().toString().padStart(2, '0');
      const mm = d.getUTCMinutes().toString().padStart(2, '0');
      const ss = d.getUTCSeconds().toString().padStart(2, '0');
      setNow(`${hh}:${mm}:${ss}Z`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Simulated block tag — non-authoritative but visually appropriate.
  useEffect(() => {
    const refresh = () => {
      const bytes = new Uint8Array(5);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < 5; i++) bytes[i] = Math.floor(Math.random() * 256);
      }
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      setBlockTag(`0x${hex}`);
    };
    refresh();
    const id = setInterval(refresh, 12_000);
    return () => clearInterval(id);
  }, []);

  // Health + latency poll
  useEffect(() => {
    let mounted = true;
    const ping = async () => {
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      try {
        await checkHealth();
        if (!mounted) return;
        const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        setLatencyMs(Math.max(1, Math.round(t1 - t0)));
        setHealth('online');
      } catch {
        if (!mounted) return;
        setHealth('offline');
        setLatencyMs(null);
      }
    };
    ping();
    const id = setInterval(ping, 8_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // Entropy probe — optional, don't break if endpoint errors
  useEffect(() => {
    let mounted = true;
    const probe = async () => {
      try {
        const res = await getQuantumEntropy();
        if (!mounted) return;
        setShannon(res.data.shannon_entropy ?? null);
        setPoolSize(res.data.pool_size ?? null);
        setHealthLabel(res.data.health_status ?? '—');
      } catch {
        /* silent */
      }
    };
    probe();
    const id = setInterval(probe, 15_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const healthTone =
    health === 'online' ? 'chip-green' : health === 'offline' ? 'chip-red' : 'chip';
  const latencyTone =
    latencyMs == null ? 'chip' : latencyMs < 150 ? 'chip-green' : latencyMs < 500 ? 'chip-amber' : 'chip-red';
  const entropyTone =
    shannon == null ? 'chip' : shannon >= 7.5 ? 'chip-green' : shannon >= 7.0 ? 'chip-amber' : 'chip-red';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-sunken))]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-hide text-[11px]">
        <span className={healthTone}>
          <span className={health === 'online' ? 'pulse' : ''}>●</span>
          {health === 'online' ? 'API ONLINE' : health === 'offline' ? 'API OFFLINE' : 'API …'}
        </span>
        <span className={latencyTone}>
          rtt {latencyMs == null ? '—' : `${latencyMs}ms`}
        </span>
        <span className={entropyTone}>
          H {shannon == null ? '—' : shannon.toFixed(3)} bits/byte
        </span>
        <span className="chip">
          pool {poolSize == null ? '—' : poolSize.toLocaleString()} B
        </span>
        <span className="chip">
          {healthLabel}
        </span>
        <span className="flex-1" />
        <span className="chip chip-cyan" title="session-unique block tag">
          blk <span className="font-mono">{blockTag}</span>
        </span>
        <span className="chip" title="session id">
          sid <span className="font-mono">{sessionId}</span>
        </span>
        <span className="chip">
          utc <span className="font-mono">{now}</span>
        </span>
      </div>
    </div>
  );
};

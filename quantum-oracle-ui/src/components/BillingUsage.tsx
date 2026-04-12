'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBillingUsage } from '@/utils/api';
import type { BillingUsageResponse } from '@/types';

const STORAGE_KEY = 'qcrypt_api_key';

function fmtNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function fmtReset(resetTime: string | null): string {
  if (!resetTime) return '—';
  const date = new Date(resetTime);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function BillingUsage() {
  const [apiKey, setApiKey] = useState('');
  const [data, setData] = useState<BillingUsageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) ?? process.env.NEXT_PUBLIC_QCRYPT_API_KEY ?? '';
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    if (apiKey.trim()) {
      window.localStorage.setItem(STORAGE_KEY, apiKey.trim());
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [apiKey]);

  const loadUsage = useCallback(async () => {
    if (!apiKey.trim()) {
      setError('Paste an API key to load billing usage.');
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getBillingUsage(apiKey.trim());
      setData(response);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Failed to load billing usage');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey.trim()) {
      void loadUsage();
    }
  }, [apiKey, loadUsage]);

  const requestPct = useMemo(() => {
    if (!data || data.limits.max_requests <= 0) return 0;
    return Math.min(100, (data.usage.requests_used / data.limits.max_requests) * 100);
  }, [data]);

  const bytesPct = useMemo(() => {
    if (!data || data.limits.max_bytes <= 0) return 0;
    return Math.min(100, (data.usage.bytes_used / data.limits.max_bytes) * 100);
  }, [data]);

  return (
    <div className="w-full space-y-6 rounded-lg bg-surface-container-low p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-lg font-semibold text-on-surface">Billing & Usage</h2>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
            Load rate-limit and usage details for a specific API key. The key is stored locally in this browser only.
          </p>
        </div>
        {data && (
          <div className="rounded border border-outline-variant/20 bg-surface px-3 py-2 font-mono text-xs uppercase tracking-wide text-outline">
            Tier: <span className="text-secondary">{data.tier}</span>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-2 block font-label text-[11px] font-bold uppercase tracking-[0.1em] text-outline">
            API key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="qcrng_..."
            className="w-full rounded border border-outline-variant/20 bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => void loadUsage()}
          disabled={loading}
          className="rounded bg-primary-container px-4 py-2.5 text-sm font-semibold text-on-primary-container transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="rounded border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}

      {data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-outline-variant/20 bg-surface p-4">
            <div className="mb-3 font-label text-[11px] font-bold uppercase tracking-[0.1em] text-outline">
              Requests
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold text-on-surface">{fmtNumber(data.usage.requests_used)}</div>
                <div className="text-sm text-on-surface-variant">
                  of {fmtNumber(data.limits.max_requests)} allowed this window
                </div>
              </div>
              <div className="font-mono text-xs text-outline">{requestPct.toFixed(1)}%</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full bg-secondary" style={{ width: `${requestPct}%` }} />
            </div>
          </div>

          <div className="rounded border border-outline-variant/20 bg-surface p-4">
            <div className="mb-3 font-label text-[11px] font-bold uppercase tracking-[0.1em] text-outline">
              Bytes
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold text-on-surface">{fmtNumber(data.usage.bytes_used)}</div>
                <div className="text-sm text-on-surface-variant">
                  of {fmtNumber(data.limits.max_bytes)} bytes allowed this window
                </div>
              </div>
              <div className="font-mono text-xs text-outline">{bytesPct.toFixed(1)}%</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full bg-primary" style={{ width: `${bytesPct}%` }} />
            </div>
          </div>

          <div className="rounded border border-outline-variant/20 bg-surface p-4 md:col-span-2">
            <div className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-outline">
              Reset time
            </div>
            <div className="mt-2 font-mono text-sm text-on-surface">{fmtReset(data.usage.reset_time)}</div>
          </div>
        </div>
      ) : (
        <div className="rounded border border-outline-variant/20 bg-surface px-4 py-6 text-sm text-on-surface-variant">
          Enter an API key to view current tier limits and usage for that key.
        </div>
      )}
    </div>
  );
}

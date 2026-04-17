'use client';

import { useMemo, useState } from 'react';
import { CopyButton } from '@/components/ui';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Collapsible raw JSON / curl viewer to attach below any result card.
 * Analysts love to copy-paste, so: toggle JSON <-> curl, copy either.
 */
export const RawView = ({
  data,
  endpoint,
  method = 'POST',
  body,
  title = 'raw response',
}: {
  data: unknown;
  endpoint?: string;
  method?: Method;
  body?: unknown;
  title?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'json' | 'curl'>('json');

  const json = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  const curl = useMemo(() => {
    if (!endpoint) return null;
    const hasBody = body !== undefined && method !== 'GET';
    const parts = [
      `curl -X ${method} "${endpoint}"`,
      `  -H "Content-Type: application/json"`,
    ];
    if (hasBody) {
      parts.push(`  -d '${JSON.stringify(body)}'`);
    }
    return parts.join(' \\\n');
  }, [endpoint, method, body]);

  const active = mode === 'json' ? json : curl ?? json;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] tracking-[0.12em] uppercase text-[rgb(var(--fg-dim))] hover:text-[rgb(var(--green))] transition-colors font-mono"
      >
        {open ? '▾' : '▸'} {title}
      </button>
      {open && (
        <div className="mt-2 border border-[rgb(var(--border))] rounded-[3px] bg-[rgb(var(--bg-sunken))]">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[rgb(var(--border))]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode('json')}
                className={`text-[10px] px-2 py-0.5 rounded-[2px] font-mono tracking-wider uppercase transition-colors ${
                  mode === 'json'
                    ? 'text-[rgb(var(--green))] bg-[rgba(0,255,156,0.08)]'
                    : 'text-[rgb(var(--fg-dim))] hover:text-[rgb(var(--fg))]'
                }`}
              >
                json
              </button>
              {curl && (
                <button
                  onClick={() => setMode('curl')}
                  className={`text-[10px] px-2 py-0.5 rounded-[2px] font-mono tracking-wider uppercase transition-colors ${
                    mode === 'curl'
                      ? 'text-[rgb(var(--green))] bg-[rgba(0,255,156,0.08)]'
                      : 'text-[rgb(var(--fg-dim))] hover:text-[rgb(var(--fg))]'
                  }`}
                >
                  curl
                </button>
              )}
            </div>
            <CopyButton value={active} label="copy" />
          </div>
          <pre className="p-3 text-[12px] leading-relaxed overflow-x-auto text-[rgb(var(--fg))] font-mono whitespace-pre">
            <code>{active}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

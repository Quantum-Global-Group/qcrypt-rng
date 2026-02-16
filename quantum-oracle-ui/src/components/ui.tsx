'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/* ── Copy button with brief "Copied" feedback ─────────────────────── */
export const CopyButton = ({
  value,
  label = 'Copy',
}: {
  value: string;
  label?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [value]);
  return (
    <button onClick={handleCopy} className="btn-ghost whitespace-nowrap shrink-0">
      {copied ? 'Copied' : label}
    </button>
  );
};

/* ── Monospaced value display with inline copy ────────────────────── */
export const MonoValue = ({
  label,
  value,
  truncate,
}: {
  label?: string;
  value: string;
  truncate?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const long = truncate && value.length > truncate;
  const display = long && !expanded ? value.slice(0, truncate) + '...' : value;

  return (
    <div className="space-y-1.5">
      {label && <div className="text-sm text-slate-400">{label}</div>}
      <div className="code-block flex items-start gap-3">
        <code
          className="flex-1 text-sm font-mono text-slate-200 break-all leading-relaxed select-all whitespace-pre-wrap"
          onClick={() => long && setExpanded((p) => !p)}
        >
          {display}
        </code>
        <CopyButton value={value} />
      </div>
    </div>
  );
};

/* ── Key-value row ────────────────────────────────────────────────── */
export const KVRow = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) => (
  <div className="flex items-baseline justify-between gap-4 py-2 border-b border-slate-700/25 last:border-0">
    <span className="text-sm text-slate-400 shrink-0">{label}</span>
    <span
      className={`text-base text-right ${mono ? 'font-mono text-slate-200 break-all' : 'text-slate-100'}`}
    >
      {value ?? '-'}
    </span>
  </div>
);

/* ── Renders arbitrary object as structured key-value rows ────────── */
export const DataRows = ({ data }: { data: Record<string, unknown> }) => {
  const fmt = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div>
      {Object.entries(data).map(([key, val]) => {
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          return (
            <div key={key} className="py-2">
              <div className="text-sm text-slate-400 font-medium mb-1">
                {fmt(key)}
              </div>
              <div className="pl-3 border-l border-slate-700/30">
                <DataRows data={val as Record<string, unknown>} />
              </div>
            </div>
          );
        }
        const display =
          val === null || val === undefined
            ? '-'
            : Array.isArray(val)
              ? val.join(', ')
              : typeof val === 'boolean'
                ? val
                  ? 'Yes'
                  : 'No'
                : String(val);
        return (
          <KVRow
            key={key}
            label={fmt(key)}
            value={display}
            mono={typeof val === 'string' && val.length > 24}
          />
        );
      })}
    </div>
  );
};

/* ── Status / risk badge ──────────────────────────────────────────── */
export const Badge = ({ label }: { label: string }) => {
  const u = (label ?? '').toUpperCase();
  const cls =
    u.includes('HIGH') ||
    u.includes('CRITICAL') ||
    u.includes('VULNERABLE')
      ? 'status-critical'
      : u.includes('WARN') || u.includes('MEDIUM')
        ? 'status-warn'
        : u.includes('SECURE') ||
            u.includes('SAFE') ||
            u.includes('OK') ||
            u.includes('ACTIVE') ||
            u.includes('HEALTHY') ||
            u.includes('VALID') ||
            u.includes('VERIFIED') ||
            u.includes('ENABLED')
          ? 'status-ok'
          : 'status-neutral';
  return <span className={cls}>{label}</span>;
};

/* ── Info popover (click to open) ─────────────────────────────────── */
export const InfoPopover = ({
  title,
  description,
  useCases,
}: {
  title: string;
  description: string;
  useCases?: string[];
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setOpen((p) => !p); } }}
        className="w-5 h-5 rounded-full border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 text-xs leading-none inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer select-none"
        aria-label={`Info: ${title}`}
      >
        i
      </span>
      {open && (
        <div className="absolute left-0 top-7 z-50 w-72 rounded-lg border border-slate-700 bg-[rgb(16,20,30)] shadow-xl p-4 space-y-2">
          <div className="text-sm font-semibold text-white">{title}</div>
          <p className="text-xs text-slate-300 leading-relaxed">{description}</p>
          {useCases && useCases.length > 0 && (
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside pt-1">
              {useCases.map((uc, i) => (
                <li key={i}>{uc}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Download helper ──────────────────────────────────────────────── */
export const DownloadButton = ({
  filename,
  content,
  label = 'Download',
}: {
  filename: string;
  content: string;
  label?: string;
}) => {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button onClick={handleDownload} className="btn-ghost whitespace-nowrap shrink-0">
      {label}
    </button>
  );
};

'use client';

import React, { forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('research-panel', className)}>{children}</div>;
}

export function PanelHeader({
  title,
  right,
  className,
}: {
  title: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('panel-header', className)}>
      <span className="panel-title min-w-0 pr-2">{title}</span>
      {right && <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">{right}</div>}
    </div>
  );
}

export function PanelBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('panel-body', className)}>{children}</div>;
}

export function ResearchHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-8 w-full min-w-0 md:mb-10', className)}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-outline mb-2">{eyebrow}</p>
      <h1 className="text-2xl md:text-[1.75rem] font-light text-on-surface tracking-tight mb-2">{title}</h1>
      {description && (
        <p className="text-[15px] text-on-surface-variant max-w-3xl leading-relaxed">{description}</p>
      )}
    </div>
  );
}

export function MonoOut({
  value,
  placeholder,
  minHeight = '48px',
  highlight = 'primary',
  copyable = false,
  className,
  children,
}: {
  value?: string;
  placeholder?: string;
  minHeight?: string;
  highlight?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'none';
  copyable?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const displayVal = value ?? '';
  const isEmpty = !displayVal && !children;

  const handleCopy = useCallback(() => {
    if (displayVal) navigator.clipboard?.writeText(displayVal).catch(() => {});
  }, [displayVal]);

  const hlClass = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
    error: 'text-error',
    none: 'text-on-surface-variant',
  }[highlight];

  return (
    <div className={cn('mono-out relative', className)} style={{ minHeight }}>
      {isEmpty ? (
        <span className="text-outline/60">{placeholder ?? '— awaiting —'}</span>
      ) : children ? (
        children
      ) : (
        <span className={hlClass}>{displayVal}</span>
      )}
      {copyable && !isEmpty && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 font-mono text-[9px] text-outline hover:text-on-surface transition-colors"
          title="Copy to clipboard"
        >
          copy
        </button>
      )}
    </div>
  );
}

export function StatBlock({
  label,
  value,
  unit,
  sub,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  unit?: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn('p-3', className)}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value ?? <span className="text-outline/60">—</span>}
        {unit && <span className="stat-unit ml-1">{unit}</span>}
      </div>
      {sub && <div className="font-mono text-[9px] text-outline mt-1">{sub}</div>}
    </div>
  );
}

type ChipVariant = 'verified' | 'simulated' | 'degraded' | 'info' | 'dim';

export function Chip({ variant, children, className }: { variant: ChipVariant; children: React.ReactNode; className?: string }) {
  return <span className={cn('chip', `chip-${variant}`, className)}>{children}</span>;
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5 mb-2.5', className)}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

export const RunButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; children: React.ReactNode }
>(({ loading, children, className, disabled, ...props }, ref) => (
  <button ref={ref} className={cn('btn-run', className)} disabled={disabled || loading} {...props}>
    {loading ? 'Running…' : children}
  </button>
));
RunButton.displayName = 'RunButton';

export const GhostButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => (
    <button ref={ref} type="button" className={cn('btn-ghost', className)} {...props}>
      {children}
    </button>
  ),
);
GhostButton.displayName = 'GhostButton';

export function SectionDivider({ className }: { className?: string }) {
  return <div className={cn('rule', className)} />;
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block h-1.5 w-1.5 rounded-full bg-primary animate-live-pulse shrink-0', className)}
    />
  );
}

export function MetaRow({
  label,
  value,
  mono = true,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between py-1', className)}>
      <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-outline">{label}</span>
      <span
        className={cn(
          'text-right text-[10px] text-on-surface-variant break-all max-w-[60%]',
          mono && 'font-mono',
        )}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

export function BenchBar({
  value,
  color = 'primary',
  className,
}: {
  value: number;
  color?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
}) {
  const bg = { primary: 'bg-primary', secondary: 'bg-secondary', tertiary: 'bg-tertiary' }[color];
  return (
    <div className={cn('h-1.5 w-full rounded-sm overflow-hidden bg-surface-container-high', className)}>
      <div
        className={cn('h-full rounded-sm transition-all duration-500', bg)}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export function MethodBadge({ method }: { method: HttpMethod }) {
  const cls: Record<HttpMethod, string> = {
    GET: 'bg-primary/10 text-primary',
    POST: 'bg-secondary/10 text-secondary',
    PUT: 'bg-tertiary/10 text-tertiary',
    DELETE: 'bg-error/10 text-error',
    PATCH: 'bg-tertiary/10 text-tertiary',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-[0.04em] shrink-0',
        cls[method],
      )}
    >
      {method}
    </span>
  );
}

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  return (
    <pre className={cn('code-block overflow-x-auto', className)}>
      <code dangerouslySetInnerHTML={{ __html: code }} />
    </pre>
  );
}

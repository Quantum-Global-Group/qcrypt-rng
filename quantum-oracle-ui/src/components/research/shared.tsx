'use client';

import React, { forwardRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Terminal-themed shared primitives used by /blockchain/*, /pqc/*, and
 * /research/* routes. Styling is driven by CSS variables from globals.css so
 * all panels inherit phosphor green on black with corner-bracket decorations.
 */

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('section', className)}>
      {children}
    </div>
  );
}

export function PanelHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg-sunken))]/60 font-mono text-[11px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('p-4 font-mono text-sm', className)}>{children}</div>;
}

interface MonoOutProps {
  value: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const MonoOut = forwardRef<HTMLTextAreaElement, MonoOutProps>(
  ({ value, placeholder = '', rows = 4, className }, ref) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      } catch {
        /* ignore — clipboard may be unavailable (e.g. insecure context) */
      }
    }, [value]);

    return (
      <div className="relative group">
        <textarea
          ref={ref}
          readOnly
          value={value}
          rows={rows}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-[2px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-sunken))]/80 px-3 py-2 text-xs font-mono text-[rgb(var(--green))] resize-none focus:outline-none focus:border-[rgb(var(--green))] placeholder-[rgb(var(--fg-dim))]/60 transition-colors',
            className,
          )}
        />
        {value && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[10px] uppercase tracking-wider text-[rgb(var(--fg-dim))] hover:text-[rgb(var(--green))] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] rounded-[2px] px-1.5 py-0.5"
          >
            {copied ? 'copied' : 'copy'}
          </button>
        )}
      </div>
    );
  },
);
MonoOut.displayName = 'MonoOut';

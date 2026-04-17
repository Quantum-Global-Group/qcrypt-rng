'use client';

import { cn } from '@/lib/utils';
import { CopyButton, DownloadButton } from '@/components/ui';

/* ─── shared primitives (exported for reuse in page components) ────────────── */

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2', className)}>
      {children}
    </div>
  );
}

interface EvidenceField {
  label: string;
  value: string;
  downloadFilename?: string;
}

interface AnalystEvidencePanelProps {
  title?: string;
  fields: EvidenceField[];
  className?: string;
}

export function AnalystEvidencePanel({ title, fields, className }: AnalystEvidencePanelProps) {
  return (
    <div className={cn('rounded-lg border border-slate-700/40 bg-slate-900/60 p-4 space-y-3', className)}>
      {title && <SectionLabel>{title}</SectionLabel>}
      {fields.map(({ label, value, downloadFilename }) => (
        <div key={label} className="space-y-1">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="flex items-start gap-2">
            <code className="flex-1 text-xs font-mono text-slate-200 break-all bg-slate-800/60 rounded px-2 py-1.5 leading-relaxed">
              {value || '—'}
            </code>
            {value && <CopyButton value={value} />}
            {value && downloadFilename && (
              <DownloadButton filename={downloadFilename} content={value} label="Save" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

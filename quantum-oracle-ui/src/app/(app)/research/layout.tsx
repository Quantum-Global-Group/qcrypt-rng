import type { ReactNode } from 'react';
import { LabZoneHeader } from '@/components/layout/LabZoneHeader';

export const metadata = {
  title: {
    template: '%s | QCrypt',
    default: 'Tools | QCrypt',
  },
};

/**
 * Lab routes use the same AppShell as the rest of the platform; this adds context + width.
 */
export default function ResearchSectionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
      <LabZoneHeader />
      <div className="flex-1 py-8 pb-16 text-[15px] leading-relaxed text-on-surface">
        {children}
      </div>
    </div>
  );
}

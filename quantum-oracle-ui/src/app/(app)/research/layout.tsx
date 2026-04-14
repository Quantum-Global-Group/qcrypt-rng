import type { ReactNode } from 'react';

export const metadata = {
  title: {
    template: '%s | QCrypt',
    default: 'Research | QCrypt',
  },
};

export default function ResearchSectionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 w-full py-7 pb-16 text-[13px] leading-relaxed text-on-surface">
      {children}
    </div>
  );
}

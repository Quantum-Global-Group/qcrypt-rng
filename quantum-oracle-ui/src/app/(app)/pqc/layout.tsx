import type { ReactNode } from 'react';

export default function PqcLayout({ children }: { children: ReactNode }) {
  return (
    <div className="py-7 pb-16">
      {children}
    </div>
  );
}

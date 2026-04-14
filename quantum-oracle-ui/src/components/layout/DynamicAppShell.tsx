'use client';

import { TopNavbar } from './TopNavbar';

export function DynamicAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-col bg-background font-body text-on-surface antialiased">
      <TopNavbar />
      <main className="isolate flex min-w-0 flex-1 flex-col overflow-x-hidden bg-surface">
        <div className="w-full min-w-0 flex-1 px-5 sm:px-6 lg:px-8 xl:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}

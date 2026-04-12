'use client';

import { useUserMode } from '@/contexts/UserModeContext';
import { TopNavbar } from './TopNavbar';
import { SideNav } from './SideNav';
import { SimpleModeSideNav } from './SimpleModeSideNav';

/**
 * DynamicAppShell: Switches between developer and simple mode layouts
 */
export function DynamicAppShell({ children }: { children: React.ReactNode }) {
  const { isSimple } = useUserMode();

  if (isSimple) {
    return (
      <div className="flex min-h-dvh w-full min-w-0 flex-col bg-background font-body text-on-surface antialiased">
        <TopNavbar />
        <div className="grid min-h-0 flex-1 grid-cols-[16rem_minmax(0,1fr)] items-start">
          <div className="sticky top-12 h-[calc(100dvh-3rem)]">
            <SimpleModeSideNav />
          </div>
          <main className="isolate flex min-h-[calc(100dvh-3rem)] min-w-0 flex-col overflow-x-hidden bg-surface">
            <div className="w-full min-w-0 flex-1 px-5 sm:px-6 lg:px-8 xl:px-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Developer mode (original layout)
  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-col bg-background font-body text-on-surface antialiased">
      <TopNavbar />
      <div className="grid min-h-0 flex-1 grid-cols-[16rem_minmax(0,1fr)] items-start">
        <div className="sticky top-12 h-[calc(100dvh-3rem)]">
          <SideNav />
        </div>
        <main className="isolate flex min-h-[calc(100dvh-3rem)] min-w-0 flex-col overflow-x-hidden bg-surface">
          <div className="w-full min-w-0 flex-1 px-5 sm:px-6 lg:px-8 xl:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

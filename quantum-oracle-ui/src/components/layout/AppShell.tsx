import { TopNavbar } from './TopNavbar';
import { SideNav } from './SideNav';

/**
 * AppShell: TopNavbar spans full width at the top, then SideNav + main content below.
 *
 * Layout:
 * ┌──────────────────────────────────────────────┐
 * │  TopNavbar (full width, sticky)              │
 * ├──────────┬───────────────────────────────────┤
 * │ SideNav  │  Main content                     │
 * │ (16rem)  │  (flex-1, scrollable)             │
 * └──────────┴───────────────────────────────────┘
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background font-body text-on-surface antialiased">
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

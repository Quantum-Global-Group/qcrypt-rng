import { SideNav } from './SideNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background font-body text-on-surface antialiased">
      <SideNav />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pl-64">
        <main className="min-h-screen flex-1 bg-surface">{children}</main>
      </div>
    </div>
  );
}

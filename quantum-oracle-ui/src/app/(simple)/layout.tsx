import { DynamicAppShell } from '@/components/layout/DynamicAppShell';

export default function SimpleModeLayout({ children }: { children: React.ReactNode }) {
  return <DynamicAppShell>{children}</DynamicAppShell>;
}

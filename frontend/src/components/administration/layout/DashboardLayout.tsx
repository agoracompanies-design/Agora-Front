import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen ">
      <main className="ml-64 p-6">{children}</main>
    </div>
  );
}
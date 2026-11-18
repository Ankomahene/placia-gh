import type { ReactNode } from 'react';
import { MobileNav, Sidebar } from '../_components/sidebar';
import { requireAdmin } from '../_lib/auth';

/** Every console page: admins only (the proxy checks too; this is the second lock). */
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-dvh">
      <Sidebar email={admin.email} />
      <main className="min-w-0 flex-1">
        <MobileNav />
        {children}
      </main>
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';

const DynamicDashboardLayout = dynamic(
  () =>
    import('@/components/layout/dashboard-layout').then((mod) => ({
      default: mod.DashboardLayout,
    })),
  { ssr: false }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DynamicDashboardLayout isAdmin={false}>{children}</DynamicDashboardLayout>
  );
}

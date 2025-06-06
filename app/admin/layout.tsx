"use client";

import dynamic from "next/dynamic";

const DynamicDashboardHeader = dynamic(
  () => import("@/components/layout/dashboard-header").then(mod => ({ default: mod.DashboardHeader })),
  { ssr: false }
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DynamicDashboardHeader isAdmin />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {children}
      </main>
    </div>
  );
}
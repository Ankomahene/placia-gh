"use client";

import { DashboardHeader } from "@/components/layout/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {children}
      </main>
    </div>
  );
}
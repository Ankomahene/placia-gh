'use client';

import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Sidebar } from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="overflow-hidden h-screen bg-gray-100 dark:bg-background">
      <DashboardHeader />

      <div className="flex w-full h-[calc(100vh-90px)] overflow-y-hidden gap-2">
        {/* Sidebar */}
        <div
          className={cn(
            'px-4 py-10 transition-all duration-300',
            isCollapsed ? 'w-[120px]' : 'w-[250px] flex flex-col items-center'
          )}
        >
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300 h-full overflow-x-hidden overflow-y-auto p-6'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  LayoutDashboard,
  PlusCircle,
  MessageSquare,
  Heart,
  UserCircle,
  ChevronRight,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Add Business",
    href: "/dashboard/add-business",
    icon: PlusCircle,
  },
  {
    name: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
  },
  {
    name: "Favorites",
    href: "/dashboard/favorites",
    icon: Heart,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 pt-24 pb-12 flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-[64px] z-30 h-[calc(100vh-64px)] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            isCollapsed ? "w-[80px]" : "w-[240px]"
          )}
        >
          <ScrollArea className="h-full py-6 pl-4 pr-3">
            <div className="space-y-4">
              <div className="px-3 py-2">
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          pathname === item.href &&
                            "bg-primary/10 hover:bg-primary/20"
                        )}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!isCollapsed && item.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-[-20px] top-3 h-8 w-8 rounded-full border shadow-md"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed ? "" : "rotate-180"
              )}
            />
          </Button>
        </aside>

        {/* Main Content */}
        <div
          className={cn(
            "flex-1 transition-all duration-300",
            isCollapsed ? "ml-[80px]" : "ml-[240px]"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
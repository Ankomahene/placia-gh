"use client";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 px-4 border-b flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo size="sm" />
        </Link>
        <ThemeToggle />
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PlaciaGH. All rights reserved.</p>
      </footer>
    </div>
  );
}
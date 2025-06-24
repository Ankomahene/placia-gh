'use client';

import { Sparkles } from 'lucide-react';
import Image from 'next/image';

export function BoltBadge() {
  return (
    <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/5 via-blue-500/5 to-purple-500/5 border border-primary/20 animate-fade-in backdrop-blur-sm group">
      <div className="relative flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 blur-xl rounded-full scale-150 animate-pulse-slow opacity-75"></div>
          <Image
            src="/bolt-3d.png"
            alt="Bolt 3d logo"
            width={40}
            height={40}
            className="relative z-10 animate-float-gentle transform transition-all duration-300 group-hover:scale-110"
          />
        </div>
        <div className="flex items-center gap-2 pl-1">
          <span className="text-sm font-medium bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient-text transform transition-all duration-300 group-hover:scale-105">
            Proudly built with bolt.new
          </span>
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
}

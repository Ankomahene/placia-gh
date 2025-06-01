'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import Link from 'next/link';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: LogoSize;
}

const sizeMap = {
  sm: { width: 100, height: 30 },
  md: { width: 150, height: 45 },
  lg: { width: 200, height: 60 },
  xl: { width: 250, height: 75 },
};

export const Logo = ({ size = 'md' }: LogoProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const logoSrc = isDark ? '/placia-logo-1.png' : '/placia-logo.png';
  const dimensions = sizeMap[size];

  return (
    <div className="relative">
      <Link href="/">
        <Image
          src={logoSrc}
          alt="Vendora Logo"
          width={dimensions.width}
          height={dimensions.height}
          priority 
        />
      </Link>
    </div>
  );
};

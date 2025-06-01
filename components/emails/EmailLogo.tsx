import React from 'react';
import { Img } from '@react-email/components';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface EmailLogoProps {
  size?: LogoSize;
}

const sizeMap = {
  sm: { width: 100, height: 30 },
  md: { width: 150, height: 45 },
  lg: { width: 200, height: 60 },
  xl: { width: 250, height: 75 },
};

export const EmailLogo = ({ size = 'md' }: EmailLogoProps) => {
  // Use a light theme logo for emails by default
  const logoSrc = `https://jjazpfwfzzgyluuuslit.supabase.co/storage/v1/object/public/assets/logo-fav.png`;

  const dimensions = sizeMap[size];

  return (
    <Img
      src={logoSrc}
      alt="PlaciaGH Logo"
      width={dimensions.width}
      height={dimensions.height}
    />
  );
};

export default EmailLogo;

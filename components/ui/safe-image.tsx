'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  sizes?: string;
}

export function SafeImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  fallbackSrc,
  priority = false,
  sizes,
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [useImgTag, setUseImgTag] = useState(false);

  // Check if it's a Google image URL
  const isGoogleImage =
    src?.includes('googleapis.com') || src?.includes('googleusercontent.com');

  const handleError = () => {
    if (!hasError) {
      setHasError(true);

      // Try fallback source first
      if (fallbackSrc && imgSrc !== fallbackSrc) {
        setImgSrc(fallbackSrc);
        return;
      }

      // For Google images, try using regular img tag as fallback
      if (isGoogleImage && !useImgTag) {
        setUseImgTag(true);
        return;
      }
    }
  };

  const handleLoad = () => {
    setHasError(false);
  };

  // Use regular img tag for Google images that failed with Next.js Image
  if (useImgTag && isGoogleImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgSrc}
        alt={alt}
        className={cn('object-cover', className)}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
        }}
        onError={handleError}
        onLoad={handleLoad}
      />
    );
  }

  // Use Next.js Image for optimization when possible
  const imageProps = {
    src: imgSrc,
    alt,
    className: cn('object-cover', className),
    onError: handleError,
    onLoad: handleLoad,
    priority,
    ...(sizes && { sizes }),
  };

  if (fill) {
    return <Image {...imageProps} alt={alt} fill />;
  }

  return (
    <Image
      {...imageProps}
      alt={alt}
      width={width || 400}
      height={height || 300}
      loading="lazy"
    />
  );
}

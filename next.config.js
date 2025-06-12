/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow unoptimized images through next/image
    unoptimized: true,
    // Allow images from Google domains
    domains: [
      'maps.googleapis.com',
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
      'places.googleapis.com',
      'streetviewpixels-pa.googleapis.com',
    ],
    // Alternative: Use remotePatterns for more flexible matching
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
};

module.exports = nextConfig;

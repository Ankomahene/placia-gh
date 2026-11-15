import type { MetadataRoute } from 'next';

/** Installable on Android and desktop ("Add to home screen"): opens full screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Placia: find places in Ghana',
    short_name: 'Placia',
    description: 'Search places in Ghana by typing or speaking plain English.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fcfcfa',
    theme_color: '#006d47',
    categories: ['travel', 'navigation', 'lifestyle'],
    icons: [
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Pharmacy near me', url: '/search?q=pharmacy+near+me' },
      { name: 'Food near me', url: '/search?q=food+near+me' },
    ],
  };
}

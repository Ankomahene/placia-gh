import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemePaletteProvider } from '@/components/theme-palette/theme-palette-context';
import { QueryProvider } from './providers/query-provider';
import {
  AudioTourProvider,
  AudioTourProviderWrapper,
} from '@/components/onboarding-v2';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Placia - Discover Amazing Places in Ghana',
  description:
    'Find restaurants, hotels, attractions, and more with AI-powered search. Your guide to the best places in Ghana.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ThemePaletteProvider>
            <QueryProvider>
              <AudioTourProvider>
                <AudioTourProviderWrapper>
                  <div className="min-h-screen flex flex-col">
                    {/* <Header /> */}
                    <main className="flex-1">{children}</main>
                    {/* <Footer /> */}
                  </div>
                  <Toaster richColors position="top-center" />
                </AudioTourProviderWrapper>
              </AudioTourProvider>
            </QueryProvider>
          </ThemePaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

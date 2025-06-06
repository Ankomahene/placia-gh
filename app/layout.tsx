import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemePaletteProvider } from '@/components/theme-palette';
import { Toaster } from 'sonner';
import { QueryProvider } from './providers/query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PlaciaGH - Discover Local Places in Ghana',
  description: 'Find the best local places in Ghana with AI-powered search',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ThemePaletteProvider>
              {children}
              <Toaster />
            </ThemePaletteProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

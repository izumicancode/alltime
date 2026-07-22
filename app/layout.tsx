import './globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { UserProvider } from '@/components/user-context';
import { Header } from '@/components/header';
import { MobileNav } from '@/components/mobile-nav';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Alltime — a calmer social space',
  description: 'Alltime is a thoughtful anonymous social app for short reflections, honest stories, and everyday moments.',
  metadataBase: new URL('https://alltime.app'),
  openGraph: {
    title: 'Alltime — a calmer social space',
    description: 'Alltime is a thoughtful anonymous social app for short reflections, honest stories, and everyday moments.',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${display.variable} font-sans`}>
        <ThemeProvider>
          <UserProvider>
            <div className="mesh-bg" />
            <Header />
            <main className="pt-16 pb-24 md:pb-10 min-h-screen">{children}</main>
            <MobileNav />
            <Toaster />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

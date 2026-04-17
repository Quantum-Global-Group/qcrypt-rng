import type { Metadata } from 'next';
import { JetBrains_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google';
import './globals.css';
import { Providers } from './lib/Providers';
import { AppShellFrame } from '@/components/terminal/AppShellFrame';

// Primary body font: JetBrains Mono — hacker-core staple.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

// Sans for headings and marketing surfaces.
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QCrypt RNG // Quantum Randomness Oracle',
  description:
    'Verifiable quantum randomness and post-quantum cryptography for blockchain, DeFi, and zero-trust systems.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} ${ibmPlexSerif.variable}`}
    >
      <body className="font-mono antialiased">
        <Providers>
          <AppShellFrame>{children}</AppShellFrame>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google';
import './globals.css';
import { Providers } from './lib/Providers';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-ibm-plex-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QCrypt — Quantum RNG + post-quantum platform',
  description:
    'Unified platform: quantum randomness oracle, PQC workspace (encrypt, sign, hash), lab benchmarks, and on-chain fulfillment.',
  keywords: ['PQC', 'Kyber', 'Dilithium', 'Falcon', 'SPHINCS', 'quantum RNG', 'VRF', 'oracle'],
  authors: [{ name: 'QCrypt' }],
  openGraph: {
    title: 'QCrypt',
    description: 'Quantum RNG, post-quantum cryptography, lab tools, and on-chain randomness.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${ibmPlexSans.variable} ${ibmPlexMono.variable} ${ibmPlexSerif.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0a0a0b" />
      </head>
      <body className="bg-background text-on-surface antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

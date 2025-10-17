import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HiFi Music Finder',
  description: 'Search, preview, and download hi-fi tracks powered by the TIDAL proxy API.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen selection:bg-cyan-400/20 selection:text-cyan-200`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,255,0.18),_transparent_65%)]" />
          <div className="relative z-10 flex min-h-screen flex-col px-4 pb-8 pt-6 md:px-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}



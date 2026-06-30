import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Intrvyu AI - Voice Mock Interview Platform',
  description: 'Practice mock interviews using real-time voice conversations with AI interviewers powered by Gemini Live API.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.variable} antialiased bg-neutral-950 text-neutral-100 font-sans min-h-screen selection:bg-indigo-500/30`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

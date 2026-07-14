import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
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
        className={`${inter.variable} ${jetbrainsMono.variable} ${plusJakartaSans.variable} antialiased bg-base text-txt-primary font-sans min-h-screen selection:bg-accent/20`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

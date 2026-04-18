import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChronicPal',
  description: 'AI-Powered Chronic Treatment Companion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

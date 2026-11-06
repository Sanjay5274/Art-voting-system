import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SCM Garments Pvt Ltd – Drawing Competition',
  description: 'Drawing Competition Voting Portal - SCM Garments Pvt Ltd',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-purple-100 selection:text-purple-900">
        {children}
      </body>
    </html>
  );
}

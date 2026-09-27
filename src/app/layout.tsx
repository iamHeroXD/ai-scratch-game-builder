import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Scratch Game Builder',
  description: 'Production-grade AI assistant that compiles natural language into playable Scratch/TurboWarp .sb3 projects.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">{children}</body>
    </html>
  );
}

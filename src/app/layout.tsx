import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Manashjyoti Barman | Project Management Consultant',
  description: 'Portfolio of Manashjyoti Barman, a Project Management Consultant based in Noida, India.',
  openGraph: {
    title: 'Manashjyoti Barman | Project Management Consultant',
    description: 'Portfolio of Manashjyoti Barman, a Project Management Consultant based in Noida, India.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-[#0A0A0A] text-slate-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Footer from '@/components/common/Footer';

export const metadata: Metadata = {
  title: '86/c AI - Key Account Management CRM',
  description: 'Minimalist AI-Powered Key Account Management CRM',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fustat:wght@200..800&display=swap');`}</style>
      </head>
      <body className="font-body antialiased bg-background text-foreground grain-texture">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}

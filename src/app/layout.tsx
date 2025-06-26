import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'IRIS AI - Key Account Management CRM',
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}

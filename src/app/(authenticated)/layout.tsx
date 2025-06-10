"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import HorizontalNav from '@/components/layout/HorizontalNav';
import { Loader2 } from 'lucide-react';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HorizontalNav />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24 lg:pt-28"> {/* Added padding-top to account for fixed HorizontalNav */}
        {children}
      </main>
    </div>
  );
}

"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import HorizontalNav from '@/components/layout/HorizontalNav';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isCheckingAuth } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = React.useState(false);

  // Trigger content animation after nav animates in
  React.useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, isCheckingAuth, router]);

  if (isCheckingAuth || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HorizontalNav />
      <motion.main
        className="overflow-y-auto lg:pt-8"
        initial={{ opacity: 0, y: 16 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {children}
      </motion.main>
    </div>
  );
}

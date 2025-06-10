"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Briefcase, ListChecks, MessageSquare, LayoutDashboard, Users2, PlusCircle, Search } from 'lucide-react';
import UserProfile from './UserProfile';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import AddAccountDialog from '@/components/accounts/AddAccountDialog'; // Import the new dialog

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Briefcase },
  { href: '/projects', label: 'Projects', icon: ListChecks },
  { href: '/updates', label: 'Updates', icon: MessageSquare },
  { href: '/settings/users', label: 'User Management', icon: Users2 },
];

export default function HorizontalNav() {
  const pathname = usePathname();
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Logo iconSize={28} textSize="text-2xl" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "text-muted-foreground hover:text-foreground hover:bg-accent",
                  (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/')) &&
                  "text-primary bg-accent font-semibold"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
            <div className="relative flex-1 max-w-xs ml-auto hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 h-9 w-full"
              />
            </div>
            <Button 
              variant="default" 
              size="sm" 
              className="h-9"
              onClick={() => setIsAddAccountDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Quick Create
            </Button>
            <UserProfile />
          </div>
        </div>
        {/* Mobile Nav - could be a dropdown or off-canvas if many items */}
        <div className="md:hidden flex items-center justify-center border-t py-2 bg-background/95">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "flex-1 justify-center text-xs text-muted-foreground",
                 (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/')) &&
                  "text-primary font-semibold"
              )}
            >
              <Link href={item.href} className="flex flex-col items-center">
                <item.icon className="h-5 w-5 mb-0.5" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </header>
      <AddAccountDialog open={isAddAccountDialogOpen} onOpenChange={setIsAddAccountDialogOpen} />
    </>
  );
}

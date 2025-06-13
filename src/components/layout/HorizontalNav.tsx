
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Briefcase, ListChecks, MessageSquare, LayoutDashboard, Users2, PlusCircle, Search, Users, BarChartBig } from 'lucide-react';
import UserProfile from './UserProfile';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import AddAccountDialog from '@/components/accounts/AddAccountDialog';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/accounts', label: 'Accounts', icon: Briefcase },
  { href: '/opportunities', label: 'Opportunities', icon: BarChartBig },
  { href: '/updates', label: 'Updates', icon: MessageSquare },
  { href: '/settings/users', label: 'User Management', icon: Users2 },
];

export default function HorizontalNav() {
  const pathname = usePathname();
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full border-b",
          "bg-[#2B2521]", 
          "border-gray-700" 
        )}
        style={{ height: '70px' }} 
      >
        <div className="container mx-auto flex h-full items-center justify-between px-1 py-2"> 
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-6">
              <Logo iconSize={28} textSize="text-2xl" className="text-[#EFEDEB]" /> 
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-1"> 
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-[#EFEDEB] hover:text-[#EFEDEB]/90"> 
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    "text-[#EFEDEB] hover:text-[#EFEDEB]/90 hover:bg-white/5", 
                    (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/')) &&
                    "text-[#EFEDEB] bg-white/10 font-semibold" 
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>

            <Button
              variant="outline" 
              size="sm"
              className="h-9 text-[#EFEDEB] border-gray-500 hover:bg-gray-700 hover:text-[#EFEDEB]/90" 
              onClick={() => setIsAddAccountDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Quick Create
            </Button>
            <UserProfile />
          </div>
        </div>
        {/* Mobile Nav */}
        <div 
          className={cn(
            "md:hidden flex items-center justify-around border-t py-2 overflow-x-auto",
            "bg-[#2B2521]", 
            "border-gray-700" 
          )}
          style={{ position: 'absolute', bottom: '-50px', left: 0, right: 0, height: '50px' }} 
        >
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "flex-1 justify-center text-xs text-[#EFEDEB] px-1 min-w-max hover:bg-white/5", 
                 (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/')) &&
                  "text-[#EFEDEB] font-semibold" 
              )}
            >
              <Link href={item.href} className="flex flex-col items-center">
                <item.icon className="h-5 w-5 mb-0.5" />
                <span className="truncate">{item.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </header>
      <AddAccountDialog open={isAddAccountDialogOpen} onOpenChange={setIsAddAccountDialogOpen} />
    </>
  );
}

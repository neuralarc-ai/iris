"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Logo from '@/components/common/Logo';
import { Briefcase, ListChecks, MessageSquare, Settings, LayoutDashboard, Users2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Briefcase },
  { href: '/projects', label: 'Projects', icon: ListChecks },
  { href: '/updates', label: 'Updates', icon: MessageSquare },
  { href: '/settings/api', label: 'API Settings', icon: Settings },
  { href: '/settings/users', label: 'User Management', icon: Users2 },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
        <SidebarHeader className="flex items-center justify-between p-4 h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo iconSize={28} textSize="text-2xl" />
          </Link>
          <SidebarTrigger className="hidden group-data-[state=expanded]:[display:inherit] group-data-[collapsible=icon]:hidden sm:flex" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/')}
                    tooltip={{ children: item.label, side: "right", align: "center"}}
                    className="justify-start"
                  >
                    <a>
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        {/* <SidebarFooter className="p-4">
          <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            © {new Date().getFullYear()} Iris AI
          </p>
        </SidebarFooter> */}
    </Sidebar>
  );
}

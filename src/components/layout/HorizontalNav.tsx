"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  MessageSquare,
  LayoutDashboard,
  Users2,
  Users,
  BarChartBig,
} from "lucide-react";
import UserProfile from "./UserProfile";
import { cn } from "@/lib/utils";
import AddAccountDialog from "@/components/accounts/AddAccountDialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/accounts", label: "Accounts", icon: Briefcase },
  { href: "/opportunities", label: "Opportunities", icon: BarChartBig },
  { href: "/updates", label: "Updates", icon: MessageSquare },
  { href: "/settings/users", label: "User Management", icon: Users2 },
];

export default function HorizontalNav() {
  const pathname = usePathname();
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

  return (
    <>
      <header
        className={cn("z-50 w-full border-b", "bg-transparent text-black")}
        style={{ height: "70px" }}
      >
        <div className="max-w-[1440px] mx-auto w-full flex h-full items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-6">
              <Image
                src="/images/iris.svg"
                alt="Iris AI Logo"
                width={40}
                height={40}
                priority
              />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center gap-1">
            <TooltipProvider delayDuration={0}>
              <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
                {navItems.map((item) => (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className={cn(
                          "w-12 h-12 p-0 flex items-center rounded-sm justify-center hover:bg-muted/20 text-black",
                          (pathname === item.href ||
                            (pathname.startsWith(item.href) &&
                              item.href !== "/dashboard" &&
                              item.href !== "/")) &&
                            "bg-muted/20 font-semibold text-black"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-10 w-10"/>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </nav>
            </TooltipProvider>

            <div className="ml-auto flex items-center">
              <UserProfile />
            </div>
          </div>
        </div>
        {/* Mobile Nav */}
        <div
          className={cn(
            "md:hidden flex items-center justify-around border-t py-2 overflow-x-auto",
            "bg-transparent text-black"
          )}
          style={{
            position: "absolute",
            bottom: "-50px",
            left: 0,
            right: 0,
            height: "50px",
          }}
        >
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "flex-1 justify-center text-xs px-1 min-w-max hover:bg-muted/20 text-black",
                (pathname === item.href ||
                  (pathname.startsWith(item.href) &&
                    item.href !== "/dashboard" &&
                    item.href !== "/")) &&
                  "font-semibold text-black"
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
      <AddAccountDialog
        open={isAddAccountDialogOpen}
        onOpenChange={setIsAddAccountDialogOpen}
      />
    </>
  );
}

"use client";

import React from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Avvvatars from 'avvvatars-react';

export default function UserProfile() {
  const { logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className='w-fit min-w-0'>
        <Button variant="ghost" className="relative px-0 h-9 w-fit rounded-full focus-visible:outline-none focus-visible:ring-0 focus-within:outline-none focus-within:ring-0">
          <div className="w-fit h-9 px-0 flex items-center justify-center">
            <Avvvatars value="admin@iris.ai" size={36} style="character" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-[90vw] w-full md:max-w-md" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Admin User</p>
            <p className="text-xs leading-none text-muted-foreground">
              admin@iris.ai
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/api">
            <Settings className="mr-2 h-4 w-4" />
            <span>API Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

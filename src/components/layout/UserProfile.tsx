"use client";

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Avvvatars from 'avvvatars-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function UserProfile() {
  const { logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [companyName, setCompanyName] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [industry, setIndustry] = React.useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className='w-fit min-w-0 rounded-sm'>
          <Button variant="ghost" className="relative px-0 h-9 w-fit rounded-sm focus-visible:outline-none focus-visible:ring-0 focus-within:outline-none focus-within:ring-0">
            <div className="w-fit h-9 px-0 flex items-center justify-center rounde-sm">
              <Avvvatars value="admin@iris.ai" size={36} style="character" radius={4}/>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-w-[90vw] rounded-sm sm:h-fit w-full md:max-w-md" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Admin User</p>
              <p className="text-xs leading-none text-muted-foreground">
                admin@iris.ai
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Company Info</DialogTitle>
          <DialogDescription>
            Set up your company profile for a personalized experience.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name</label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://acme.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City, Country" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Industry</label>
            <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. SaaS, Consulting" />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" variant="add" className="w-full mt-2">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

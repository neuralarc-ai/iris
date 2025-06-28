"use client";

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';

export default function UserProfile() {
  const { logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [companyName, setCompanyName] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [companyDescription, setCompanyDescription] = React.useState('');
  const [editMode, setEditMode] = React.useState(false);
  const [userData, setUserData] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const industryOptions = [
    'SaaS', 'Consulting', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Technology', 'Other'
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
          console.error('No user ID found in localStorage');
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('name, email, role')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          setUserData(data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className='w-fit min-w-0 rounded-sm'>
          <Button variant="ghost" className="relative px-0 h-9 w-fit rounded-sm focus-visible:outline-none focus-visible:ring-0 focus-within:outline-none focus-within:ring-0">
            <div className="w-fit h-9 px-0 flex items-center justify-center rounde-sm">
              <Avvvatars value={userData?.email || "admin@iris.ai"} size={36} style="shape" radius={4}/>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-w-[90vw] rounded-sm sm:h-fit w-full md:max-w-md" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {isLoading ? 'Loading...' : userData?.name || 'Admin User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {isLoading ? 'Loading...' : userData?.email || 'admin@iris.ai'}
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
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc." readOnly={!editMode} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://acme.com" readOnly={!editMode} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City, Country" readOnly={!editMode} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company Description</label>
            <Textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} placeholder="Describe your company..." readOnly={!editMode} className="min-h-[60px]" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Industry</label>
            <Select value={industry} onValueChange={setIndustry} disabled={!editMode}>
              <SelectTrigger className="w-full mt-1" disabled={!editMode}>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industryOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          {!editMode ? (
            <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setEditMode(true)}>Edit</Button>
          ) : (
            <Button type="submit" variant="add" className="w-full mt-2" onClick={() => setEditMode(false)}>Save</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

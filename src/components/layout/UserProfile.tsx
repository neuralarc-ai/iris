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
import { User, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Avvvatars from 'avvvatars-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import CompanyProfileDialog from './CompanyProfileDialog';

export default function UserProfile() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [userData, setUserData] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
          console.error('No user ID found in localStorage');
          setIsLoading(false);
          return;
        }

        // Fetch user data
        const { data: userDataResult, error: userError } = await supabase
          .from('users')
          .select('name, email, role')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          setIsLoading(false);
          return;
        }

        if (userDataResult) {
          setUserData(userDataResult);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const isAdmin = userData?.role === 'admin';

  return (
    <>
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
              <Building2 className="mr-2 h-4 w-4" />
              <span>Company</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Dialog>
      <CompanyProfileDialog open={open} onOpenChange={setOpen} isEditable={isAdmin} />
    </>
  );
}

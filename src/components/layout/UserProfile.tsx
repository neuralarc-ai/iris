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
import { useToast } from '@/hooks/use-toast';

export default function UserProfile() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [companyName, setCompanyName] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [companyDescription, setCompanyDescription] = React.useState('');
  const [editMode, setEditMode] = React.useState(false);
  const [userData, setUserData] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompanyData, setHasCompanyData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasShownInitialDialog, setHasShownInitialDialog] = useState(false);
  
  const industryOptions = [
    'SaaS', 'Consulting', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Technology', 'Other'
  ];

  useEffect(() => {
    const fetchUserDataAndCompany = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
          console.error('No user ID found in localStorage');
          setIsLoading(false);
          return;
        }

        // Check if we've already shown the initial dialog for this admin
        const hasShownDialog = localStorage.getItem('hasShownInitialCompanyDialog');
        setHasShownInitialDialog(!!hasShownDialog);

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
          
          // If user is admin, check for company data
          if (userDataResult.role === 'admin') {
            const { data: companyData, error: companyError } = await supabase
              .from('company')
              .select('*')
              .single();

            if (companyError && companyError.code !== 'PGRST116') { // PGRST116 is "not found"
              console.error('Error fetching company data:', companyError);
            }

            if (companyData) {
              setHasCompanyData(true);
              setCompanyName(companyData.name || '');
              setWebsite(companyData.website || '');
              setAddress(companyData.address || '');
              setIndustry(companyData.industry || '');
              setCompanyDescription(companyData.description || '');
            } else {
              // No company data found - this is a new admin
              setHasCompanyData(false);
              
              // Only auto-open the dialog if we haven't shown it before
              if (!hasShownDialog) {
                setOpen(true);
                setEditMode(true); // Start in edit mode
                // Mark that we've shown the initial dialog
                localStorage.setItem('hasShownInitialCompanyDialog', 'true');
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDataAndCompany();
  }, []);

  const handleSaveCompanyData = async () => {
    if (!userData || userData.role !== 'admin') {
      toast({
        title: "Error",
        description: "Only admins can configure company data.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      if (hasCompanyData) {
        // Update existing company data
        const { error } = await supabase
          .from('company')
          .update({
            name: companyName,
            website: website,
            address: address,
            industry: industry,
            description: companyDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', 1); // Assuming single company record

        if (error) {
          throw error;
        }
      } else {
        // Insert new company data
        const { error } = await supabase
          .from('company')
          .insert({
            name: companyName,
            website: website,
            address: address,
            industry: industry,
            description: companyDescription
          });

        if (error) {
          throw error;
        }
        setHasCompanyData(true);
      }

      setEditMode(false);
      toast({
        title: "Success",
        description: "Company information saved successfully.",
        className: "bg-green-100 dark:bg-green-900 border-green-500"
      });
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: "Error",
        description: "Failed to save company information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = userData?.role === 'admin';

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
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={() => setOpen(true)} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={logout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Company Profile</DialogTitle>
          <DialogDescription>
            {hasCompanyData 
              ? "Update your company profile for a personalized experience."
              : "Welcome! Please set up your company profile to get started."
            }
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveCompanyData(); }}>
          <div>
            <label className="block text-sm font-medium mb-1">Company Name</label>
            <Input 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)} 
              placeholder="Acme Inc." 
              readOnly={!editMode}
              required={editMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <Input 
              value={website} 
              onChange={e => setWebsite(e.target.value)} 
              placeholder="https://acme.com" 
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              placeholder="123 Main St, City, Country" 
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company Description</label>
            <Textarea 
              value={companyDescription} 
              onChange={e => setCompanyDescription(e.target.value)} 
              placeholder="Describe your company..." 
              readOnly={!editMode} 
              className="max-h-[80px] resize-none"
            />
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
            <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setEditMode(true)}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2 w-full mt-2">
              {!hasCompanyData && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => {
                    setOpen(false);
                    setEditMode(false);
                    // Mark that we've shown the initial dialog (even if skipped)
                    localStorage.setItem('hasShownInitialCompanyDialog', 'true');
                  }}
                >
                  Skip
                </Button>
              )}
              <Button 
                type="submit" 
                variant="add" 
                className={!hasCompanyData ? "flex-1" : "w-full"} 
                onClick={handleSaveCompanyData}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

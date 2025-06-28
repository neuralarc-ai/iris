"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { countries } from '@/lib/countryData';
import { Loader2 } from 'lucide-react';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadAdded?: (newLead: Lead) => void;
}

export default function AddLeadDialog({ open, onOpenChange, onLeadAdded }: AddLeadDialogProps) {
  const [companyName, setCompanyName] = useState('');
  const [personName, setPersonName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinProfileUrl, setLinkedinProfileUrl] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [role, setRole] = useState<string>('user');
  const [ownerId, setOwnerId] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        // Test Supabase connection
        try {
          const { data: testData, error: testError } = await supabase.from('users').select('count').limit(1);
          console.log('Supabase connection test:', { testData, testError });
        } catch (testError) {
          console.error('Supabase connection failed:', testError);
        }
        
        const userId = localStorage.getItem('user_id');
        if (userId) {
          const { data: userData } = await supabase.from('users').select('role').eq('id', userId).single();
          setRole(userData?.role || 'user');
          setOwnerId(userId);
          if (userData?.role === 'admin') {
            const { data: usersData } = await supabase.from('users').select('id, name, email');
            if (usersData) setUsers(usersData);
          }
        }
      };
      fetchData();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !personName.trim() || !email.trim()) {
      toast({ title: "Error", description: "Company Name, Person's Name, and Email are required.", variant: "destructive" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (linkedinProfileUrl && !linkedinProfileUrl.startsWith('http')) {
        toast({ title: "Invalid URL", description: "LinkedIn Profile URL must be a valid URL (e.g., https://linkedin.com/in/...)", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      // Use current user as owner if no specific user is assigned
      const currentUserId = localStorage.getItem('user_id');
      const finalOwnerId = ownerId || currentUserId;
      
      if (!finalOwnerId) throw new Error('User not authenticated');
      
      console.log('Creating lead with data:', {
        company_name: companyName,
        person_name: personName,
        email,
        phone,
        linkedin_profile_url: linkedinProfileUrl,
        country,
        status: 'New',
        owner_id: finalOwnerId,
      });
      
      // Add timeout to handle network issues
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const supabasePromise = supabase.from('lead').insert([
        {
          company_name: companyName,
          person_name: personName,
          email,
          phone,
          linkedin_profile_url: linkedinProfileUrl,
          country,
          status: 'New',
          owner_id: finalOwnerId,
        }
      ]).select().single();
      
      const { data, error } = await Promise.race([supabasePromise, timeoutPromise]) as any;
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('No data returned from Supabase');
      }
      
      // Transform the response data to match the Lead interface
      const transformedLead = {
        id: data.id,
        companyName: data.company_name || '',
        personName: data.person_name || '',
        phone: data.phone || '',
        email: data.email || '',
        linkedinProfileUrl: data.linkedin_profile_url || '',
        country: data.country || '',
        status: data.status || 'New',
        opportunityIds: [], // Not implemented yet
        updateIds: [], // Not implemented yet
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
        assignedUserId: data.owner_id || '',
        rejectionReasons: [], // Not implemented yet
      };
      
      toast({
        title: "Lead Created",
        description: `${personName} from ${companyName} has been successfully added as a lead.`,
      });
      
      try {
        onLeadAdded?.(transformedLead);
      } catch (callbackError) {
        console.error('Error in onLeadAdded callback:', callbackError);
        // Don't throw here, just log the error
      }
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create lead:", error);
      toast({ title: "Error", description: "Failed to create lead. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setPersonName('');
    setEmail('');
    setPhone('');
    setLinkedinProfileUrl('');
    setCountry('');
    setOwnerId('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Enter details to create a new lead.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-3 max-h-[70vh] overflow-y-auto pr-2">
          {/* Business Card Upload Section - Commented Out
          <div className="p-4 border rounded-md bg-muted/30 space-y-3">
            <Label htmlFor="business-card-upload" className="flex items-center text-sm font-medium">
              <UploadCloud className="mr-2 h-4 w-4 text-primary" /> Upload Business Card (Optional)
            </Label>
            <Input 
              id="business-card-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="text-xs"
              ref={fileInputRef}
              disabled={isLoading || isOcrLoading}
            />
            {businessCardPreview && (
              <div className="mt-2 text-center">
                <img src={businessCardPreview} alt="Business card preview" className="max-w-full max-h-32 mx-auto rounded-md border" />
              </div>
            )}
            {businessCardImage && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleExtractFromCard} 
                disabled={isOcrLoading || isLoading} 
                className="w-full mt-2"
              >
                {isOcrLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                Extract Info from Card
              </Button>
            )}
          </div>
          */}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <Label htmlFor="lead-person-name">Person's Name <span className="text-destructive">*</span></Label>
              <Input id="lead-person-name" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="e.g., John Doe" disabled={isLoading} />
            </div>
             <div>
              <Label htmlFor="lead-company-name">Company Name <span className="text-destructive">*</span></Label>
              <Input id="lead-company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., Acme Innovations" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="lead-email">Email <span className="text-destructive">*</span></Label>
              <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john.doe@acme.com" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="lead-phone">Phone</Label>
              <Input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., (555) 123-4567" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="lead-linkedin">LinkedIn Profile URL</Label>
              <Input id="lead-linkedin" type="url" value={linkedinProfileUrl} onChange={(e) => setLinkedinProfileUrl(e.target.value)} placeholder="e.g., https://linkedin.com/in/johndoe" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="lead-country">Country</Label>
              <Select value={country} onValueChange={setCountry} disabled={isLoading}>
                <SelectTrigger id="lead-country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Countries</SelectLabel>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {role === 'admin' && (
              <div>
                <Label htmlFor="lead-owner">Assigned To</Label>
                <Select value={ownerId} onValueChange={setOwnerId} disabled={isLoading}>
                  <SelectTrigger id="lead-owner">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline-dark" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} variant="add">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Account, AccountType, AccountStatus, Lead } from '@/types';
import { addAccount, getUnconvertedLeads, convertLeadToAccount, mockAccounts } from '@/lib/data';
import { Loader2, PlusCircle, UserCheck, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/use-auth';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountAdded?: (newAccount: Account) => void;
  onLeadConverted?: (leadId: string, newAccountId: string) => void;
}

const MANUAL_CREATE_VALUE = "_manual_create_";

export default function AddAccountDialog({ open, onOpenChange, onAccountAdded, onLeadConverted }: AddAccountDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType | ''>('Client');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
  const [selectedLeadToConvert, setSelectedLeadToConvert] = useState<string | ''>('');

  const { isAuthenticated } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [ownerId, setOwnerId] = useState<string>('');
  const [role, setRole] = useState<string>('user');

  const industryOptions = [
    'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Consulting', 'Real Estate', 'Other'
  ];

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (data) {
        setCurrentUser(data);
        setRole(data.role);
        setOwnerId(data.id);
      }
    };
    fetchCurrentUser();
  }, [open]);

  useEffect(() => {
    if (role === 'admin') {
      const fetchUsers = async () => {
        const { data, error } = await supabase.from('users').select('id, name, email');
        if (data) setUsers(data);
      };
      fetchUsers();
    }
  }, [role]);

  useEffect(() => {
    if (open) {
      setAvailableLeads(getUnconvertedLeads());
      // Reset form fields when dialog opens if not already reset by onOpenChange
      // This is particularly important if the dialog was closed without submitting previously
      if (!selectedLeadToConvert) { // Or a more explicit reset condition if needed
          resetFormFields();
      }
    }
  }, [open]);

  useEffect(() => {
    if (selectedLeadToConvert && selectedLeadToConvert !== MANUAL_CREATE_VALUE) {
      const lead = availableLeads.find(l => l.id === selectedLeadToConvert);
      if (lead) {
        setName(lead.companyName);
        setContactPersonName(lead.personName);
        setContactEmail(lead.email);
        setContactPhone(lead.phone || '');
        setType('Client'); // Default type when converting
        setDescription(''); // Clear fields not on lead or let user decide
        setIndustry('');
      }
    } else if (selectedLeadToConvert === MANUAL_CREATE_VALUE) {
      // If user explicitly selects "Create Manually" after selecting a lead, clear fields
      resetFormFields(false); // keep selectedLeadToConvert as MANUAL_CREATE_VALUE
    }
    // If selectedLeadToConvert becomes '', it's handled by resetForm on dialog close or initial state
  }, [selectedLeadToConvert, availableLeads]);

  const resetFormFields = (resetLeadSelection = true) => {
    setName('');
    setType('Client');
    setDescription('');
    setContactEmail('');
    setContactPersonName('');
    setContactPhone('');
    setIndustry('');
    if (resetLeadSelection) {
      setSelectedLeadToConvert('');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let newAccountId = '';
      if (!name.trim() || !type) {
        toast({ title: "Error", description: "Account Name and Type are required for new accounts.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const accountData = {
        name,
        type,
        status: 'Active',
        description,
        contact_email: contactEmail,
        contact_person_name: contactPersonName,
        contact_phone: contactPhone,
        industry,
        owner_id: role === 'admin' ? ownerId : currentUser?.id,
      };
      const { data, error } = await supabase.from('account').insert([accountData]).select().single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      newAccountId = data.id;
      toast({ title: "Account Created", description: `${data.name} has been successfully added.` });
      onAccountAdded?.(data);
      resetFormFields(true);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to process account:", error);
      toast({ title: "Error", description: "Failed to process account. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
          resetFormFields(true); // Full reset when dialog is closed
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[525px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Account
          </DialogTitle>
          <DialogDescription>
            Create a new account directly, or convert an existing lead.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2 p-3 border rounded-md bg-muted/30">
            <Label htmlFor="convert-lead-select" className="flex items-center text-sm">
              <UserCheck className="mr-2 h-4 w-4 text-secondary"/> Convert an Existing Lead (Optional)
            </Label>
            <Select 
              value={selectedLeadToConvert || undefined} // Use undefined if '' to show placeholder
              onValueChange={(value) => setSelectedLeadToConvert(value || '')} // Ensure '' if value becomes undefined/null from Select
              disabled={isLoading}
            >
              <SelectTrigger id="convert-lead-select" className="shadow-sm border-0">
                <SelectValue placeholder="Select a lead to convert..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MANUAL_CREATE_VALUE}>Create New Account Manually</SelectItem>
                {availableLeads.map(lead => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.companyName} ({lead.personName}) - {lead.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             {selectedLeadToConvert && selectedLeadToConvert !== MANUAL_CREATE_VALUE && <p className="text-xs text-muted-foreground">Selected lead details will pre-fill the form. You can edit them.</p>}
          </div>

          <fieldset disabled={isLoading} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="account-name">Account Name <span className="text-destructive">*</span></Label>
                <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Corp" className="shadow-sm border-0" />
              </div>
              <div className="flex-1">
                <Label htmlFor="account-type">Account Type <span className="text-destructive">*</span></Label>
                <Select value={type || undefined} onValueChange={(value: string) => setType(value as AccountType)}>
                  <SelectTrigger id="account-type" className="shadow-sm border-0">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Channel Partner">Channel Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="account-person-name">Contact Person Name</Label>
              <Input id="account-person-name" value={contactPersonName} onChange={(e) => setContactPersonName(e.target.value)} placeholder="e.g., Jane Doe" className="shadow-sm border-0" />
            </div>
            <div>
              <Label htmlFor="account-email">Contact Email</Label>
              <Input id="account-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="e.g., contact@acme.com" className="shadow-sm border-0" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="account-phone">Contact Phone</Label>
                <Input id="account-phone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="e.g., (555) 123-4567" className="shadow-sm border-0" />
              </div>
              <div className="flex-1">
                <Label htmlFor="account-industry">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger id="account-industry" className="shadow-sm border-0">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="account-description">Description</Label>
              <Textarea
                id="account-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief overview of the account..."
                rows={3}
                className="shadow-sm border-0 resize-none"
              />
            </div>
            {role === 'admin' && (
              <div>
                <Label htmlFor="account-owner">Assign Owner <span className="text-destructive">*</span></Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger id="account-owner" className="shadow-sm border-0">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </fieldset>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (selectedLeadToConvert && selectedLeadToConvert !== MANUAL_CREATE_VALUE ? "Convert Lead & Create Account" : "Create Account")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

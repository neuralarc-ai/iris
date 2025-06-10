
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
import { addAccount, getUnconvertedLeads, convertLeadToAccount } from '@/lib/data';
import { Loader2, PlusCircle, UserCheck, Users } from 'lucide-react';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountAdded?: (newAccount: Account) => void;
  // To refresh leads if one is converted via this dialog
  onLeadConverted?: (leadId: string, newAccountId: string) => void;
}

export default function AddAccountDialog({ open, onOpenChange, onAccountAdded, onLeadConverted }: AddAccountDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType | ''>('Client'); // Default to Client
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
  const [selectedLeadToConvert, setSelectedLeadToConvert] = useState<string | ''>('');


  useEffect(() => {
    if (open) {
      setAvailableLeads(getUnconvertedLeads());
      setSelectedLeadToConvert(''); // Reset on open
    }
  }, [open]);

  useEffect(() => {
    if (selectedLeadToConvert) {
      const lead = availableLeads.find(l => l.id === selectedLeadToConvert);
      if (lead) {
        setName(lead.companyName);
        setContactPersonName(lead.personName);
        setContactEmail(lead.email);
        setContactPhone(lead.phone || '');
        // Optionally set description or industry if available on lead
      }
    } else {
      // If no lead is selected for conversion, clear fields that might have been auto-filled
      // or allow manual entry (current behavior)
    }
  }, [selectedLeadToConvert, availableLeads]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
      let newAccount: Account | null = null;

      if (selectedLeadToConvert) {
        newAccount = convertLeadToAccount(selectedLeadToConvert);
        if (newAccount) {
           // If lead conversion also involves updating type/desc/industry directly, do it here
           // For now, convertLeadToAccount uses defaults, then these fields from the form could override.
           // This part might need refinement based on exact desired behavior for overrides.
           newAccount.name = name || newAccount.name;
           newAccount.type = type || newAccount.type;
           newAccount.description = description || newAccount.description;
           newAccount.industry = industry || newAccount.industry;
           newAccount.contactEmail = contactEmail || newAccount.contactEmail;
           newAccount.contactPersonName = contactPersonName || newAccount.contactPersonName;
           newAccount.contactPhone = contactPhone || newAccount.contactPhone;
           // Update mockAccounts array directly (or ideally use a state management solution)
           const accountIndex = mockAccounts.findIndex(acc => acc.id === newAccount!.id);
           if (accountIndex > -1) mockAccounts[accountIndex] = newAccount;


          toast({
            title: "Lead Converted to Account",
            description: `${newAccount.name} has been successfully created from lead.`,
            className: "bg-green-100 dark:bg-green-900 border-green-500"
          });
          onLeadConverted?.(selectedLeadToConvert, newAccount.id);
        } else {
          toast({ title: "Error", description: "Failed to convert selected lead.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
      } else {
        if (!name.trim() || !type) {
          toast({ title: "Error", description: "Account Name and Type are required for new accounts.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const newAccountData = {
          name,
          type,
          status: 'Active' as AccountStatus,
          description,
          contactEmail,
          contactPersonName,
          contactPhone,
          industry,
        };
        newAccount = addAccount(newAccountData);
        toast({
          title: "Account Created",
          description: `${newAccount.name} has been successfully added.`,
        });
      }

      if (newAccount) {
        onAccountAdded?.(newAccount);
      }
      resetForm();
      onOpenChange(false);

    } catch (error) {
      console.error("Failed to process account:", error);
      toast({ title: "Error", description: "Failed to process account. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('Client');
    setDescription('');
    setContactEmail('');
    setContactPersonName('');
    setContactPhone('');
    setIndustry('');
    setSelectedLeadToConvert('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[525px]">
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
              <UserCheck className="mr-2 h-4 w-4 text-primary"/> Convert an Existing Lead (Optional)
            </Label>
            <Select value={selectedLeadToConvert} onValueChange={(value) => setSelectedLeadToConvert(value)} disabled={isLoading}>
              <SelectTrigger id="convert-lead-select">
                <SelectValue placeholder="Select a lead to convert..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Create New Account Manually</SelectItem>
                {availableLeads.map(lead => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.companyName} ({lead.personName}) - {lead.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             {selectedLeadToConvert && <p className="text-xs text-muted-foreground">Selected lead details will pre-fill the form. You can edit them.</p>}
          </div>

          <fieldset disabled={isLoading} className="space-y-4">
            <div>
              <Label htmlFor="account-name">Account Name <span className="text-destructive">*</span></Label>
              <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Corp" />
            </div>
            <div>
              <Label htmlFor="account-type">Account Type <span className="text-destructive">*</span></Label>
              <Select value={type} onValueChange={(value: AccountType) => setType(value)}>
                <SelectTrigger id="account-type">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Channel Partner">Channel Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="account-person-name">Contact Person Name</Label>
              <Input id="account-person-name" value={contactPersonName} onChange={(e) => setContactPersonName(e.target.value)} placeholder="e.g., Jane Doe" />
            </div>
            <div>
              <Label htmlFor="account-email">Contact Email</Label>
              <Input id="account-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="e.g., contact@acme.com" />
            </div>
             <div>
              <Label htmlFor="account-phone">Contact Phone</Label>
              <Input id="account-phone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="e.g., (555) 123-4567" />
            </div>
            <div>
              <Label htmlFor="account-industry">Industry</Label>
              <Input id="account-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., Technology, Finance" />
            </div>
            <div>
              <Label htmlFor="account-description">Description</Label>
              <Textarea
                id="account-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief overview of the account..."
                rows={3}
              />
            </div>
          </fieldset>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (selectedLeadToConvert ? "Convert Lead & Create Account" : "Create Account")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

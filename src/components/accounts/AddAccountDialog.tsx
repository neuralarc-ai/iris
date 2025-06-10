
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
import { Loader2, PlusCircle, UserCheck } from 'lucide-react';

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
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      let newAccount: Account | null = null;

      if (selectedLeadToConvert && selectedLeadToConvert !== MANUAL_CREATE_VALUE) {
        const convertedAccount = convertLeadToAccount(selectedLeadToConvert);
        if (convertedAccount) {
           newAccount = {
             ...convertedAccount,
             name: name || convertedAccount.name, // Allow overriding pre-filled name
             type: type || convertedAccount.type,
             description: description || convertedAccount.description,
             industry: industry || convertedAccount.industry,
             contactEmail: contactEmail || convertedAccount.contactEmail,
             contactPersonName: contactPersonName || convertedAccount.contactPersonName,
             contactPhone: contactPhone || convertedAccount.contactPhone,
             updatedAt: new Date().toISOString()
           };
           // Update mockAccounts array directly if convertLeadToAccount doesn't handle updates to existing entries (it creates new)
           const accountIndex = mockAccounts.findIndex(acc => acc.id === newAccount!.id);
           if (accountIndex > -1) {
             mockAccounts[accountIndex] = newAccount;
           } else {
              // This case should ideally not happen if convertLeadToAccount adds it via addAccount
              mockAccounts.push(newAccount); 
           }


          toast({
            title: "Lead Converted to Account",
            description: `${newAccount.name} has been successfully created and updated.`,
            className: "bg-green-100 dark:bg-green-900 border-green-500"
          });
          onLeadConverted?.(selectedLeadToConvert, newAccount.id);
        } else {
          toast({ title: "Error", description: "Failed to convert selected lead. It might already be converted or lost.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
      } else {
        // This block handles manual creation (selectedLeadToConvert is '' or MANUAL_CREATE_VALUE)
        if (!name.trim() || !type) {
          toast({ title: "Error", description: "Account Name and Type are required for new accounts.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const newAccountData = {
          name,
          type,
          status: 'Active' as AccountStatus, // Default to Active
          description,
          contactEmail,
          contactPersonName,
          contactPhone,
          industry,
        };
        newAccount = addAccount(newAccountData); // addAccount adds to mockAccounts
        toast({
          title: "Account Created",
          description: `${newAccount.name} has been successfully added.`,
        });
      }

      if (newAccount) {
        onAccountAdded?.(newAccount);
      }
      resetFormFields(true); // Reset all including lead selection
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
            <Select 
              value={selectedLeadToConvert || undefined} // Use undefined if '' to show placeholder
              onValueChange={(value) => setSelectedLeadToConvert(value || '')} // Ensure '' if value becomes undefined/null from Select
              disabled={isLoading}
            >
              <SelectTrigger id="convert-lead-select">
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
            <div>
              <Label htmlFor="account-name">Account Name <span className="text-destructive">*</span></Label>
              <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Corp" />
            </div>
            <div>
              <Label htmlFor="account-type">Account Type <span className="text-destructive">*</span></Label>
              <Select value={type || undefined} onValueChange={(value: AccountType | undefined) => setType(value || 'Client')}>
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
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (selectedLeadToConvert && selectedLeadToConvert !== MANUAL_CREATE_VALUE ? "Convert Lead & Create Account" : "Create Account")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

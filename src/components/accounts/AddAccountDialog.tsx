"use client";

import React, { useState } from 'react';
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
import type { Account, AccountType, AccountStatus } from '@/types';
import { addAccount } from '@/lib/data'; // Assuming you'll add this function to lib/data.ts
import { Loader2, PlusCircle } from 'lucide-react';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountAdded?: (newAccount: Account) => void;
}

export default function AddAccountDialog({ open, onOpenChange, onAccountAdded }: AddAccountDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType | ''>('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type) {
      toast({ title: "Error", description: "Account Name and Type are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      // Simulate API call or data saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAccountData = {
        name,
        type,
        status: 'Active' as AccountStatus, // Default status
        description,
        contactEmail,
        industry,
      };
      const newAccount = addAccount(newAccountData); // This function needs to be created in lib/data.ts
      
      toast({
        title: "Account Created",
        description: `${name} has been successfully added.`,
      });
      
      onAccountAdded?.(newAccount);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create account:", error);
      toast({ title: "Error", description: "Failed to create account. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('');
    setDescription('');
    setContactEmail('');
    setIndustry('');
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
            Fill in the details below to create a new client or partner account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="account-name">Account Name <span className="text-destructive">*</span></Label>
            <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Corp" disabled={isLoading} />
          </div>
          <div>
            <Label htmlFor="account-type">Account Type <span className="text-destructive">*</span></Label>
            <Select value={type} onValueChange={(value: AccountType) => setType(value)} disabled={isLoading}>
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
            <Label htmlFor="account-email">Contact Email</Label>
            <Input id="account-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="e.g., contact@acme.com" disabled={isLoading} />
          </div>
           <div>
            <Label htmlFor="account-industry">Industry</Label>
            <Input id="account-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., Technology, Finance" disabled={isLoading} />
          </div>
          <div>
            <Label htmlFor="account-description">Description</Label>
            <Textarea 
              id="account-description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Brief overview of the account..." 
              disabled={isLoading}
              rows={3}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

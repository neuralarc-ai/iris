
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { addLead } from '@/lib/data';
import { Loader2, UserPlus } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const newLeadData = {
        companyName,
        personName,
        email,
        phone,
      };
      const newLead = addLead(newLeadData); 
      
      toast({
        title: "Lead Created",
        description: `${personName} from ${companyName} has been successfully added as a lead.`,
      });
      
      onLeadAdded?.(newLead);
      resetForm();
      onOpenChange(false);
    } catch (error)
        {
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
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" /> Add New Lead
          </DialogTitle>
          <DialogDescription>
            Enter the details below to create a new lead.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="lead-company-name">Company Name <span className="text-destructive">*</span></Label>
            <Input id="lead-company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., Acme Innovations" disabled={isLoading} />
          </div>
          <div>
            <Label htmlFor="lead-person-name">Person's Name <span className="text-destructive">*</span></Label>
            <Input id="lead-person-name" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="e.g., John Doe" disabled={isLoading} />
          </div>
           <div>
            <Label htmlFor="lead-email">Email <span className="text-destructive">*</span></Label>
            <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john.doe@acme.com" disabled={isLoading} />
          </div>
           <div>
            <Label htmlFor="lead-phone">Phone</Label>
            <Input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., (555) 123-4567" disabled={isLoading} />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

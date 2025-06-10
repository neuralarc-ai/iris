
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
import type { Opportunity, Account } from '@/types';
import { addOpportunity, mockAccounts } from '@/lib/data';
import { Loader2, BarChartBig, Briefcase } from 'lucide-react';

interface AddOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpportunityAdded?: (newOpportunity: Opportunity) => void;
}

export default function AddOpportunityDialog({ open, onOpenChange, onOpportunityAdded }: AddOpportunityDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState<number | string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | ''>('');

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedAccountId || value === '' || Number(value) <= 0) {
      toast({ title: "Error", description: "Opportunity Name, associated Account, and a valid positive Quoted Amount are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newOpportunityData = {
        name,
        description,
        value: Number(value),
        accountId: selectedAccountId,
      };
      const newOpportunity = addOpportunity(newOpportunityData);
      
      toast({
        title: "Opportunity Created",
        description: `Opportunity "${name}" has been successfully added for account ${mockAccounts.find(a => a.id === selectedAccountId)?.name}.`,
      });
      
      onOpportunityAdded?.(newOpportunity);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create opportunity:", error);
      toast({ title: "Error", description: "Failed to create opportunity. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setValue('');
    setSelectedAccountId('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChartBig className="mr-2 h-5 w-5" /> Add New Opportunity
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new sales opportunity for an existing account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="opportunity-name">Opportunity Name <span className="text-destructive">*</span></Label>
            <Input id="opportunity-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Q4 Enterprise Deal" disabled={isLoading} />
          </div>
          
          <div>
            <Label htmlFor="opportunity-account">Associated Account <span className="text-destructive">*</span></Label>
            <Select value={selectedAccountId} onValueChange={(value: string) => setSelectedAccountId(value)} disabled={isLoading}>
              <SelectTrigger id="opportunity-account">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {mockAccounts.filter(account => account.status === 'Active').map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center">
                      <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                      {account.name} ({account.type})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="opportunity-description">Description</Label>
            <Textarea
              id="opportunity-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of the opportunity, client needs, etc."
              disabled={isLoading}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="opportunity-value">Quoted Amount <span className="text-destructive">*</span></Label>
            <Input
              id="opportunity-value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., 50000"
              disabled={isLoading}
              min="0"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Opportunity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

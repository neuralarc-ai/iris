
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
import type { Account, Opportunity, Update, UpdateType } from '@/types';
import { mockAccounts, getOpportunitiesByAccount, addUpdate } from '@/lib/data';
import { Loader2, MessageSquarePlus, Briefcase, BarChartBig } from 'lucide-react';

interface AddUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAdded: (newUpdate: Update) => void;
}

const updateTypeOptions: UpdateType[] = ["General", "Call", "Meeting", "Email"];

export default function AddUpdateDialog({ open, onOpenChange, onUpdateAdded }: AddUpdateDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [availableOpportunities, setAvailableOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
  const [updateType, setUpdateType] = useState<UpdateType | ''>('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedAccountId) {
      setAvailableOpportunities(getOpportunitiesByAccount(selectedAccountId));
      setSelectedOpportunityId(''); 
    } else {
      setAvailableOpportunities([]);
      setSelectedOpportunityId('');
    }
  }, [selectedAccountId]);

  const resetForm = () => {
    setSelectedAccountId('');
    setAvailableOpportunities([]);
    setSelectedOpportunityId('');
    setUpdateType('');
    setContent('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !selectedOpportunityId || !updateType || !content.trim()) {
      toast({ title: "Error", description: "All fields (Account, Opportunity, Type, and Content) are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 700));

      const newUpdate = addUpdate({
        opportunityId: selectedOpportunityId,
        type: updateType as UpdateType,
        content: content,
        // updatedByUserId could be passed from useAuth if available
      });
      
      toast({
        title: "Update Logged",
        description: `Communication update for opportunity "${availableOpportunities.find(op=>op.id === selectedOpportunityId)?.name}" has been logged.`,
      });
      
      onUpdateAdded(newUpdate);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to log update:", error);
      toast({ title: "Error", description: "Failed to log update. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquarePlus className="mr-2 h-5 w-5" /> Log New Update
          </DialogTitle>
          <DialogDescription>
            Select an account and opportunity, then describe the communication update.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="update-account">Account <span className="text-destructive">*</span></Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={isLoading}>
              <SelectTrigger id="update-account">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {mockAccounts.filter(acc => acc.status === 'Active').map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center">
                      <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                      {account.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAccountId && (
            <div>
              <Label htmlFor="update-opportunity">Opportunity <span className="text-destructive">*</span></Label>
              <Select value={selectedOpportunityId} onValueChange={setSelectedOpportunityId} disabled={isLoading || availableOpportunities.length === 0}>
                <SelectTrigger id="update-opportunity">
                  <SelectValue placeholder={availableOpportunities.length === 0 ? "No opportunities for this account" : "Select an opportunity"} />
                </SelectTrigger>
                <SelectContent>
                  {availableOpportunities.map(opportunity => (
                    <SelectItem key={opportunity.id} value={opportunity.id}>
                       <div className="flex items-center">
                        <BarChartBig className="mr-2 h-4 w-4 text-muted-foreground" />
                        {opportunity.name}
                       </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableOpportunities.length === 0 && selectedAccountId && !isLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  This account has no active opportunities. Please create an opportunity for this account first.
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="update-type">Update Type <span className="text-destructive">*</span></Label>
            <Select value={updateType} onValueChange={(value) => setUpdateType(value as UpdateType)} disabled={isLoading}>
              <SelectTrigger id="update-type">
                <SelectValue placeholder="Select update type" />
              </SelectTrigger>
              <SelectContent>
                {updateTypeOptions.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="update-content">Content <span className="text-destructive">*</span></Label>
            <Textarea
              id="update-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the call, meeting, email, or general update..."
              rows={5}
              disabled={isLoading}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedOpportunityId || (availableOpportunities.length === 0 && !!selectedAccountId) }>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

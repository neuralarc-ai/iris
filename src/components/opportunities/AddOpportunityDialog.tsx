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
import type { Opportunity, Account } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, BarChartBig, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Calendar } from '@/components/ui/calendar';
import { OpportunityStatus } from '@/types';

interface AddOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpportunityAdded?: (newOpportunity: Opportunity) => void;
  accountId?: string | null;
}

export default function AddOpportunityDialog({ open, onOpenChange, onOpportunityAdded, accountId }: AddOpportunityDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState<number | string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | ''>(accountId || '');

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [role, setRole] = useState<string>('user');
  const [ownerId, setOwnerId] = useState<string>('');
  const [status, setStatus] = useState<OpportunityStatus>('Need Analysis');
  const [expectedCloseDate, setExpectedCloseDate] = useState<Date | undefined>(undefined);

  const opportunityStatusOptions: OpportunityStatus[] = [
    'Scope Of Work', 'Proposal', 'Negotiation', 'Win', 'Loss', 'On Hold'
  ];

  useEffect(() => {
    if (open) {
      setSelectedAccountId(accountId || '');
      const fetchData = async () => {
        const { data, error } = await supabase.from('account').select('*').eq('status', 'Active');
        if (!error && data) setAccounts(data);
        else setAccounts([]);
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
  }, [open, accountId]);

  useEffect(() => {
    if (role === 'admin' && selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      if (account && account.owner_id) setOwnerId(account.owner_id);
    }
  }, [selectedAccountId, accounts, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedAccountId || value === '' || Number(value) <= 0 || !status || !expectedCloseDate) {
      toast({ title: "Error", description: "All required fields must be filled, including Status and Expected Close Date.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      if (!ownerId) throw new Error('User not authenticated');
      const now = new Date();
      const startDate = now.toISOString();
      const endDate = expectedCloseDate.toISOString();
      const { data, error } = await supabase.from('opportunity').insert([
        {
          name,
          description,
          value: Number(value),
          account_id: selectedAccountId,
          status,
          start_date: startDate,
          end_date: endDate,
          owner_id: ownerId,
        }
      ]).select().single();
      if (error || !data) throw error || new Error('Failed to create opportunity');
      toast({
        title: "Opportunity Created",
        description: `Opportunity "${name}" has been successfully added for account ${accounts.find(a => a.id === selectedAccountId)?.name}.`,
      });
      onOpportunityAdded?.(data);
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
    setOwnerId('');
    setStatus('Need Analysis');
    setExpectedCloseDate(undefined);
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
            <Select value={selectedAccountId} onValueChange={(value: string) => setSelectedAccountId(value)} disabled={isLoading || !!accountId}>
              <SelectTrigger id="opportunity-account">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
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

          {role === 'admin' && (
            <div>
              <Label htmlFor="opportunity-owner">Assigned To <span className="text-destructive">*</span></Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger id="opportunity-owner">
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

          <div>
            <Label htmlFor="opportunity-status">Status <span className="text-destructive">*</span></Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="opportunity-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {opportunityStatusOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="opportunity-expected-close">Expected Close Date <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-2">
              <Calendar
                mode="single"
                selected={expectedCloseDate}
                onSelect={setExpectedCloseDate}
                initialFocus
              />
              {expectedCloseDate && (
                <span className="text-xs text-muted-foreground ml-2">{expectedCloseDate.toLocaleDateString()}</span>
              )}
            </div>
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

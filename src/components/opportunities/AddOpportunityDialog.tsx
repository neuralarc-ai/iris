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
import type { Opportunity, Account, Lead } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, BarChartBig, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Calendar } from '@/components/ui/calendar';
import { OpportunityStatus } from '@/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { countries } from '@/lib/countryData';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface AddOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpportunityAdded?: (newOpportunity: Opportunity) => void;
  accountId?: string | null;
}

// Helper to format with commas
function formatNumberWithCommas(value: string | number) {
  const num = typeof value === 'number' ? value : Number(value.replace(/,/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString();
}

export default function AddOpportunityDialog({ open, onOpenChange, onOpportunityAdded, accountId }: AddOpportunityDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | ''>(accountId || '');
  const [associateWith, setAssociateWith] = useState<'account' | 'lead'>('account');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [role, setRole] = useState<string>('user');
  const [ownerId, setOwnerId] = useState<string>('');
  const [status, setStatus] = useState<OpportunityStatus>('Scope Of Work');
  const [expectedCloseDate, setExpectedCloseDate] = useState<Date | undefined>(undefined);
  const [currency, setCurrency] = useState('USD');

  const opportunityStatusOptions: OpportunityStatus[] = [
    'Scope Of Work', 'Proposal', 'Negotiation', 'Win', 'Loss', 'On Hold'
  ];

  // Get unique currencies
  const uniqueCurrencies = Array.from(
    new Map(
      countries.map(c => [c.currencyCode, { code: c.currencyCode, name: c.currencyName, symbol: c.currencySymbol }])
    ).values()
  );

  useEffect(() => {
    if (open) {
      setSelectedAccountId(accountId || '');
      setAssociateWith(accountId ? 'account' : 'account');
      const fetchData = async () => {
        const { data: accountsData, error: accountsError } = await supabase.from('account').select('*').eq('status', 'Active');
        if (!accountsError && accountsData) setAccounts(accountsData);
        else setAccounts([]);
        // Fetch leads that are not converted or lost
        const { data: leadsData, error: leadsError } = await supabase.from('lead').select('*').not('status', 'in', '("Converted to Account","Lost")');
        if (!leadsError && leadsData) setLeads(leadsData);
        else setLeads([]);
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
      if (account) {
        // For now, use the current user as owner since Account doesn't have owner_id
        const userId = localStorage.getItem('user_id');
        if (userId) setOwnerId(userId);
      }
    }
  }, [selectedAccountId, accounts, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAccount = associateWith === 'account';
    const assocId = isAccount ? selectedAccountId : selectedLeadId;
    if (!name.trim() || !assocId || value === '' || Number(value) <= 0 || !status || !expectedCloseDate || !currency) {
      toast({ title: "Error", description: "All required fields must be filled, including Status, Expected Close Date, and Currency.", variant: "destructive" });
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
          value: Number(value.replace(/,/g, '')),
          account_id: isAccount ? assocId : null,
          lead_id: isAccount ? null : assocId,
          status,
          start_date: startDate,
          end_date: endDate,
          owner_id: ownerId,
          currency: currency || 'USD',
        }
      ]).select().single();
      if (error || !data) throw error || new Error('Failed to create opportunity');
      toast({
        title: "Opportunity Created",
        description: `Opportunity "${name}" has been successfully added for ${isAccount ? 'account ' + accounts.find(a => a.id === selectedAccountId)?.name : 'lead ' + leads.find(l => l.id === selectedLeadId)?.companyName}.`,
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
    setSelectedLeadId('');
    setOwnerId('');
    setStatus('Scope Of Work');
    setExpectedCloseDate(undefined);
    setCurrency('USD');
    setAssociateWith('account');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[525px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChartBig className="mr-2 h-5 w-5" /> Add New Opportunity
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new sales opportunity for an existing account or lead.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="opportunity-name">Opportunity Name <span className="text-destructive">*</span></Label>
            <Input id="opportunity-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Q4 Enterprise Deal" disabled={isLoading} />
          </div>
          <div>
            <Label>Associate With <span className="text-destructive">*</span></Label>
            <RadioGroup className="flex flex-row gap-4 mt-1" value={associateWith} onValueChange={(value) => setAssociateWith(value as 'account' | 'lead')}>
              <RadioGroupItem value="account" id="associate-account" />
              <Label htmlFor="associate-account" className="mr-4">Account</Label>
              <RadioGroupItem value="lead" id="associate-lead" />
              <Label htmlFor="associate-lead">Lead</Label>
            </RadioGroup>
          </div>
          {associateWith === 'account' ? (
            <div>
              <Label htmlFor="opportunity-account">Associated Account <span className="text-destructive">*</span></Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={isLoading || !!accountId}>
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
          ) : (
            <div>
              <Label htmlFor="opportunity-lead">Associated Lead <span className="text-destructive">*</span></Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId} disabled={isLoading}>
                <SelectTrigger id="opportunity-lead">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      <div className="flex items-center">
                        {(lead.personName && lead.companyName)
                          ? `${lead.personName} - ${lead.companyName}`
                          : (lead.personName || lead.companyName || lead.email || 'Unnamed Lead')}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="opportunity-status">Status <span className="text-destructive">*</span></Label>
              <Select value={status} onValueChange={(value: OpportunityStatus) => setStatus(value)}>
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
            <div className="flex-1">
              <Label htmlFor="opportunity-expected-close">Expected Close Date <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Input
                    id="opportunity-expected-close"
                    type="text"
                    readOnly
                    value={expectedCloseDate ? format(expectedCloseDate, 'MMM dd, yyyy') : ''}
                    placeholder="Select expected close date"
                    className="w-full cursor-pointer"
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expectedCloseDate}
                    onSelect={setExpectedCloseDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="opportunity-value">Quoted Amount <span className="text-destructive">*</span></Label>
              <Input
                id="opportunity-value"
                type="text"
                value={formatNumberWithCommas(value)}
                onChange={e => {
                  // Remove commas before saving to state
                  const raw = e.target.value.replace(/,/g, '');
                  // Only allow numbers
                  if (/^\d*$/.test(raw)) setValue(raw);
                }}
                placeholder="e.g., 5,000,000"
                disabled={isLoading}
                min="0"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="opportunity-currency">Currency <span className="text-destructive">*</span></Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="opportunity-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCurrencies.map(cur => (
                    <SelectItem key={cur.code} value={cur.code}>
                      {cur.name} ({cur.symbol || cur.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              className='resize-none'
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="add" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Opportunity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

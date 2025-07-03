"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Account, Opportunity, Update, UpdateType, Lead } from '@/types';
import { Loader2, PlusCircle, Briefcase, BarChartBig, User, CalendarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface AddUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAdded: (newUpdate: Update) => void;
}

const updateTypeOptions: UpdateType[] = ["General", "Call", "Meeting", "Email"];
type EntityType = "account" | "opportunity" | "lead";

export default function AddUpdateDialog({ open, onOpenChange, onUpdateAdded }: AddUpdateDialogProps) {
  const [entityType, setEntityType] = useState<EntityType>("account");
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [availableOpportunities, setAvailableOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
  const [updateType, setUpdateTypeState] = useState<UpdateType | ''>('');
  const [content, setContent] = useState('');
  const [activityDate, setActivityDate] = useState<Date | undefined>(undefined);
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { toast } = useToast();

  // Search states for dropdowns
  const [accountSearch, setAccountSearch] = useState('');
  const [opportunitySearch, setOpportunitySearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      const localUserId = localStorage.getItem('user_id');
      if (!localUserId) return;

      // Fetch user role
      const { data: userData } = await supabase.from('users').select('role').eq('id', localUserId).single();
      const userRole = userData?.role || 'user';

      // Fetch leads
      let leadsQuery = supabase.from('lead').select('*').order('updated_at', { ascending: false });
      if (userRole !== 'admin') {
        leadsQuery = leadsQuery.eq('owner_id', localUserId);
      }
      const { data: leadsData } = await leadsQuery;
      
      if (leadsData) {
        const transformedLeads = leadsData.map((lead: any) => ({
          id: lead.id,
          companyName: lead.company_name || '',
          personName: lead.person_name || '',
          phone: lead.phone || '',
          email: lead.email || '',
          linkedinProfileUrl: lead.linkedin_profile_url || '',
          country: lead.country || '',
          status: lead.status || 'New',
          opportunityIds: [],
          updateIds: [],
          createdAt: lead.created_at || new Date().toISOString(),
          updatedAt: lead.updated_at || new Date().toISOString(),
          assignedUserId: lead.owner_id || '',
          rejectionReasons: [],
        }));
        setLeads(transformedLeads.filter(lead => lead.status !== 'Converted to Account' && lead.status !== 'Lost'));
      }

      // Fetch accounts
      let accountsQuery = supabase.from('account').select('*').order('updated_at', { ascending: false });
      if (userRole !== 'admin') {
        accountsQuery = accountsQuery.eq('owner_id', localUserId);
      }
      const { data: accountsData } = await accountsQuery;
      
      if (accountsData) {
        const transformedAccounts = accountsData.map((account: any) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          status: account.status,
          description: account.description || '',
          contactEmail: account.contact_email || '',
          industry: account.industry || '',
          contactPersonName: account.contact_person_name || '',
          contactPhone: account.contact_phone || '',
          convertedFromLeadId: account.converted_from_lead_id,
          opportunityIds: [],
          createdAt: account.created_at || new Date().toISOString(),
          updatedAt: account.updated_at || new Date().toISOString(),
        }));
        setAccounts(transformedAccounts.filter(account => account.status === 'Active'));
      }

      // Fetch opportunities
      let opportunitiesQuery = supabase.from('opportunity').select('*').order('updated_at', { ascending: false });
      if (userRole !== 'admin') {
        opportunitiesQuery = opportunitiesQuery.eq('owner_id', localUserId);
      }
      const { data: opportunitiesData } = await opportunitiesQuery;
      
      if (opportunitiesData) {
        const transformedOpportunities = opportunitiesData.map((opp: any) => ({
          id: opp.id,
          name: opp.name,
          accountId: opp.account_id,
          status: opp.status,
          value: opp.value || 0,
          description: opp.description || '',
          startDate: opp.start_date || new Date().toISOString(),
          endDate: opp.end_date || new Date().toISOString(),
          updateIds: [],
          createdAt: opp.created_at || new Date().toISOString(),
          updatedAt: opp.updated_at || new Date().toISOString(),
        }));
        setAvailableOpportunities(transformedOpportunities);
      }

      setIsLoadingData(false);
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const resetForm = () => {
    setEntityType("account");
    setSelectedLeadId('');
    setSelectedAccountId('');
    setAvailableOpportunities([]);
    setSelectedOpportunityId('');
    setUpdateTypeState('');
    setContent('');
    setActivityDate(undefined);
    setNextActionDate(undefined);
    setAccountSearch('');
    setOpportunitySearch('');
    setLeadSearch('');
  };

  const addUpdateToSupabase = async (updateData: any): Promise<Update> => {
    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) throw new Error('User not authenticated');

    const { data, error } = await supabase.from('update').insert([
      {
        type: updateData.type,
        content: updateData.content,
        updated_by_user_id: currentUserId,
        date: updateData.activityDate ? updateData.activityDate.toISOString() : new Date().toISOString(),
        lead_id: updateData.leadId || null,
        opportunity_id: updateData.opportunityId || null,
        account_id: updateData.accountId || null,
        next_action_date: updateData.nextActionDate || null,
      }
    ]).select().single();

    if (error || !data) throw error || new Error('Failed to create update');

    // Transform the response to match Update interface
    return {
      id: data.id,
      type: data.type,
      content: data.content || '',
      updatedByUserId: data.updated_by_user_id,
      date: data.date || data.created_at || new Date().toISOString(),
      createdAt: data.created_at || new Date().toISOString(),
      leadId: data.lead_id,
      opportunityId: data.opportunity_id,
      accountId: data.account_id,
      nextActionDate: data.next_action_date,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = false;
    if (entityType === "lead") {
        isValid = !!selectedLeadId && !!updateType && !!content.trim();
    } else if (entityType === "opportunity") {
        isValid = !!selectedOpportunityId && !!updateType && !!content.trim();
    } else { // account
        isValid = !!selectedAccountId && !!updateType && !!content.trim();
    }

    // Must select either activityDate or nextActionDate, not both, not neither
    if ((!activityDate && !nextActionDate) || (activityDate && nextActionDate)) {
      toast({
        title: "Error",
        description: "Please select either an Activity Date or a Next Action Date (not both).",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      let newUpdateData;
      let successMessage = "";

      if (entityType === "lead") {
        newUpdateData = {
          leadId: selectedLeadId,
          type: updateType as UpdateType,
          content: content,
          nextActionDate: nextActionDate?.toISOString() || null,
          activityDate: activityDate || null,
        };
        const lead = leads.find(l => l.id === selectedLeadId);
        successMessage = `Update for lead "${lead?.companyName}" has been logged.`
      } else if (entityType === "opportunity") {
        const selectedOpportunity = availableOpportunities.find(op => op.id === selectedOpportunityId);
        newUpdateData = {
          opportunityId: selectedOpportunityId,
          accountId: selectedOpportunity?.accountId || null,
          type: updateType as UpdateType,
          content: content,
          nextActionDate: nextActionDate?.toISOString() || null,
          activityDate: activityDate || null,
        };
        successMessage = `Update for opportunity "${selectedOpportunity?.name}" has been logged.`
      } else { // account
        newUpdateData = {
          accountId: selectedAccountId,
          type: updateType as UpdateType,
          content: content,
          nextActionDate: nextActionDate?.toISOString() || null,
          activityDate: activityDate || null,
        };
        const account = accounts.find(acc => acc.id === selectedAccountId);
        successMessage = `Update for account "${account?.name}" has been logged.`
      }
      
      const newUpdateResult = await addUpdateToSupabase(newUpdateData);
      
      toast({
        title: "Update Logged",
        description: successMessage,
      });
      
      onUpdateAdded(newUpdateResult);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to log update:", error);
      toast({ title: "Error", description: "Failed to log update. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Mutually exclusive date logic
  const handleActivityDateChange = (date: Date | undefined) => {
    setActivityDate(date);
    if (date) setNextActionDate(undefined);
  };
  const handleNextActionDateChange = (date: Date | undefined) => {
    setNextActionDate(date);
    if (date) setActivityDate(undefined);
  };

  if (isLoadingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>
              <span className="sr-only">Loading Data</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg focus-within:ring-0 focus-within:outline-none bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5 text-[#916D5B]" /> Add New Activity
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
          
          <div>
            <Label className="mb-2 block">Log Update For:</Label>
            <RadioGroup defaultValue="account" value={entityType} onValueChange={(value: EntityType) => setEntityType(value)} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lead" id="rLead" />
                <Label htmlFor="rLead" className="font-normal">Lead</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="account" id="rAccount" />
                <Label htmlFor="rAccount" className="font-normal">Account</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="opportunity" id="rOpportunity" />
                <Label htmlFor="rOpportunity" className="font-normal">Opportunity</Label>
              </div>
            </RadioGroup>
          </div>

          {entityType === 'lead' && (
            <div>
              <Label htmlFor="update-lead">Lead <span className="text-destructive">*</span></Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId} disabled={isLoading}>
                <SelectTrigger id="update-lead">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search leads..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="mb-2"
                    />
                  </div>
                  {leads
                    .filter(lead => 
                      lead.personName.toLowerCase().includes(leadSearch.toLowerCase()) ||
                      lead.companyName.toLowerCase().includes(leadSearch.toLowerCase()) ||
                      lead.email.toLowerCase().includes(leadSearch.toLowerCase())
                    )
                    .map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          {lead.personName} ({lead.companyName})
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {entityType === 'account' && (
            <div>
              <Label htmlFor="update-account">Account <span className="text-destructive">*</span></Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={isLoading}>
                <SelectTrigger id="update-account">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search accounts..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="mb-2"
                    />
                  </div>
                  {accounts
                    .filter(account => 
                      account.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
                      (account.contactEmail || '').toLowerCase().includes(accountSearch.toLowerCase()) ||
                      (account.contactPersonName || '').toLowerCase().includes(accountSearch.toLowerCase())
                    )
                    .map(account => (
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
          )}

          {entityType === 'opportunity' && (
            <div>
              <Label htmlFor="update-opportunity">Opportunity <span className="text-destructive">*</span></Label>
              <Select 
                value={selectedOpportunityId} 
                onValueChange={setSelectedOpportunityId} 
                disabled={isLoading || availableOpportunities.length === 0}
              >
                <SelectTrigger id="update-opportunity">
                  <SelectValue placeholder={availableOpportunities.length === 0 ? "No opportunities available" : "Select an opportunity"} />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search opportunities..."
                      value={opportunitySearch}
                      onChange={(e) => setOpportunitySearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="mb-2"
                    />
                  </div>
                  {availableOpportunities
                    .filter(opportunity => {
                      const account = accounts.find(acc => acc.id === opportunity.accountId);
                      return (
                        opportunity.name.toLowerCase().includes(opportunitySearch.toLowerCase()) ||
                        (account?.name || '').toLowerCase().includes(opportunitySearch.toLowerCase()) ||
                        opportunity.description.toLowerCase().includes(opportunitySearch.toLowerCase())
                      );
                    })
                    .map(opportunity => {
                      const account = accounts.find(acc => acc.id === opportunity.accountId);
                      return (
                        <SelectItem key={opportunity.id} value={opportunity.id}>
                           <div className="flex items-center">
                            <BarChartBig className="mr-2 h-4 w-4 text-muted-foreground" />
                            {opportunity.name} ({account?.name || 'Unknown Account'})
                           </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {availableOpportunities.length === 0 && !isLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  No opportunities available. Please create an opportunity first.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="update-type">Update Type <span className="text-destructive">*</span></Label>
              <Select value={updateType} onValueChange={(value) => setUpdateTypeState(value as UpdateType)} disabled={isLoading}>
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
          </div>

          {/* Date Pickers */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="activity-date">Activity Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Input
                    id="activity-date"
                    type="text"
                    value={activityDate ? format(activityDate, 'dd/MM/yyyy') : ''}
                    placeholder="dd/mm/yyyy"
                    readOnly
                    disabled={isLoading || !!nextActionDate}
                    className="cursor-pointer bg-white"
                  />
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-auto border-none bg-[#CFD4C9] rounded-sm">
                  <Calendar
                    mode="single"
                    selected={activityDate}
                    onSelect={handleActivityDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <Label htmlFor="next-action-date">Next Action Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Input
                    id="next-action-date"
                    type="text"
                    value={nextActionDate ? format(nextActionDate, 'dd/MM/yyyy') : ''}
                    placeholder="dd/mm/yyyy"
                    readOnly
                    disabled={isLoading || !!activityDate}
                    className="cursor-pointer bg-white"
                  />
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-auto border-none bg-[#CFD4C9] rounded-sm">
                  <Calendar
                    mode="single"
                    selected={nextActionDate}
                    onSelect={handleNextActionDateChange}
                    initialFocus
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      return date <= today;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
                type="submit" 
                variant="add"
                disabled={
                    isLoading || 
                    (entityType === 'opportunity' && !selectedOpportunityId) ||
                    (entityType === 'lead' && !selectedLeadId) ||
                    (entityType === 'account' && !selectedAccountId)
                }
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

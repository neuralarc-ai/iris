"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import type { Opportunity, OpportunityStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { ListFilter, Search, BarChartBig } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AddOpportunityDialog from '@/components/opportunities/AddOpportunityDialog';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

interface OpportunityData {
  id: string;
  name: string;
  account_id?: string;
  status: OpportunityStatus;
  value: number;
  description: string;
  start_date: string;
  end_date: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  currency?: string;
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<string | 'all'>('all');
  const [isAddOpportunityDialogOpen, setIsAddOpportunityDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const localUserId = localStorage.getItem('user_id');
      if (!localUserId) {
        setIsLoading(false);
        return;
      }
      
      // Fetch user role
      const { data: userData } = await supabase.from('users').select('role').eq('id', localUserId).single();
      const userRole = userData?.role || 'user';
      
      // Fetch accounts
      const { data: accountsData } = await supabase.from('account').select('id, name');
      setAccounts(accountsData || []);
      
      // Fetch opportunities
      let query = supabase.from('opportunity').select('*').order('updated_at', { ascending: false });
      if (userRole !== 'admin') {
        query = query.eq('owner_id', localUserId);
      }
      const { data, error } = await query;
      if (!error && data) {
        setOpportunities(data);
      } else {
        setOpportunities([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [isAddOpportunityDialogOpen]);

  const opportunityStatusOptions: OpportunityStatus[] = ["Scope Of Work", "Proposal", "Negotiation", "On Hold", "Win", "Loss"];
  const accountOptions = accounts.map(account => ({ id: account.id, name: account.name }));

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opportunity.status === statusFilter;
    const matchesAccount = accountFilter === 'all' || opportunity.account_id === accountFilter;
    return matchesSearch && matchesStatus && matchesAccount;
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const handleOpportunityAdded = (newOpportunity: Opportunity) => {
    // Convert Opportunity to OpportunityData format for state
    const opportunityData: OpportunityData = {
      id: newOpportunity.id,
      name: newOpportunity.name,
      account_id: newOpportunity.accountId,
      status: newOpportunity.status,
      value: newOpportunity.value,
      description: newOpportunity.description,
      start_date: newOpportunity.startDate,
      end_date: newOpportunity.endDate,
      owner_id: '', // Will be set by the dialog
      created_at: newOpportunity.createdAt,
      updated_at: newOpportunity.updatedAt,
      currency: newOpportunity.currency || 'USD',
    };
    setOpportunities(prevOpportunities => [opportunityData, ...prevOpportunities.filter(op => op.id !== newOpportunity.id)]);
  };

  function mapOpportunityFromSupabase(opp: OpportunityData): Opportunity {
    return {
      id: opp.id,
      name: opp.name,
      accountId: opp.account_id,
      status: opp.status,
      value: opp.value,
      description: opp.description,
      startDate: opp.start_date,
      endDate: opp.end_date,
      updateIds: [], // Not implemented yet
      createdAt: opp.created_at,
      updatedAt: opp.updated_at,
      currency: opp.currency || 'USD',
      ownerId: opp.owner_id,
    };
  }

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] px-4 mx-auto w-full space-y-6">
      <PageTitle title="Opportunity Management" subtitle="Track and manage all ongoing and potential sales opportunities.">
        <Button onClick={() => setIsAddOpportunityDialogOpen(true)} variant="add" className='w-fit'>
          <Image src="/images/add.svg" alt="Add" width={20} height={20} className="mr-2" /> Add New Opportunity
        </Button>
      </PageTitle>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary"/> Filter & Search Opportunities
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="search-opportunities">Search Opportunities</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-opportunities"
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value: OpportunityStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger id="status-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {opportunityStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="account-filter">Account</Label>
              <Select value={accountFilter} onValueChange={(value: string | 'all') => setAccountFilter(value)}>
                <SelectTrigger id="account-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accountOptions.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={mapOpportunityFromSupabase(opportunity)}
              accountName={accounts.find(a => a.id === opportunity.account_id)?.name || ''}
              onStatusChange={newStatus => {
                setOpportunities(prev =>
                  prev.map(op =>
                    op.id === opportunity.id ? { ...op, status: newStatus } : op
                  )
                );
              }}
              onValueChange={newValue => {
                setOpportunities(prev =>
                  prev.map(op =>
                    op.id === opportunity.id ? { ...op, value: newValue } : op
                  )
                );
              }}
              onTimelineChange={(newStartDate, newEndDate) => {
                setOpportunities(prev =>
                  prev.map(op =>
                    op.id === opportunity.id ? { ...op, start_date: newStartDate, end_date: newEndDate } : op
                  )
                );
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BarChartBig className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Opportunities Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new opportunity.</p>
        </div>
      )}
      <AddOpportunityDialog 
        open={isAddOpportunityDialogOpen} 
        onOpenChange={setIsAddOpportunityDialogOpen}
        onOpportunityAdded={handleOpportunityAdded} 
      />
    </div>
  );
}

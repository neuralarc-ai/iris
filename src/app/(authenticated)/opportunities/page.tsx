
"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import { mockOpportunities as initialMockOpportunities, mockAccounts, mockLeads } from '@/lib/data';
import type { Opportunity, OpportunityStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter, Search, BarChartBig } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AddOpportunityDialog from '@/components/opportunities/AddOpportunityDialog';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialMockOpportunities);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<string | 'all'>('all'); 
  const [isAddOpportunityDialogOpen, setIsAddOpportunityDialogOpen] = useState(false);

  const opportunityStatusOptions: OpportunityStatus[] = ["Need Analysis", "Negotiation", "In Progress", "On Hold", "Completed", "Cancelled"];

  const accountOptions = mockAccounts.map(account => ({ id: account.id, name: account.name }));

  useEffect(() => {
    // This effect ensures that if mockOpportunities is updated (e.g. by adding through dialog), the local state reflects it.
    // However, addOpportunity in lib/data.ts modifies the array directly, so this might just re-sync.
    // For a more robust solution with external data, you'd fetch/re-fetch here.
    setOpportunities([...initialMockOpportunities]);
  }, []);


  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opportunity.status === statusFilter;
    const matchesAccount = accountFilter === 'all' || opportunity.accountId === accountFilter;
    return matchesSearch && matchesStatus && matchesAccount;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleOpportunityAdded = (newOpportunity: Opportunity) => {
    // Add to the beginning for visibility and to ensure the list state is updated
    setOpportunities(prevOpportunities => [newOpportunity, ...prevOpportunities.filter(op => op.id !== newOpportunity.id)]);
  };

  return (
    <div className="container mx-auto space-y-6">
      <PageTitle title="Opportunity Management" subtitle="Track and manage all ongoing and potential sales opportunities.">
        <Button onClick={() => setIsAddOpportunityDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Opportunity
        </Button>
      </PageTitle>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
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
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
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

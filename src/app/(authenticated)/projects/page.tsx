
"use client";

import React, { useState } from 'react';
import PageTitle from '@/components/common/PageTitle';
import OpportunityCard from '@/components/opportunities/OpportunityCard'; // Renamed
import { mockOpportunities, mockAccounts, mockLeads, addOpportunity as saveNewOpportunity } from '@/lib/data'; // Renamed, added addOpportunity
import type { Opportunity, OpportunityStatus } from '@/types'; // Renamed
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter, BarChartBig } from 'lucide-react'; // Added BarChartBig
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardHeader, CardTitle
import { Label } from '@/components/ui/label';
import AddOpportunityDialog from '@/components/opportunities/AddOpportunityDialog'; // New Dialog

export default function OpportunitiesPage() { // Renamed
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities); // Renamed, state for opportunities
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | 'all'>('all'); // Renamed
  const [entityFilter, setEntityFilter] = useState<string | 'all'>('all'); 
  const [isAddOpportunityDialogOpen, setIsAddOpportunityDialogOpen] = useState(false); // Renamed

  const opportunityStatusOptions: OpportunityStatus[] = ["Need Analysis", "Negotiation", "In Progress", "On Hold", "Completed", "Cancelled"]; // Renamed

  const entityOptions = [
    ...mockLeads.map(lead => ({ id: `lead_${lead.id}`, name: `${lead.companyName} (Lead)` })),
    ...mockAccounts.map(account => ({ id: `account_${account.id}`, name: `${account.name} (Account)` }))
  ];

  const filteredOpportunities = opportunities.filter(opportunity => { // Renamed
    const matchesSearch = opportunity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opportunity.status === statusFilter;
    
    let matchesEntity = true;
    if (entityFilter !== 'all') {
      const [type, id] = entityFilter.split('_');
      if (type === 'lead') {
        matchesEntity = opportunity.leadId === id;
      } else if (type === 'account') {
        matchesEntity = opportunity.accountId === id;
      }
    }
    return matchesSearch && matchesStatus && matchesEntity;
  });

  const handleOpportunityAdded = (newOpportunity: Opportunity) => { // Renamed
    setOpportunities(prevOpportunities => [newOpportunity, ...prevOpportunities]); // Add to the beginning
  };

  return (
    <div className="container mx-auto">
      <PageTitle title="Opportunity Management" subtitle="Track and manage all ongoing and potential sales opportunities."> {/* Renamed */}
        <Button onClick={() => setIsAddOpportunityDialogOpen(true)}> {/* Renamed */}
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Opportunity {/* Renamed */}
        </Button>
      </PageTitle>

      <Card className="mb-6 p-4 shadow">
        <CardHeader className="p-0 mb-4"> {/* Added CardHeader for consistency */}
            <CardTitle className="text-lg">Filter & Search Opportunities</CardTitle> {/* Renamed */}
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="search-opportunities">Search Opportunities</Label> {/* Renamed */}
              <Input
                id="search-opportunities" // Renamed
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value: OpportunityStatus | 'all') => setStatusFilter(value)}> {/* Renamed */}
                <SelectTrigger id="status-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {opportunityStatusOptions.map(status => ( // Renamed
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entity-filter">Lead / Account</Label>
              <Select value={entityFilter} onValueChange={(value: string | 'all') => setEntityFilter(value)}>
                <SelectTrigger id="entity-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by lead or account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leads/Accounts</SelectItem>
                  {entityOptions.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredOpportunities.length > 0 ? ( // Renamed
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opportunity) => ( // Renamed
            <OpportunityCard key={opportunity.id} opportunity={opportunity} /> // Renamed
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <BarChartBig className="mx-auto h-12 w-12 text-muted-foreground mb-4" /> {/* Changed Icon */}
          <p className="text-xl font-semibold text-foreground">No Opportunities Found</p> {/* Renamed */}
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new opportunity.</p> {/* Renamed */}
        </div>
      )}
      <AddOpportunityDialog  // Renamed
        open={isAddOpportunityDialogOpen} 
        onOpenChange={setIsAddOpportunityDialogOpen}
        onOpportunityAdded={handleOpportunityAdded} 
      />
    </div>
  );
}

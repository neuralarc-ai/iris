
"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import LeadCard from '@/components/leads/LeadCard';
import { mockLeads as initialMockLeads, addLead as saveNewLead } from '@/lib/data';
import type { Lead, LeadStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const leadStatusOptions: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal Sent", "Converted to Account", "Lost"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);

  useEffect(() => {
    // Initialize with a copy to allow local modification
    setLeads([...initialMockLeads]);
  }, []);


  const filteredLeads = leads.filter(lead => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      lead.companyName.toLowerCase().includes(searchTermLower) ||
      lead.personName.toLowerCase().includes(searchTermLower) ||
      (lead.email && lead.email.toLowerCase().includes(searchTermLower));
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLeadAdded = (newLead: Lead) => {
    setLeads(prevLeads => [newLead, ...prevLeads]); // Add to the beginning of the list
  };

  const handleLeadConverted = (convertedLeadId: string) => {
    // Update the status of the converted lead in the local state
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === convertedLeadId ? { ...lead, status: 'Converted to Account', updatedAt: new Date().toISOString() } : lead
      )
    );
    // Note: The actual account creation is handled in lib/data.ts
    // If you needed to also update an accounts list on this page, you'd do it here.
  };


  return (
    <div className="container mx-auto">
      <PageTitle title="Lead Management" subtitle="Track and manage potential clients.">
        <Button onClick={() => setIsAddLeadDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
        </Button>
      </PageTitle>

      <Card className="mb-6 p-4 shadow">
        <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg">Filter & Search Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="search-leads">Search Leads</Label>
              <Input
                id="search-leads"
                type="text"
                placeholder="Search by company, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value: LeadStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger id="status-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {leadStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredLeads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onLeadConverted={handleLeadConverted} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-foreground">No Leads Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new lead.</p>
        </div>
      )}
      <AddLeadDialog
        open={isAddLeadDialogOpen}
        onOpenChange={setIsAddLeadDialogOpen}
        onLeadAdded={handleLeadAdded}
      />
    </div>
  );
}

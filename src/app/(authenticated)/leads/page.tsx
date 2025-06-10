
"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import LeadCard from '@/components/leads/LeadCard';
import { mockLeads as initialMockLeads } from '@/lib/data';
import type { Lead, LeadStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ListFilter, FileUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const leadStatusOptions: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal Sent", "Converted to Account", "Lost"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLeads([...initialMockLeads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, []);


  const filteredLeads = leads.filter(lead => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      lead.companyName.toLowerCase().includes(searchTermLower) ||
      lead.personName.toLowerCase().includes(searchTermLower) ||
      (lead.email && lead.email.toLowerCase().includes(searchTermLower)) ||
      (lead.country && lead.country.toLowerCase().includes(searchTermLower));
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  }); // Sorting is now done in useEffect and after add/convert

  const handleLeadAdded = (newLead: Lead) => {
    setLeads(prevLeads => [newLead, ...prevLeads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  };

  const handleLeadConverted = (convertedLeadId: string) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === convertedLeadId ? { ...lead, status: 'Converted to Account', updatedAt: new Date().toISOString() } : lead
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
  };

  const handleImportCsv = () => {
    // Placeholder for CSV import functionality
    toast({
      title: "Import CSV",
      description: "CSV import functionality is under development. Please add leads manually or use the business card OCR.",
      duration: 5000,
    });
  };


  return (
    <div className="container mx-auto space-y-6">
      <PageTitle title="Lead Management" subtitle="Track and manage potential clients.">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleImportCsv}>
                <FileUp className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            <Button onClick={() => setIsAddLeadDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
            </Button>
        </div>
      </PageTitle>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
         <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary"/> Filter & Search Leads
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="search-leads">Search Leads</Label>
               <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="search-leads"
                    type="text"
                    placeholder="Search by company, name, email, country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
              </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onLeadConverted={handleLeadConverted} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Leads Found</p>
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

"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import LeadCard from '@/components/leads/LeadCard';
import { mockLeads as initialMockLeads } from '@/lib/data';
import type { Lead, LeadStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Search, ListFilter, List, Grid, Trash2, CheckSquare } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

const leadStatusOptions: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal Sent", "Lost"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'table'>('list');

  useEffect(() => {
    setLeads([...initialMockLeads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, []);


  const filteredLeads = leads.filter(lead => {
    if (lead.status === 'Converted to Account') return false;
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      lead.companyName.toLowerCase().includes(searchTermLower) ||
      lead.personName.toLowerCase().includes(searchTermLower) ||
      (lead.email && lead.email.toLowerCase().includes(searchTermLower)) ||
      (lead.country && lead.country.toLowerCase().includes(searchTermLower));
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLeadAdded = (newLead: Lead) => {
    setLeads(prevLeads => [newLead, ...prevLeads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  };

  const handleLeadConverted = (convertedLeadId: string) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === convertedLeadId ? { ...lead, status: 'Converted to Account' as LeadStatus, updatedAt: new Date().toISOString() } : lead
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
    <div className="max-w-[1440px] px-4 mx-auto w-full space-y-6">
      <PageTitle title="Lead Management" subtitle="Track and manage potential clients.">
        <div className="flex items-center gap-2">
            <Button onClick={handleImportCsv} className='bg-transparent border border-[#2B2521] text-[#2B2521] w-fit rounded-[4px]'>
                <Image src="/images/import.svg" alt="Import" width={20} height={20} className="mr-2" /> Import CSV
            </Button>
            <Button onClick={() => setIsAddLeadDialogOpen(true)} variant="add" className='w-fit'>
                <Image src="/images/add.svg" alt="Add" width={20} height={20} className="mr-2" /> Add New Lead
            </Button>
        </div>
      </PageTitle>

      <Card className="shadow duration-300">
         <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary"/> Filter & Search Leads
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={view === 'list' ? 'default' : 'outline'} size="icon" className="rounded-[4px]" onClick={() => setView('list')}><Grid className="h-5 w-5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={view === 'table' ? 'default' : 'outline'} size="icon" className="rounded-[4px]" onClick={() => setView('table')}><List className="h-5 w-5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {filteredLeads.length > 0 ? (
        view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onLeadConverted={handleLeadConverted} />
          ))}
        </div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] shadow">
            <Table className='rounded-[8px] bg-white'>
              <TableHeader>
                <TableRow className='bg-[#CBCAC5] hover:bg-[#CBCAC5]'>
                  <TableHead className='text-[#282828] rounded-tl-[8px]'>Company</TableHead>
                  <TableHead className='text-[#282828]'>Contact Person</TableHead>
                  <TableHead className='text-[#282828]'>Email</TableHead>
                  <TableHead className='text-[#282828]'>Phone</TableHead>
                  <TableHead className='text-[#282828]'>Country</TableHead>
                  <TableHead className='text-[#282828]'>Status</TableHead>
                  <TableHead className='text-[#282828]'>Created</TableHead>
                  <TableHead className='text-[#282828] rounded-tr-[8px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-transparent">
                    <TableCell className="font-semibold text-foreground">{lead.companyName}</TableCell>
                    <TableCell>{lead.personName}</TableCell>
                    <TableCell><a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a></TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>{lead.country}</TableCell>
                    <TableCell><span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground" style={{background:'#b0aca7',color:'#23201d'}}>{lead.status}</span></TableCell>
                    <TableCell>{new Date(lead.createdAt).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell className="flex gap-2">
                      <TooltipProvider delayDuration={0}>
                        {lead.status !== "Converted to Account" && lead.status !== "Lost" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" onClick={() => handleLeadConverted(lead.id)} variant="add" className="rounded-[4px] p-2"><CheckSquare className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Convert</TooltipContent>
                          </Tooltip>
                        )}
                        {lead.status !== "Converted to Account" && lead.status !== "Lost" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="delete" className="rounded-[4px] p-2"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this lead? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {
                                      setLeads(prev => prev.filter(l => l.id !== lead.id));
                                      // Optionally, call deleteLead(lead.id) if you want to sync with mock data
                                    }} className="bg-[#916D5B] text-white rounded-[4px] border-0 hover:bg-[#a98a77]">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
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

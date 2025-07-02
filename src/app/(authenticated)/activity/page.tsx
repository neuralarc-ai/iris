"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import UpdateItem from '@/components/activity/UpdateItem';
import type { Update, UpdateType, Opportunity } from '@/types';
import { Button } from '@/components/ui/button';
import { Search, ListFilter, MessageSquare, Grid, List, Eye, MessageCircleMore, Users, Mail } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {format, parseISO, isValid} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AddUpdateDialog from '@/components/activity/AddUpdateDialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/lib/supabaseClient';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Interface for grouped updates
interface GroupedUpdate {
  entityId: string;
  entityType: 'lead' | 'opportunity' | 'account';
  entityName: string;
  updates: Update[];
  latestUpdate: Update;
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [typeFilter, setTypeFilter] = useState<UpdateType | 'all'>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<string | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); 
  const [isAddUpdateDialogOpen, setIsAddUpdateDialogOpen] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | 'lead' | 'opportunity' | 'account'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [leadFilter, setLeadFilter] = useState<string | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<string | 'all'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  
  // Modal state for viewing update details
  const [selectedUpdate, setSelectedUpdate] = useState<Update | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedGroupedUpdates, setSelectedGroupedUpdates] = useState<Update[]>([]);

  useEffect(() => {
    const fetchUpdatesAndOpportunities = async () => {
      const localUserId = localStorage.getItem('user_id');
      if (!localUserId) return;

      // Fetch user role
      const { data: userData } = await supabase.from('users').select('role').eq('id', localUserId).single();
      const userRole = userData?.role || 'user';

      // Fetch opportunities for filtering
      let opportunitiesQuery = supabase.from('opportunity').select('*').order('updated_at', { ascending: false });
      if (userRole !== 'admin') {
        opportunitiesQuery = opportunitiesQuery.eq('owner_id', localUserId);
      }
      const { data: opportunitiesData } = await opportunitiesQuery;
      
      if (opportunitiesData) {
        // Transform snake_case to camelCase
        const transformedOpportunities = opportunitiesData.map((opp: any) => ({
          id: opp.id,
          name: opp.name,
          accountId: opp.account_id,
          status: opp.status,
          value: opp.value || 0,
          description: opp.description || '',
          startDate: opp.start_date || new Date().toISOString(),
          endDate: opp.end_date || new Date().toISOString(),
          updateIds: [], // Not implemented yet
          createdAt: opp.created_at || new Date().toISOString(),
          updatedAt: opp.updated_at || new Date().toISOString(),
        }));
        setOpportunities(transformedOpportunities);
      }

      // Fetch updates - Admin sees all updates, users see only their own
      let updatesQuery = supabase.from('update').select('*').order('date', { ascending: false });
      if (userRole !== 'admin') {
        updatesQuery = updatesQuery.eq('updated_by_user_id', localUserId);
      }
      const { data: updatesData } = await updatesQuery;
      
      if (updatesData) {
        // Transform snake_case to camelCase
        const transformedUpdates = updatesData.map((update: any) => ({
          id: update.id,
          type: update.type,
          content: update.content || '',
          updatedByUserId: update.updated_by_user_id,
          date: update.date || update.created_at || new Date().toISOString(),
          createdAt: update.created_at || new Date().toISOString(),
          leadId: update.lead_id,
          opportunityId: update.opportunity_id,
          accountId: update.account_id,
          nextActionDate: update.next_action_date,
        }));
        
        // Sort by date (most recent first) and then by creation time for tie-breaking
        const sortedUpdates = transformedUpdates.sort((a, b) => {
          const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateComparison !== 0) return dateComparison;
          // If dates are equal, sort by creation time (most recent first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setUpdates(sortedUpdates);
      } else {
        setUpdates([]);
      }
      
      setIsLoading(false);
    };

    fetchUpdatesAndOpportunities();
  }, []); // Only run on component mount

  useEffect(() => {
    const fetchLeadsAndAccounts = async () => {
      const localUserId = localStorage.getItem('user_id');
      if (!localUserId) return;
      // Fetch user role
      const { data: userData } = await supabase.from('users').select('role').eq('id', localUserId).single();
      const userRole = userData?.role || 'user';
      // Fetch leads - Admin sees all leads, users see only their own
      let leadsQuery = supabase.from('lead').select('*').order('updated_at', { ascending: false });
      if (userRole !== 'admin') {
        leadsQuery = leadsQuery.eq('owner_id', localUserId);
      }
      const { data: leadsData } = await leadsQuery;
      if (leadsData) setLeads(leadsData);
      // Fetch accounts - Admin sees all accounts, users see only their own
      let accountsQuery = supabase.from('account').select('*').order('updated_at', { ascending: false });
      if (userRole !== 'admin') {
        accountsQuery = accountsQuery.eq('owner_id', localUserId);
      }
      const { data: accountsData } = await accountsQuery;
      if (accountsData) setAccounts(accountsData);
    };
    fetchLeadsAndAccounts();
  }, []);

  // Reset filters when entity type changes
  useEffect(() => {
    setOpportunityFilter('all');
    setLeadFilter('all');
    setAccountFilter('all');
  }, [entityTypeFilter]);

  const handleUpdateAdded = (newUpdate: Update) => {
    setUpdates(prevUpdates => {
      const updatedList = [newUpdate, ...prevUpdates];
      // Sort by date (most recent first) and then by creation time for tie-breaking
      return updatedList.sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        // If dates are equal, sort by creation time (most recent first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
  };

  // Function to refresh data when needed
  const refreshData = async () => {
    const localUserId = localStorage.getItem('user_id');
    if (!localUserId) return;

    // Fetch user role
    const { data: userData } = await supabase.from('users').select('role').eq('id', localUserId).single();
    const userRole = userData?.role || 'user';

    // Fetch updates
    let updatesQuery = supabase.from('update').select('*').order('date', { ascending: false });
    if (userRole !== 'admin') {
      updatesQuery = updatesQuery.eq('updated_by_user_id', localUserId);
    }
    const { data: updatesData } = await updatesQuery;
    
    if (updatesData) {
      // Transform snake_case to camelCase
      const transformedUpdates = updatesData.map((update: any) => ({
        id: update.id,
        type: update.type,
        content: update.content || '',
        updatedByUserId: update.updated_by_user_id,
        date: update.date || update.created_at || new Date().toISOString(),
        createdAt: update.created_at || new Date().toISOString(),
        leadId: update.lead_id,
        opportunityId: update.opportunity_id,
        accountId: update.account_id,
        nextActionDate: update.next_action_date,
      }));
      
      // Sort by date (most recent first) and then by creation time for tie-breaking
      const sortedUpdates = transformedUpdates.sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        // If dates are equal, sort by creation time (most recent first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setUpdates(sortedUpdates);
    }
  };

  const updateTypeOptions: UpdateType[] = ["General", "Call", "Meeting", "Email"];

  // Function to group updates by entity
  const groupUpdatesByEntity = (updates: Update[]): GroupedUpdate[] => {
    const grouped: { [key: string]: GroupedUpdate } = {};

    updates.forEach(update => {
      let entityId = '';
      let entityType: 'lead' | 'opportunity' | 'account' = 'account';
      let entityName = '';

      if (update.leadId) {
        entityId = update.leadId;
        entityType = 'lead';
        entityName = `Lead: ${update.leadId}`; // Will be updated with actual lead name
      } else if (update.opportunityId) {
        entityId = update.opportunityId;
        entityType = 'opportunity';
        entityName = `Opportunity: ${update.opportunityId}`; // Will be updated with actual opportunity name
      } else if (update.accountId) {
        entityId = update.accountId;
        entityType = 'account';
        entityName = `Account: ${update.accountId}`; // Will be updated with actual account name
      } else {
        // Skip updates without entity
        return;
      }

      const key = `${entityType}-${entityId}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          entityId,
          entityType,
          entityName,
          updates: [],
          latestUpdate: update
        };
      }
      
      grouped[key].updates.push(update);
      
      // Update latest update if this one is newer
      if (new Date(update.date).getTime() > new Date(grouped[key].latestUpdate.date).getTime()) {
        grouped[key].latestUpdate = update;
      }
    });

    // Sort by latest update date (most recent first)
    return Object.values(grouped).sort((a, b) => 
      new Date(b.latestUpdate.date).getTime() - new Date(a.latestUpdate.date).getTime()
    );
  };

  // Filter updates first, then group them
  const filteredUpdates = updates.filter(update => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    // Find related entity name
    let entityName = '';
    if (update.leadId) {
      const lead = leads.find(l => l.id === update.leadId);
      entityName = lead ? (lead.person_name || lead.company_name || lead.email || '') : '';
    } else if (update.opportunityId) {
      const opp = opportunities.find(o => o.id === update.opportunityId);
      entityName = opp ? (opp.name || '') : '';
    } else if (update.accountId) {
      const acc = accounts.find(a => a.id === update.accountId);
      entityName = acc ? (acc.name || '') : '';
    }
    const matchesSearch =
      !normalizedSearch ||
      (update.content && update.content.toLowerCase().includes(normalizedSearch)) ||
      (update.type && update.type.toLowerCase().includes(normalizedSearch)) ||
      (entityName && entityName.toLowerCase().includes(normalizedSearch));
    const matchesType = typeFilter === 'all' || update.type === typeFilter;
    const matchesOpportunity = opportunityFilter === 'all' || update.opportunityId === opportunityFilter;
    const matchesLead = leadFilter === 'all' || update.leadId === leadFilter;
    const matchesAccount = accountFilter === 'all' || update.accountId === accountFilter;
    let matchesDate = true;
    if (dateFilter) {
      try {
        const filterDateObj = parseISO(dateFilter);
        const updateDateObj = parseISO(update.date);
        if (isValid(filterDateObj) && isValid(updateDateObj)) {
           matchesDate = format(updateDateObj, 'yyyy-MM-dd') === format(filterDateObj, 'yyyy-MM-dd');
        } else {
            matchesDate = false; 
        }
      } catch (e) {
        matchesDate = true; 
      }
    }
    let matchesEntity = true;
    if (entityTypeFilter === 'lead') matchesEntity = !!update.leadId;
    else if (entityTypeFilter === 'opportunity') matchesEntity = !!update.opportunityId;
    else if (entityTypeFilter === 'account') matchesEntity = !!update.accountId;
    return matchesSearch && matchesType && matchesOpportunity && matchesLead && matchesAccount && matchesDate && matchesEntity;
  });

  // Sort filtered updates by date (most recent first) before grouping
  const sortedFilteredUpdates = filteredUpdates.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Group the sorted filtered updates
  const groupedUpdates = groupUpdatesByEntity(sortedFilteredUpdates);
  
  // For list view, we want to show individual updates, not grouped
  const individualUpdatesForList = sortedFilteredUpdates;
  
  // Pagination logic - different for grid vs list view
  const totalPages = Math.ceil(view === 'grid' ? groupedUpdates.length : individualUpdatesForList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedGroupedUpdates = groupedUpdates.slice(startIndex, endIndex);
  const paginatedIndividualUpdates = individualUpdatesForList.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, opportunityFilter, leadFilter, accountFilter, dateFilter, entityTypeFilter]);

  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1440px] px-4 mx-auto w-full space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading updates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] px-4 mx-auto w-full space-y-6">
      <PageTitle title="Activities" subtitle="Log and review all opportunity-related activities.">
        <Button onClick={() => setIsAddUpdateDialogOpen(true)} variant="add" className='w-fit'> 
          <Image src="/images/add.svg" alt="Add" width={20} height={20} className="mr-2" /> Add Activity
        </Button>
      </PageTitle>

      {/* Search, Filter, and View Toggle Row (refactored to match accounts page) */}
      <Card className="duration-300 bg-transparent shadow-none p-0">
        <CardHeader className="pb-4 flex flex-row bg-transparent shadow-none p-0 items-center justify-between">
          <div className="flex-1 flex items-center gap-2 bg-transparent">
            <div className="relative w-[60%]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-updates"
                type="text"
                placeholder="Search activities by content, type, or entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 min-w-[140px] max-h-10">
                  <ListFilter className="h-5 w-5 text-primary" />
                  Sort & Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className='w-[200px] rounded-sm h-fit'>
                <Label htmlFor="entity-filter" className="text-[#282828] font-medium px-2 py-1">Entity Type</Label>
                <Select value={entityTypeFilter} onValueChange={(value: 'all' | 'lead' | 'opportunity' | 'account') => setEntityTypeFilter(value)}>
                  <SelectTrigger id="entity-filter" className="w-full mt-1 border-none text-[#282828]">
                    <SelectValue placeholder="All Entities" className="text-[#282828]" />
                  </SelectTrigger>
                  <SelectContent className="text-[#282828]">
                    <SelectItem value="all" className="text-[#282828]">All Entities</SelectItem>
                    <SelectItem value="lead" className="text-[#282828]">Leads</SelectItem>
                    <SelectItem value="opportunity" className="text-[#282828]">Opportunities</SelectItem>
                    <SelectItem value="account" className="text-[#282828]">Accounts</SelectItem>
                  </SelectContent>
                </Select>
                
                <Label htmlFor="type-filter" className="text-[#282828] font-medium px-2 py-1 mt-2">Type</Label>
                <Select value={typeFilter} onValueChange={(value: UpdateType | 'all') => setTypeFilter(value)}>
                  <SelectTrigger id="type-filter" className="w-full mt-1 border-none text-[#282828]">
                    <SelectValue placeholder="All Types" className="text-[#282828]" />
                  </SelectTrigger>
                  <SelectContent className="text-[#282828]">
                    <SelectItem value="all" className="text-[#282828]">All Types</SelectItem>
                    {updateTypeOptions.map(type => (
                      <SelectItem key={type} value={type} className="text-[#282828]">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {entityTypeFilter === 'opportunity' && (
                  <>
                    <Label htmlFor="opportunity-filter" className="text-[#282828] font-medium px-2 py-1 mt-2">Opportunity</Label>
                    <Select value={opportunityFilter} onValueChange={(value: string | 'all') => setOpportunityFilter(value)}>
                      <SelectTrigger id="opportunity-filter" className="w-full mt-1 border-none text-[#282828]">
                        <SelectValue placeholder="All Opportunities" className="text-[#282828]" />
                      </SelectTrigger>
                      <SelectContent className="text-[#282828]">
                        <SelectItem value="all" className="text-[#282828]">All Opportunities</SelectItem>
                        {opportunities.map(opportunity => ( 
                          <SelectItem key={opportunity.id} value={opportunity.id} className="text-[#282828]">{opportunity.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                
                {entityTypeFilter === 'lead' && (
                  <>
                    <Label htmlFor="lead-filter" className="text-[#282828] font-medium px-2 py-1 mt-2">Lead</Label>
                    <Select value={leadFilter} onValueChange={(value: string | 'all') => setLeadFilter(value)}>
                      <SelectTrigger id="lead-filter" className="w-full mt-1 border-none text-[#282828]">
                        <SelectValue placeholder="All Leads" className="text-[#282828]" />
                      </SelectTrigger>
                      <SelectContent className="text-[#282828]">
                        <SelectItem value="all" className="text-[#282828]">All Leads</SelectItem>
                        {leads.map(lead => ( 
                          <SelectItem key={lead.id} value={lead.id} className="text-[#282828]">{lead.person_name || lead.company_name || lead.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                
                {entityTypeFilter === 'account' && (
                  <>
                    <Label htmlFor="account-filter" className="text-[#282828] font-medium px-2 py-1 mt-2">Account</Label>
                    <Select value={accountFilter} onValueChange={(value: string | 'all') => setAccountFilter(value)}>
                      <SelectTrigger id="account-filter" className="w-full mt-1 border-none text-[#282828]">
                        <SelectValue placeholder="All Accounts" className="text-[#282828]" />
                      </SelectTrigger>
                      <SelectContent className="text-[#282828]">
                        <SelectItem value="all" className="text-[#282828]">All Accounts</SelectItem>
                        {accounts.map(account => ( 
                          <SelectItem key={account.id} value={account.id} className="text-[#282828]">{account.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                
                <Label htmlFor="date-filter" className="text-[#282828] font-medium px-2 py-1 mt-2">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Input
                      id="date-filter"
                      type="text"
                      readOnly
                      value={dateFilter ? format(parseISO(dateFilter), 'MMM dd, yyyy') : ''}
                      placeholder="Select date"
                      className="w-full mt-1 cursor-pointer bg-white border-none text-[#282828]"
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFilter ? parseISO(dateFilter) : undefined}
                      onSelect={(date) => setDateFilter(date ? format(date, 'yyyy-MM-dd') : '')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center bg-[#F8F7F3] rounded-[8px] p-1 gap-1">
              <Button
                variant={view === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className={`rounded-[6px] ${view === 'grid' ? 'bg-[#E6D0D7] text-[#2B2521]' : 'text-[#2B2521]'}`}
                onClick={() => setView('grid')}
                aria-label="Grid View"
              >
                <Grid className="h-5 w-5" />
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="icon"
                className={`rounded-[6px] ${view === 'list' ? 'bg-[#E6D0D7] text-[#2B2521]' : 'text-[#2B2521]'}`}
                onClick={() => setView('list')}
                aria-label="List View"
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {groupedUpdates.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {paginatedGroupedUpdates.map((groupedUpdate) => (
              <UpdateItem 
                key={`${groupedUpdate.entityType}-${groupedUpdate.entityId}`} 
                update={groupedUpdate.latestUpdate}
                groupedUpdates={groupedUpdate.updates}
              />
            ))}
          </div>
        ) : (
          <TooltipProvider delayDuration={0}>
            <div className="overflow-x-auto rounded-[8px] shadow">
              <Table className='bg-white'>
              <TableHeader>
                <TableRow className='bg-[#CBCAC5] hover:bg-[#CBCAC5]'>
                  <TableHead className='text-[#282828] rounded-tl-[8px]'>Entity</TableHead>
                  <TableHead className='text-[#282828]'>Type</TableHead>
                  <TableHead className='text-[#282828]'>Content</TableHead>
                  <TableHead className='text-[#282828]'>Date</TableHead>
                  <TableHead className='text-[#282828]'>Next Action</TableHead>
                  <TableHead className='text-[#282828] rounded-tr-[8px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIndividualUpdates.map((update) => {
                  // Get entity name and type
                  let entityName = '';
                  let entityType = '';
                  
                  if (update.leadId) {
                    const lead = leads.find(l => l.id === update.leadId);
                    entityName = lead ? (lead.person_name || lead.company_name || lead.email || '') : `Lead: ${update.leadId}`;
                    entityType = 'lead';
                  } else if (update.opportunityId) {
                    const opp = opportunities.find(o => o.id === update.opportunityId);
                    entityName = opp ? opp.name : `Opportunity: ${update.opportunityId}`;
                    entityType = 'opportunity';
                  } else if (update.accountId) {
                    const acc = accounts.find(a => a.id === update.accountId);
                    entityName = acc ? acc.name : `Account: ${update.accountId}`;
                    entityType = 'account';
                  }
                  
                  return (
                    <TableRow key={update.id} className="hover:bg-transparent">
                      <TableCell className="font-semibold text-foreground">
                        <div>
                          <div className="capitalize text-sm text-muted-foreground">{entityType}</div>
                          <div className="truncate max-w-[200px]">{entityName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          update.type === 'Call' ? 'bg-blue-100 text-blue-800' :
                          update.type === 'Email' ? 'bg-green-100 text-green-800' :
                          update.type === 'Meeting' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {update.type}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="truncate" title={update.content}>
                          {update.content || 'No content'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(update.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {update.nextActionDate ? 
                          format(new Date(update.nextActionDate), 'MMM dd, yyyy') : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-[4px] p-2"
                              onClick={() => {
                                setSelectedUpdate(update);
                                // Find all updates for the same entity
                                const entityUpdates = updates.filter(u => {
                                  if (update.leadId) return u.leadId === update.leadId;
                                  if (update.opportunityId) return u.opportunityId === update.opportunityId;
                                  if (update.accountId) return u.accountId === update.accountId;
                                  return false;
                                });
                                setSelectedGroupedUpdates(entityUpdates);
                                setIsUpdateModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          </TooltipProvider>
        )
      ) : (
         <div className="text-center py-16">
          <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No activity Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new activity.</p>
        </div>
      )}
      
      {/* Pagination */}
      {(view === 'grid' ? groupedUpdates.length : individualUpdatesForList.length) > ITEMS_PER_PAGE && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={goToPreviousPage}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
                  </PaginationItem>
                  {currentPage > 4 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}
              
              {/* Page numbers around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum <= totalPages) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink 
                        onClick={() => goToPage(pageNum)}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                return null;
              })}
              
              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink onClick={() => goToPage(totalPages)}>{totalPages}</PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={goToNextPage}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      <AddUpdateDialog
        open={isAddUpdateDialogOpen}
        onOpenChange={setIsAddUpdateDialogOpen}
        onUpdateAdded={handleUpdateAdded}
      />
      
            {/* Update Details Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={(open) => {
        setIsUpdateModalOpen(open);
        if (!open) {
          setSelectedUpdate(null);
          setSelectedGroupedUpdates([]);
        }
      }}>
        <DialogContent className="sm:max-w-xl bg-white border border-[#CBCAC5] rounded-lg" onClick={e => e.stopPropagation()}>
          <DialogHeader className="pb-3 border-b border-[#E5E3DF]">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-semibold text-[#282828]">
                {(() => {
                  if (selectedUpdate?.leadId) {
                    const lead = leads.find(l => l.id === selectedUpdate.leadId);
                    return lead ? (lead.person_name || lead.company_name || lead.email || 'Lead') : 'Lead';
                  } else if (selectedUpdate?.opportunityId) {
                    const opp = opportunities.find(o => o.id === selectedUpdate.opportunityId);
                    return opp ? opp.name : 'Opportunity';
                  } else if (selectedUpdate?.accountId) {
                    const acc = accounts.find(a => a.id === selectedUpdate.accountId);
                    return acc ? acc.name : 'Account';
                  }
                  return 'Update';
                })()}
              </DialogTitle>
              {selectedGroupedUpdates.length > 1 && (
                <Badge variant="secondary" className="ml-2" style={{ backgroundColor: '#916D5B', color: '#fff', border: 'none' }}>
                  {selectedGroupedUpdates.length} updates
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Details Section */}
            {selectedUpdate?.opportunityId && (() => {
              const opp = opportunities.find(o => o.id === selectedUpdate.opportunityId);
              if (!opp) return null;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-[#F3F4F6] p-4 rounded-lg flex flex-col items-center justify-center min-h-[56px]">
                    <div className="text-sm font-medium text-[#6B7280]">Value</div>
                    <div className="text-2xl font-bold text-[#5E6156] mt-1">${opp.value.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#F3F4F6] p-4 rounded-lg flex flex-col items-center justify-center min-h-[56px]">
                    <div className="text-sm font-medium text-[#6B7280]">Status</div>
                    <span className={`mt-2 rounded-full px-4 py-1 text-base font-semibold capitalize border ${
                      opp.status === 'Scope Of Work' ? 'bg-sky-500/20 text-sky-700 border-sky-500/30' :
                      opp.status === 'Proposal' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' :
                      opp.status === 'Negotiation' ? 'bg-amber-500/20 text-amber-700 border-amber-500/30' :
                      opp.status === 'Win' ? 'bg-green-500/20 text-green-700 border-green-500/30' :
                      opp.status === 'Loss' ? 'bg-red-500/20 text-red-700 border-red-500/30' :
                      opp.status === 'On Hold' ? 'bg-slate-500/20 text-slate-700 border-slate-500/30' :
                      'bg-gray-500/20 text-gray-700 border-gray-500/30'
                    }`}>
                      {opp.status}
                    </span>
                  </div>
                  <div className="bg-[#F3F4F6] p-4 rounded-lg flex flex-col items-center justify-center min-h-[56px]">
                    <div className="text-sm font-medium text-[#6B7280]">Expected Close</div>
                    <div className="text-lg font-semibold mt-1">{format(parseISO(opp.endDate), 'MMM dd, yyyy')}</div>
                  </div>
                </div>
              );
            })()}

            {/* Full Description */}
            <div>
              <h4 className="text-sm font-semibold text-[#5E6156] mb-2">Description</h4>
              <div className="bg-[#F8F7F3] p-4 rounded-lg border border-[#E5E3DF] h-24">
                <p className="text-sm text-[#282828]">
                  {(() => {
                    if (selectedUpdate?.opportunityId) {
                      const opp = opportunities.find(o => o.id === selectedUpdate.opportunityId);
                      return opp?.description || 'No description available.';
                    } else if (selectedUpdate?.leadId) {
                      const lead = leads.find(l => l.id === selectedUpdate.leadId);
                      return lead ? (lead.person_name || lead.company_name || lead.email || 'No description available.') : 'No description available.';
                    } else if (selectedUpdate?.accountId) {
                      const acc = accounts.find(a => a.id === selectedUpdate.accountId);
                      return acc?.description || 'No description available.';
                    }
                    return 'No description available.';
                  })()}
                </p>
              </div>
            </div>

            {/* All Activity Logs */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Activity Updates</div>
              <div className="relative">
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {selectedGroupedUpdates.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-[#F8F7F3] border border-[#E5E3DF] hover:bg-[#EFEDE7] transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {(() => {
                          switch (log.type) {
                            case 'Call': return <MessageCircleMore className="h-4 w-4" style={{ color: '#2B2521' }} />;
                            case 'Meeting': return <Users className="h-4 w-4" style={{ color: '#2B2521' }} />;
                            case 'Email': return <Mail className="h-4 w-4" style={{ color: '#2B2521' }} />;
                            default: return <MessageSquare className="h-4 w-4" style={{ color: '#2B2521' }} />;
                          }
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-[#282828] line-clamp-2">
                            {log.content}
                          </p>
                          <span className="text-xs text-[#998876] ml-2 font-medium">
                            {format(new Date(log.date), 'MMM dd')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs bg-white border-[#CBCAC5] text-[#5E6156] font-medium">{log.type}</Badge>
                          {log.nextActionDate && (
                            <span className="text-xs text-[#4B7B9D] font-medium">
                              Next: {format(parseISO(log.nextActionDate), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Gradient overlay at the bottom, only if more than one log */}
                {selectedGroupedUpdates.length > 2 && (
                  <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-white/50 to-70%" />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

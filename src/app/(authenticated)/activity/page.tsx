"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import UpdateItem from '@/components/updates/UpdateItem';
import type { Update, UpdateType, Opportunity } from '@/types';
import { Button } from '@/components/ui/button';
import { Search, ListFilter, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {format, parseISO, isValid} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AddUpdateDialog from '@/components/updates/AddUpdateDialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/lib/supabaseClient';

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
        }));
        setUpdates(transformedUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        setUpdates([]);
      }
      
      setIsLoading(false);
    };

    fetchUpdatesAndOpportunities();
  }, []); // Only run on component mount

  const handleUpdateAdded = (newUpdate: Update) => {
    setUpdates(prevUpdates => [newUpdate, ...prevUpdates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
      }));
      setUpdates(transformedUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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

    // Sort by latest update date
    return Object.values(grouped).sort((a, b) => 
      new Date(b.latestUpdate.date).getTime() - new Date(a.latestUpdate.date).getTime()
    );
  };

  // Filter updates first, then group them
  const filteredUpdates = updates.filter(update => {
    const matchesSearch = update.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || update.type === typeFilter;
    const matchesOpportunity = opportunityFilter === 'all' || update.opportunityId === opportunityFilter;
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
    return matchesSearch && matchesType && matchesOpportunity && matchesDate && matchesEntity;
  });

  // Group the filtered updates
  const groupedUpdates = groupUpdatesByEntity(filteredUpdates);

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
      <PageTitle title="Communication Updates" subtitle="Log and review all opportunity-related communications.">
        <Button onClick={() => setIsAddUpdateDialogOpen(true)} variant="add" className='w-fit'> 
          <Image src="/images/add.svg" alt="Add" width={20} height={20} className="mr-2" /> Log New Update
        </Button>
      </PageTitle>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary"/> Filter & Search Updates
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <Label htmlFor="search-updates">Search Content</Label>
               <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="search-updates"
                    type="text"
                    placeholder="Keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={(value: UpdateType | 'all') => setTypeFilter(value)}>
                <SelectTrigger id="type-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {updateTypeOptions.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="opportunity-filter">Opportunity</Label>
              <Select value={opportunityFilter} onValueChange={(value: string | 'all') => setOpportunityFilter(value)}>
                <SelectTrigger id="opportunity-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by opportunity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Opportunities</SelectItem>
                  {opportunities.map(opportunity => ( 
                    <SelectItem key={opportunity.id} value={opportunity.id}>{opportunity.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entity-filter">Entity Type</Label>
              <Select value={entityTypeFilter} onValueChange={(value: 'all' | 'lead' | 'opportunity' | 'account') => setEntityTypeFilter(value)}>
                <SelectTrigger id="entity-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="opportunity">Opportunities</SelectItem>
                  <SelectItem value="account">Accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Input
                    id="date-filter"
                    type="text"
                    readOnly
                    value={dateFilter ? format(parseISO(dateFilter), 'MMM dd, yyyy') : ''}
                    placeholder="Select date"
                    className="w-full mt-1 cursor-pointer bg-white"
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
            </div>
          </div>
        </CardContent>
      </Card>

      {groupedUpdates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {groupedUpdates.map((groupedUpdate) => (
            <UpdateItem 
              key={`${groupedUpdate.entityType}-${groupedUpdate.entityId}`} 
              update={groupedUpdate.latestUpdate}
              groupedUpdates={groupedUpdate.updates}
            />
          ))}
        </div>
      ) : (
         <div className="text-center py-16">
          <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Updates Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or log a new update.</p>
        </div>
      )}
      <AddUpdateDialog
        open={isAddUpdateDialogOpen}
        onOpenChange={setIsAddUpdateDialogOpen}
        onUpdateAdded={handleUpdateAdded}
      />
    </div>
  );
}

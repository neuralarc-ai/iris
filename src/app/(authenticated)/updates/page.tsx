
"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import UpdateItem from '@/components/updates/UpdateItem';
import { mockUpdates as initialMockUpdates, mockOpportunities } from '@/lib/data';
import type { Update, UpdateType, Opportunity } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ListFilter, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {format, parseISO, isValid} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AddUpdateDialog from '@/components/updates/AddUpdateDialog';

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [typeFilter, setTypeFilter] = useState<UpdateType | 'all'>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<string | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); 
  const [isAddUpdateDialogOpen, setIsAddUpdateDialogOpen] = useState(false);

  useEffect(() => {
    setUpdates([...initialMockUpdates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const handleUpdateAdded = (newUpdate: Update) => {
    setUpdates(prevUpdates => [newUpdate, ...prevUpdates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const updateTypeOptions: UpdateType[] = ["General", "Call", "Meeting", "Email"];

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
    return matchesSearch && matchesType && matchesOpportunity && matchesDate;
  });

  return (
    <div className="container mx-auto space-y-6">
      <PageTitle title="Communication Updates" subtitle="Log and review all opportunity-related communications.">
        <Button onClick={() => setIsAddUpdateDialogOpen(true)}> 
          <PlusCircle className="mr-2 h-4 w-4" /> Log New Update
        </Button>
      </PageTitle>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary"/> Filter & Search Updates
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                  {mockOpportunities.map(opportunity => ( 
                    <SelectItem key={opportunity.id} value={opportunity.id}>{opportunity.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>


      {filteredUpdates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {filteredUpdates.map((update) => (
            <UpdateItem key={update.id} update={update} />
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

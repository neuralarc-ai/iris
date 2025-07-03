"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import type { Opportunity, OpportunityStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { ListFilter, Search, BarChartBig, List, Grid, Eye, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AddOpportunityDialog from '@/components/opportunities/AddOpportunityDialog';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [owners, setOwners] = useState<Record<string, { name: string; email: string }>>({});
  const [userRole, setUserRole] = useState<string>('user');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

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
      setUserRole(userRole);
      
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
        // Fetch owners for all unique owner_ids
        const ownerIds = Array.from(new Set(data.map((opp: any) => opp.owner_id).filter(Boolean)));
        if (ownerIds.length > 0) {
          const { data: usersData } = await supabase.from('users').select('id, name, email').in('id', ownerIds);
          const ownersMap: Record<string, { name: string; email: string }> = {};
          usersData?.forEach((user: any) => {
            ownersMap[user.id] = { name: user.name, email: user.email };
          });
          setOwners(ownersMap);
        } else {
          setOwners({});
        }
      } else {
        setOpportunities([]);
        setOwners({});
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const opportunityStatusOptions: OpportunityStatus[] = ["Scope Of Work", "Proposal", "Negotiation", "On Hold", "Win", "Loss"];
  const accountOptions = accounts.map(account => ({ id: account.id, name: account.name }));

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opportunity.status === statusFilter;
    const matchesAccount = accountFilter === 'all' || opportunity.account_id === accountFilter;
    return matchesSearch && matchesStatus && matchesAccount;
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // Pagination logic
  const totalPages = Math.ceil(filteredOpportunities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOpportunities = filteredOpportunities.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, accountFilter]);

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

  // Add a reload function for when an opportunity is added
  const reloadOpportunities = async () => {
    setIsLoading(true);
    const localUserId = localStorage.getItem('user_id');
    if (!localUserId) {
      setIsLoading(false);
      return;
    }
    // Fetch user role
    const { data: userData } = await supabase.from('users').select('role').eq('id', localUserId).single();
    const userRole = userData?.role || 'user';
    setUserRole(userRole);
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
      // Fetch owners for all unique owner_ids
      const ownerIds = Array.from(new Set(data.map((opp: any) => opp.owner_id).filter(Boolean)));
      if (ownerIds.length > 0) {
        const { data: usersData } = await supabase.from('users').select('id, name, email').in('id', ownerIds);
        const ownersMap: Record<string, { name: string; email: string }> = {};
        usersData?.forEach((user: any) => {
          ownersMap[user.id] = { name: user.name, email: user.email };
        });
        setOwners(ownersMap);
      } else {
        setOwners({});
      }
    } else {
      setOpportunities([]);
      setOwners({});
    }
    setIsLoading(false);
  };

  const handleOpportunityAdded = (newOpportunity: Opportunity) => {
    reloadOpportunities();
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

  // Render AddOpportunityDialog outside the main return
  const addOpportunityDialog = (
    <AddOpportunityDialog 
      open={isAddOpportunityDialogOpen} 
      onOpenChange={setIsAddOpportunityDialogOpen}
      onOpportunityAdded={handleOpportunityAdded} 
    />
  );

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

      {/* Search, Filter, and View Toggle Row (refactored to match accounts page) */}
      <Card className="duration-300 bg-transparent shadow-none border-none">
        <CardHeader className="flex flex-row items-center justify-between p-0 pb-0">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative w-[60%]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-opportunities"
                type="text"
                placeholder="Search opportunities by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white w-full min-h-12"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex bg-white max-w-10 border-[#2B2521]/30 items-center gap-2 min-w-[140px] max-h-12">
                  <ListFilter className="h-5 w-5 text-primary" />
                  Sort & Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className='w-[150px] rounded-sm h-fit'>
                <Label htmlFor="status-filter" className="text-[#282828] font-medium px-2 py-1">Status</Label>
                <Select value={statusFilter} onValueChange={(value: OpportunityStatus | 'all') => setStatusFilter(value)}>
                  <SelectTrigger id="status-filter" className="w-full mt-1 border-none text-[#282828]">
                    <SelectValue placeholder="All Statuses" className="text-[#282828]" />
                  </SelectTrigger>
                  <SelectContent className="text-[#282828]">
                    <SelectItem value="all" className="text-[#282828]">All Statuses</SelectItem>
                    {opportunityStatusOptions.map(status => (
                      <SelectItem key={status} value={status} className="text-[#282828]">{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label htmlFor="account-filter" className="text-[#282828] font-medium px-2 py-1 mt-2">Account</Label>
                <Select value={accountFilter} onValueChange={(value: string | 'all') => setAccountFilter(value)}>
                  <SelectTrigger id="account-filter" className="w-full mt-1 border-none text-[#282828]">
                    <SelectValue placeholder="All Accounts" className="text-[#282828]" />
                  </SelectTrigger>
                  <SelectContent className="text-[#282828]">
                    <SelectItem value="all" className="text-[#282828]">All Accounts</SelectItem>
                    {accountOptions.map(account => (
                      <SelectItem key={account.id} value={account.id} className="text-[#282828]">{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center border border-[#2B2521]/30 bg-white rounded-[4px] p-1 gap-1">
              <Button
                variant={view === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className={`rounded-[2px] ${view === 'grid' ? 'text-[#2B2521]' : 'text-[#2B2521]'}`}
                onClick={() => setView('grid')}
                aria-label="Grid View"
              >
                <Grid className="h-5 w-5" />
              </Button>
              <Button
                variant={view === 'table' ? 'default' : 'ghost'}
                size="icon"
                className={`rounded-[2px] ${view === 'table' ? 'text-[#2B2521]' : 'text-[#2B2521]'}`}
                onClick={() => setView('table')}
                aria-label="List View"
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {filteredOpportunities.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
            {paginatedOpportunities.map((opportunity) => (
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
          <div className="overflow-x-auto rounded-[8px] shadow">
            <Table className='bg-white'>
              <TableHeader>
                <TableRow className='bg-[#CBCAC5] hover:bg-[#CBCAC5]'>
                  <TableHead className='text-[#282828] rounded-tl-[8px]'>Name</TableHead>
                  <TableHead className='text-[#282828]'>Account</TableHead>
                  <TableHead className='text-[#282828]'>Value</TableHead>
                  <TableHead className='text-[#282828]'>Status</TableHead>
                  <TableHead className='text-[#282828]'>Timeline</TableHead>
                  {userRole === 'admin' && <TableHead className='text-[#282828]'>Assigned To</TableHead>}
                  <TableHead className='text-[#282828] rounded-tr-[8px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOpportunities.map((opportunity) => (
                  <TableRow key={opportunity.id} className="hover:bg-transparent">
                    <TableCell className="font-semibold text-foreground">{opportunity.name}</TableCell>
                    <TableCell>{accounts.find(a => a.id === opportunity.account_id)?.name || '-'}</TableCell>
                    <TableCell className="font-medium">${opportunity.value.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opportunity.status === 'Win' ? 'bg-green-100 text-green-800' :
                        opportunity.status === 'Loss' ? 'bg-red-100 text-red-800' :
                        opportunity.status === 'Negotiation' ? 'bg-amber-100 text-amber-800' :
                        opportunity.status === 'Proposal' ? 'bg-blue-100 text-blue-800' :
                        opportunity.status === 'On Hold' ? 'bg-gray-100 text-gray-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {opportunity.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(() => {
                        const start = new Date(opportunity.start_date);
                        const end = new Date(opportunity.end_date);
                        if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
                          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                        }
                        return 'N/A';
                      })()}
                    </TableCell>
                    {userRole === 'admin' && <TableCell>{owners[opportunity.owner_id]?.name || '-'}</TableCell>}
                    <TableCell className="flex gap-2">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-[4px] p-2">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="add" className="rounded-[4px] p-2">
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add Activity</TooltipContent>
                        </Tooltip>
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
          <BarChartBig className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Opportunities Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new opportunity.</p>
        </div>
      )}
      
      {/* Pagination */}
      {filteredOpportunities.length > ITEMS_PER_PAGE && (
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
      
      {addOpportunityDialog}
    </div>
  );
}

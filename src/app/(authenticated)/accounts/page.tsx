"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import AccountCard from '@/components/accounts/AccountCard';
import { mockAccounts as initialMockAccounts } from '@/lib/data';
import type { Account, AccountType, AccountStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Search, ListFilter, List, Grid, Eye, PlusCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddAccountDialog from '@/components/accounts/AddAccountDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import AddOpportunityDialog from '@/components/opportunities/AddOpportunityDialog';
import { supabase } from '@/lib/supabaseClient';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';


export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [owners, setOwners] = useState<Record<string, { name: string; email: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all');
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [isAddOpportunityDialogOpen, setIsAddOpportunityDialogOpen] = useState(false);
  const [opportunityAccountId, setOpportunityAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      const localUserId = localStorage.getItem('user_id');
      // Fetch user role
      const { data: userData } = await supabase.from('users').select('role').eq('id', localUserId).single();
      // Fetch accounts
      let query = supabase.from('account').select('*').order('updated_at', { ascending: false });
      if (userData?.role !== 'admin') {
        query = query.eq('owner_id', localUserId);
      }
      const { data, error } = await query;
      if (!error && data) {
        setAccounts(data);
        // Fetch owners for all unique owner_ids
        const ownerIds = Array.from(new Set(data.map((acc: Account) => (acc as any).owner_id).filter(Boolean)));
        if (ownerIds.length > 0) {
          const { data: usersData } = await supabase.from('users').select('id, name, email').in('id', ownerIds);
          const ownersMap: Record<string, { name: string; email: string }> = {};
          usersData?.forEach((user: { id: string; name: string; email: string }) => {
            ownersMap[user.id] = { name: user.name, email: user.email };
          });
          setOwners(ownersMap);
        } else {
          setOwners({});
        }
      } else {
        setAccounts([]);
        setOwners({});
      }
      setIsLoading(false);
    };
    fetchAccounts();
  }, [isAddAccountDialogOpen]);

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) || (account.contactEmail && account.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesType = typeFilter === 'all' || account.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Pagination logic
  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

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

  const handleAccountAddedOrUpdated = (updatedAccount: Account) => {
    setAccounts(prevAccounts => {
      const existingIndex = prevAccounts.findIndex(acc => acc.id === updatedAccount.id);
      if (existingIndex > -1) {
        const newAccounts = [...prevAccounts];
        newAccounts[existingIndex] = updatedAccount;
        return newAccounts;
      }
      return [updatedAccount, ...prevAccounts];
    });
  };

  // Add a handler to refresh accounts after delete
  const handleAccountDeleted = (deletedId: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== deletedId));
  };

  const handleAccountUpdated = (updatedAccount: Account) => {
    setAccounts(prevAccounts => {
      const existingIndex = prevAccounts.findIndex(acc => acc.id === updatedAccount.id);
      if (existingIndex > -1) {
        const newAccounts = [...prevAccounts];
        newAccounts[existingIndex] = updatedAccount;
        return newAccounts;
      }
      return [updatedAccount, ...prevAccounts];
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto w-full space-y-6 px-4">
      <PageTitle title="Accounts Management" subtitle="Oversee all client and partner accounts.">
        <Button onClick={() => setIsAddAccountDialogOpen(true)} variant="add" className='w-fit'>
          <Image src="/images/add.svg" alt="Add" width={20} height={20} className="mr-2" /> Add New Account
        </Button>
      </PageTitle>

      <Card className="shadow duration-300">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary"/> Filter & Search Accounts
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={view === 'grid' ? 'default' : 'outline'} size="icon" className="rounded-[4px]" onClick={() => setView('grid')}><Grid className="h-5 w-5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={view === 'table' ? 'default' : 'outline'} size="icon" className="rounded-[4px]" onClick={() => setView('table')}><List className="h-5 w-5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Table View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="search-accounts">Search Accounts</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-accounts"
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value: AccountStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger id="status-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={(value: AccountType | 'all') => setTypeFilter(value)}>
                <SelectTrigger id="type-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Channel Partner">Channel Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>


      {filteredAccounts.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {paginatedAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                owner={owners[(account as any).owner_id]?.name || '-'}
                onAccountDeleted={handleAccountDeleted}
                onAccountUpdated={handleAccountUpdated}
                onNewOpportunity={() => {
                  setOpportunityAccountId(account.id);
                  setIsAddOpportunityDialogOpen(true);
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
                  <TableHead className='text-[#282828]'>Contact</TableHead>
                  <TableHead className='text-[#282828]'>Email</TableHead>
                  <TableHead className='text-[#282828]'>Type</TableHead>
                  <TableHead className='text-[#282828]'>Status</TableHead>
                  <TableHead className='text-[#282828]'>Assigned To</TableHead>
                  <TableHead className='text-[#282828] rounded-tr-[8px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAccounts.map((account) => (
                  <TableRow key={account.id} className="hover:bg-transparent">
                    <TableCell className="font-semibold text-foreground">{account.name}</TableCell>
                    <TableCell>{account.contactPersonName || '-'}</TableCell>
                    <TableCell>{account.contactEmail}</TableCell>
                    <TableCell>{account.type}</TableCell>
                    <TableCell>{account.status}</TableCell>
                    <TableCell>{owners[(account as any).owner_id]?.name || '-'}</TableCell>
                    <TableCell className="flex gap-2">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" asChild className="rounded-[4px] p-2"><a href={`/accounts?id=${account.id}#details`}><Eye className="h-4 w-4" /></a></Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="add" className="rounded-[4px] p-2" onClick={() => {
                              setOpportunityAccountId(account.id);
                              setIsAddOpportunityDialogOpen(true);
                            }}><PlusCircle className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>New Opportunity</TooltipContent>
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
          <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Accounts Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new account.</p>
        </div>
      )}
      
      {/* Pagination */}
      {filteredAccounts.length > ITEMS_PER_PAGE && (
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
      <AddAccountDialog
        open={isAddAccountDialogOpen}
        onOpenChange={setIsAddAccountDialogOpen}
        onAccountAdded={handleAccountAddedOrUpdated}
        onLeadConverted={(leadId, newAccountId) => {
            // Find the newly created/updated account and pass it to the handler
            const newOrUpdatedAccount = accounts.find(acc => acc.id === newAccountId) || initialMockAccounts.find(acc => acc.id === newAccountId);
            if(newOrUpdatedAccount) {
                 handleAccountAddedOrUpdated(newOrUpdatedAccount);
            }
             // Optionally, refresh leads list on the Leads page if it were visible or if global state existed
        }}
      />
      <AddOpportunityDialog
        open={isAddOpportunityDialogOpen}
        onOpenChange={(open) => {
          setIsAddOpportunityDialogOpen(open);
          if (!open) setOpportunityAccountId(null);
        }}
        onOpportunityAdded={() => {
          setIsAddOpportunityDialogOpen(false);
          setOpportunityAccountId(null);
          // Optionally, refresh opportunities list here if needed
        }}
        accountId={opportunityAccountId || undefined}
      />
    </div>
  );
}

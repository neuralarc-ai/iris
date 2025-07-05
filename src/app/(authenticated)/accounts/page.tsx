"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import AccountCard from '@/components/accounts/AccountCard';
import { mockAccounts as initialMockAccounts } from '@/lib/data';
import type { Account, AccountType, AccountStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Search, ListFilter, List, Grid, Eye, PlusCircle, Loader2, Archive, Trash2, CheckSquare } from 'lucide-react';
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
import { restoreAccount, archiveAccount } from '@/lib/archive';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AccountModal from '@/components/accounts/AccountModal';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';


export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [archivedAccounts, setArchivedAccounts] = useState<Account[]>([]);
  const [owners, setOwners] = useState<Record<string, { name: string; email: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const [view, setView] = useState<'list' | 'table'>('list');
  const [isAddOpportunityDialogOpen, setIsAddOpportunityDialogOpen] = useState(false);
  const [opportunityAccountId, setOpportunityAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'accounts' | 'archived'>('accounts');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentArchivedPage, setCurrentArchivedPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Add at the top, after other useState hooks
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [accountIdToArchive, setAccountIdToArchive] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [selectedAccountEnrichment, setSelectedAccountEnrichment] = useState<any>(null);
  const [isAccountEnrichmentLoading, setIsAccountEnrichmentLoading] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      const localUserId = localStorage.getItem('user_id');
      // Fetch user role
      const { data: userData } = await supabase.from('users').select('role').eq('id', localUserId).single();
      // Fetch active accounts
      let query = supabase.from('account').select('*').eq('is_archived', false).order('updated_at', { ascending: false });
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

      // Fetch archived accounts
      let archivedQuery = supabase.from('account').select('*').eq('is_archived', true).order('archived_at', { ascending: false });
      if (userData?.role !== 'admin') {
        archivedQuery = archivedQuery.eq('owner_id', localUserId);
      }
      const { data: archivedData, error: archivedError } = await archivedQuery;
      if (!archivedError && archivedData) {
        setArchivedAccounts(archivedData);
      } else {
        setArchivedAccounts([]);
      }
      setIsLoading(false);
    };
    fetchAccounts();
  }, [isAddAccountDialogOpen]);

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) || (account.contactEmail && account.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Filter archived accounts
  const filteredArchivedAccounts = archivedAccounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) || (account.contactEmail && account.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date((a as any).archived_at || b.updatedAt).getTime() - new Date((b as any).archived_at || a.updatedAt).getTime());

  // Pagination logic for active accounts
  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

  // Pagination logic for archived accounts
  const totalArchivedPages = Math.ceil(filteredArchivedAccounts.length / ITEMS_PER_PAGE);
  const startArchivedIndex = (currentArchivedPage - 1) * ITEMS_PER_PAGE;
  const endArchivedIndex = startArchivedIndex + ITEMS_PER_PAGE;
  const paginatedArchivedAccounts = filteredArchivedAccounts.slice(startArchivedIndex, endArchivedIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

  const goToArchivedPage = (page: number) => {
    setCurrentArchivedPage(page);
  };

  const goToNextArchivedPage = () => {
    if (currentArchivedPage < totalArchivedPages) {
      setCurrentArchivedPage(currentArchivedPage + 1);
    }
  };

  const goToPreviousArchivedPage = () => {
    if (currentArchivedPage > 1) {
      setCurrentArchivedPage(currentArchivedPage - 1);
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

  const handleRestoreArchivedAccount = async (accountId: string) => {
    try {
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');
      
      await restoreAccount(accountId, currentUserId);
      
      // Remove from archived accounts
      setArchivedAccounts(prev => prev.filter(acc => acc.id !== accountId));
      
      // Refresh the accounts list to include the restored account
      const { data: restoredAccount } = await supabase
        .from('account')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (restoredAccount) {
        setAccounts(prev => [restoredAccount, ...prev]);
      }
    } catch (error) {
      console.error('Failed to restore account:', error);
    }
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

      {/* Search, Filter, and View Toggle Row (refactored to match leads page) */}
      <Card className="duration-300 bg-transparent shadow-none border-none">
        <CardHeader className="flex flex-row items-center justify-between p-0 pb-0">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative w-[60%]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-accounts"
                type="text"
                placeholder="Search accounts by name or email..."
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
              <DropdownMenuContent align="end" className='max-w-[140px] border-[#282828]/30 rounded-sm h-fit bg-white'>
              <DropdownMenuLabel className='text-[#282828] text-base border-b'>Status</DropdownMenuLabel> 
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    className={`w-full text-left px-3 py-1 rounded hover:bg-[#EFEDE7] text-[#282828] bg-white ${statusFilter === 'all' ? 'bg-[#EFEDE7]' : ''}`}
                    onClick={() => setStatusFilter('all')}
                    type="button"
                  >
                    All Statuses
                  </button>
                  <button
                    className={`w-full text-left px-3 py-1 rounded hover:bg-[#EFEDE7] text-[#282828] bg-white ${statusFilter === 'Active' ? 'bg-[#EFEDE7]' : ''}`}
                    onClick={() => setStatusFilter('Active')}
                    type="button"
                  >
                    Active
                  </button>
                  <button
                    className={`w-full text-left px-3 py-1 rounded hover:bg-[#EFEDE7] text-[#282828] bg-white ${statusFilter === 'Inactive' ? 'bg-[#EFEDE7]' : ''}`}
                    onClick={() => setStatusFilter('Inactive')}
                    type="button"
                  >
                    Inactive
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center border border-[#2B2521]/30 bg-white rounded-[4px] p-1 gap-1">
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="icon"
                className={`rounded-[2px] ${view === 'list' ? 'text-[#2B2521]' : 'text-[#2B2521]'}`}
                onClick={() => setView('list')}
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

      {/* Tab Navigation - Show when there are archived accounts */}
      {archivedAccounts.length > 0 && (
        <div className="flex items-center space-x-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
              activeTab === 'accounts'
                ? 'bg-white dark:bg-gray-800 text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              Active
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'accounts'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {filteredAccounts.length}
              </span>
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
              activeTab === 'archived'
                ? 'bg-white dark:bg-gray-800 text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              Archived
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'archived'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {filteredArchivedAccounts.length}
              </span>
            </span>
          </button>
        </div>
      )}

      {/* Active Accounts Tab Content */}
      {activeTab === 'accounts' && (
        <>
          {filteredAccounts.length > 0 ? (
        view === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-[4px] p-2"
                              onClick={async () => {
                                setIsAccountEnrichmentLoading(true);
                                setSelectedAccountId(account.id);
                                // Fetch enrichment from Supabase
                                const { data } = await supabase
                                  .from('aianalysis')
                                  .select('ai_output')
                                  .eq('entity_type', 'Account')
                                  .eq('entity_id', account.id)
                                  .eq('analysis_type', 'enrichment')
                                  .eq('status', 'success')
                                  .order('last_refreshed_at', { ascending: false })
                                  .limit(1)
                                  .single();
                                setSelectedAccountEnrichment(data?.ai_output || null);
                                setIsAccountEnrichmentLoading(false);
                                setIsAccountModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="delete"
                              className="rounded-[4px] p-2"
                              onClick={() => {
                                setAccountIdToArchive(account.id);
                                setArchiveDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Archive</TooltipContent>
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
        </>
      )}

      {/* Archived Accounts Tab Content */}
      {activeTab === 'archived' && (
        <div className="mt-6">
          {filteredArchivedAccounts.length > 0 ? (
            view === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
                {paginatedArchivedAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    owner={owners[(account as any).owner_id]?.name || '-'}
                    onAccountDeleted={handleRestoreArchivedAccount}
                    onAccountUpdated={handleAccountUpdated}
                    onNewOpportunity={() => {
                      setOpportunityAccountId(account.id);
                      setIsAddOpportunityDialogOpen(true);
                    }}
                    isArchived={true}
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
                    {paginatedArchivedAccounts.map((account) => (
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-[4px] p-2"
                                  onClick={() => {
                                    setSelectedAccountId(account.id);
                                    setIsAccountModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="add" 
                                  className="rounded-[4px] p-2"
                                  onClick={() => handleRestoreArchivedAccount(account.id)}
                                >
                                  <CheckSquare className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Restore Account</TooltipContent>
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
              <Archive className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
              <p className="text-xl font-semibold text-foreground mb-2">No Archived Accounts</p>
              <p className="text-muted-foreground">No accounts have been archived yet.</p>
            </div>
          )}
          
          {/* Pagination for archived accounts */}
          {filteredArchivedAccounts.length > ITEMS_PER_PAGE && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={goToPreviousArchivedPage}
                      className={currentArchivedPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {/* First page */}
                  {currentArchivedPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => goToArchivedPage(1)}>1</PaginationLink>
                      </PaginationItem>
                      {currentArchivedPage > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}
                  
                  {/* Page numbers around current page */}
                  {Array.from({ length: Math.min(5, totalArchivedPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalArchivedPages - 4, currentArchivedPage - 2)) + i;
                    if (pageNum <= totalArchivedPages) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            onClick={() => goToArchivedPage(pageNum)}
                            isActive={currentArchivedPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Last page */}
                  {currentArchivedPage < totalArchivedPages - 2 && (
                    <>
                      {currentArchivedPage < totalArchivedPages - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink onClick={() => goToArchivedPage(totalArchivedPages)}>{totalArchivedPages}</PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={goToNextArchivedPage}
                      className={currentArchivedPage === totalArchivedPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
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
      {selectedAccountId && (
        <AccountModal
          accountId={selectedAccountId}
          open={isAccountModalOpen}
          onClose={() => {
            setIsAccountModalOpen(false);
            setSelectedAccountId(null);
            setSelectedAccountEnrichment(null);
          }}
          aiEnrichment={selectedAccountEnrichment}
          isAiLoading={isAccountEnrichmentLoading}
        />
      )}
      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this account? It will be moved to the archive section and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isArchiving}
              onClick={async () => {
                if (!accountIdToArchive) return;
                setIsArchiving(true);
                try {
                  const currentUserId = localStorage.getItem('user_id');
                  if (!currentUserId) throw new Error('User not authenticated');
                  await archiveAccount(accountIdToArchive, currentUserId);
                  setAccounts(prev => prev.filter(acc => acc.id !== accountIdToArchive));
                  setArchiveDialogOpen(false);
                  setAccountIdToArchive(null);
                } catch (error) {
                  // Optionally show a toast or error message
                  setIsArchiving(false);
                } finally {
                  setIsArchiving(false);
                }
              }}
            >
              {isArchiving ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

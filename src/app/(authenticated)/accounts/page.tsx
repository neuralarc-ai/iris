
"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import AccountCard from '@/components/accounts/AccountCard';
import { mockAccounts as initialMockAccounts } from '@/lib/data';
import type { Account, AccountType, AccountStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddAccountDialog from '@/components/accounts/AddAccountDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';


export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all');
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

  useEffect(() => {
    setAccounts([...initialMockAccounts]);
  }, []);

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) || (account.contactEmail && account.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesType = typeFilter === 'all' || account.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());


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

  return (
    <div className="container mx-auto space-y-6">
      <PageTitle title="Accounts Management" subtitle="Oversee all client and partner accounts.">
        <Button onClick={() => setIsAddAccountDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Account
        </Button>
      </PageTitle>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary"/> Filter & Search Accounts
            </CardTitle>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {filteredAccounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Accounts Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new account.</p>
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
    </div>
  );
}

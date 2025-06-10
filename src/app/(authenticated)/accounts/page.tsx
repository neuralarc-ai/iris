"use client";

import React, { useState } from 'react';
import PageTitle from '@/components/common/PageTitle';
import AccountCard from '@/components/accounts/AccountCard';
import { mockAccounts, addAccount as saveNewAccount } from '@/lib/data'; // Updated import
import type { Account, AccountType, AccountStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddAccountDialog from '@/components/accounts/AddAccountDialog'; // Import the dialog

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts); // Use state for accounts
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all');
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) || (account.contactEmail && account.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesType = typeFilter === 'all' || account.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAccountAdded = (newAccount: Account) => {
    // No need to call saveNewAccount here as it's already called in AddAccountDialog
    // Just update the local state to re-render the list
    setAccounts(prevAccounts => [...prevAccounts, newAccount]);
  };

  return (
    <div className="container mx-auto">
      <PageTitle title="Accounts Management" subtitle="Oversee all client and partner accounts.">
        <Button onClick={() => setIsAddAccountDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Account
        </Button>
      </PageTitle>

      <Card className="mb-6 p-4 shadow">
        <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg">Filter & Search Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="search-accounts" className="text-sm font-medium">Search Accounts</Label>
              <Input
                id="search-accounts"
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
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
              <Label htmlFor="type-filter" className="text-sm font-medium">Type</Label>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-foreground">No Accounts Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new account.</p>
        </div>
      )}
      <AddAccountDialog 
        open={isAddAccountDialogOpen} 
        onOpenChange={setIsAddAccountDialogOpen}
        onAccountAdded={handleAccountAdded} 
      />
    </div>
  );
}

// Minimal Label and Card components used inline for brevity - consider moving to shared components if used elsewhere
const Label = ({ htmlFor, children, className }: { htmlFor: string, children: React.ReactNode, className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-muted-foreground ${className}`}>
    {children}
  </label>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-lg border bg-card text-card-foreground ${className}`}> {/* Removed shadow-sm for consistency */}
    {children}
  </div>
);

const CardHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);


const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}> {/* Adjusted default padding */}
    {children}
  </div>
);

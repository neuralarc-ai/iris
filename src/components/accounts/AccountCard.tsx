"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ListChecks, PlusCircle, Eye, MessageSquareHeart, Lightbulb, Users, Mail, Phone, Tag, Trash2, X, Pencil } from 'lucide-react';
import type { Account, DailyAccountSummary as AIDailySummary, Opportunity, Update, UpdateType } from '@/types';
import { getOpportunitiesByAccount, mockUpdates, addUpdate } from '@/lib/data';
import { generateDailyAccountSummary } from '@/ai/flows/daily-account-summary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

interface AccountCardProps {
  account: Account;
  view?: 'grid' | 'table';
}

export default function AccountCard({ account, view = 'grid' }: AccountCardProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [dailySummary, setDailySummary] = useState<AIDailySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logs, setLogs] = useState<Update[]>([]);
  const [updateType, setUpdateType] = useState<UpdateType | ''>('');
  const [updateContent, setUpdateContent] = useState('');
  const [updateDate, setUpdateDate] = useState<Date | undefined>(undefined);
  const [isLogging, setIsLogging] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editAccount, setEditAccount] = useState({
    name: account.name,
    contactPersonName: account.contactPersonName || '',
    contactEmail: account.contactEmail || '',
    contactPhone: account.contactPhone || '',
    industry: account.industry || '',
    description: account.description || '',
  });

  useEffect(() => {
    setOpportunities(getOpportunitiesByAccount(account.id));
    setLogs(mockUpdates.filter(u => u.accountId === account.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [account.id]);

  const fetchDailySummary = async () => {
    setIsLoadingSummary(true);
    try {
      const summary = await generateDailyAccountSummary({
        accountId: account.id,
        accountName: account.name,
        recentUpdates: "Placeholder: Recent updates indicate active engagement.", 
        keyMetrics: "Placeholder: Key metrics are trending positively.", 
      });
      setDailySummary(summary);
    } catch (error) {
      console.error(`Failed to fetch summary for ${account.name}:`, error);
      // Set a default error state for summary to inform user
      setDailySummary({ summary: "Could not load AI summary.", relationshipHealth: "Unknown" });
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  useEffect(() => {
    if (account.status === 'Active') {
        fetchDailySummary();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id, account.name, account.status]);

  // Placeholder for delete handler
  const handleDeleteAccount = () => {
    // Implement actual delete logic as needed
    setDeleteDialogOpen(false);
    // Optionally show a toast or update parent state
  };

  const handleLogUpdate = async () => {
    if (!updateType || !updateContent.trim() || !updateDate) return;
    setIsLogging(true);
    setTimeout(() => {
      const newUpdate = addUpdate({
        type: updateType,
        content: updateContent,
        opportunityId: undefined,
        accountId: undefined,
        updatedByUserId: undefined,
      } as any);
      setLogs(prev => [newUpdate, ...prev]);
      setUpdateType('');
      setUpdateContent('');
      setUpdateDate(undefined);
      setIsLogging(false);
    }, 1000);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditAccount(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = () => {
    // In a real app, update backend here
    setEditMode(false);
    // Optionally update local state (not global/mock)
  };

  const handleCancelEdit = () => {
    setEditAccount({
      name: account.name,
      contactPersonName: account.contactPersonName || '',
      contactEmail: account.contactEmail || '',
      contactPhone: account.contactPhone || '',
      industry: account.industry || '',
      description: account.description || '',
    });
    setEditMode(false);
  };

  // Card click handler: only open dialog if not already open and click is not inside dialog
  const handleCardClick = (e: React.MouseEvent) => {
    // If the dialog is open and the click is inside the dialog content, do nothing
    if (dialogOpen) return;
    setDialogOpen(true);
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full bg-white" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-xl font-headline flex items-center text-foreground">
            <Briefcase className="mr-2 h-5 w-5 text-primary shrink-0" />
            {account.name}
          </CardTitle>
          <Badge 
            variant={account.status === 'Active' ? 'default' : 'secondary'} 
            className={`capitalize whitespace-nowrap ml-2 ${account.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-amber-500/20 text-amber-700 border-amber-500/30'}`}
          >
            {account.status}
          </Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground flex items-center">
            <Tag className="mr-2 h-4 w-4 shrink-0"/> {account.type}
            {account.industry && <span className="mx-1 text-muted-foreground/50">|</span>}
            {account.industry && <span className="text-xs">{account.industry}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <p className="text-muted-foreground line-clamp-2">{account.description}</p>
        
        {account.contactPersonName && (
            <div className="flex items-center text-muted-foreground">
                <Users className="mr-2 h-4 w-4 shrink-0"/>
                {account.contactPersonName}
            </div>
        )}
        {account.contactEmail && (
            <div className="flex items-center text-muted-foreground">
                <Mail className="mr-2 h-4 w-4 shrink-0"/>
                {account.contactEmail}
            </div>
        )}
         {account.contactPhone && (
            <div className="flex items-center text-muted-foreground">
                <Phone className="mr-2 h-4 w-4 shrink-0"/>
                {account.contactPhone}
            </div>
        )}

        <div className="text-sm flex items-center text-foreground font-medium">
          <ListChecks className="mr-2 h-4 w-4 text-primary" />
          <span>{opportunities.length} Active Opportunit{opportunities.length !== 1 ? 'ies' : 'y'}</span> 
        </div>

        {account.status === 'Active' && (
          <div className="pt-3 border-t mt-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center">
              <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-yellow-500" /> AI Daily Brief
            </h4>
            {isLoadingSummary ? (
              <div className="flex items-center space-x-2 h-10">
                <LoadingSpinner size={16} /> 
                <span className="text-xs text-muted-foreground">Generating brief...</span>
              </div>
            ) : dailySummary ? (
              <div className="space-y-1">
                <p className="text-xs text-foreground line-clamp-2">{dailySummary.summary}</p>
                <div className="flex items-center text-xs">
                  <MessageSquareHeart className="mr-1.5 h-3.5 w-3.5 text-pink-500" />
                  <span className="font-medium text-foreground">Health:</span>&nbsp;
                  <span className="text-muted-foreground">{dailySummary.relationshipHealth}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground h-10 flex items-center">No AI brief available for this account.</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 border-t mt-auto">
        <TooltipProvider delayDuration={0}>
          {view === 'grid' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" asChild className="rounded-[4px] p-2 mr-auto"><Link href={`/accounts?id=${account.id}#details`}><Eye className="h-4 w-4" /></Link></Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" asChild variant="add" className="rounded-[4px] p-2"><Link href={`/opportunities/new?accountId=${account.id}`}><PlusCircle className="h-4 w-4" /></Link></Button>
            </TooltipTrigger>
            <TooltipContent>New Opportunity</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="delete" className="rounded-[4px] p-2 ml-2"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the account and all its data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="justify-center">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-[#916D5B] text-white rounded-[4px] border-0 hover:bg-[#a98a77]">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white" onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {editMode ? (
                <Input
                  value={editAccount.name}
                  onChange={e => handleEditChange('name', e.target.value)}
                  className="font-semibold text-lg border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                  placeholder="Account Name"
                />
              ) : (
                editAccount.name
              )}
              <Button variant="ghost" size="icon" className="ml-2" onClick={() => setEditMode(e => !e)}>
                {editMode ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
              </Button>
            </DialogTitle>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <div>
                <span className="font-semibold">Contact Person:</span>{' '}
                {editMode ? (
                  <Input
                    value={editAccount.contactPersonName}
                    onChange={e => handleEditChange('contactPersonName', e.target.value)}
                    className="border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                    placeholder="Contact Person"
                  />
                ) : (
                  editAccount.contactPersonName || 'N/A'
                )}
              </div>
              <div>
                <span className="font-semibold">Email:</span>{' '}
                {editMode ? (
                  <Input
                    value={editAccount.contactEmail}
                    onChange={e => handleEditChange('contactEmail', e.target.value)}
                    className="border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                    placeholder="Email"
                  />
                ) : (
                  editAccount.contactEmail || 'N/A'
                )}
              </div>
              <div>
                <span className="font-semibold">Phone:</span>{' '}
                {editMode ? (
                  <Input
                    value={editAccount.contactPhone}
                    onChange={e => handleEditChange('contactPhone', e.target.value)}
                    className="border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                    placeholder="Phone"
                  />
                ) : (
                  editAccount.contactPhone || 'N/A'
                )}
              </div>
              <div>
                <span className="font-semibold">Industry:</span>{' '}
                {editMode ? (
                  <Input
                    value={editAccount.industry}
                    onChange={e => handleEditChange('industry', e.target.value)}
                    className="border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                    placeholder="Industry"
                  />
                ) : (
                  editAccount.industry || 'N/A'
                )}
              </div>
              <div>
                <span className="font-semibold">Description:</span>{' '}
                {editMode ? (
                  <Textarea
                    value={editAccount.description}
                    onChange={e => handleEditChange('description', e.target.value)}
                    className="border-none bg-transparent px-0 focus:ring-0 focus:outline-none min-h-[60px]"
                    placeholder="Description"
                  />
                ) : (
                  editAccount.description || 'N/A'
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="mt-4">
            <div className="mb-2 text-sm font-semibold">Account: {editAccount.name}</div>
            <div className="mb-2 text-muted-foreground text-xs">
              {logs.length === 0 ? 'No log found' : ''}
            </div>
            {logs.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {logs.slice(0, 2).map((log, idx) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border-l-4 border-muted">
                    <div className="flex-shrink-0 mt-1">
                      <ListChecks className="h-4 w-4 text-primary shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {log.content}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(new Date(log.date), 'MMM dd')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">{log.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {logs.length > 2 && (
                  <div className="flex items-center justify-center pt-2 border-t border-muted/30 overflow-hidden max-h-8 opacity-70">
                    <p className="text-xs text-muted-foreground truncate">
                      +{logs.length - 2} more activities
                    </p>
                  </div>
                )}
              </div>
            )}
            {editMode ? (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                <Button variant="add" onClick={handleSaveEdit}>Save</Button>
              </div>
            ) : (
              <form className="space-y-4">
                <div>
                  <Label htmlFor="update-type">Update Type *</Label>
                  <Select value={updateType} onValueChange={value => setUpdateType(value as UpdateType)}>
                    <SelectTrigger id="update-type" className="w-full mt-1">
                      <SelectValue placeholder="Select update type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="update-content">Content *</Label>
                  <Textarea
                    id="update-content"
                    value={updateContent}
                    onChange={e => setUpdateContent(e.target.value)}
                    placeholder="Describe the call, meeting, email, or general update..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {updateDate ? format(updateDate, 'dd/MM/yyyy') : 'dd/mm/yyyy'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-0 w-auto border-none bg-[#CFD4C9] rounded-sm">
                      <Calendar
                        mode="single"
                        selected={updateDate}
                        onSelect={setUpdateDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <DialogFooter>
                  <Button type="button" variant="add" className="w-full mt-2" onClick={handleLogUpdate} disabled={isLogging}>
                    {isLogging ? 'Logging...' : 'Log Update'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

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
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface AccountCardProps {
  account: Account;
  view?: 'grid' | 'table';
  onNewOpportunity?: () => void;
  owner?: string;
  onAccountDeleted?: (accountId: string) => void;
  onAccountUpdated?: (updatedAccount: any) => void;
}

export default function AccountCard({ account, view = 'grid', onNewOpportunity, owner, onAccountDeleted, onAccountUpdated }: AccountCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [role, setRole] = useState<string>('user');
  const [users, setUsers] = useState<any[]>([]);
  const [editOwnerId, setEditOwnerId] = useState<string>((account as any).owner_id || '');
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
    contactPersonName: (account as any).contact_person_name || '',
    contactEmail: (account as any).contact_email || '',
    contactPhone: (account as any).contact_phone || '',
    industry: account.industry || '',
    description: account.description || '',
  });

  useEffect(() => {
    // Fetch opportunities from Supabase for this account
    const fetchOpportunities = async () => {
      const { data, error } = await supabase
        .from('opportunity')
        .select('*')
        .eq('account_id', account.id)
        .order('updated_at', { ascending: false });
      if (!error && data) {
        setOpportunities(data);
      } else {
        setOpportunities([]);
      }
    };
    fetchOpportunities();
  }, [account.id]);

  // Fetch existing logs from Supabase
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data: logsData } = await supabase
          .from('update')
          .select('*')
          .eq('account_id', account.id)
          .order('date', { ascending: false });
        
        if (logsData) {
          const transformedLogs = logsData.map((log: any) => ({
            id: log.id,
            type: log.type,
            content: log.content || '',
            updatedByUserId: log.updated_by_user_id,
            date: log.date || log.created_at || new Date().toISOString(),
            createdAt: log.created_at || new Date().toISOString(),
            leadId: log.lead_id,
            opportunityId: log.opportunity_id,
            accountId: log.account_id,
          }));
          setLogs(transformedLogs);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };

    fetchLogs();
  }, [account.id]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (data) {
        setCurrentUser(data);
        setRole(data.role);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      const fetchUsers = async () => {
        const { data, error } = await supabase.from('users').select('id, name, email');
        if (data) setUsers(data);
      };
      fetchUsers();
    }
  }, [role]);

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

  const handleDeleteAccount = async () => {
    // Use Supabase to delete the account
    const { error } = await supabase.from('account').delete().eq('id', account.id);
    if (!error) {
      if (onAccountDeleted) onAccountDeleted(account.id);
    } else {
      alert('Failed to delete account: ' + error.message);
    }
    setDeleteDialogOpen(false);
  };

  const handleLogUpdate = async () => {
    if (!updateType || !updateContent.trim() || !updateDate) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    
    // Check for recent duplicate entries (within last 5 seconds)
    const recentDuplicate = logs.find(log => 
      log.content === updateContent.trim() && 
      log.type === updateType &&
      new Date().getTime() - new Date(log.createdAt).getTime() < 5000
    );
    
    if (recentDuplicate) {
      console.log('Duplicate activity detected, ignoring');
      toast({ title: "Warning", description: "This activity was already logged recently.", variant: "destructive" });
      return;
    }
    
    setIsLogging(true);
    try {
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');

      // Save to Supabase
      const { data, error } = await supabase.from('update').insert([
        {
          type: updateType,
          content: updateContent,
          updated_by_user_id: currentUserId,
          date: updateDate.toISOString(),
          lead_id: null,
          opportunity_id: null,
          account_id: account.id,
        }
      ]).select().single();

      if (error) throw error;

      // Transform the response to match Update interface
      const newUpdate: Update = {
        id: data.id,
        type: data.type,
        content: data.content || '',
        updatedByUserId: data.updated_by_user_id,
        date: data.date || data.created_at || new Date().toISOString(),
        createdAt: data.created_at || new Date().toISOString(),
        leadId: data.lead_id,
        opportunityId: data.opportunity_id,
        accountId: data.account_id,
      };

      // Update local state
      setLogs(prev => [newUpdate, ...prev]);
      setUpdateType('');
      setUpdateContent('');
      setUpdateDate(undefined);
      toast({ title: 'Update logged', description: 'Your update has been logged.' });
    } catch (error) {
      console.error('Failed to log update:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to log update. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLogging(false);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditAccount(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    // Update the account in Supabase
    const { data, error } = await supabase.from('account').update({
      name: editAccount.name,
      contact_person_name: editAccount.contactPersonName,
      contact_email: editAccount.contactEmail,
      contact_phone: editAccount.contactPhone,
      industry: editAccount.industry,
      description: editAccount.description,
      owner_id: role === 'admin' ? editOwnerId : (account as any).owner_id,
      updated_at: new Date().toISOString(),
    }).eq('id', account.id).select().single();
    if (!error && data) {
      setEditMode(false);
      if (onAccountUpdated) onAccountUpdated(data);
    } else {
      alert('Failed to update account: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleCancelEdit = () => {
    setEditAccount({
      name: account.name,
      contactPersonName: (account as any).contact_person_name || '',
      contactEmail: (account as any).contact_email || '',
      contactPhone: (account as any).contact_phone || '',
      industry: account.industry || '',
      description: account.description || '',
    });
    setEditMode(false);
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full bg-white">
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
      <CardContent className="flex-grow space-y-3 text-sm" onClick={() => setDialogOpen(true)} style={{ cursor: 'pointer' }}>
        <p className="text-muted-foreground line-clamp-2">{account.description || 'N/A'}</p>
        
        <div className="flex items-center text-muted-foreground">
          <Users className="mr-2 h-4 w-4 shrink-0"/>
          {(account as any).contact_person_name || 'N/A'}
        </div>
        <div className="flex items-center text-muted-foreground">
          <Mail className="mr-2 h-4 w-4 shrink-0"/>
          {(account as any).contact_email || 'N/A'}
        </div>
        <div className="flex items-center text-muted-foreground">
          <Phone className="mr-2 h-4 w-4 shrink-0"/>
          {(account as any).contact_phone || 'N/A'}
        </div>
        {owner && (
          <div className="flex items-center text-muted-foreground">
            <span className="font-semibold mr-2">Assigned To:</span> {owner}
          </div>
        )}
        <div className="text-sm flex items-center text-foreground font-medium">
          <ListChecks className="mr-2 h-4 w-4 text-primary" />
          <span>{opportunities.length} Active Opportunit{opportunities.length !== 1 ? 'ies' : 'y'}</span> 
        </div>

        {/* {account.status === 'Active' && (
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
        )} */}
      </CardContent>
      <CardFooter className="pt-4 border-t mt-auto">
        <TooltipProvider delayDuration={0}>
          {view === 'grid' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[4px] p-2 mr-auto"
                  onClick={e => {
                    e.stopPropagation();
                    setDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="add" className="rounded-[4px] p-2" onClick={e => {
                e.stopPropagation();
                if (typeof onNewOpportunity === 'function') {
                  setDialogOpen(false); // Ensure details dialog is closed
                  onNewOpportunity();
                }
              }}><PlusCircle className="h-4 w-4" /></Button>
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
        <DialogContent className="sm:max-w-xl bg-white" onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editMode ? (
                <Input
                  value={editAccount.name}
                  onChange={e => handleEditChange('name', e.target.value)}
                  className="font-bold text-3xl border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                  placeholder="Account Name"
                />
              ) : (
                <span className="font-bold text-3xl">{editAccount.name}</span>
              )}
              {!editMode && (
                <Button variant="ghost" size="icon" className="ml-2" onClick={() => setEditMode(true)}>
                  <Pencil className="h-5 w-5" />
                </Button>
              )}
            </DialogTitle>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#55504C]">Contact Person:</span>
                {editMode ? (
                  <Input
                    value={editAccount.contactPersonName}
                    onChange={e => handleEditChange('contactPersonName', e.target.value)}
                    className="border border-muted/30 bg-[#EFEDE7] px-2 py-1 rounded focus:ring-0 focus:outline-none"
                    placeholder="Contact Person"
                  />
                ) : (
                  <span className="text-[#282828]">{editAccount.contactPersonName || 'N/A'}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#55504C]">Email:</span>
                {editMode ? (
                  <Input
                    value={editAccount.contactEmail}
                    onChange={e => handleEditChange('contactEmail', e.target.value)}
                    className="border border-muted/30 bg-[#EFEDE7] px-2 py-1 rounded focus:ring-0 focus:outline-none"
                    placeholder="Email"
                  />
                ) : (
                  <span className="text-[#282828]">{editAccount.contactEmail || 'N/A'}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#55504C]">Phone:</span>
                {editMode ? (
                  <Input
                    value={editAccount.contactPhone}
                    onChange={e => handleEditChange('contactPhone', e.target.value)}
                    className="border border-muted/30 bg-[#EFEDE7] px-2 py-1 rounded focus:ring-0 focus:outline-none"
                    placeholder="Phone"
                  />
                ) : (
                  <span className="text-[#282828]">{editAccount.contactPhone || 'N/A'}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#55504C]">Industry:</span>
                {editMode ? (
                  <Select value={editAccount.industry} onValueChange={value => handleEditChange('industry', value)}>
                    <SelectTrigger className="border border-muted/30 bg-[#EFEDE7] px-2 py-1 rounded focus:ring-0 focus:outline-none">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-[#282828]">{editAccount.industry || 'N/A'}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#55504C]">Description:</span>
                {editMode ? (
                  <Textarea
                    value={editAccount.description}
                    onChange={e => handleEditChange('description', e.target.value)}
                    className="border border-muted/30 bg-[#EFEDE7] px-2 py-1 rounded focus:ring-0 focus:outline-none min-h-[60px]"
                    placeholder="Description"
                  />
                ) : (
                  <span className="text-[#282828]">{editAccount.description || 'N/A'}</span>
                )}
              </div>
              {editMode && role === 'admin' && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[#55504C]">Assigned To:</span>
                  <Select value={editOwnerId} onValueChange={setEditOwnerId}>
                    <SelectTrigger className="border border-muted/30 bg-[#EFEDE7] px-2 py-1 rounded focus:ring-0 focus:outline-none">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="mt-4">
            {!editMode && logs.length > 0 && (
              <div className="relative">
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {logs.map((log, idx) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 rounded-r-sm bg-muted/30 border-l-4 border-muted">
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
                </div>
                {/* Gradient overlay at the bottom, only if more than one log */}
                {logs.length > 2 && (
                  <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8" style={{background: 'linear-gradient(to bottom, transparent, #fff 90%)'}} />
                )}
              </div>
            )}
            {editMode ? (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                <Button variant="add" onClick={handleSaveEdit}>Save</Button>
              </div>
            ) : (
              <form className="space-y-4 mt-3" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 min-w-0">
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
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="update-date">Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Input
                          id="update-date"
                          type="text"
                          value={updateDate ? format(updateDate, 'dd/MM/yyyy') : ''}
                          placeholder="dd/mm/yyyy"
                          readOnly
                          className="mt-1 cursor-pointer bg-white"
                        />
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
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="add" 
                    className="w-full mt-2" 
                    onClick={handleLogUpdate} 
                    disabled={isLogging || !updateType || !updateContent.trim() || !updateDate}
                  >
                    {isLogging ? 'Adding...' : 'Add Activity'}
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

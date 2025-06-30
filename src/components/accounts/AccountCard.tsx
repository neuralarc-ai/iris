"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ListChecks, PlusCircle, Eye, MessageSquareHeart, Lightbulb, Users, Mail, Phone, Tag, Trash2, X, Pencil, FileText } from 'lucide-react';
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
import { format, parseISO } from 'date-fns';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Globe, Building2, Target, BrainCircuit, FileText as FileTextIcon, Lightbulb as LightbulbIcon, Mail as MailIcon, Activity, User as UserIcon, CheckSquare } from 'lucide-react';

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
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(undefined);
  const [isLogging, setIsLogging] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editAccount, setEditAccount] = useState({
    name: account.name,
    contactPersonName: (account as any).contact_person_name || '',
    contactEmail: (account as any).contact_email || '',
    contactPhone: (account as any).contact_phone || '',
    industry: account.industry || '',
    description: account.description || '',
    website: (account as any).website || '',
    type: account.type || '',
    status: account.status || 'Active',
  });
  const [activeTab, setActiveTab] = useState('overview');

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
            nextActionDate: log.next_action_date,
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
          next_action_date: nextActionDate?.toISOString() || null,
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
      setNextActionDate(undefined);
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
      website: editAccount.website,
      type: editAccount.type,
      status: editAccount.status,
      owner_id: role === 'admin' ? editOwnerId : (account as any).owner_id,
      updated_at: new Date().toISOString(),
    }).eq('id', account.id).select().single();
    if (!error && data) {
      setEditMode(false);
      if (onAccountUpdated) onAccountUpdated(data);
      toast({ title: 'Success', description: 'Account updated successfully.' });
    } else {
      toast({ title: 'Error', description: 'Failed to update account: ' + (error?.message || 'Unknown error'), variant: 'destructive' });
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
      website: (account as any).website || '',
      type: account.type || '',
      status: account.status || 'Active',
    });
    setEditMode(false);
  };

  const getUpdateTypeIcon = (type: Update['type']) => {
    switch (type) {
      case 'Call':
        return <Phone className="h-4 w-4 text-blue-500" />;
      case 'Email':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'Meeting':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'General':
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <>
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
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl bg-white border-0 rounded-lg p-0">
          <div className="p-6 pb-0">
            <DialogHeader className="">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 bg-[#5E6156]">
                    <AvatarFallback className="text-2xl bg-[#2B2521] font-bold text-white">
                      {account.name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-[#282828]">
                      {editMode ? (
                        <Input
                          value={editAccount.name}
                          onChange={e => handleEditChange('name', e.target.value)}
                          className="font-bold text-3xl border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                          placeholder="Account Name"
                        />
                      ) : (
                        account.name
                      )}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {editMode ? (
                        <Input
                          value={editAccount.contactPersonName}
                          onChange={e => handleEditChange('contactPersonName', e.target.value)}
                          className="text-lg border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                          placeholder="Contact Person"
                        />
                      ) : (
                        <p className="text-lg text-[#5E6156]">{(account as any).contact_person_name || ''}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {editMode ? (
                        <Input
                          value={editAccount.industry}
                          onChange={e => handleEditChange('industry', e.target.value)}
                          className="text-lg border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                          placeholder="Industry"
                        />
                      ) : (
                        <p className="text-lg text-[#5E6156]">{account.industry || ''}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={account.status === 'Active' ? 'default' : 'secondary'} 
                    className={`capitalize whitespace-nowrap ${account.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-amber-500/20 text-amber-700 border-amber-500/30'}`}
                  >
                    {editMode ? (
                      <Select value={editAccount.status} onValueChange={value => handleEditChange('status', value)}>
                        <SelectTrigger className="border-none bg-transparent p-0 h-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      account.status
                    )}
                  </Badge>
                  {!editMode && (
                    <Button variant="ghost" size="icon" className="ml-2" onClick={() => setEditMode(true)}>
                      <Pencil className="h-5 w-5" />
                    </Button>
                  )}
                  {editMode && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                      <Button variant="add" size="sm" onClick={handleSaveEdit}>Save</Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>
          </div>

          <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#EFEDE7] h-fit w-fit mx-auto grid grid-cols-2 items-center p-1 rounded-lg justify-center shadow-none">
              <TabsTrigger value="overview" className="text-base px-4 py-1.5 rounded-md flex items-center gap-2 data-[state=active]:bg-[#2B2521] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <UserIcon className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-base px-4 py-1.5 rounded-md flex items-center gap-2 data-[state=active]:bg-[#2B2521] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Activity className="h-4 w-4" /> Activity
              </TabsTrigger>
            </TabsList>
            <div className="bg-white rounded-b-md p-6">
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div className="bg-white border border-[#E5E3DF] rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                        <UserIcon className="h-5 w-5 text-[#5E6156]" /> Contact Information
                      </h3>
                      <div className="space-y-2">
                        <div className="bg-[#F8F7F3] p-3 rounded-md">
                          <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-[#C57E94] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Email</p>
                              {editMode ? (
                                <Input
                                  value={editAccount.contactEmail}
                                  onChange={e => handleEditChange('contactEmail', e.target.value)}
                                  className="text-base font-medium border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                                  placeholder="Email"
                                />
                              ) : (
                                <p className="text-base text-[#282828] font-medium break-all">{(account as any).contact_email || 'N/A'}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#F8F7F3] p-3 rounded-md">
                          <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-[#4B7B9D] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Phone</p>
                              {editMode ? (
                                <Input
                                  value={editAccount.contactPhone}
                                  onChange={e => handleEditChange('contactPhone', e.target.value)}
                                  className="text-base font-medium border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                                  placeholder="Phone"
                                />
                              ) : (
                                <p className="text-base text-[#282828] font-medium">{(account as any).contact_phone || 'N/A'}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Company Information */}
                    <div className="bg-white border border-[#E5E3DF] rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                        <Briefcase className="h-5 w-5 text-[#5E6156]" /> Company Information
                      </h3>
                      <div className="space-y-2">
                        <div className="bg-[#F8F7F3] p-3 rounded-md">
                          <div className="flex items-start gap-3">
                            <Building2 className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Company</p>
                              <p className="text-base text-[#282828] font-medium">{account.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#F8F7F3] p-3 rounded-md">
                          <div className="flex items-start gap-3">
                            <Globe className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Website</p>
                              {editMode ? (
                                <Input
                                  value={editAccount.website}
                                  onChange={e => handleEditChange('website', e.target.value)}
                                  className="text-base font-medium border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                                  placeholder="Website"
                                />
                              ) : (
                                <p className="text-base font-medium text-[#282828]">
                                  {(account as any).website ? (
                                    <a href={(account as any).website} target="_blank" rel="noopener noreferrer" className="underline text-[#3987BE]">{(account as any).website}</a>
                                  ) : 'N/A'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#F8F7F3] p-3 rounded-md text-center">
                            <p className="text-sm text-[#5E6156] mb-1">Industry</p>
                            {editMode ? (
                              <Input
                                value={editAccount.industry}
                                onChange={e => handleEditChange('industry', e.target.value)}
                                className="text-base font-semibold border-none bg-transparent px-0 focus:ring-0 focus:outline-none text-center"
                                placeholder="Industry"
                              />
                            ) : (
                              <p className="text-base font-semibold text-[#282828]">{account.industry || 'N/A'}</p>
                            )}
                          </div>
                          <div className="bg-[#F8F7F3] p-3 rounded-md text-center">
                            <p className="text-sm text-[#5E6156] mb-1">Type</p>
                            {editMode ? (
                              <Select value={editAccount.type} onValueChange={value => handleEditChange('type', value)}>
                                <SelectTrigger className="border-none bg-transparent p-0 h-auto">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Client">Client</SelectItem>
                                  <SelectItem value="Channel Partner">Channel Partner</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-base font-semibold text-[#282828]">{account.type || 'N/A'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Account Metrics */}
                  <div className="bg-white border border-[#E5E3DF] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-[#5E6156]" /> Account Metrics
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm text-[#5E6156]">Opportunities</p>
                          <p className="text-sm font-semibold text-[#282828]">{opportunities.length}</p>
                        </div>
                        <div className="w-full bg-[#E5E3DF] rounded-full h-2.5">
                          <div className="h-2.5 rounded-full" style={{ width: `${Math.min(opportunities.length * 10, 100)}%`, backgroundImage: 'linear-gradient(to right, #3987BE, #D48EA3)' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm text-[#5E6156]">Status</p>
                          <p className="text-sm font-semibold text-[#282828]">{account.status}</p>
                        </div>
                        <div className="w-full bg-[#E5E3DF] rounded-full h-2.5">
                          <div className="h-2.5 rounded-full" style={{ width: account.status === 'Active' ? '100%' : '50%', backgroundImage: account.status === 'Active' ? 'linear-gradient(to right, #22c55e, #16a34a)' : 'linear-gradient(to right, #f59e0b, #d97706)' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="activity">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                    <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Add New Activity</div>
                    <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleLogUpdate(); }}>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 min-w-0">
                          <Label htmlFor="update-type" className="text-sm font-medium text-[#5E6156] mb-2 block">Activity Type</Label>
                          <Select value={updateType} onValueChange={setUpdateType}>
                            <SelectTrigger id="update-type" className="w-full border border-[#CBCAC5] bg-[#F8F7F3] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md">
                              <SelectValue placeholder="Select activity type" />
                            </SelectTrigger>
                            <SelectContent>
                              {['General', 'Call', 'Meeting', 'Email'].map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label htmlFor="update-date" className="text-sm font-medium text-[#5E6156] mb-2 block">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Input
                                id="update-date"
                                type="text"
                                value={updateDate ? format(updateDate, 'dd/MM/yyyy') : ''}
                                placeholder="dd/mm/yyyy"
                                readOnly
                                className="cursor-pointer bg-[#F8F7F3] border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
                              />
                            </PopoverTrigger>
                            <PopoverContent align="start" className="p-0 w-auto border-[#CBCAC5] bg-white rounded-md shadow-lg">
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
                        <Label htmlFor="update-content" className="text-sm font-medium text-[#5E6156] mb-2 block">Description</Label>
                        <Textarea
                          id="update-content"
                          value={updateContent}
                          onChange={e => setUpdateContent(e.target.value)}
                          placeholder="Describe the activity..."
                          className="bg-[#F8F7F3] border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" variant="add" className="bg-[#2B2521] text-white hover:bg-[#3a322c] rounded-md max-h-12" disabled={isLogging}>
                          {isLogging ? 'Logging...' : 'Add Activity'}
                        </Button>
                      </div>
                    </form>
                  </div>
                  <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                    <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Activity Updates</div>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {logs.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No activity updates yet.</p>
                      ) : (
                        logs.map(log => (
                          <div key={log.id} className="border-b border-[#E5E3DF] pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getUpdateTypeIcon(log.type)}
                              <span className="text-xs font-semibold text-[#5E6156]">{log.type}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{format(new Date(log.date), 'dd MMM yyyy')}</span>
                            </div>
                            <div className="text-sm text-[#282828]">{log.content}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

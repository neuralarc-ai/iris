"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageSquare, Users, Mail, 
  MessageCircleMore, 
  Plus, Eye
} from 'lucide-react';
import type { Update, Opportunity, Account, User, Lead, UpdateType } from '@/types';
import { format, parseISO } from 'date-fns';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface UpdateItemProps {
  update: Update;
  groupedUpdates?: Update[];
}

const getUpdateTypeIcon = (type: Update['type']) => {
  switch (type) {
    case 'Call': return <MessageCircleMore className="h-4 w-4" style={{ color: '#2B2521' }} />; 
    case 'Meeting': return <Users className="h-4 w-4" style={{ color: '#2B2521' }} />;
    case 'Email': return <Mail className="h-4 w-4" style={{ color: '#2B2521' }} />;
    default: return <MessageSquare className="h-4 w-4" style={{ color: '#2B2521' }} />; 
  }
};

// Add status badge color classes for opportunity statuses
const getOpportunityStatusBadgeClasses = (status: string) => {
  switch (status) {
    case 'Scope Of Work': return 'bg-sky-500/20 text-sky-700 border-sky-500/30';
    case 'Proposal': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    case 'Negotiation': return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
    case 'Win': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'Loss': return 'bg-red-500/20 text-red-700 border-red-500/30';
    case 'On Hold': return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

export default function UpdateItem({ update, groupedUpdates }: UpdateItemProps) {
  // State for related data
  const [opportunity, setOpportunity] = useState<Opportunity | undefined>(undefined);
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const [lead, setLead] = useState<Lead | undefined>(undefined);
  const [user, setUser] = useState<User | undefined>(undefined);
  
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // State for activity log form
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(undefined);
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [newActivityType, setNewActivityType] = useState<UpdateType>('General');
  
  // Get activity logs (updates for the same opportunity/lead)
  const [activityLogs, setActivityLogs] = useState<Update[]>([]);
  
  // State to store all users for activity log attribution
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  
  const { toast } = useToast();

  // Use groupedUpdates if available, otherwise use the single update
  const updatesToShow = groupedUpdates || [update];
  const totalUpdates = updatesToShow.length;

  useEffect(() => {
    const fetchRelatedData = async () => {
      if (update.opportunityId) {
        // Fetch opportunity
        const { data: oppData } = await supabase
          .from('opportunity')
          .select('*')
          .eq('id', update.opportunityId)
          .single();
        
        if (oppData) {
          const transformedOpp: Opportunity = {
            id: oppData.id,
            name: oppData.name,
            accountId: oppData.account_id,
            status: oppData.status,
            value: oppData.value || 0,
            description: oppData.description || '',
            startDate: oppData.start_date || new Date().toISOString(),
            endDate: oppData.end_date || new Date().toISOString(),
            updateIds: [],
            createdAt: oppData.created_at || new Date().toISOString(),
            updatedAt: oppData.updated_at || new Date().toISOString(),
          };
          setOpportunity(transformedOpp);

          // Fetch account
          const { data: accData } = await supabase
            .from('account')
            .select('*')
            .eq('id', oppData.account_id)
            .single();
          
          if (accData) {
            const transformedAcc: Account = {
              id: accData.id,
              name: accData.name,
              type: accData.type,
              status: accData.status,
              description: accData.description || '',
              contactEmail: accData.contact_email || '',
              industry: accData.industry || '',
              contactPersonName: accData.contact_person_name || '',
              contactPhone: accData.contact_phone || '',
              convertedFromLeadId: accData.converted_from_lead_id,
              opportunityIds: [],
              createdAt: accData.created_at || new Date().toISOString(),
              updatedAt: accData.updated_at || new Date().toISOString(),
            };
            setAccount(transformedAcc);
          }
        }
        setLead(undefined);

        // Use groupedUpdates if available, otherwise fetch all updates for this opportunity
        if (groupedUpdates) {
          setActivityLogs(groupedUpdates);
        } else {
          const { data: updatesData } = await supabase
            .from('update')
            .select('*')
            .eq('opportunity_id', update.opportunityId)
            .order('date', { ascending: false });
          
          if (updatesData) {
            const transformedUpdates = updatesData.map((upd: any) => ({
              id: upd.id,
              type: upd.type,
              content: upd.content || '',
              updatedByUserId: upd.updated_by_user_id,
              date: upd.date || upd.created_at || new Date().toISOString(),
              createdAt: upd.created_at || new Date().toISOString(),
              leadId: upd.lead_id,
              opportunityId: upd.opportunity_id,
              accountId: upd.account_id,
              nextActionDate: upd.next_action_date,
            }));
            setActivityLogs(transformedUpdates);
          }
        }
      } else if (update.leadId) {
        // Fetch lead
        const { data: leadData } = await supabase
          .from('lead')
          .select('*')
          .eq('id', update.leadId)
          .single();
        
        if (leadData) {
          const transformedLead: Lead = {
            id: leadData.id,
            companyName: leadData.company_name || '',
            personName: leadData.person_name || '',
            phone: leadData.phone || '',
            email: leadData.email || '',
            linkedinProfileUrl: leadData.linkedin_profile_url || '',
            country: leadData.country || '',
            status: leadData.status || 'New',
            opportunityIds: [],
            updateIds: [],
            createdAt: leadData.created_at || new Date().toISOString(),
            updatedAt: leadData.updated_at || new Date().toISOString(),
            assignedUserId: leadData.owner_id || '',
            rejectionReasons: [],
          };
          setLead(transformedLead);
        }
        setOpportunity(undefined);
        setAccount(undefined);

        // Use groupedUpdates if available, otherwise fetch all updates for this lead
        if (groupedUpdates) {
          setActivityLogs(groupedUpdates);
        } else {
          const { data: updatesData } = await supabase
            .from('update')
            .select('*')
            .eq('lead_id', update.leadId)
            .order('date', { ascending: false });
          
          if (updatesData) {
            const transformedUpdates = updatesData.map((upd: any) => ({
              id: upd.id,
              type: upd.type,
              content: upd.content || '',
              updatedByUserId: upd.updated_by_user_id,
              date: upd.date || upd.created_at || new Date().toISOString(),
              createdAt: upd.created_at || new Date().toISOString(),
              leadId: upd.lead_id,
              opportunityId: upd.opportunity_id,
              accountId: upd.account_id,
              nextActionDate: upd.next_action_date,
            }));
            setActivityLogs(transformedUpdates);
          }
        }
      } else if (update.accountId) {
        // Fetch account for account-only updates
        const { data: accData } = await supabase
          .from('account')
          .select('*')
          .eq('id', update.accountId)
          .single();
        
        if (accData) {
          const transformedAcc: Account = {
            id: accData.id,
            name: accData.name,
            type: accData.type,
            status: accData.status,
            description: accData.description || '',
            contactEmail: accData.contact_email || '',
            industry: accData.industry || '',
            contactPersonName: accData.contact_person_name || '',
            contactPhone: accData.contact_phone || '',
            convertedFromLeadId: accData.converted_from_lead_id,
            opportunityIds: [],
            createdAt: accData.created_at || new Date().toISOString(),
            updatedAt: accData.updated_at || new Date().toISOString(),
          };
          setAccount(transformedAcc);
        }
        setOpportunity(undefined);
        setLead(undefined);

        // Use groupedUpdates if available, otherwise fetch all updates for this account
        if (groupedUpdates) {
          setActivityLogs(groupedUpdates);
        } else {
          const { data: updatesData } = await supabase
            .from('update')
            .select('*')
            .eq('account_id', update.accountId)
            .order('date', { ascending: false });
          
          if (updatesData) {
            const transformedUpdates = updatesData.map((upd: any) => ({
              id: upd.id,
              type: upd.type,
              content: upd.content || '',
              updatedByUserId: upd.updated_by_user_id,
              date: upd.date || upd.created_at || new Date().toISOString(),
              createdAt: upd.created_at || new Date().toISOString(),
              leadId: upd.lead_id,
              opportunityId: upd.opportunity_id,
              accountId: upd.account_id,
              nextActionDate: upd.next_action_date,
            }));
            setActivityLogs(transformedUpdates);
          }
        }
      }

      // Fetch user who created the update
      if (update.updatedByUserId) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', update.updatedByUserId)
          .single();
        
        if (userData) {
          const transformedUser: User = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            pin: userData.pin,
            role: userData.role,
            createdAt: userData.created_at || new Date().toISOString(),
          };
          setUser(transformedUser);
        }
      }
    };

    fetchRelatedData();
  }, [update.opportunityId, update.leadId, update.updatedByUserId, update.accountId, groupedUpdates]);

  // Fetch all users when activity logs change
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (activityLogs.length > 0) {
        // Get unique user IDs from activity logs
        const userIds = Array.from(new Set(
          activityLogs
            .map(log => log.updatedByUserId)
            .filter(Boolean)
        ));

        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('*')
            .in('id', userIds);

          if (usersData) {
            const usersMap: Record<string, User> = {};
            usersData.forEach((userData: any) => {
              usersMap[userData.id] = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                pin: userData.pin,
                role: userData.role,
                createdAt: userData.created_at || new Date().toISOString(),
              };
            });
            setAllUsers(usersMap);
          }
        }
      }
    };

    fetchAllUsers();
  }, [activityLogs]);

  // const fetchInsights = async () => { ... }
  // const toggleAiInsights = () => { ... }

  const addUpdateToSupabase = async (updateData: any): Promise<Update> => {
    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) throw new Error('User not authenticated');

    const { data, error } = await supabase.from('update').insert([
      {
        type: updateData.type,
        content: updateData.content,
        updated_by_user_id: currentUserId,
        date: new Date().toISOString(),
        next_action_date: updateData.nextActionDate ? updateData.nextActionDate.toISOString() : null,
        lead_id: updateData.leadId || null,
        opportunity_id: updateData.opportunityId || null,
        account_id: updateData.accountId || null,
      }
    ]).select().single();

    if (error || !data) throw error || new Error('Failed to create update');

    // Transform the response to match Update interface
    return {
      id: data.id,
      type: data.type,
      content: data.content || '',
      updatedByUserId: data.updated_by_user_id,
      date: data.date || data.created_at || new Date().toISOString(),
      createdAt: data.created_at || new Date().toISOString(),
      leadId: data.lead_id,
      opportunityId: data.opportunity_id,
      accountId: data.account_id,
      nextActionDate: data.next_action_date,
    };
  };

  const handleLogActivity = async () => {
    if (!newActivityDescription.trim()) {
      toast({ title: "Error", description: "Please enter a description for the activity.", variant: "destructive" });
      return;
    }

    setIsLoggingActivity(true);
    try {
      const newUpdateData = {
        type: newActivityType,
        content: newActivityDescription,
        nextActionDate: nextActionDate,
        ...(update.opportunityId ? { opportunityId: update.opportunityId, accountId: update.accountId! } : { leadId: update.leadId! })
      };

      const newUpdate = await addUpdateToSupabase(newUpdateData);

      // Refresh activity logs
      if (update.opportunityId) {
        const { data: updatesData } = await supabase
          .from('update')
          .select('*')
          .eq('opportunity_id', update.opportunityId)
          .order('date', { ascending: false });
        
        if (updatesData) {
          const transformedUpdates = updatesData.map((upd: any) => ({
            id: upd.id,
            type: upd.type,
            content: upd.content || '',
            updatedByUserId: upd.updated_by_user_id,
            date: upd.date || upd.created_at || new Date().toISOString(),
            createdAt: upd.created_at || new Date().toISOString(),
            leadId: upd.lead_id,
            opportunityId: upd.opportunity_id,
            accountId: upd.account_id,
            nextActionDate: upd.next_action_date,
          }));
          setActivityLogs(transformedUpdates);
        }
      } else {
        setActivityLogs(prev => [newUpdate, ...prev]);
      }

      setNewActivityDescription('');
      setNextActionDate(undefined);
      toast({ title: "Success", description: "Activity logged successfully." });
    } catch (error) {
      console.error("Failed to log activity:", error);
      toast({ title: "Error", description: "Failed to log activity. Please try again.", variant: "destructive" });
    } finally {
      setIsLoggingActivity(false);
    }
  };

  const getStatusBadge = () => {
    if (opportunity) {
      return (
        <Badge variant="secondary" className="flex-shrink-0 capitalize bg-accent hover:bg-accent text-accent-foreground">
          {opportunity.status}
        </Badge>
      );
    }
    if (lead) {
      return (
        <Badge variant="secondary" className="flex-shrink-0 capitalize bg-accent hover:bg-accent text-accent-foreground">
          {lead.status}
        </Badge>
      );
    }
    return null;
  };

  const getValueDisplay = () => {
    if (opportunity) {
      return (
        <div className="text-lg font-bold text-[#97A487]">
          ${opportunity.value.toLocaleString()}
        </div>
      );
    }
    return null;
  };

  const getExpectedClose = () => {
    if (opportunity) {
      return (
        <div className="text-sm py-1 text-[#282828]">
          {format(parseISO(opportunity.endDate), 'MMM dd, yyyy')}
        </div>
      );
    }
    return null;
  };

  const renderActivityLogItem = (log: Update) => {
    return (
      <div key={log.id} className={
        'flex items-start space-x-3 p-3 rounded-r-lg bg-[#9A8A744c] border-l-4 border-muted'
      }>
        <div className="flex-shrink-0 mt-1">
          {getUpdateTypeIcon(log.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-foreground line-clamp-2">
              {log.content}
            </p>
            <span className="text-xs text-muted-foreground ml-2">
              {format(parseISO(log.date), 'MMM dd')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {log.type}
            </Badge>
            {log.updatedByUserId && (
              <span className="text-xs text-muted-foreground">
                by {allUsers[log.updatedByUserId]?.name || user?.name || 'Unknown'}
              </span>
            )}
            {log.nextActionDate && (
              <span className="text-xs text-blue-600 font-medium">
                Next: {format(parseISO(log.nextActionDate), 'MMM dd, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Card View */}
      <Card 
        className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-white flex flex-col h-full cursor-pointer rounded-lg border border-[#E5E3DF] min-h-[320px] max-h-[420px] min-w-[260px] max-w-full p-0 overflow-hidden"
        onClick={() => setIsDialogOpen(true)}
      >
        <CardHeader className="pb-2 pt-4 px-5">
          {/* Capsules Row: left-aligned at the very top */}
          <div className="flex justify-start items-center gap-2 w-full mb-2">
            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-300">
              {opportunity ? 'Opportunities' : lead ? 'Leads' : account ? 'Accounts' : 'General'}
            </Badge>
            {totalUpdates > 1 && (
              <Badge variant="secondary" className="whitespace-nowrap" style={{ backgroundColor: '#916D5B', color: '#fff', border: 'none' }}>
                {totalUpdates} updates
              </Badge>
            )}
            {opportunity && (
              <Badge variant="secondary" className={`capitalize whitespace-nowrap ml-2 border ${getOpportunityStatusBadgeClasses(opportunity.status)}`}>{opportunity.status}</Badge>
            )}
            {getStatusBadge && !opportunity && getStatusBadge()}
          </div>
          {/* Entity Name/Title */}
          <CardTitle className="text-lg font-headline text-foreground line-clamp-1 flex-1 truncate">
            {opportunity ? opportunity.name : lead ? `${lead.personName} (${lead.companyName})` : account ? account.name : 'Update'}
          </CardTitle>
          <div className="space-y-1">
            {getValueDisplay()}
            {getExpectedClose()}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex-grow flex flex-col justify-end px-5 pb-2">
          {/* Recent Activity */}
          <div className="space-y-2 mt-auto">
            <h4 className="text-xs font-semibold text-muted-foreground">Recent Activity</h4>
            <div className={`bg-white/30 rounded-[6px] space-y-2 ${activityLogs.length > 2 ? 'max-h-32 overflow-y-auto pr-1' : ''}`}>
              {activityLogs.slice(0, 2).map((log) => renderActivityLogItem(log))}
              {activityLogs.length > 2 && (
                <div className="flex items-center justify-center pt-2 border-t border-muted/30 bg-white sticky bottom-0 left-0 right-0">
                  <p className="text-xs text-muted-foreground">+{activityLogs.length - 2} more activities</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 px-5 pb-4 border-t mt-auto flex gap-2 bg-white z-10">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 px-4 flex items-center justify-center gap-2 rounded-md bg-[#E6D0D7] text-[#2B2521] hover:bg-[#d1b6c0] shadow-none font-semibold text-base"
                  onClick={e => { e.stopPropagation(); setIsDialogOpen(true); }}
                >
                  <Plus className="h-5 w-5" />
                  Add Activity
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Add Activity</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-white border border-[#CBCAC5] rounded-lg" onClick={e => e.stopPropagation()}>
          <DialogHeader className="pb-3 border-b border-[#E5E3DF]">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-semibold text-[#282828]">
                {opportunity?.name || lead?.personName || account?.name || 'Update'}
              </DialogTitle>
              {totalUpdates > 1 && (
                <Badge variant="secondary" className="ml-2" style={{ backgroundColor: '#916D5B', color: '#fff', border: 'none' }}>
                  {totalUpdates} updates
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Details Section */}
            {opportunity && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-[#F3F4F6] p-4 rounded-lg flex flex-col items-center justify-center min-h-[56px]">
                  <div className="text-sm font-medium text-[#6B7280]">Value</div>
                  <div className="text-2xl font-bold text-[#5E6156] mt-1">${opportunity.value.toLocaleString()}</div>
                </div>
                <div className="bg-[#F3F4F6] p-4 rounded-lg flex flex-col items-center justify-center min-h-[56px]">
                  <div className="text-sm font-medium text-[#6B7280]">Status</div>
                  <span className={`mt-2 rounded-full px-4 py-1 text-base font-semibold capitalize border ${getOpportunityStatusBadgeClasses(opportunity.status)}`}>{opportunity.status}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" onClick={handleLogActivity}>
              Log Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
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
  onClick?: () => void;
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

const getActivityTypeBadgeClasses = (type: Update['type']) => {
  switch (type) {
    case 'Call': return 'bg-[#E6F4F1] text-[#1B6B5C] border-none'; // teal
    case 'Meeting': return 'bg-[#F3E8FF] text-[#7C3AED] border-none'; // purple
    case 'Email': return 'bg-[#FFF4E6] text-[#B45309] border-none'; // orange
    case 'General':
    default: return 'bg-[#F3F4F6] text-[#374151] border-none'; // gray
  }
};

export default function UpdateItem({ update, groupedUpdates, onClick }: UpdateItemProps) {
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
    const logDate = log.date ? parseISO(log.date) : new Date();
    const userName = log.updatedByUserId ? (allUsers[log.updatedByUserId]?.name || user?.name || 'Unknown') : 'Unknown';

    return (
      <div key={log.id} className="bg-white border border-gray-200/80 rounded-lg p-3 flex items-start gap-3 transition-colors hover:bg-gray-50/50">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#F8F7F3] flex items-center justify-center mt-0.5 self-start">
          {getUpdateTypeIcon(log.type)}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-start">
          <p className="text-sm text-[#282828] leading-snug line-clamp-1 overflow-hidden text-ellipsis">
            {log.content}
          </p>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5">
            <span className="font-medium text-[#5E6156]">
              {userName}
            </span>
            <span className="text-gray-400">&bull;</span>
            <span>{format(logDate, 'MMM dd, yyyy')}</span>
          </div>
          <div className="mt-2">
            <Badge variant="outline" className={`text-xs ${getActivityTypeBadgeClasses(log.type)}`}>{log.type}</Badge>
          </div>
          {log.nextActionDate && (
            <div className="mt-2 bg-[#F8F7F3] border-l-2 border-[#916D5B] px-3 py-1.5 rounded-r-md">
              <p className="text-xs font-semibold text-[#5E6156]">
                Next Action: <span className="font-normal text-[#282828]">{format(parseISO(log.nextActionDate), 'MMM dd, yyyy')}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Card View */}
      <Card 
        className="border border-[#E5E3DF] bg-white rounded-sm shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full p-4 cursor-pointer"
        onClick={onClick}
      >
        {/* Top badges and name */}
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between">
            <div className='overflow-hidden'>
              <div className="text-xl font-bold text-[#282828] leading-tight truncate max-w-full" style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                {opportunity ? opportunity.name : lead ? `${lead.personName} (${lead.companyName})` : account ? account.name : 'Update'}
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-row gap-2 items-center">
            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-300">
              {opportunity ? 'Opportunities' : lead ? 'Leads' : account ? 'Accounts' : 'General'}
            </Badge>
            {totalUpdates > 1 && (
              <Badge variant="secondary" className="whitespace-nowrap" style={{ backgroundColor: '#D48EA3', color: '#fff', border: 'none' }}>
                {totalUpdates} updates
              </Badge>
            )}
            {opportunity && (
              <Badge variant="secondary" className={`capitalize whitespace-nowrap border ${getOpportunityStatusBadgeClasses(opportunity.status)}`}>{opportunity.status}</Badge>
            )}
            {getStatusBadge && !opportunity && getStatusBadge()}
          </div>
          {/* Recent Activity - always directly below badges */}
          <div className="space-y-2 my-2">
            <div className="space-y-2">
              {activityLogs.slice(0, 1).map((log) => renderActivityLogItem(log))}
            </div>
            {activityLogs.length > 1 && (
              <div className="text-center pt-1">
                <p className="text-xs text-muted-foreground/80 hover:text-muted-foreground cursor-pointer">View {activityLogs.length - 1} more activities</p>
              </div>
            )}
          </div>
        </div>
        {/* Bottom Button */}
        <CardFooter className="pt-2 px-0 pb-0 border-t mt-auto flex gap-2 bg-white z-10 justify-center">
                <Button
            variant="outline"
            className="w-full text-[#282828] font-semibold text-base py-2 rounded-md border-[#E5E3DF] bg-[#F8F7F3] hover:bg-[#EFEDE7] flex items-center justify-center gap-2 max-h-10"
                  onClick={e => { e.stopPropagation(); onClick && onClick(); }}
                >
            <Plus className="h-5 w-5" /> Add Activity
                </Button>
        </CardFooter>
      </Card>
    </>
  );
}
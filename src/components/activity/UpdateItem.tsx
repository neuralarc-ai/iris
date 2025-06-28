"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  CheckSquare, Repeat, MessageSquare, Users, Mail, 
  Activity, ThumbsUp, ThumbsDown, MessageCircleMore, 
  Sparkles, Calendar as CalendarIcon,
  Plus, MessageSquarePlus, Eye
} from 'lucide-react';
import type { Update, UpdateInsights as AIUpdateInsights, Opportunity, Account, User, Lead, UpdateType } from '@/types';
import { format, parseISO } from 'date-fns';
// import { generateInsights, RelationshipHealthOutput } from '@/ai/flows/intelligent-insights'; 
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabaseClient';

interface UpdateItemProps {
  update: Update;
  groupedUpdates?: Update[];
}

const getUpdateTypeIcon = (type: Update['type']) => {
  switch (type) {
    case 'Call': return <MessageCircleMore className="h-4 w-4 text-primary shrink-0" />; 
    case 'Meeting': return <Users className="h-4 w-4 text-primary shrink-0" />;
    case 'Email': return <Mail className="h-4 w-4 text-primary shrink-0" />;
    default: return <MessageSquare className="h-4 w-4 text-primary shrink-0" />; 
  }
};

const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return <Activity className="h-4 w-4"/>;
    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes("positive")) return <ThumbsUp className="h-4 w-4 text-green-500"/>;
    if (lowerSentiment.includes("negative")) return <ThumbsDown className="h-4 w-4 text-red-500"/>;
    if (lowerSentiment.includes("neutral")) return <Activity className="h-4 w-4 text-yellow-500"/>;
    return <Activity className="h-4 w-4"/>;
}

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
  
  // Get activity logs (updates for the same opportunity/lead)
  const [activityLogs, setActivityLogs] = useState<Update[]>([]);
  
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
            createdAt: userData.created_at || new Date().toISOString(),
          };
          setUser(transformedUser);
        }
      }
    };

    fetchRelatedData();
  }, [update.opportunityId, update.leadId, update.updatedByUserId, update.accountId, groupedUpdates]);

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
        type: 'General' as UpdateType,
        content: newActivityDescription,
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

  const getHeaderTitle = () => {
    if (opportunity) {
      return (
        <div className="flex items-center justify-between">
          <span className="font-semibold">{opportunity.name}</span>
          {totalUpdates > 1 && (
            <Badge variant="secondary" className="ml-2">
              {totalUpdates} updates
            </Badge>
          )}
        </div>
      );
    } else if (lead) {
      return (
        <div className="flex items-center justify-between">
          <span className="font-semibold">{lead.personName} ({lead.companyName})</span>
          {totalUpdates > 1 && (
            <Badge variant="secondary" className="ml-2">
              {totalUpdates} updates
            </Badge>
          )}
        </div>
      );
    } else if (account) {
      return (
        <div className="flex items-center justify-between">
          <span className="font-semibold">{account.name}</span>
          {totalUpdates > 1 && (
            <Badge variant="secondary" className="ml-2">
              {totalUpdates} updates
            </Badge>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between">
        <span className="font-semibold">Update</span>
        {totalUpdates > 1 && (
          <Badge variant="secondary" className="ml-2">
            {totalUpdates} updates
          </Badge>
        )}
      </div>
    );
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
    const isCurrentUpdate = log.id === update.id;
    return (
      <div key={log.id} className={`flex items-start space-x-3 p-3 rounded-lg ${isCurrentUpdate ? 'bg-primary/5 border-l-4 border-primary' : 'bg-muted/30 border-l-4 border-muted'}`}>
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
                by {user?.name || 'Unknown'}
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
        className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-white flex flex-col h-full cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
      >
      <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg font-headline text-foreground line-clamp-1">
              {getHeaderTitle()}
          </CardTitle>
            {getStatusBadge()}
        </div>

          <div className="space-y-1">
            {getValueDisplay()}
            {getExpectedClose()}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 flex-grow">
          {/* Description */}
          <div className="bg-white/30 p-3 rounded-[4px]">
            <p className="text-sm text-foreground line-clamp-3">{update.content}</p>
          </div>

          {/* Activity Log (max 2 items) */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
            <div className="bg-white/30 p-3 rounded-[4px] space-y-2">
              {activityLogs.slice(0, 2).map((log) => renderActivityLogItem(log))}
              {activityLogs.length > 2 && (
                <div className="flex items-center justify-center pt-2 border-t border-muted/30">
                  <p className="text-xs text-muted-foreground">
                    +{activityLogs.length - 2} more activities
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t mt-auto">
          <Button variant="outline" size="sm" asChild className="mr-auto rounded-[2px]">
            <div onClick={(e) => {
              e.stopPropagation();
              setIsDialogOpen(true);
            }}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </div>
          </Button>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="add" 
                  className="rounded-[2px] p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Add Activity</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-white" onClick={e => e.stopPropagation()}>
          <DialogHeader className="flex flex-row items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-headline">
                {opportunity?.name || lead?.personName || account?.name || 'Update'}
              </DialogTitle>
              {totalUpdates > 1 && (
                <Badge variant="secondary" className="ml-2">
                  {totalUpdates} updates
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getValueDisplay() && (
                <div className="bg-white/30 p-3 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Value</div>
                  {getValueDisplay()}
                </div>
              )}
              <div className="bg-white/30 p-3 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                {getStatusBadge()}
              </div>
              {getExpectedClose() && (
                <div className="bg-white/30 p-3 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Expected Close</div>
                  {getExpectedClose()}
                </div>
              )}
            </div>

            {/* Full Description */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-foreground">{update.content}</p>
              </div>
            </div>

            {/* All Activity Logs */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Activity Updates</div>
              <div className="relative">
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {activityLogs.map((log, idx) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 rounded-r-sm bg-muted/30 border-l-4 border-muted">
                      <div className="flex-shrink-0 mt-1">
                        {getUpdateTypeIcon(log.type)}
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
                {activityLogs.length > 2 && (
                  <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8" style={{background: 'linear-gradient(to bottom, transparent, #fff 90%)'}} />
                )}
              </div>
            </div>

            {/* Log New Activity Form */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Add New Activity</h4>
              <div className="space-y-3">
                <Textarea
                  placeholder="Describe the activity..."
                  value={newActivityDescription}
                  onChange={(e) => setNewActivityDescription(e.target.value)}
                  className="min-h-[80px] resize-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="add" 
                      className="w-fit"
                      onClick={handleLogActivity}
                      disabled={isLoggingActivity || !newActivityDescription.trim()}
                    >
                      {isLoggingActivity ? (
                        <LoadingSpinner size={16} className="mr-2" />
                      ) : (
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                      )}
                      Add Activity
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-fit">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {nextActionDate ? format(nextActionDate, 'MMM dd, yyyy') : 'Set next action'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={nextActionDate}
                          onSelect={setNextActionDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

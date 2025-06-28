"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChartBig, DollarSign, CalendarDays, Eye, AlertTriangle, CheckCircle2, Briefcase, Lightbulb, TrendingUp, Users, Clock, MessageSquarePlus, Calendar as CalendarIcon, Sparkles, Pencil, Check, X, Phone, Mail, FileText } from 'lucide-react';
import type { Opportunity, OpportunityForecast as AIOpportunityForecast, Account, OpportunityStatus, Update } from '@/types';
import { Progress } from "@/components/ui/progress";
import {format, differenceInDays, parseISO, isValid, formatDistanceToNowStrict, formatDistanceToNow} from 'date-fns';
import { aiPoweredOpportunityForecasting } from '@/ai/flows/ai-powered-opportunity-forecasting';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getAccountById } from '@/lib/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/lib/supabaseClient';
import { countries } from '@/lib/countryData';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface OpportunityCardProps {
  opportunity: Opportunity;
  accountName?: string;
  onStatusChange?: (newStatus: OpportunityStatus) => void;
  onValueChange?: (newValue: number) => void;
  onTimelineChange?: (newStartDate: string, newEndDate: string) => void;
}

const getStatusBadgeColorClasses = (status: Opportunity['status']): string => {
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

// Utility to safely parse ISO date strings
function safeParseISO(dateString?: string): Date | null {
  if (!dateString) return null;
  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : null;
}

function calculateProgress(startDate: string, endDate: string, status: OpportunityStatus): number {
  const start = safeParseISO(startDate);
  const end = safeParseISO(endDate);
  if (!start || !end) return 0;
  const today = new Date();
  if (status === 'Win') return 100;
  if (status === 'Loss') return 0;
  if (today < start) return 5;
  if (today >= end) return 95;
  const totalDuration = differenceInDays(end, start);
  const elapsedDuration = differenceInDays(today, start);
  if (totalDuration <= 0) return (status === 'Negotiation' || status === 'Proposal' || status === 'On Hold') ? 50 : 0;
  return Math.min(98, Math.max(5, (elapsedDuration / totalDuration) * 100));
}

// Build a map for quick lookup (outside the component)
const currencyMap = Object.fromEntries(
  countries.map(c => [c.currencyCode, c.currencySymbol || c.currencyCode])
);

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

export default function OpportunityCard({ opportunity, accountName, onStatusChange, onValueChange, onTimelineChange }: OpportunityCardProps) {
  // const [forecast, setForecast] = useState<AIOpportunityForecast | null>(null);
  // const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [associatedAccount, setAssociatedAccount] = useState<Account | undefined>(undefined);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<Update[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [newActivityType, setNewActivityType] = useState<'General' | 'Call' | 'Meeting' | 'Email'>('General');
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(undefined);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [assignedUser, setAssignedUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [editStatus, setEditStatus] = useState<OpportunityStatus>(opportunity.status as OpportunityStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // Editable Value
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editValue, setEditValue] = useState(opportunity.value.toString());
  const [isUpdatingValue, setIsUpdatingValue] = useState(false);

  // Editable Timeline
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);
  const [editStartDate, setEditStartDate] = useState(opportunity.startDate);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(safeParseISO(opportunity.endDate) || undefined);
  const [isUpdatingTimeline, setIsUpdatingTimeline] = useState(false);

  const status = opportunity.status as OpportunityStatus;

  // Use the map for robust lookup
  const currencySymbol = currencyMap[(opportunity as any).currency || 'USD'] || (opportunity as any).currency || '$';

  useEffect(() => {
    if (opportunity.accountId) {
      setAssociatedAccount(getAccountById(opportunity.accountId));
    }
  }, [opportunity.accountId]);

  // Fetch current user role
  useEffect(() => {
    const fetchRole = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;
      const { data, error } = await supabase.from('users').select('role').eq('id', userId).single();
      if (!error && data) setCurrentUserRole(data.role);
    };
    fetchRole();
  }, []);

  // Fetch assigned user from DB
  useEffect(() => {
    const fetchAssignedUser = async () => {
      const ownerId = opportunity.ownerId || (opportunity as any).owner_id;
      if (!ownerId) {
        setAssignedUser(null);
        setAssignedUserId(null);
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', ownerId)
        .single();
      if (!error && data) {
        setAssignedUser(data);
        setAssignedUserId(data.id);
      } else {
        setAssignedUser(null);
        setAssignedUserId(null);
      }
    };
    fetchAssignedUser();
  }, [opportunity.ownerId, (opportunity as any).owner_id]);

  // Fetch all users for assignment dropdown (admin only)
  useEffect(() => {
    if (currentUserRole !== 'admin') return;
    const fetchAllUsers = async () => {
      const { data, error } = await supabase.from('users').select('id, name, email');
      if (!error && data) setAllUsers(data);
    };
    fetchAllUsers();
  }, [currentUserRole]);

  // Fetch existing logs from Supabase
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      try {
        console.log('Fetching activity logs for opportunity:', opportunity.id);
        
        // Check if opportunity.id exists and is valid
        if (!opportunity.id) {
          console.error('No opportunity ID provided');
          setActivityLogs([]);
          return;
        }

        // First, let's check if the opportunity exists in the database
        const { data: opportunityCheck, error: opportunityError } = await supabase
          .from('opportunity')
          .select('id')
          .eq('id', opportunity.id)
          .single();

        if (opportunityError) {
          console.error('Opportunity not found:', opportunityError);
          setActivityLogs([]);
          return;
        }

        console.log('Opportunity found, fetching logs...');
        
        // Debug: Let's first check what columns exist in the update table
        console.log('Checking update table structure...');
        const { data: tableInfo, error: tableError } = await supabase
          .from('update')
          .select('*')
          .limit(1);
        
        if (tableError) {
          console.error('Error checking table structure:', tableError);
        } else {
          console.log('Update table structure sample:', tableInfo?.[0]);
        }
        
        // Now fetch the logs with better error handling
        console.log('Executing main query for opportunity_id:', opportunity.id);
        const { data: logsData, error } = await supabase
          .from('update')
          .select('*')
          .eq('opportunity_id', opportunity.id)
          .order('date', { ascending: false });
        
        console.log('Query result:', { data: logsData, error });
        
        if (error) {
          console.error('Supabase error fetching logs:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          
          // Try a fallback query to see if the issue is with the opportunity_id column
          console.log('Trying fallback query...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('update')
            .select('*')
            .limit(5);
          
          if (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
          } else {
            console.log('Fallback query successful, sample data:', fallbackData);
          }
          
          toast({ 
            title: "Error", 
            description: `Failed to load activity logs: ${error.message || 'Unknown error'}`, 
            variant: "destructive" 
          });
          setActivityLogs([]);
          return;
        }
        
        console.log('Activity logs fetched successfully:', logsData?.length || 0, 'logs');
        
        if (logsData && logsData.length > 0) {
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
          setActivityLogs(transformedLogs);
        } else {
          console.log('No activity logs found for opportunity:', opportunity.id);
          setActivityLogs([]);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        console.error('Error type:', typeof error);
        console.error('Error details:', error);
        toast({ 
          title: "Error", 
          description: "Failed to load activity logs. Please try again.", 
          variant: "destructive" 
        });
        setActivityLogs([]);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    if (opportunity.id) {
      fetchLogs();
    }
  }, [opportunity.id, toast]);

  // Function to refresh activity logs
  const refreshActivityLogs = async () => {
    try {
      console.log('Refreshing activity logs for opportunity:', opportunity.id);
      
      const { data: logsData, error } = await supabase
        .from('update')
        .select('*')
        .eq('opportunity_id', opportunity.id)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Supabase error refreshing logs:', error);
        return;
      }
      
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
        setActivityLogs(transformedLogs);
      }
    } catch (error) {
      console.error('Failed to refresh logs:', error);
    }
  };

  // const fetchForecast = async () => {
  //   setIsLoadingForecast(true);
  //   try {
  //     const start = safeParseISO(opportunity.startDate);
  //     const end = safeParseISO(opportunity.endDate);
  //     const timeline = start && end ? `Start: ${format(start, 'MMM dd, yyyy')}, End: ${format(end, 'MMM dd, yyyy')}` : 'N/A';
  //     const forecastData = await aiPoweredOpportunityForecasting({
  //       opportunityName: opportunity.name,
  //       opportunityDescription: opportunity.description,
  //       opportunityTimeline: timeline,
  //       opportunityValue: opportunity.value,
  //       opportunityStatus: opportunity.status,
  //       recentUpdates: "Placeholder: Updates show steady progress.",
  //     });
  //     setForecast(forecastData);
  //   } catch (error) {
  //     console.error(`Failed to fetch forecast for ${opportunity.name}:`, error);
  //     setForecast({ timelinePrediction: "N/A", completionDateEstimate: "N/A", revenueForecast: opportunity.value,    bottleneckIdentification: "Error fetching forecast."});
  //   } finally {
  //     setIsLoadingForecast(false);
  //   }
  // };

  // useEffect(() => {
  //   if(opportunity.status !== 'Win' && opportunity.status !== 'Loss' && opportunity.name && opportunity.startDate && opportunity.endDate && opportunity.value && opportunity.status && opportunity.description) {
  //       fetchForecast();
  //   } else {
  //     setForecast(null); // No forecast for completed/cancelled
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [opportunity.id, opportunity.name, opportunity.startDate, opportunity.endDate, opportunity.value, opportunity.status, opportunity.description]);

  const progress = calculateProgress(opportunity.startDate, opportunity.endDate, opportunity.status as OpportunityStatus);
  // const isAtRisk = forecast?.bottleneckIdentification && forecast.bottleneckIdentification.toLowerCase() !== "none identified" && forecast.bottleneckIdentification.toLowerCase() !== "none" && forecast.bottleneckIdentification !== "Error fetching forecast." && forecast.bottleneckIdentification.length > 0;
  
  let opportunityHealthIcon = <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
  let opportunityHealthText = "On Track";
  // if (forecast?.bottleneckIdentification === "Error fetching forecast.") {
  //   opportunityHealthIcon = <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />;
  //   opportunityHealthText = "Forecast Error";
  // } else if (isAtRisk) {
  //   opportunityHealthIcon = <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
  //   opportunityHealthText = "Potential Risk";
  // }


  function timeRemaining(status: OpportunityStatus): string {
    if (status === 'Win' || status === 'Loss') return status;
    const end = safeParseISO(opportunity.endDate);
    if (!end) return 'N/A';
    const now = new Date();
    if (now > end) return `Overdue by ${formatDistanceToNowStrict(end, {addSuffix: false})}`;
    return `${formatDistanceToNowStrict(end, {addSuffix: false})} left`;
  }

  const handleLogActivity = async () => {
    if (!newActivityDescription.trim()) {
      toast({ title: "Error", description: "Please enter a description for the activity.", variant: "destructive" });
      return;
    }
    if (!newActivityType) {
      toast({ title: "Error", description: "Please select an activity type.", variant: "destructive" });
      return;
    }
    
    // Prevent duplicate submissions
    if (isLoggingActivity) {
      console.log('Activity logging already in progress, ignoring duplicate click');
      return;
    }
    
    // Check for recent duplicate entries (within last 5 seconds)
    const recentDuplicate = activityLogs.find(log => 
      log.content === newActivityDescription.trim() && 
      log.type === 'General' &&
      new Date().getTime() - new Date(log.createdAt).getTime() < 5000
    );
    
    if (recentDuplicate) {
      console.log('Duplicate activity detected, ignoring');
      toast({ title: "Warning", description: "This activity was already logged recently.", variant: "destructive" });
      return;
    }
    
    setIsLoggingActivity(true);
    console.log('Starting to log activity:', newActivityDescription);
    
    try {
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');

      // Save to Supabase
      const { data, error } = await supabase.from('update').insert([
        {
          type: newActivityType,
          content: newActivityDescription,
          updated_by_user_id: currentUserId,
          date: new Date().toISOString(),
          lead_id: null,
          opportunity_id: opportunity.id,
          account_id: opportunity.accountId,
          next_action_date: nextActionDate?.toISOString() || null,
        }
      ]).select().single();

      if (error) throw error;

      console.log('Activity logged successfully:', data);

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
        nextActionDate: data.next_action_date,
      };

      // Update local state and refresh logs
      setActivityLogs(prev => [newUpdate, ...prev]);
      setNewActivityDescription('');
      setNewActivityType('General');
      setNextActionDate(undefined);
      
      // Also refresh from backend to ensure consistency
      await refreshActivityLogs();
      
      toast({ title: "Success", description: "Activity logged successfully." });
    } catch (error) {
      console.error('Failed to log activity:', error);
      toast({ title: "Error", description: "Failed to log activity. Please try again.", variant: "destructive" });
    } finally {
      setIsLoggingActivity(false);
    }
  };

  const renderActivityLogItem = (log: Update) => {
    const logDate = safeParseISO(log.date);
    return (
      <div key={log.id} className="flex items-start space-x-3 p-3 rounded-r-lg bg-[#9A8A744c] border-l-4 border-muted">
        <div className="flex-shrink-0 mt-1">
          {getUpdateTypeIcon(log.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-foreground line-clamp-2">{log.content}</p>
            <span className="text-xs text-muted-foreground ml-2">{logDate ? format(logDate, 'MMM dd') : 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">{log.type}</Badge>
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

  const toggleAiInsights = () => setShowAiInsights((prev) => !prev);

  const handleAssignUser = async (userId: string) => {
    setAssignedUserId(userId);
    // Update the assignment in the backend
    const { error } = await supabase
      .from('opportunity')
      .update({ owner_id: userId })
      .eq('id', opportunity.id);
    if (!error) {
      // Fetch and update assigned user
      const { data, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', userId)
        .single();
      if (!userError && data) setAssignedUser(data);
    }
  };

  // Keep editStatus in sync if opportunity.status changes (e.g., after parent update)
  useEffect(() => {
    setEditStatus(opportunity.status as OpportunityStatus);
  }, [opportunity.status]);

  const handleStatusChange = async (newStatus: OpportunityStatus) => {
    setIsUpdatingStatus(true);
    const { error } = await supabase
      .from('opportunity')
      .update({ status: newStatus })
      .eq('id', opportunity.id);
    if (!error) {
      setEditStatus(newStatus);
      toast({ title: "Status Updated", description: `Status changed to ${newStatus}` });
      if (onStatusChange) onStatusChange(newStatus);
    } else {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
    setIsUpdatingStatus(false);
  };

  // Status options for editing
  const statusOptions = [
    'Scope Of Work',
    'Proposal',
    'Negotiation',
    'On Hold',
    'Win',
    'Loss',
  ];

  // Keep edit fields in sync if opportunity changes
  useEffect(() => {
    setEditStatus(opportunity.status as OpportunityStatus);
    setEditValue(opportunity.value.toString());
    setEditStartDate(opportunity.startDate);
    setEditEndDate(safeParseISO(opportunity.endDate) || undefined);
  }, [opportunity.value, opportunity.startDate, opportunity.endDate]);

  const handleValueSave = async () => {
    setIsUpdatingValue(true);
    const newValue = Number(editValue.replace(/,/g, ''));
    const { error } = await supabase
      .from('opportunity')
      .update({ value: newValue })
      .eq('id', opportunity.id);
    if (!error) {
      toast({ title: "Value Updated", description: `Value changed to ${newValue.toLocaleString()}` });
      setIsEditingValue(false);
      if (typeof onValueChange === 'function') onValueChange(newValue);
    } else {
      toast({ title: "Error", description: "Failed to update value", variant: "destructive" });
    }
    setIsUpdatingValue(false);
  };

  const handleTimelineSave = async () => {
    if (!editEndDate) return;
    setIsUpdatingTimeline(true);
    try {
      const { error } = await supabase
        .from('opportunity')
        .update({ end_date: editEndDate.toISOString() })
        .eq('id', opportunity.id);
      if (error) throw error;
      setIsEditingTimeline(false);
      toast({ title: 'Timeline updated', description: 'Expected close date has been updated.' });
      if (onTimelineChange) onTimelineChange(opportunity.startDate, editEndDate.toISOString());
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update timeline.', variant: 'destructive' });
    } finally {
      setIsUpdatingTimeline(false);
    }
  };

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-white flex flex-col h-full cursor-pointer" onClick={() => setIsDialogOpen(true)}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg font-headline text-foreground line-clamp-1 flex items-center">
              <BarChartBig className="mr-2 h-5 w-5 text-primary shrink-0" />
              {opportunity.name}
            </CardTitle>
            <Badge variant="secondary" className={`capitalize whitespace-nowrap ml-2 ${getStatusBadgeColorClasses(opportunity.status)}`}>{opportunity.status}</Badge>
          </div>
          <div className="space-y-1">
            <div className="flex items-center text-muted-foreground">
              <Briefcase className="mr-2 h-4 w-4 shrink-0" />
              <span className="text-xs">{accountName}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <DollarSign className="mr-2 h-4 w-4 text-green-600 shrink-0" />
              <span className="font-medium text-foreground">
                {currencySymbol} {opportunity.value.toLocaleString()}
              </span>
            </div>
            {assignedUser && (
              <div className="flex items-center text-muted-foreground">
                <Users className="mr-2 h-4 w-4 shrink-0" />
                <span className="text-xs">Assigned To: <span className="font-semibold text-foreground">{assignedUser.name}</span></span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex-grow">
          <div className="bg-[#F8F7F3] p-3 rounded-[4px]">
            <p className="text-sm text-foreground line-clamp-3">{opportunity.description}</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center text-muted-foreground text-xs">
              <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
              <span>{
                (() => {
                  const start = safeParseISO(opportunity.startDate);
                  const end = safeParseISO(opportunity.endDate);
                  if (start && end) {
                    return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
                  }
                  return 'N/A';
                })()
              }</span>
            </div>
            <div className="flex items-center text-muted-foreground text-xs">
              <Clock className="mr-1 h-3 w-3 shrink-0"/>{timeRemaining(opportunity.status as OpportunityStatus)}
            </div>
          </div>
          {/* {(forecast || isLoadingForecast) && opportunity.status !== 'Win' && opportunity.status !== 'Loss' && (
            <div className="pt-3 border-t mt-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center">
                <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-yellow-500" /> AI Forecast
              </h4>
              {isLoadingForecast ? (
                <div className="flex items-center space-x-2 h-12">
                  <LoadingSpinner size={16} />
                  <span className="text-xs text-muted-foreground">Generating forecast...</span>
                </div>
              ) : forecast ? (
                <div className="space-y-1 text-xs">
                  <p className="text-foreground line-clamp-1">
                    <span className="font-medium">Est. Completion:</span> {forecast.completionDateEstimate}
                  </p>
                  <p className="text-foreground line-clamp-2 leading-snug">
                    <span className="font-medium">Bottlenecks:</span> {forecast.bottleneckIdentification || "None identified"}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground h-12 flex items-center">No AI forecast data for this opportunity.</p>
              )}
            </div>
          )} */}
        </CardContent>
        <CardFooter className="pt-4 border-t mt-auto flex gap-2">
          <Button variant="outline" size="sm" asChild className="mr-auto rounded-[4px]" onClick={(e) => { e.stopPropagation(); setIsViewDialogOpen(true); }}>
            <div>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </div>
          </Button>
        </CardFooter>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-white" onClick={e => e.stopPropagation()}>
          <DialogHeader className="flex flex-row items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-headline">
                {opportunity.name}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-[#F3F4F6] p-4 rounded-lg flex flex-col items-center justify-center min-h-[56px]">
                <div className="text-sm font-medium text-[#6B7280]">Value</div>
                <div className="text-2xl font-bold text-[#5E6156] mt-1">
                  {isEditingValue ? (
                    <div className="flex flex-col items-center gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 text-center"
                        placeholder="0"
                      />
                      <div className="flex gap-1">
                        <button onClick={handleValueSave} disabled={isUpdatingValue} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                        <button onClick={() => { setIsEditingValue(false); setEditValue(opportunity.value.toString()); }} disabled={isUpdatingValue} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <>{currencySymbol} {opportunity.value.toLocaleString()}</>
                  )}
                </div>
              </div>
              <div className="bg-[#F3F4F6] p-4 rounded-lg flex flex-col items-center justify-center min-h-[56px]">
                <div className="text-sm font-medium text-[#6B7280]">Status</div>
                <Select
                  value={editStatus}
                  onValueChange={value => handleStatusChange(value as OpportunityStatus)}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="w-full mt-2 bg-[#E5E7EB] text-[#333] rounded-[8px] px-4 py-1 text-base font-semibold capitalize">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isUpdatingStatus && <span className="text-xs text-muted-foreground mt-1">Updating...</span>}
              </div>
              <div className="bg-[#F3F4F6] p-4 rounded-lg flex flex-col items-center justify-center min-h-[56px]">
                <div className="text-sm font-medium text-[#6B7280] flex items-center gap-2">
                  Expected Close
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => setIsEditingTimeline(true)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-lg font-semibold mt-1">
                  {isEditingTimeline ? (
                    <div className="flex flex-col items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editEndDate ? format(editEndDate, 'MMM dd, yyyy') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <Calendar
                            mode="single"
                            selected={editEndDate}
                            onSelect={setEditEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <div className="flex gap-1">
                        <button onClick={handleTimelineSave} disabled={isUpdatingTimeline} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                        <button onClick={() => { setIsEditingTimeline(false); setEditEndDate(safeParseISO(opportunity.endDate) || undefined); }} disabled={isUpdatingTimeline} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const end = safeParseISO(opportunity.endDate);
                      return end ? format(end, 'MMM dd, yyyy') : 'N/A';
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* Full Description */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-foreground">
                  {opportunity.description || 'No description available.'}
                </p>
              </div>
            </div>

            {/* All Activity Logs */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Activity Updates</div>
              <div className="relative">
                {isLoadingLogs ? (
                  <div className="flex items-center justify-center h-32">
                    <LoadingSpinner size={24} />
                    <span className="ml-2 text-muted-foreground">Loading activity updates...</span>
                  </div>
                ) : activityLogs.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {activityLogs.map((log) => renderActivityLogItem(log))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <span>No activity updates yet</span>
                  </div>
                )}
                {/* Gradient overlay at the bottom, only if more than one log */}
                {activityLogs.length > 2 && (
                  <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8" style={{background: 'linear-gradient(to bottom, transparent, #fff 90%)'}} />
                )}
              </div>
            </div>

            {/* Add New Activity Form */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Add New Activity</h4>
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row gap-2 items-center min-h-[44px]">
                  <Select value={newActivityType} onValueChange={value => setNewActivityType(value as 'General' | 'Call' | 'Meeting' | 'Email')}>
                    <SelectTrigger className="w-fit min-w-[120px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Describe the activity..."
                    value={newActivityDescription}
                    onChange={(e) => setNewActivityDescription(e.target.value)}
                    className="min-h-[44px] resize-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 flex-1"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 w-full">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-fit">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {nextActionDate ? format(nextActionDate, 'MMM dd, yyyy') : 'Select next action'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={nextActionDate}
                        onSelect={(date) => setNextActionDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Opportunity Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div><span className="font-semibold">Name:</span> {opportunity.name}</div>
              <div><span className="font-semibold">Account:</span> {accountName}</div>
              <div><span className="font-semibold">Value:</span> ${opportunity.value.toLocaleString()}</div>
              <div><span className="font-semibold">Status:</span> {opportunity.status}</div>
              <div><span className="font-semibold">Description:</span> {opportunity.description}</div>
              <div><span className="font-semibold">Timeline:</span> {
                (() => {
                  const start = safeParseISO(opportunity.startDate);
                  const end = safeParseISO(opportunity.endDate);
                  if (start && end) {
                    return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
                  }
                  return 'N/A';
                })()
              }</div>
              <div><span className="font-semibold">Created:</span> {opportunity.createdAt && !isNaN(new Date(opportunity.createdAt).getTime()) ? formatDistanceToNow(new Date(opportunity.createdAt), { addSuffix: true }) : 'N/A'}</div>
              <div><span className="font-semibold">Last Updated:</span> {opportunity.updatedAt && !isNaN(new Date(opportunity.updatedAt).getTime()) ? formatDistanceToNow(new Date(opportunity.updatedAt), { addSuffix: true }) : 'N/A'}</div>
            </div>
            <div className="pt-2">
              <span className="font-semibold">Assigned To:</span>
              {currentUserRole === 'admin' ? (
                <Select value={assignedUserId || ''} onValueChange={handleAssignUser}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Assign to user" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="ml-2">{assignedUser ? `${assignedUser.name} (${assignedUser.email})` : <span className="text-muted-foreground">Unassigned</span>}</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

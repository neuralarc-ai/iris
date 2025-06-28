"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChartBig, DollarSign, CalendarDays, Eye, AlertTriangle, CheckCircle2, Briefcase, Lightbulb, TrendingUp, Users, Clock, MessageSquarePlus, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import type { Opportunity, OpportunityForecast as AIOpportunityForecast, Account, OpportunityStatus, Update } from '@/types';
import { Progress } from "@/components/ui/progress";
import {format, differenceInDays, parseISO, isValid, formatDistanceToNowStrict} from 'date-fns';
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

interface OpportunityCardProps {
  opportunity: Opportunity;
  accountName?: string;
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

export default function OpportunityCard({ opportunity, accountName }: OpportunityCardProps) {
  const [forecast, setForecast] = useState<AIOpportunityForecast | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [associatedAccount, setAssociatedAccount] = useState<Account | undefined>(undefined);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<Update[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(undefined);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [assignedUser, setAssignedUser] = useState<{ name: string; email: string } | null>(null);

  const status = opportunity.status as OpportunityStatus;

  // Use the map for robust lookup
  const currencySymbol = currencyMap[opportunity.currency] || opportunity.currency || '$';

  useEffect(() => {
    if (opportunity.accountId) {
      setAssociatedAccount(getAccountById(opportunity.accountId));
    }
  }, [opportunity.accountId]);

  // Note: Opportunity interface doesn't have ownerId, so we'll skip this for now
  // If owner assignment is needed, it should be added to the Opportunity interface

  // Fetch existing logs from Supabase
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      try {
        console.log('Fetching activity logs for opportunity:', opportunity.id);
        
        const { data: logsData, error } = await supabase
          .from('update')
          .select('*')
          .eq('opportunity_id', opportunity.id)
          .order('date', { ascending: false });
        
        if (error) {
          console.error('Supabase error fetching logs:', error);
          toast({ 
            title: "Error", 
            description: "Failed to load activity logs. Please try again.", 
            variant: "destructive" 
          });
          return;
        }
        
        if (logsData) {
          console.log('Activity logs fetched successfully:', logsData.length, 'logs');
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
          setActivityLogs(transformedLogs);
        } else {
          console.log('No activity logs found for opportunity:', opportunity.id);
          setActivityLogs([]);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        toast({ 
          title: "Error", 
          description: "Failed to load activity logs. Please try again.", 
          variant: "destructive" 
        });
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
        }));
        setActivityLogs(transformedLogs);
      }
    } catch (error) {
      console.error('Failed to refresh logs:', error);
    }
  };

  const fetchForecast = async () => {
    setIsLoadingForecast(true);
    try {
      const start = safeParseISO(opportunity.startDate);
      const end = safeParseISO(opportunity.endDate);
      const timeline = start && end ? `Start: ${format(start, 'MMM dd, yyyy')}, End: ${format(end, 'MMM dd, yyyy')}` : 'N/A';
      const forecastData = await aiPoweredOpportunityForecasting({
        opportunityName: opportunity.name,
        opportunityDescription: opportunity.description,
        opportunityTimeline: timeline,
        opportunityValue: opportunity.value,
        opportunityStatus: opportunity.status,
        recentUpdates: "Placeholder: Updates show steady progress.",
      });
      setForecast(forecastData);
    } catch (error) {
      console.error(`Failed to fetch forecast for ${opportunity.name}:`, error);
      setForecast({ timelinePrediction: "N/A", completionDateEstimate: "N/A", revenueForecast: opportunity.value, bottleneckIdentification: "Error fetching forecast."});
    } finally {
      setIsLoadingForecast(false);
    }
  };

  useEffect(() => {
    if(opportunity.status !== 'Win' && opportunity.status !== 'Loss' && opportunity.name && opportunity.startDate && opportunity.endDate && opportunity.value && opportunity.status && opportunity.description) {
        fetchForecast();
    } else {
      setForecast(null); // No forecast for completed/cancelled
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity.id, opportunity.name, opportunity.startDate, opportunity.endDate, opportunity.value, opportunity.status, opportunity.description]);

  const progress = calculateProgress(opportunity.startDate, opportunity.endDate, opportunity.status as OpportunityStatus);
  const isAtRisk = forecast?.bottleneckIdentification && forecast.bottleneckIdentification.toLowerCase() !== "none identified" && forecast.bottleneckIdentification.toLowerCase() !== "none" && forecast.bottleneckIdentification !== "Error fetching forecast." && forecast.bottleneckIdentification.length > 0;
  
  let opportunityHealthIcon = <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
  let opportunityHealthText = "On Track";
  if (forecast?.bottleneckIdentification === "Error fetching forecast.") {
    opportunityHealthIcon = <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />;
    opportunityHealthText = "Forecast Error";
  } else if (isAtRisk) {
    opportunityHealthIcon = <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
    opportunityHealthText = "Potential Risk";
  }


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
          type: 'General',
          content: newActivityDescription,
          updated_by_user_id: currentUserId,
          date: new Date().toISOString(),
          lead_id: null,
          opportunity_id: opportunity.id,
          account_id: opportunity.accountId,
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
      };

      // Update local state and refresh logs
      setActivityLogs(prev => [newUpdate, ...prev]);
      setNewActivityDescription('');
      
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
      <div key={log.id} className="flex items-start space-x-3 p-3 rounded-r-lg bg-muted/30 border-l-4 border-muted">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-foreground line-clamp-2">{log.content}</p>
            <span className="text-xs flex-shrink-0 text-muted-foreground ml-2">{logDate ? format(logDate, 'MMM dd') : 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">{log.type}</Badge>
          </div>
        </div>
      </div>
    );
  };

  const toggleAiInsights = () => setShowAiInsights((prev) => !prev);

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
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-2 flex-1" gradient="linear-gradient(90deg, #3987BE 0%, #D48EA3 100%)" />
            <div className="flex items-center gap-1 text-xs">
              {opportunityHealthIcon} {opportunityHealthText}
            </div>
          </div>
          {(forecast || isLoadingForecast) && opportunity.status !== 'Win' && opportunity.status !== 'Loss' && (
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
          )}
        </CardContent>
        <CardFooter className="pt-4 border-t mt-auto flex gap-2">
          <Button variant="outline" size="sm" asChild className="mr-auto rounded-[4px]">
            <Link href={`/opportunities/${opportunity.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </Button>
        </CardFooter>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline flex items-center">
              <BarChartBig className="mr-2 h-5 w-5 text-primary shrink-0" />
              {opportunity.name}
            </DialogTitle>
            <DialogDescription>{opportunity.description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/30 p-3 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Value</div>
                <div className="text-lg font-bold text-[#97A487]">
                  {currencySymbol} {opportunity.value.toLocaleString()}
                </div>
              </div>
              <div className="bg-white/30 p-3 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <Badge variant="secondary" className={`capitalize whitespace-nowrap ml-2 ${getStatusBadgeColorClasses(opportunity.status)}`}>{opportunity.status}</Badge>
              </div>
              <div className="bg-white/30 p-3 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Timeline</div>
                <div className="text-xs text-muted-foreground">{
                  (() => {
                    const start = safeParseISO(opportunity.startDate);
                    const end = safeParseISO(opportunity.endDate);
                    if (start && end) {
                      return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
                    }
                    return 'N/A';
                  })()
                }</div>
              </div>
            </div>
            {/* Progress & Health */}
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2 flex-1" gradient="linear-gradient(90deg, #3987BE 0%, #D48EA3 100%)" />
              <div className="flex items-center gap-1 text-xs">
                {opportunityHealthIcon} {opportunityHealthText}
              </div>
            </div>
            {/* Activity Log */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Activity Log</h4>
              {isLoadingLogs ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingSpinner size={24} />
                  <span className="ml-2 text-muted-foreground">Loading activity logs...</span>
                </div>
              ) : activityLogs.length > 0 ? (
                <div className="space-y-2 h-32 overflow-y-auto">
                  {activityLogs.map((log) => renderActivityLogItem(log))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <span>No activity logs yet</span>
                </div>
              )}
            </div>
            {/* Log New Activity Form */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Log New Activity</h4>
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
                      Log Activity
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
                          onSelect={(date) => setNextActionDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={toggleAiInsights}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Advice
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

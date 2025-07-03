"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, User, Mail, Phone, Eye, CheckSquare, FileWarning, CalendarPlus, History, Linkedin, MapPin, Trash2, Pencil, X, FileText, Building2, UserCheck, Clock, Calendar as CalendarIcon, Activity, PlusCircle, MoreHorizontal, Briefcase, Target, User as UserIcon, BrainCircuit, FileText as FileTextIcon, Lightbulb, Mail as MailIcon, Globe, RefreshCw, Copy as CopyIcon, Send as SendIcon, Inbox, AtSign, Shield, Computer } from 'lucide-react';
import type { Lead, Update, LeadStatus } from '@/types';
import { add, formatDistanceToNow, format, parseISO } from 'date-fns';
import { convertLeadToAccount, deleteLead } from '@/lib/data';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { archiveLead } from '@/lib/archive';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { countries } from '@/lib/countryData';
import AddOpportunityDialog from '@/components/opportunities/AddOpportunityDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import LeadDialog from './LeadDialog';

interface LeadCardProps {
  lead: Lead;
  onLeadConverted: (leadId: string, newAccountId: string) => void;
  onLeadDeleted?: (leadId: string) => void;
  onActivityLogged?: (leadId: string, activity: Update) => void;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  assignedUser?: string;
  onStatusChange?: (newStatus: LeadStatus) => void;
  users?: Array<{ id: string; name: string; email: string }>;
  role?: string;
  enrichmentData?: { leadScore?: number; recommendations?: string[]; pitchNotes?: string; useCase?: string; emailTemplate?: string };
  isEnrichmentLoading?: boolean;
}

// Add type for editLead state
interface EditLeadState {
  companyName: string;
  personName: string;
  email: string;
  phone: string;
  country: string;
  website: string;
  industry: string;
  jobTitle: string;
  status: LeadStatus;
}

const getStatusBadgeVariant = (status: Lead['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'New': return 'secondary';
    case 'Contacted': return 'outline';
    case 'Qualified': return 'default';
    case 'Proposal Sent': return 'default';
    case 'Converted to Account': return 'default';
    case 'Lost': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusBadgeColorClasses = (status: Lead['status']): string => {
  switch (status) {
    case 'New': return 'bg-[#C57E94]/10 text-[#C57E94] border-[#C57E94]/20';
    case 'Contacted': return 'bg-[#4B7B9D]/10 text-[#4B7B9D] border-[#4B7B9D]/20';
    case 'Qualified': return 'bg-[#5E6156]/10 text-[#5E6156] border-[#5E6156]/20';
    case 'Proposal Sent': return 'bg-[#998876]/10 text-[#998876] border-[#998876]/20';
    case 'Converted to Account': return 'bg-[#916D5B]/10 text-[#916D5B] border-[#916D5B]/20';
    case 'Lost': return 'bg-[#CBCAC5]/10 text-[#CBCAC5] border-[#CBCAC5]/20';
    default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
  }
}

const getUpdateTypeIcon = (type: Update['type']) => {
  switch (type) {
    case 'Call':
      return <Phone className="h-4 w-4 text-[#4B7B9D]" />;
    case 'Email':
      return <Mail className="h-4 w-4 text-[#C57E94]" />;
    case 'Meeting':
      return <Users className="h-4 w-4 text-[#5E6156]" />;
    case 'General':
    default:
      return <FileText className="h-4 w-4 text-[#998876]" />;
  }
};

export default function LeadCard({ lead, onLeadConverted, onLeadDeleted, onActivityLogged, selectMode = false, selected = false, onSelect, assignedUser, onStatusChange, users = [], role, enrichmentData, isEnrichmentLoading }: LeadCardProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [updateType, setUpdateType] = React.useState('');
  const [updateContent, setUpdateContent] = React.useState('');
  const [updateDate, setUpdateDate] = React.useState<Date | undefined>(undefined);
  const [isLogging, setIsLogging] = React.useState(false);
  const updateTypes = ['General', 'Call', 'Meeting', 'Email'];
  const [editMode, setEditMode] = React.useState(false);
  const [editLead, setEditLead] = React.useState<EditLeadState>({
    companyName: lead.companyName,
    personName: lead.personName,
    email: lead.email,
    phone: lead.phone || '',
    country: lead.country || '',
    website: lead.website || '',
    industry: lead.industry || '',
    jobTitle: lead.jobTitle || '',
    status: lead.status,
  });
  const [logs, setLogs] = React.useState<Update[]>([]);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [assignedUserId, setAssignedUserId] = React.useState(lead.assignedUserId || '');
  const assignedUserObj = users.find(u => u.id === assignedUserId);
  const leadStatusOptions: LeadStatus[] = [
    "New", "Contacted", "Qualified", "Proposal Sent", "Lost"
  ];
  const [editStatus, setEditStatus] = React.useState<LeadStatus>(lead.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [isAddOpportunityOpen, setIsAddOpportunityOpen] = React.useState(false);
  const [nextActionDate, setNextActionDate] = React.useState<Date | undefined>(undefined);
  const [showConvertDialog, setShowConvertDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isFutureActivity, setIsFutureActivity] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [emailTabContent, setEmailTabContent] = React.useState<string | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<{ name: string; email: string } | null>(null);
  const [isEnrichingLead, setIsEnrichingLead] = React.useState(false);

  const completenessFields = [lead.companyName, lead.personName, lead.email, lead.phone, lead.country];
  const filledFields = completenessFields.filter(Boolean).length;
  const dataCompleteness = Math.round((filledFields / completenessFields.length) * 100);

  // Fetch existing logs from Supabase
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data: logsData } = await supabase
          .from('update')
          .select('*')
          .eq('lead_id', lead.id)
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
  }, [lead.id]);

  useEffect(() => {
    setEditStatus(lead.status);
  }, [lead.status]);

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;
      const { data, error } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setCurrentUser({ name: data.name, email: data.email });
      }
    };
    fetchUser();
  }, []);

  const handleConvertLead = async () => {
    if (lead.status === "Converted to Account" || lead.status === "Lost") {
      toast({ title: "Action not allowed", description: "This lead has already been processed.", variant: "destructive" });
      return;
    }

    try {
      // Carry forward the assigned user from the lead
      const ownerId = lead.assignedUserId || localStorage.getItem('user_id');
      if (!ownerId) throw new Error('User not authenticated');

      const { data: accountData, error: accountError } = await supabase.from('account').insert([
        {
          name: lead.companyName,
          type: 'Client',
          status: 'Active',
          description: `Converted from lead: ${lead.personName}`,
          contact_email: lead.email,
          contact_person_name: lead.personName,
          contact_phone: lead.phone || '',
          converted_from_lead_id: lead.id,
          owner_id: ownerId,
        }
      ]).select().single();

      if (accountError || !accountData) {
        throw accountError || new Error('Failed to create account');
      }

      // Update lead status to "Converted to Account"
      const { error: leadError } = await supabase
        .from('lead')
        .update({ status: 'Converted to Account' })
        .eq('id', lead.id);

      if (leadError) {
        throw leadError;
      }

      toast({
        title: "Lead Converted!",
        description: lead.companyName + " has been converted to an account: " + accountData.name + ".",
        className: "bg-green-100 dark:bg-green-900 border-green-500"
      });

      // Call the callback to update the UI
      onLeadConverted(lead.id, accountData.id);
    } catch (error) {
      console.error('Lead conversion failed:', error);
      toast({ 
        title: "Conversion Failed", 
        description: error instanceof Error ? error.message : "Could not convert lead to account.", 
        variant: "destructive" 
      });
    }
  };

  const canConvert = lead.status !== "Converted to Account" && lead.status !== "Lost";

  const handleArchiveLead = async () => {
    try {
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');
      
      await archiveLead(lead.id, currentUserId);

      toast({
        title: "Lead Archived",
        description: `${lead.companyName} and all related activity logs have been moved to archive.`,
        variant: "destructive"
      });

      if (onLeadDeleted) onLeadDeleted(lead.id);
    } catch (error) {
      console.error('Lead archiving failed:', error);
      toast({ 
        title: "Archiving Failed", 
        description: error instanceof Error ? error.message : "Could not archive lead.", 
        variant: "destructive" 
      });
    }
  };

  const handleLogUpdate = async () => {
    if (!updateType || !updateContent.trim() || !updateDate) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsLogging(true);
    try {
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');

      const { data, error } = await supabase.from('update').insert([
        {
          type: updateType,
          content: updateContent.trim(),
          updated_by_user_id: currentUserId,
          date: updateDate.toISOString(),
          next_action_date: nextActionDate?.toISOString() || null,
          lead_id: lead.id,
        }
      ]).select().single();

      if (error || !data) throw error || new Error('Failed to log update');

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

      setLogs(prev => [newUpdate, ...prev]);
      setUpdateType('');
      setUpdateContent('');
      setUpdateDate(undefined);
      setNextActionDate(undefined);

      toast({
        title: "Activity Logged",
        description: "Your update has been successfully logged.",
        className: "bg-green-100 dark:bg-green-900 border-green-500"
      });

      if (onActivityLogged) onActivityLogged(lead.id, newUpdate);
    } catch (error) {
      console.error('Failed to log update:', error);
      toast({
        title: "Logging Failed",
        description: error instanceof Error ? error.message : "Could not log update.",
        variant: "destructive"
      });
    } finally {
      setIsLogging(false);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditLead(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('lead')
        .update({
          company_name: editLead.companyName,
          person_name: editLead.personName,
          email: editLead.email,
          phone: editLead.phone,
          website: editLead.website,
          industry: editLead.industry,
          job_title: editLead.jobTitle,
          status: editLead.status,
        })
        .eq('id', lead.id);
      if (error) throw error;
      toast({ title: 'Lead updated', description: 'Lead details have been updated.' });
      setEditMode(false);
      // Optionally, update the UI with new values (could refetch or update local state)
      // For now, reload the page or refetch the lead if needed
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update lead.', variant: 'destructive' });
    }
  };

  const handleCancelEdit = () => {
    setEditLead({
      companyName: lead.companyName,
      personName: lead.personName,
      email: lead.email,
      phone: lead.phone || '',
      country: lead.country || '',
      website: lead.website || '',
      industry: lead.industry || '',
      jobTitle: lead.jobTitle || '',
      status: lead.status,
    });
    setEditMode(false);
  };

  const handleAssignUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('lead')
        .update({ owner_id: userId })
        .eq('id', lead.id);

      if (error) throw error;

      setAssignedUserId(userId);
      toast({ title: 'Assignment Updated', description: 'Lead has been reassigned successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reassign lead.', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('lead')
        .update({ status: newStatus })
        .eq('id', lead.id);

      if (error) throw error;

      setEditStatus(newStatus);
      toast({ title: 'Status updated', description: `Lead status changed to ${newStatus}.` });
      if (onStatusChange) onStatusChange(newStatus);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update status.', variant: 'destructive' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setUpdateDate(undefined);
      setNextActionDate(undefined);
      setIsFutureActivity(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const isFuture = selectedDate > today;
    setIsFutureActivity(isFuture);

    if (isFuture) {
      setNextActionDate(date);
      setUpdateDate(new Date()); // Set activity date to today for future actions
    } else {
      setUpdateDate(date);
      setNextActionDate(undefined);
    }
  };

  // Placeholder for user's company info
  const userCompany = {
    name: 'NeuralArc',
    website: 'https://neuralarc.com',
    contact: 'contact@neuralarc.com',
  };

  // Placeholder for Gemini email generation
  const generateProfessionalEmail = async () => {
    setIsGeneratingEmail(true);
    // Compose recommended services string
    const services = enrichmentData?.recommendations?.length
      ? enrichmentData.recommendations.map(s => `- ${s}`).join('\n')
      : '- AI-powered CRM\n- Sales Forecasting\n- Automated Reporting';
    // Simulate API call delay
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`Subject: Unlock Your Sales Potential at ${lead.companyName}

Hi ${lead.personName},

I hope this message finds you well. My name is ${currentUser?.name || '[Your Name]'} from ${userCompany.name}. I wanted to introduce you to our platform, designed to help companies like ${lead.companyName} streamline sales processes, gain actionable insights, and boost conversions.

Our solution offers:\n${services}

I'd love to schedule a quick call to discuss how we can help ${lead.companyName} achieve its sales goals. Please let me know your availability, or feel free to reply directly to this email.

Best regards,\n${currentUser?.name || '[Your Name]'}\n${userCompany.name}\n${currentUser?.email || '[Your Email]'}\n${userCompany.website}`);
        setIsGeneratingEmail(false);
      }, 1200);
    });
  };

  // Trigger lead enrichment when dialog opens and no score exists
  const triggerLeadEnrichment = async () => {
    if (enrichmentData?.leadScore !== undefined || isEnrichingLead) {
      return; // Already enriched or currently enriching
    }

    setIsEnrichingLead(true);
    try {
      const response = await fetch('/api/lead-enrichment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          triggerEnrichment: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enrich lead');
      }

      const data = await response.json();
      
      // Show success message
      toast({
        title: 'Lead Enriched',
        description: `AI analysis completed for ${lead.companyName}. Lead score: ${data.leadScore}%`,
        className: "bg-green-100 dark:bg-green-900 border-green-500"
      });

      // Trigger a page refresh to show the new enrichment data
      window.location.reload();
      
    } catch (error) {
      console.error('Error enriching lead:', error);
      toast({
        title: 'Enrichment Failed',
        description: 'Failed to enrich lead. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsEnrichingLead(false);
    }
  };

  // Copy email content to clipboard
  const handleCopyEmail = () => {
    if (emailTabContent) {
      navigator.clipboard.writeText(emailTabContent);
      toast({ title: 'Copied!', description: 'Email content copied to clipboard.' });
    }
  };

  // Email client URLs
  const getMailClientUrl = (client: string) => {
    const subject = encodeURIComponent(emailTabContent?.split('\n')[0].replace('Subject: ', '') || '');
    const body = encodeURIComponent(emailTabContent?.replace(/^Subject:.*\n+/, '') || '');
    const to = encodeURIComponent(lead.email);
    switch (client) {
      case 'gmail':
        return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
      case 'outlook':
        return `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${subject}&body=${body}`;
      case 'yahoo':
        return `https://compose.mail.yahoo.com/?to=${to}&subject=${subject}&body=${body}`;
      case 'protonmail':
        return `https://mail.proton.me/u/0/inbox?compose&to=${to}&subject=${subject}&body=${body}`;
      case 'zoho':
        return `https://mail.zoho.com/zm/#compose?to=${to}&subject=${subject}&body=${body}`;
      default:
        return `mailto:${lead.email}?subject=${subject}&body=${body}`;
    }
  };

  // Generate email only on first visit or on explicit regeneration
  React.useEffect(() => {
    if (activeTab === 'email' && emailTabContent === null && !isGeneratingEmail) {
      if (enrichmentData && enrichmentData.emailTemplate) {
        setEmailTabContent(enrichmentData.emailTemplate);
      } else {
        generateProfessionalEmail().then(setEmailTabContent);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Trigger enrichment when dialog opens and no lead score exists
  React.useEffect(() => {
    if (isDialogOpen && enrichmentData?.leadScore === undefined && !isEnrichingLead && !isEnrichmentLoading) {
      triggerLeadEnrichment();
    }
  }, [isDialogOpen, enrichmentData?.leadScore, isEnrichingLead, isEnrichmentLoading]);

  return (
    <>
      <Card
        className={`border border-[#E5E3DF] bg-white rounded-sm shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full p-4 ${selectMode && selected ? 'ring-2 ring-[#97A487] ring-offset-2' : ''}`}
        onClick={selectMode ? onSelect : () => setIsDialogOpen(true)}
        style={selectMode ? { cursor: 'pointer' } : { cursor: 'pointer' }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xl font-bold text-[#282828] leading-tight truncate">{lead.personName}</div>
              <div className="text-base text-[#5E6156] font-medium mt-0.5 truncate">{lead.companyName}</div>
            </div>
          </div>
          <div className="mt-3 text-sm font-medium text-[#5E6156]">Lead Score</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-full bg-[#E5E3DF] rounded-full h-2 overflow-hidden">
              {isEnrichmentLoading ? (
                <Skeleton className="h-2 w-full rounded-full" />
              ) : (
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${enrichmentData?.leadScore !== undefined ? enrichmentData.leadScore : 0}%`,
                    backgroundImage: 'linear-gradient(to right, #3987BE, #D48EA3)',
                  }}
                />
              )}
            </div>
            <div className="text-sm font-semibold text-[#282828] ml-2 flex flex-row items-center flex-shrink-0">
              {isEnrichmentLoading ? <Skeleton className="h-4 w-8 rounded" /> : enrichmentData?.leadScore !== undefined ? `${enrichmentData.leadScore}%` : '--%'}
            </div>
          </div>
          <div className="mt-4 space-y-1.5 text-[15px]">
            <div className="text-[#5E6156] truncate">
              <span className="font-medium">Email: {lead.email} </span>
            </div>
            <div className="text-[#5E6156] truncate">
              <span className="font-medium">Phone:</span> <span className="text-[#282828]">{lead.phone || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-[#E5E3DF] pt-3 flex justify-center" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full text-[#282828] font-semibold text-base py-2 rounded-md border-[#E5E3DF] bg-[#F8F7F3] hover:bg-[#EFEDE7] flex items-center justify-center gap-2 max-h-10">
                <MoreHorizontal className="h-5 w-5 text-[#282828]" /> Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#fff] text-[#282828] p-1 rounded-md border border-[#E5E3DF] shadow-xl sm:max-w-[308px] sm:h-fit">
              <DropdownMenuItem onClick={() => setIsAddOpportunityOpen(true)} className="min-h-[44px] text-[#282828] bg-[#fff] focus:bg-[#F8F7F3] focus:text-black flex items-center gap-2 cursor-pointer">
                <PlusCircle className="h-5 w-5 text-[#282828]" /> Add Opportunity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowConvertDialog(true)} disabled={lead.status === 'Converted to Account' || lead.status === 'Lost'} className="min-h-[44px] text-[#282828] bg-[#fff] focus:bg-[#F8F7F3] focus:text-black flex items-center gap-2 cursor-pointer">
                <CheckSquare className="h-5 w-5 text-[#282828]" /> Convert to Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="min-h-[44px] bg-[#fff] flex items-center gap-2 text-[#916D5B] focus:bg-[#F8F7F3] focus:text-[#916D5B] cursor-pointer">
                                        <Trash2 className="h-5 w-5 text-[#916D5B]" /> Archive Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <LeadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        lead={lead}
        onLeadConverted={onLeadConverted}
        onLeadDeleted={onLeadDeleted}
        onActivityLogged={onActivityLogged}
        users={users}
        role={role}
        enrichmentData={enrichmentData}
        isEnrichmentLoading={isEnrichmentLoading}
      />

      <AddOpportunityDialog
        open={isAddOpportunityOpen}
        onOpenChange={setIsAddOpportunityOpen}
        accountId={undefined}
        key={lead.id}
      />

      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Lead to Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to convert this lead to an account? This action cannot be undone and the lead will be moved to your accounts list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowConvertDialog(false); handleConvertLead(); }} className="bg-[#2B2521] text-white rounded-md border-0 hover:bg-[#3a322c]">Convert</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
                                <AlertDialogTitle>Archive Lead?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to archive this lead? It will be moved to the archive section and can be restored later.
                    </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => { setShowDeleteDialog(false); handleArchiveLead(); }} className="bg-[#916D5B] text-white rounded-md border-0 hover:bg-[#a98a77]">Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

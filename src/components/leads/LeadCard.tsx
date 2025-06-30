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

export default function LeadCard({ lead, onLeadConverted, onLeadDeleted, onActivityLogged, selectMode = false, selected = false, onSelect, assignedUser, onStatusChange, users = [], role }: LeadCardProps) {
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
  const [enrichmentData, setEnrichmentData] = React.useState<{
    recommendations: string[];
    pitchNotes: string;
    useCase: string;
    leadScore?: number;
  } | null>(null);
  const [isLoadingEnrichment, setIsLoadingEnrichment] = React.useState(false);
  const [isFutureActivity, setIsFutureActivity] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [emailTabContent, setEmailTabContent] = React.useState<string | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<{ name: string; email: string } | null>(null);

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

  // Move fetchEnrichmentData outside useEffect so it can be called from the Refresh button
  const fetchEnrichmentData = async () => {
    if (isDialogOpen && !enrichmentData && currentUser) {
      setIsLoadingEnrichment(true);
      try {
        const response = await fetch('/api/lead-enrichment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead, user: currentUser }),
        });
        const data = await response.json();
        setEnrichmentData({
          recommendations: data.recommendations,
          pitchNotes: data.pitchNotes,
          useCase: data.useCase,
          leadScore: data.leadScore,
        });
      } catch (error) {
        console.error('Failed to fetch lead enrichment data:', error);
      } finally {
        setIsLoadingEnrichment(false);
      }
    }
  };

  useEffect(() => {
    fetchEnrichmentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen, currentUser]);

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

  const handleDeleteLead = async () => {
    try {
      const { error } = await supabase
        .from('lead')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: "Lead Deleted",
        description: `${lead.companyName} has been deleted successfully.`,
        variant: "destructive"
      });

      if (onLeadDeleted) onLeadDeleted(lead.id);
    } catch (error) {
      console.error('Lead deletion failed:', error);
      toast({ 
        title: "Deletion Failed", 
        description: error instanceof Error ? error.message : "Could not delete lead.", 
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
      generateProfessionalEmail().then(setEmailTabContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
              <div className="h-2 rounded-full" style={{ width: '94%', backgroundImage: 'linear-gradient(to right, #3987BE, #D48EA3)' }} />
            </div>
            <div className="text-sm font-semibold text-[#282828] ml-2">94%</div>
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
        <div className="mt-6 border-t border-[#E5E3DF] pt-3 flex justify-center" onClick={(e) => e.stopPropagation()}>
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
                <Trash2 className="h-5 w-5 text-[#916D5B]" /> Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl bg-white border-0 rounded-lg p-0">
          <div className="p-6 pb-0">
            <DialogHeader className="">
              <div className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 bg-[#5E6156]">
                    <AvatarFallback className="text-2xl bg-[#2B2521] font-bold text-white">
                      {lead.personName?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      {editMode ? (
                        <Input
                          className="text-3xl font-bold text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                          value={editLead.personName}
                          onChange={e => handleEditChange('personName', e.target.value)}
                        />
                      ) : (
                        <DialogTitle className="text-3xl font-bold text-[#282828]">{lead.personName}</DialogTitle>
                      )}
                      {editMode ? (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="ml-1" onClick={handleSaveEdit} disabled={isUpdatingStatus}>
                                  <CheckSquare className="h-5 w-5 text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Save changes</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="ml-1" onClick={handleCancelEdit}>
                                  <X className="h-5 w-5 text-red-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cancel editing</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="ml-1" onClick={() => setEditMode(true)} disabled={editMode}>
                                <Pencil className="h-5 w-5 text-[#998876]" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit lead</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-lg text-[#5E6156] leading-tight">{lead.jobTitle || editLead.jobTitle || 'Role/Title'}</p>
                    <p className="text-lg text-[#5E6156] leading-tight">{lead.companyName || editLead.companyName || 'Company'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editMode ? (
                    <Select value={editLead.status} onValueChange={val => handleEditChange('status', val)}>
                      <SelectTrigger className="w-[180px] sm:w-fit border-[#E5E3DF] mr-6">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="sm:w-fit">
                        {["New", "Contacted", "Qualified", "Proposal Sent", "Converted to Account", "Lost", "Rejected"].map(status => (
                          <SelectItem key={status} value={status} className="sm:w-fit">{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`text-xs mr-6 ${getStatusBadgeColorClasses(lead.status)}`}>{lead.status}</Badge>
                  )}
                </div>
              </div>
            </DialogHeader>
          </div>

          <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#EFEDE7] h-fit w-fit mx-auto grid grid-cols-3 items-center p-1 rounded-lg justify-center shadow-none">
              <TabsTrigger value="overview" className="text-base px-4 py-1.5 rounded-md flex items-center gap-2 data-[state=active]:bg-[#2B2521] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <UserIcon className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-base px-4 py-1.5 rounded-md flex items-center gap-2 data-[state=active]:bg-[#2B2521] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Activity className="h-4 w-4" /> Activity
              </TabsTrigger>
              <TabsTrigger value="email" className="text-base px-4 py-1.5 rounded-md flex items-center gap-2 data-[state=active]:bg-[#2B2521] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <MailIcon className="h-4 w-4" /> Email
              </TabsTrigger>
            </TabsList>

            <div className="bg-white rounded-b-md p-6">
              <TabsContent value="overview" className='max-h-[708px] overflow-y-scroll'>
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
                                <Input value={editLead.email} onChange={e => handleEditChange('email', e.target.value)} className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md" />
                              ) : (
                                <p className="text-base text-[#282828] font-medium break-all">{lead.email}</p>
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
                                <Input value={editLead.phone} onChange={e => handleEditChange('phone', e.target.value)} className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md" />
                              ) : (
                                <p className="text-base text-[#282828] font-medium">{lead.phone || 'N/A'}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#F8F7F3] p-3 rounded-md">
                          <div className="flex items-start gap-3">
                            <UserCheck className="h-5 w-5 text-[#5E6156] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Job Title</p>
                              {editMode ? (
                                <Input value={editLead.jobTitle || ''} onChange={e => handleEditChange('jobTitle', e.target.value)} className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md" />
                              ) : (
                                <p className="text-base text-[#282828] font-medium">{lead.jobTitle || 'N/A'}</p>
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
                                {editMode ? (
                                  <Input value={editLead.companyName} onChange={e => handleEditChange('companyName', e.target.value)} className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md" />
                                ) : (
                                  <p className="text-base text-[#282828] font-medium">{lead.companyName}</p>
                                )}
                              </div>
                            </div>
                        </div>
                        <div className="bg-[#F8F7F3] p-3 rounded-md">
                          <div className="flex items-start gap-3">
                            <Globe className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#3987BE]" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Website</p>
                              {editMode ? (
                                <Input value={editLead.website || ''} onChange={e => handleEditChange('website', e.target.value)} className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md" />
                              ) : lead.website ? (
                                <Link
                                  href={lead.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-base font-medium text-[#282828] underline"
                                >
                                  {lead.website}
                                </Link>
                              ) : (
                                <p className="text-base font-medium text-[#282828]">N/A</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#F8F7F3] p-3 rounded-md">
                          <div className="flex items-start gap-3">
                            <Briefcase className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Industry</p>
                              {editMode ? (
                                <Input value={editLead.industry || ''} onChange={e => handleEditChange('industry', e.target.value)} className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md" />
                              ) : (
                                <p className="text-base font-medium text-[#282828]">{lead.industry || 'N/A'}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lead Metrics */}
                  <div className="bg-white border border-[#E5E3DF] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-[#5E6156]" /> Lead Metrics
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm text-[#5E6156]">Lead Score</p>
                          <p className="text-sm font-semibold text-[#282828]">{enrichmentData?.leadScore !== undefined ? `${enrichmentData.leadScore}/100` : '--/100'}</p>
                        </div>
                        <div className="w-full bg-[#E5E3DF] rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${enrichmentData?.leadScore !== undefined ? enrichmentData.leadScore : 0}%`,
                              backgroundImage: 'linear-gradient(to right, #3987BE, #D48EA3)',
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-base font-semibold text-[#282828]">AI Recommendations</p>
                          <button
                            className="ml-auto px-2 py-1 text-xs rounded bg-[#E5E3DF] hover:bg-[#d4d2ce] text-[#3987BE] font-medium border border-[#C7C7C7]"
                            onClick={async () => {
                              setIsLoadingEnrichment(true);
                              try {
                                await fetch('/api/lead-enrichment?refresh=true', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ lead, user: currentUser }),
                                });
                                // Wait a moment for the job to be picked up, then re-fetch
                                setTimeout(fetchEnrichmentData, 2000);
                              } catch (e) {
                                // Optionally show error toast
                              } finally {
                                setIsLoadingEnrichment(false);
                              }
                            }}
                            disabled={isLoadingEnrichment}
                            title="Refresh AI analysis"
                          >
                            {isLoadingEnrichment ? 'Refreshing...' : 'Refresh'}
                          </button>
                        </div>
                        {isLoadingEnrichment ? (
                          <div className="space-y-2">
                            <Skeleton className="h-6 w-3/4 rounded-md" />
                            <Skeleton className="h-10 w-full rounded-md" />
                            <Skeleton className="h-10 w-full rounded-md" />
                          </div>
                        ) : enrichmentData ? (
                          <>
                            <div>
                              <p className="text-sm text-[#5E6156] mb-2 font-medium">Recommended Services</p>
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(enrichmentData.recommendations) &&
                                  enrichmentData.recommendations.map((rec, i) => (
                                    <Badge key={i} variant="outline" className="text-xs bg-[#F8F7F3] border-[#E5E3DF] text-[#282828] font-medium">{rec}</Badge>
                                  ))}
                              </div>
                            </div>
                            <div className="bg-[#F8F7F3] p-3 rounded-md mb-2 h-full min-h-[140px] max-h-[160px] flex flex-col justify-start overflow-y-auto" style={{ maxHeight: '120px' }}>
                              <p className="text-sm text-[#5E6156] mb-2 font-semibold flex items-center gap-1.5"><FileTextIcon className="h-5 w-5" /> Pitch Notes</p>
                              <p className="text-sm text-[#5E6156]">{enrichmentData.pitchNotes}</p>
                            </div>
                            <div className="bg-[#F8F7F3] p-3 rounded-md h-full min-h-[140px] max-h-[160px] flex flex-col justify-start overflow-y-auto" style={{ maxHeight: '120px' }}>
                              <p className="text-sm text-[#5E6156] mb-2 font-semibold flex items-center gap-1.5"><Lightbulb className="h-5 w-5" /> Use Case</p>
                              <p className="text-sm text-[#5E6156]">{enrichmentData.useCase}</p>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-center text-[#998876]">Could not load AI recommendations.</p>
                        )}
                        {!editMode && (
                          <Button
                            variant="add"
                            className="w-full bg-[#2B2521] text-white hover:bg-[#3a322c] rounded-md max-h-12"
                            onClick={() => setActiveTab('email')}
                          >
                            <MailIcon className="h-4 w-4 mr-2" /> Generate Email
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                     <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Add New Activity</div>
                     <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 min-w-0">
                          <Label htmlFor="update-type" className="text-sm font-medium text-[#5E6156] mb-2 block">Activity Type</Label>
                          <Select value={updateType} onValueChange={setUpdateType}>
                            <SelectTrigger id="update-type" className="w-full border border-[#CBCAC5] bg-[#F8F7F3] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md">
                              <SelectValue placeholder="Select activity type" />
                            </SelectTrigger>
                            <SelectContent>
                              {updateTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label htmlFor="update-date" className="text-sm font-medium text-[#5E6156] mb-2 block">Date</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild className="w-full">
                                <Popover>
                                  <PopoverTrigger asChild disabled={!!nextActionDate}>
                                    <Input
                                      id="update-date"
                                      type="text"
                                      value={updateDate ? format(updateDate, 'dd/MM/yyyy') : ''}
                                      placeholder="dd/mm/yyyy"
                                      readOnly
                                      className="cursor-pointer bg-[#F8F7F3] border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md disabled:cursor-not-allowed disabled:opacity-50"
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
                              </TooltipTrigger>
                              {!!nextActionDate && (
                                <TooltipContent>
                                  <p>Clear 'Next Action Date' to select an 'Activity Date'.</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 min-w-0">
                           <Label htmlFor="next-action-date" className="text-sm font-medium text-[#5E6156] mb-2 block">Next Action Date (Optional)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild className="w-full">
                                <Popover>
                                  <PopoverTrigger asChild disabled={!!updateDate}>
                                    <Input
                                      id="next-action-date"
                                      type="text"
                                      value={nextActionDate ? format(nextActionDate, 'dd/MM/yyyy') : ''}
                                      placeholder="dd/mm/yyyy (optional)"
                                      readOnly
                                      className="cursor-pointer bg-[#F8F7F3] border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </PopoverTrigger>
                                  <PopoverContent align="start" className="p-0 w-auto border-[#CBCAC5] bg-white rounded-md shadow-lg">
                                    <Calendar
                                      mode="single"
                                      selected={nextActionDate}
                                      onSelect={setNextActionDate}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </TooltipTrigger>
                              {!!updateDate && (
                                <TooltipContent>
                                  <p>Clear 'Activity Date' to set a 'Next Action Date'.</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="update-content" className="text-sm font-medium text-[#5E6156] mb-2 block">Activity Details</Label>
                        <Textarea
                          id="update-content"
                          value={updateContent}
                          onChange={e => setUpdateContent(e.target.value)}
                          placeholder="Describe the call, meeting, email, or general update..."
                          className="min-h-[100px] resize-none border-[#CBCAC5] bg-[#F8F7F3] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
                        />
                      </div>
                      <DialogFooter className="pt-4">
                        <Button
                          type="button"
                          variant="add"
                          className="w-full bg-[#2B2521] text-white hover:bg-[#3a322c] rounded-md"
                          onClick={handleLogUpdate}
                          disabled={isLogging || !updateType || !updateContent.trim() || !updateDate}
                        >
                          {isLogging ? (
                            <>
                              <Activity className="mr-2 h-4 w-4 animate-spin" />
                              Adding Activity...
                            </>
                          ) : (
                            <>
                              <Activity className="mr-2 h-4 w-4" />
                              Add Activity
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                   </div>
                  <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                    {!editMode && logs.length > 0 && (
                      <>
                        <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Recent Activity</div>
                        <div className="relative">
                          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                            {logs.map((log, idx) => (
                              <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-[#F8F7F3] border border-[#E5E3DF] hover:bg-[#EFEDE7] transition-colors">
                                <div className="flex-shrink-0 mt-1">
                                  {getUpdateTypeIcon(log.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-[#282828] line-clamp-2">
                                      {log.content}
                                    </p>
                                    <span className="text-xs text-[#998876] ml-2 font-medium">
                                      {format(new Date(log.date), 'MMM dd')}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs bg-white border-[#CBCAC5] text-[#5E6156] font-medium">{log.type}</Badge>
                                    {log.nextActionDate && (
                                      <span className="text-xs text-[#4B7B9D] font-medium">
                                        Next: {format(parseISO(log.nextActionDate), 'MMM dd, yyyy')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {logs.length > 5 && (
                            <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8" style={{background: 'linear-gradient(to bottom, transparent, #fff 90%)'}} />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email">
                <div className="flex flex-col h-full min-h-[300px]">
                  <div className="bg-white rounded-lg shadow-sm border border-[#E5E3DF] relative min-h-[200px] flex flex-col">
                    <div className="flex items-center justify-between px-0 pt-2 pb-3 border-b border-[#EFEDE7]">
                      <h4 className="text-lg font-semibold text-[#282828] flex items-center gap-2 pl-6">
                        <MailIcon className="h-5 w-5 text-[#5E6156]" /> Email to Lead
                      </h4>
                      <div className="flex gap-2 pr-6">
                        <Button
                          variant="outline"
                          className="max-h-12 flex items-center gap-1 border-[#E5E3DF] text-[#282828] bg-white hover:bg-[#F8F7F3]"
                          onClick={async () => {
                            setIsGeneratingEmail(true);
                            setEmailTabContent(null);
                            const email = await generateProfessionalEmail();
                            setEmailTabContent(email);
                          }}
                          disabled={isGeneratingEmail}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          {isGeneratingEmail ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                        <Button
                          variant="outline"
                          className="max-h-12 flex items-center gap-1 border-[#E5E3DF] text-[#282828] bg-white hover:bg-[#F8F7F3]"
                          onClick={handleCopyEmail}
                          disabled={!emailTabContent}
                        >
                          <CopyIcon className="h-4 w-4 mr-1" /> Copy
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-6 whitespace-pre-line text-[#282828] text-[16px] leading-relaxed font-normal">
                      {isGeneratingEmail && !emailTabContent ? (
                        <span className="text-[#998876]">Generating email...</span>
                      ) : emailTabContent ? (
                        <>
                          {/* Subject line bold and larger */}
                          {(() => {
                            const lines = emailTabContent.split('\n');
                            const subject = lines[0];
                            const body = lines.slice(1).join('\n').replace(/^\n+/, '');
                            return (
                              <>
                                <div className="font-semibold text-lg text-[#282828] mb-3">{subject.replace('Subject: ', '')}</div>
                                <div className="text-[16px] text-[#282828] leading-relaxed">{body}</div>
                              </>
                            );
                          })()}
                        </>
                      ) : null}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="add"
                          className="max-h-12 flex items-center gap-1 absolute bottom-4 right-6 z-10"
                          disabled={!emailTabContent}
                        >
                          <SendIcon className="h-4 w-4 mr-1" /> Send
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white text-[#282828] p-1 rounded-md border border-[#E5E3DF] shadow-xl max-w-[220px] sm:h-fit">
                        <DropdownMenuItem onClick={() => window.open(getMailClientUrl('gmail'), '_blank')} className="flex items-center gap-2 cursor-pointer focus:bg-[#F8F7F3] focus:text-black">
                          <MailIcon className="h-4 w-4" /> Gmail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(getMailClientUrl('outlook'), '_blank')} className="flex items-center gap-2 cursor-pointer focus:bg-[#F8F7F3] focus:text-black">
                          <Inbox className="h-4 w-4" /> Outlook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(getMailClientUrl('yahoo'), '_blank')} className="flex items-center gap-2 cursor-pointer focus:bg-[#F8F7F3] focus:text-black">
                          <AtSign className="h-4 w-4" /> Yahoo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(getMailClientUrl('protonmail'), '_blank')} className="flex items-center gap-2 cursor-pointer focus:bg-[#F8F7F3] focus:text-black">
                          <Shield className="h-4 w-4" /> ProtonMail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(getMailClientUrl('zoho'), '_blank')} className="flex items-center gap-2 cursor-pointer focus:bg-[#F8F7F3] focus:text-black">
                          <Briefcase className="h-4 w-4" /> Zoho Mail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.open(getMailClientUrl('default'), '_blank')} className="flex items-center gap-2 cursor-pointer focus:bg-[#F8F7F3] focus:text-black">
                          <Computer className="h-4 w-4" /> Other (Choose on device)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#282828]">Lead Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#5E6156]">Company:</span>
                <span className="text-[#282828] font-medium">{lead.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#5E6156]">Contact:</span>
                <span className="text-[#282828] font-medium">{lead.personName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#5E6156]">Email:</span>
                <span className="text-[#282828] font-medium">{lead.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#5E6156]">Phone:</span>
                <span className="text-[#282828] font-medium">{lead.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#5E6156]">Country:</span>
                <span className="text-[#282828] font-medium">{lead.country || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#5E6156]">Status:</span>
                <Badge className={`text-xs ${getStatusBadgeColorClasses(lead.status)}`}>
                  {lead.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#5E6156]">Created:</span>
                <span className="text-[#282828] font-medium">{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#5E6156]">Last Updated:</span>
                <span className="text-[#282828] font-medium">{formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[#E5E3DF]">
              <span className="text-sm font-medium text-[#5E6156]">Assigned To:</span>
              <Select value={assignedUserId} onValueChange={handleAssignUser}>
                <SelectTrigger className="w-full mt-2 border-[#CBCAC5] bg-[#F8F7F3] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B]">
                  <SelectValue placeholder="Assign to user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignedUserObj && (
                <div className="mt-2 text-sm text-[#998876]">Currently assigned to: <span className="font-medium text-[#282828]">{assignedUserObj.name}</span></div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDeleteDialog(false); handleDeleteLead(); }} className="bg-[#916D5B] text-white rounded-md border-0 hover:bg-[#a98a77]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

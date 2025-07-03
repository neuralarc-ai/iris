import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Mail, Phone, Pencil, X, CheckSquare, Briefcase, Target, User as UserIcon, Activity, Mail as MailIcon, Globe, RefreshCw, Copy as CopyIcon, Send as SendIcon, Inbox, AtSign, Shield, Computer, FileText as FileTextIcon, Lightbulb, History, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { Lead, Update, LeadStatus } from '@/types';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onLeadConverted: (leadId: string, newAccountId: string) => void;
  onLeadDeleted?: (leadId: string) => void;
  onActivityLogged?: (leadId: string, activity: Update) => void;
  users?: Array<{ id: string; name: string; email: string }>;
  role?: string;
  enrichmentData?: { leadScore?: number; recommendations?: string[]; pitchNotes?: string; useCase?: string; emailTemplate?: string };
  isEnrichmentLoading?: boolean;
}

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
};

const getUpdateTypeIcon = (type: Update['type']) => {
  switch (type) {
    case 'Call': return <Phone className="h-4 w-4 text-[#4B7B9D]" />;
    case 'Email': return <Mail className="h-4 w-4 text-[#C57E94]" />;
    case 'Meeting': return <Users className="h-4 w-4 text-[#5E6156]" />;
    case 'General':
    default: return <FileTextIcon className="h-4 w-4 text-[#998876]" />;
  }
};

export default function LeadDialog({
  open,
  onOpenChange,
  lead,
  onLeadConverted,
  onLeadDeleted,
  onActivityLogged,
  users = [],
  role,
  enrichmentData,
  isEnrichmentLoading
}: LeadDialogProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [editLead, setEditLead] = useState({
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
  const [assignedUserId, setAssignedUserId] = useState(lead.assignedUserId || '');
  const assignedUserObj = users.find(u => u.id === assignedUserId);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState<Update[]>([]);
  const [updateType, setUpdateType] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [updateDate, setUpdateDate] = useState<Date | undefined>(undefined);
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(undefined);
  const [isLogging, setIsLogging] = useState(false);
  const [isEnrichingLead, setIsEnrichingLead] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [emailTabContent, setEmailTabContent] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
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
    setAssignedUserId(lead.assignedUserId || '');
  }, [lead]);

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
    if (open) fetchLogs();
  }, [lead.id, open]);

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

  // Handler: Convert Lead to Account
  const handleConvertLead = async () => {
    if (lead.status === "Converted to Account" || lead.status === "Lost") {
      toast({ title: "Action not allowed", description: "This lead has already been processed.", variant: "destructive" });
      return;
    }
    try {
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
      if (accountError || !accountData) throw accountError || new Error('Failed to create account');
      const { error: leadError } = await supabase.from('lead').update({ status: 'Converted to Account' }).eq('id', lead.id);
      if (leadError) throw leadError;
      toast({ title: "Lead Converted!", description: lead.companyName + " has been converted to an account: " + accountData.name + ".", className: "bg-green-100 dark:bg-green-900 border-green-500" });
      onLeadConverted(lead.id, accountData.id);
    } catch (error) {
      console.error('Lead conversion failed:', error);
      toast({ title: "Conversion Failed", description: error instanceof Error ? error.message : "Could not convert lead to account.", variant: "destructive" });
    }
  };

  // Handler: Delete Lead
  const handleDeleteLead = async () => {
    try {
      const { error } = await supabase.from('lead').delete().eq('id', lead.id);
      if (error) throw error;
      toast({ title: "Lead Deleted", description: `${lead.companyName} has been deleted successfully.`, variant: "destructive" });
      if (onLeadDeleted) onLeadDeleted(lead.id);
    } catch (error) {
      console.error('Lead deletion failed:', error);
      toast({ title: "Deletion Failed", description: error instanceof Error ? error.message : "Could not delete lead.", variant: "destructive" });
    }
  };

  // Handler: Log Update
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
      toast({ title: "Activity Logged", description: "Your update has been successfully logged.", className: "bg-green-100 dark:bg-green-900 border-green-500" });
      if (onActivityLogged) onActivityLogged(lead.id, newUpdate);
    } catch (error) {
      console.error('Failed to log update:', error);
      toast({ title: "Logging Failed", description: error instanceof Error ? error.message : "Could not log update.", variant: "destructive" });
    } finally {
      setIsLogging(false);
    }
  };

  // Handler: Edit Change
  const handleEditChange = (field: string, value: string) => {
    setEditLead(prev => ({ ...prev, [field]: value }));
  };

  // Handler: Save Edit
  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase.from('lead').update({
        company_name: editLead.companyName,
        person_name: editLead.personName,
        email: editLead.email,
        phone: editLead.phone,
        website: editLead.website,
        industry: editLead.industry,
        job_title: editLead.jobTitle,
        status: editLead.status,
      }).eq('id', lead.id);
      if (error) throw error;
      toast({ title: 'Lead updated', description: 'Lead details have been updated.' });
      setEditMode(false);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update lead.', variant: 'destructive' });
    }
  };

  // Handler: Cancel Edit
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

  // Handler: Assign User
  const handleAssignUser = async (userId: string) => {
    try {
      const { error } = await supabase.from('lead').update({ owner_id: userId }).eq('id', lead.id);
      if (error) throw error;
      setAssignedUserId(userId);
      toast({ title: 'Assignment Updated', description: 'Lead has been reassigned successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reassign lead.', variant: 'destructive' });
    }
  };

  // Handler: Status Change
  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase.from('lead').update({ status: newStatus }).eq('id', lead.id);
      if (error) throw error;
      setEditLead(prev => ({ ...prev, status: newStatus }));
      toast({ title: 'Status updated', description: `Lead status changed to ${newStatus}.` });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update status.', variant: 'destructive' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handler: Date Select (for mutually exclusive selection)
  const handleUpdateDateSelect = (date: Date | undefined) => {
    setUpdateDate(date);
    if (date) setNextActionDate(undefined);
  };
  const handleNextActionDateSelect = (date: Date | undefined) => {
    setNextActionDate(date);
    if (date) setUpdateDate(undefined);
  };

  // Handler: Generate Professional Email
  const generateProfessionalEmail = async () => {
    setIsGeneratingEmail(true);
    const services = enrichmentData?.recommendations?.length
      ? enrichmentData.recommendations.map(s => `- ${s}`).join('\n')
      : '- AI-powered CRM\n- Sales Forecasting\n- Automated Reporting';
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`Subject: Unlock Your Sales Potential at ${lead.companyName}\n\nHi ${lead.personName},\n\nI hope this message finds you well. My name is ${currentUser?.name || '[Your Name]'} from NeuralArc. I wanted to introduce you to our platform, designed to help companies like ${lead.companyName} streamline sales processes, gain actionable insights, and boost conversions.\n\nOur solution offers:\n${services}\n\nI'd love to schedule a quick call to discuss how we can help ${lead.companyName} achieve its sales goals. Please let me know your availability, or feel free to reply directly to this email.\n\nBest regards,\n${currentUser?.name || '[Your Name]'}\nNeuralArc\n${currentUser?.email || '[Your Email]'}\nhttps://neuralarc.com`);
        setIsGeneratingEmail(false);
      }, 1200);
    });
  };

  // Handler: Trigger Lead Enrichment
  const triggerLeadEnrichment = async () => {
    if (enrichmentData?.leadScore !== undefined || isEnrichingLead) return;
    setIsEnrichingLead(true);
    try {
      const response = await fetch('/api/lead-enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, triggerEnrichment: true }),
      });
      if (!response.ok) throw new Error('Failed to enrich lead');
      const data = await response.json();
      toast({ title: 'Lead Enriched', description: `AI analysis completed for ${lead.companyName}. Lead score: ${data.leadScore}%`, className: "bg-green-100 dark:bg-green-900 border-green-500" });
      window.location.reload();
    } catch (error) {
      console.error('Error enriching lead:', error);
      toast({ title: 'Enrichment Failed', description: 'Failed to enrich lead. Please try again.', variant: "destructive" });
    } finally {
      setIsEnrichingLead(false);
    }
  };

  // Handler: Copy Email
  const handleCopyEmail = () => {
    if (emailTabContent) {
      navigator.clipboard.writeText(emailTabContent);
      toast({ title: 'Copied!', description: 'Email content copied to clipboard.' });
    }
  };

  // Handler: Get Mail Client URL
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

  useEffect(() => {
    if (activeTab === 'email' && !isGeneratingEmail) {
      if (enrichmentData && enrichmentData.emailTemplate) {
        setEmailTabContent(enrichmentData.emailTemplate);
      } else if (emailTabContent === null) {
        generateProfessionalEmail().then(setEmailTabContent);
      }
    }
  }, [activeTab, enrichmentData?.emailTemplate]);

  useEffect(() => {
    if (open && enrichmentData?.leadScore === undefined && !isEnrichingLead && !isEnrichmentLoading) {
      triggerLeadEnrichment();
    }
  }, [open, enrichmentData?.leadScore, isEnrichingLead, isEnrichmentLoading]);

  // --- DIALOG CONTENT ---
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-white border-0 rounded-lg p-0 max-h-[95vh] overflow-scroll">
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
                        value={editLead.personName}
                        onChange={e => handleEditChange('personName', e.target.value)}
                        className="border-0 border-b-2 border-[#916D5B] bg-transparent px-0 rounded-none text-base font-medium text-[#282828] placeholder:text-base"
                        placeholder="Lead Name"
                        autoFocus
                      />
                    ) : (
                      <DialogTitle className="text-2xl font-bold text-[#282828]">{lead.personName}</DialogTitle>
                    )}
                    {!editMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1"
                        onClick={() => setEditMode(true)}
                      >
                        <Pencil className="h-5 w-5 text-[#998876]" />
                      </Button>
                    )}
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1 flex-shrink-0"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-5 w-5" style={{ color: "#916D5B" }} />
                      </Button>
                    )}
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1 flex-shrink-0"
                        onClick={handleSaveEdit}
                        disabled={isUpdatingStatus}
                      >
                        <CheckSquare className="h-5 w-5" style={{ color: "#97A487" }} />
                      </Button>
                    )}
                  </div>
                  <p className="text-lg text-[#5E6156] leading-tight">{lead.jobTitle || editLead.jobTitle || 'Role/Title'}</p>
                  <p className="text-lg text-[#5E6156] leading-tight">{lead.companyName || editLead.companyName || 'Company'}</p>
                </div>
              </div>
              <div className="flex gap-4 mr-8">
                {users.length > 0 && (
                  <div className="w-24 flex flex-col">
                    <div className="text-xs text-[#998876] mb-1">Assigned:</div>
                    <Select value={assignedUserId || ''} onValueChange={handleAssignUser}>
                      <SelectTrigger className="w-full border-[#CBCAC5] bg-[#F8F7F3]">
                        <SelectValue placeholder="Assign to user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex flex-col items-start gap-1 w-24">
                  <div className="text-xs text-[#998876]">Status</div>
                  <Select value={editMode ? editLead.status : editLead.status} onValueChange={async (val) => {
                    setIsUpdatingStatus(true);
                    const status = val as LeadStatus;
                    await handleStatusChange(status);
                    setIsUpdatingStatus(false);
                  }} disabled={isUpdatingStatus}>
                    <SelectTrigger className={`gap-2 w-full ${editMode ? 'border-0 border-b-2 border-[#916D5B] rounded-none bg-transparent' : 'border-[#CBCAC5] bg-[#F8F7F3]'} ${isUpdatingStatus ? 'opacity-60' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="sm:w-fit">
                      {["New", "Contacted", "Qualified", "Proposal Sent", "Converted to Account", "Lost"].map(status => (
                        <SelectItem key={status} value={status} className="w-full">{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isUpdatingStatus && <span className="ml-2 text-xs text-[#998876]">Updating...</span>}
                </div>
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
            {/* Overview Tab */}
            <TabsContent value="overview" className='max-h-[708px] overflow-y-scroll'>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-6">
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
                                value={editLead.email}
                                onChange={e => handleEditChange('email', e.target.value)}
                                className="border-0 border-b-2 border-[#916D5B] bg-transparent px-0 rounded-none text-base font-medium text-[#282828] placeholder:text-base"
                              />
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
                              <Input
                                value={editLead.phone}
                                onChange={e => handleEditChange('phone', e.target.value)}
                                className="border-0 border-b-2 border-[#916D5B] bg-transparent px-0 rounded-none text-base font-medium text-[#282828] placeholder:text-base"
                              />
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
                              <Input
                                value={editLead.jobTitle}
                                onChange={e => handleEditChange('jobTitle', e.target.value)}
                                className="border-0 border-b-2 border-[#916D5B] bg-transparent px-0 rounded-none text-base font-medium text-[#282828] placeholder:text-base"
                              />
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
                              <Input
                                value={editLead.companyName}
                                onChange={e => handleEditChange('companyName', e.target.value)}
                                className="border-0 border-b-2 border-[#916D5B] bg-transparent px-0 rounded-none text-base font-medium text-[#282828] placeholder:text-base"
                              />
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
                              <Input
                                value={editLead.website}
                                onChange={e => handleEditChange('website', e.target.value)}
                                className="border-0 border-b-2 border-[#916D5B] bg-transparent px-0 rounded-none text-base font-medium text-[#282828] placeholder:text-base"
                              />
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
                              <Input
                                value={editLead.industry}
                                onChange={e => handleEditChange('industry', e.target.value)}
                                className="border-0 border-b-2 border-[#916D5B] bg-transparent px-0 rounded-none text-base font-medium text-[#282828] placeholder:text-base"
                              />
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
                        <p className="text-sm font-semibold text-[#282828]">
                          {isEnrichingLead ? (
                            <span className="flex items-center gap-2">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Analyzing...
                            </span>
                          ) : enrichmentData?.leadScore !== undefined ? `${enrichmentData.leadScore}/100` : '--/100'}
                        </p>
                      </div>
                      <div className="w-full bg-[#E5E3DF] rounded-full h-2.5">
                        {isEnrichingLead ? (
                          <Skeleton className="h-2.5 w-full rounded-full" />
                        ) : (
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${enrichmentData?.leadScore !== undefined ? enrichmentData.leadScore : 0}%`,
                              backgroundImage: 'linear-gradient(to right, #3987BE, #D48EA3)',
                            }}
                          ></div>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-base font-semibold text-[#282828]">AI Recommendations</p>
                        <button
                          className="ml-auto px-2 py-1 text-xs rounded bg-[#E5E3DF] hover:bg-[#d4d2ce] text-[#3987BE] font-medium border border-[#C7C7C7]"
                          onClick={async () => {
                            setIsGeneratingEmail(true);
                            try {
                              const response = await fetch('/api/lead-enrichment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ leadId: lead.id, triggerEnrichment: true, forceRefresh: true }),
                              });
                              if (!response.ok) throw new Error('Failed to regenerate AI analysis');
                              window.location.reload();
                            } catch (e) {
                              toast({ title: 'Regeneration Failed', description: 'Could not regenerate AI analysis.', variant: 'destructive' });
                            } finally {
                              setIsGeneratingEmail(false);
                            }
                          }}
                          disabled={isGeneratingEmail}
                          title="Refresh AI analysis"
                        >
                          {isGeneratingEmail ? 'Regenerating...' : 'Regenerate'}
                        </button>
                      </div>
                      {isGeneratingEmail ? (
                        <div className="space-y-4 min-h-[220px]">
                          <Skeleton className="h-8 w-1/3 rounded-md mb-2" />
                          <Skeleton className="h-8 w-2/3 rounded-md mb-2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-28 rounded-full" />
                          </div>
                          <Skeleton className="h-16 w-full rounded-md mb-2" />
                          <Skeleton className="h-16 w-full rounded-md" />
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
                          <div className="bg-[#F8F7F3] p-3 rounded-md mb-2 h-full flex flex-col justify-start overflow-y-auto">
                            <p className="text-sm text-[#5E6156] mb-2 font-semibold flex items-center gap-1.5"><FileTextIcon className="h-5 w-5" /> Pitch Notes</p>
                            <p className="text-sm text-[#5E6156] max-h-[160px] ">{enrichmentData.pitchNotes}</p>
                          </div>
                          <div className="bg-[#F8F7F3] p-3 rounded-md h-full min-h-[140px] max-h-[160px] flex flex-col justify-start overflow-y-auto">
                            <p className="text-sm text-[#5E6156] mb-2 font-semibold flex items-center gap-1.5"><Lightbulb className="h-5 w-5" /> Use Case</p>
                            <p className="text-sm text-[#5E6156] max-h-[160px]">{enrichmentData.useCase}</p>
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
            {/* Activity Tab */}
            <TabsContent value="activity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                  <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Add New Activity</div>
                  <form className="space-y-4" onSubmit={e => e.preventDefault()}>
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild className="w-full">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Input
                                    id="update-date"
                                    type="text"
                                    value={updateDate ? format(updateDate, 'dd/MM/yyyy') : ''}
                                    placeholder="dd/mm/yyyy"
                                    readOnly
                                    className={`cursor-pointer bg-[#F8F7F3] border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md disabled:cursor-not-allowed disabled:opacity-50 ${nextActionDate ? 'opacity-60' : ''}`}
                                    disabled={!!nextActionDate}
                                  />
                                </PopoverTrigger>
                                <PopoverContent align="start" className="p-0 w-auto border-[#CBCAC5] bg-white rounded-md shadow-lg">
                                  <Calendar
                                    mode="single"
                                    selected={updateDate}
                                    onSelect={handleUpdateDateSelect}
                                    initialFocus
                                    disabled={!!nextActionDate}
                                  />
                                </PopoverContent>
                              </Popover>
                            </TooltipTrigger>
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
                                <PopoverTrigger asChild>
                                  <Input
                                    id="next-action-date"
                                    type="text"
                                    value={nextActionDate ? format(nextActionDate, 'dd/MM/yyyy') : ''}
                                    placeholder="dd/mm/yyyy (optional)"
                                    readOnly
                                    className={`cursor-pointer bg-[#F8F7F3] border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md disabled:cursor-not-allowed disabled:opacity-50 ${updateDate ? 'opacity-60' : ''}`}
                                    disabled={!!updateDate}
                                  />
                                </PopoverTrigger>
                                <PopoverContent align="start" className="p-0 w-auto border-[#CBCAC5] bg-white rounded-md shadow-lg">
                                  <Calendar
                                    mode="single"
                                    selected={nextActionDate}
                                    onSelect={handleNextActionDateSelect}
                                    initialFocus
                                    disabled={!!updateDate}
                                  />
                                </PopoverContent>
                              </Popover>
                            </TooltipTrigger>
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
                        disabled={isLogging || !updateType || !updateContent.trim() || (!updateDate && !nextActionDate)}
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
                  <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Recent Activity</div>
                  {logs.length > 0 ? (
                    <>
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
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center h-full text-[#998876]">
                      <History className="w-12 h-12 mb-2 text-[#E5E3DF]" />
                      <span className="text-base font-medium">No activity yet</span>
                      <span className="text-sm">All your recent activity will appear here.</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            {/* Email Tab */}
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
                      <div className="w-full flex flex-col gap-4">
                        <Skeleton className="h-8 w-full rounded-md mb-2" />
                        <Skeleton className="h-24 w-full rounded-md mb-2" />
                        <Skeleton className="h-16 w-2/3 rounded-md mb-2" />
                        <Skeleton className="h-6 w-1/2 rounded-md" />
                      </div>
                    ) : (emailTabContent ? (
                      <>
                        {(() => {
                          if (!emailTabContent) return null;
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
                    ) : null)}
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
  );
} 
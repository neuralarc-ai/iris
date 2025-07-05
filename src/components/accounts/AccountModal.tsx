import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Briefcase, Globe, Tag, Pencil, Users, FileText, MessageSquareHeart, Lightbulb, MapPin, UserCheck, Activity, Building2, Target, BrainCircuit, RefreshCw, CopyIcon, SendIcon, Inbox, AtSign, Shield, Computer, CheckSquare, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import type { Account, Update, UpdateType } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { AccountStatus, AccountType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// NOTE: The parent component of AccountModal MUST set open=false when onClose is called.
// The Dialog close button triggers onClose, but AccountModal does not manage its own open state.
// If the dialog does not close, ensure the parent updates the open prop accordingly.

interface AccountModalProps {
  accountId: string;
  open: boolean;
  onClose: () => void;
  aiEnrichment?: any;
  isAiLoading?: boolean;
  onEnrichmentComplete?: () => void;
}

export default function AccountModal({ accountId, open, onClose, aiEnrichment, isAiLoading, onEnrichmentComplete }: AccountModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'overview' | 'activity' | 'email'>('overview');
  const [account, setAccount] = useState<(Account & {
    ownerId?: string;
    website?: string;
    country?: string;
    jobTitle?: string;
  }) | null>(null);
  const [contact, setContact] = useState<any>(null);
  const [logs, setLogs] = useState<Update[]>([]);
  const [ai, setAI] = useState<any>(aiEnrichment || null);
  const [loadingAI, setLoadingAI] = useState<boolean>(isAiLoading || false);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [emailTabContent, setEmailTabContent] = useState<string | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editAccount, setEditAccount] = useState({
    name: '',
    type: 'Client' as AccountType,
    status: 'Active' as AccountStatus,
    description: '',
    contactEmail: '',
    industry: '',
    contactPersonName: '',
    contactPhone: '',
    website: '',
    jobTitle: '',
  });

  // --- Activity Form State ---
  const [updateType, setUpdateType] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [updateDate, setUpdateDate] = useState<Date | undefined>(undefined);
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(undefined);
  const [nextActionTime, setNextActionTime] = useState('10:30:00');
  const [isLogging, setIsLogging] = useState(false);

  // Mutually exclusive handlers
  const handleUpdateDateSelect = (date: Date | undefined) => {
    setUpdateDate(date);
    if (date) setNextActionDate(undefined);
  };
  const handleNextActionDateSelect = (date: Date | undefined) => {
    setNextActionDate(date);
    if (date) setUpdateDate(undefined);
  };

  // Handler: Log Update (stub, implement as needed)
  const handleLogUpdate = async () => {
    if (!updateType || !updateContent.trim() || (!updateDate && !nextActionDate)) {
      toast({ title: 'Missing Information', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    setIsLogging(true);
    try {
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');
      let nextActionDateTime: Date | undefined = undefined;
      if (nextActionDate && nextActionTime) {
        const [hours, minutes, seconds] = nextActionTime.split(":");
        nextActionDateTime = new Date(nextActionDate);
        nextActionDateTime.setHours(Number(hours), Number(minutes), Number(seconds || 0), 0);
      }
      const { data, error } = await supabase.from('update').insert([
        {
          type: updateType,
          content: updateContent.trim(),
          updated_by_user_id: currentUserId,
          date: updateDate?.toISOString() || new Date().toISOString(),
          next_action_date: nextActionDateTime ? nextActionDateTime.toISOString() : null,
          account_id: accountId,
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
      setNextActionTime('10:30:00');
      toast({ title: 'Activity Logged', description: 'Your update has been successfully logged.', className: 'bg-green-100 dark:bg-green-900 border-green-500' });
    } catch (error) {
      toast({ title: 'Logging Failed', description: error instanceof Error ? error.message : 'Could not log update.', variant: 'destructive' });
    } finally {
      setIsLogging(false);
    }
  };

  const [leadInfo, setLeadInfo] = useState<{ website?: string; industry?: string; jobTitle?: string } | null>(null);

  useEffect(() => {
    if (account && (!account.website || !account.industry || !account.jobTitle) && (account as any).converted_from_lead_id) {
      (async () => {
        const { data: lead } = await supabase.from('lead').select('website, industry, job_title').eq('id', (account as any).converted_from_lead_id).single();
        if (lead) {
          setLeadInfo({
            website: lead.website,
            industry: lead.industry,
            jobTitle: lead.job_title,
          });
        }
      })();
    } else {
      setLeadInfo(null);
    }
  }, [account]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      // Fetch account
      const { data: acc } = await supabase.from('account').select('*').eq('id', accountId).single();
      if (acc) {
        setAccount({
          ...acc,
          contactEmail: acc.contact_email,
          contactPersonName: acc.contact_person_name,
          contactPhone: acc.contact_phone,
          ownerId: acc.owner_id,
          website: acc.website,
          country: acc.country,
          jobTitle: acc.job_title,
        });
      } else {
        setAccount(null);
      }
      // Fetch assigned user name/email if ownerId exists
      if (acc?.owner_id) {
        const { data: user } = await supabase.from('users').select('name, email').eq('id', acc.owner_id).single();
        setOwnerName(user ? user.name || user.email : null);
      } else {
        setOwnerName(null);
      }
      // Fetch activity logs
      const { data: logsData } = await supabase.from('update').select('*').eq('account_id', accountId).order('date', { ascending: false });
      setLogs((logsData || []).map((log: any) => ({
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
      })));
      // Fetch users for assignment
      const { data: usersData } = await supabase.from('users').select('id, name, email');
      if (usersData) setUsers(usersData);
    })();
  }, [accountId, open]);

  useEffect(() => {
    if (account?.ownerId) setAssignedUserId(account.ownerId);
  }, [account]);

  useEffect(() => {
    if (account) {
      setEditAccount({
        name: account.name || '',
        type: (account.type as AccountType) || 'Client',
        status: (account.status as AccountStatus) || 'Active',
        description: account.description || '',
        contactEmail: account.contactEmail || '',
        industry: account.industry || '',
        contactPersonName: account.contactPersonName || '',
        contactPhone: account.contactPhone || '',
        website: account.website || '',
        jobTitle: account.jobTitle || '',
      });
    }
  }, [account]);

  const handleAssignUser = async (userId: string) => {
    if (!account) return;
    const { error } = await supabase.from('account').update({ owner_id: userId }).eq('id', account.id);
    if (!error) {
      setAssignedUserId(userId);
      setOwnerName(users.find(u => u.id === userId)?.name || users.find(u => u.id === userId)?.email || null);
      toast({ title: 'Assignment Updated', description: 'Account has been reassigned successfully.' });
    } else {
      toast({ title: 'Error', description: 'Failed to reassign account.', variant: 'destructive' });
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditAccount(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!account) return;
    const { name, type, status, description, contactEmail, industry, contactPersonName, contactPhone, website, jobTitle } = editAccount;
    const { error } = await supabase.from('account').update({
      name,
      type,
      status,
      description,
      contact_email: contactEmail,
      industry,
      contact_person_name: contactPersonName,
      contact_phone: contactPhone,
      website,
      job_title: jobTitle,
    }).eq('id', account.id);
    if (!error) {
      setAccount({
        ...account,
        name,
        type,
        status,
        description,
        contactEmail,
        industry,
        contactPersonName,
        contactPhone,
        website,
        jobTitle,
      });
      setEditMode(false);
      toast({ title: 'Account updated', description: 'Account details have been updated.' });
    } else {
      toast({ title: 'Error', description: 'Failed to update account.', variant: 'destructive' });
    }
  };

  const handleCancelEdit = () => {
    if (account) {
      setEditAccount({
        name: account.name || '',
        type: (account.type as AccountType) || 'Client',
        status: (account.status as AccountStatus) || 'Active',
        description: account.description || '',
        contactEmail: account.contactEmail || '',
        industry: account.industry || '',
        contactPersonName: account.contactPersonName || '',
        contactPhone: account.contactPhone || '',
        website: account.website || '',
        jobTitle: account.jobTitle || '',
      });
    }
    setEditMode(false);
  };

  // Placeholder for user's company info (customize as needed)
  const userCompany = {
    name: '[Your Company Name]',
    website: 'https://yourcompany.com',
    contact: 'contact@yourcompany.com',
  };
  // Placeholder for current user (customize as needed)
  const currentUser = { name: ownerName || '[Your Name]', email: ownerName || '[Your Email]' };

  function buildEmailFromSubjectAndBody(subject: string, body: string, firstName: string) {
    const regards = Math.random() < 0.5 ? 'Best Regards,' : 'Warm Regards,';
    return `Subject: ${subject}\n\nDear ${firstName},\n\n${body}\n\n${regards}\nNyra\nNeuralArc Inc\nnyra@neuralarc.ai`;
  }

  function extractSubjectAndBodyFromTemplate(template: string) {
    // Try to extract subject from first line, rest is body
    const lines = template.split(/\r?\n/);
    let subject = '';
    let body = '';
    if (lines[0].toLowerCase().startsWith('subject:')) {
      subject = lines[0].replace(/^subject:/i, '').trim();
      body = lines.slice(1).join('\n').trim();
    } else {
      subject = 'AI-Generated Email';
      body = template.trim();
    }
    return { subject, body };
  }

  const generateProfessionalEmail = async (aiOverride?: any) => {
    setIsGeneratingEmail(true);
    const aiData = aiOverride || ai;
    const firstName = account?.contactPersonName?.split(' ')[0] || account?.contactPersonName || '';
    // Only generate subject and body
    const subject = `Unlock Your Sales Potential at ${account?.name || ''}`;
    const services = (aiData?.recommended_services || aiData?.recommendations)?.length
      ? (aiData.recommended_services || aiData.recommendations).map((s: string) => `- ${s}`).join('\n')
      : '- AI-powered CRM\n- Sales Forecasting\n- Automated Reporting';
    const body = `I hope this message finds you well. My name is Nyra, Neural Intelligence Officer at NeuralArc. I wanted to introduce you to our platform, designed to help companies like ${account?.name || ''} streamline sales processes, gain actionable insights, and boost conversions.\n\nOur solution offers:\n${services}\n\nSchedule a Call: https://meet.neuralarc.ai\n\nThank you for your time and consideration.`;
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(buildEmailFromSubjectAndBody(subject, body, firstName));
        setIsGeneratingEmail(false);
      }, 1200);
    });
  };

  function enforceEmailTemplateStructure(email: string, firstName: string) {
    // Remove Mr/Mrs/Dr etc. from greeting
    email = email.replace(/Dear\s+(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Miss|Sir|Madam)\s+([A-Za-z]+)/i, `Dear ${firstName}`);
    email = email.replace(/Dear\s+(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Miss|Sir|Madam)\s+/i, 'Dear ');
    // Ensure greeting is 'Dear {firstName},'
    email = email.replace(/Dear\s+([A-Za-z]+)[^,\n]*,?/i, `Dear ${firstName},`);
    // Ensure Schedule a Call line is present before thank you or regards
    if (!email.includes('Schedule a Call: https://meet.neuralarc.ai')) {
      email = email.replace(/(Thank you[\s\S]*?\n)/i, 'Schedule a Call: https://meet.neuralarc.ai\n$1');
      if (!email.includes('Schedule a Call: https://meet.neuralarc.ai')) {
        email = email.replace(/(Best Regards,|Warm Regards,)/, 'Schedule a Call: https://meet.neuralarc.ai\n\n$1');
      }
    }
    return email;
  }

  // Copy email content to clipboard
  const handleCopyEmail = () => {
    if (emailTabContent) {
      const firstName = account?.contactPersonName?.split(' ')[0] || account?.contactPersonName || '';
      navigator.clipboard.writeText(enforceEmailTemplateStructure(emailTabContent, firstName));
      toast({ title: 'Copied!', description: 'Email content copied to clipboard.' });
    }
  };

  // Email client URLs
  const getMailClientUrl = (client: string) => {
    const subject = encodeURIComponent(emailTabContent?.split('\n')[0].replace('Subject: ', '') || '');
    const body = encodeURIComponent(emailTabContent?.replace(/^Subject:.*\n+/, '') || '');
    const to = encodeURIComponent(account?.contactEmail || '');
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
        return `mailto:${account?.contactEmail}?subject=${subject}&body=${body}`;
    }
  };

  // Generate email only on first visit or on explicit regeneration
  useEffect(() => {
    if (open && emailTabContent === null && !isGeneratingEmail) {
      generateProfessionalEmail().then(email => {
        const firstName = account?.contactPersonName?.split(' ')[0] || account?.contactPersonName || '';
        setEmailTabContent(enforceEmailTemplateStructure(email, firstName));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // If aiEnrichment or isAiLoading props change, update local state and regenerate email if needed
  useEffect(() => {
    setAI(aiEnrichment || null);
    setLoadingAI(isAiLoading || false);
    if (aiEnrichment && aiEnrichment.emailTemplate) {
      const firstName = account?.contactPersonName?.split(' ')[0] || account?.contactPersonName || '';
      setEmailTabContent(enforceEmailTemplateStructure(aiEnrichment.emailTemplate, firstName));
    }
  }, [aiEnrichment, isAiLoading]);

  // Replace the enrichment fetch logic with this useEffect:
  useEffect(() => {
    // Only trigger enrichment if no enrichment data is provided and not already enriching
    if (open && !aiEnrichment && !ai && !loadingAI) {
      setLoadingAI(true);
      (async () => {
        try {
          const response = await fetch('/api/account-enrichment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId, triggerEnrichment: true }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            toast({ title: 'AI Enrichment Failed', description: errorData.error || 'Could not enrich account. Please try again.', variant: 'destructive' });
            setLoadingAI(false);
            return;
          }
          const data = await response.json();
          setAI(data.ai_output || data);
          setLoadingAI(false);
          if (onEnrichmentComplete) onEnrichmentComplete();
        } catch (e) {
          toast({ title: 'AI Enrichment Failed', description: 'Could not enrich account. Please try again.', variant: 'destructive' });
          setLoadingAI(false);
        }
      })();
    }
  }, [open, aiEnrichment]);

  const [showLogEmailDialog, setShowLogEmailDialog] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendEmail = () => {
    setShowLogEmailDialog(true);
  };

  const handleConfirmSendEmail = async () => {
    setShowLogEmailDialog(false);
    try {
      if (!account) throw new Error('Account not loaded');
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: account.contactEmail?.includes(':mailto:') ? account.contactEmail.split(':mailto:')[0] : account.contactEmail,
          subject: emailTabContent?.split('\n')[0].replace('Subject: ', ''),
          body: emailTabContent?.replace(/^Subject:.*\n+/, '')
        })
      });
      // Log activity (reuse your existing log logic)
      // ...
      setEmailSent(true);
    } catch (error) {
      toast({ title: 'Failed to send email', description: error instanceof Error ? error.message : 'Could not send email.', variant: 'destructive' });
    }
  };

  // Add state for editing email subject and body
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmailContent, setEditedEmailContent] = useState<string | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');

  useEffect(() => {
    if (isEditingEmail && editedEmailContent) {
      const lines = editedEmailContent.split('\n');
      setEditedSubject(lines[0].replace(/^Subject: /, ''));
      setEditedBody(lines.slice(1).join('\n').replace(/^\n+/, ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingEmail]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-white border-0 rounded-lg p-0 max-h-[873px] overflow-y-scroll">
        <div className="p-6 pb-0">
          <DialogHeader>
            <div className="flex gap-4 justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 bg-[#5E6156]">
                  <AvatarFallback className="text-2xl bg-[#2B2521] font-bold text-white">
                    {account?.contactPersonName?.split(' ').map(n => n[0]).join('') || account?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <Input
                        className="text-2xl font-bold text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                        value={editAccount.name}
                        onChange={e => handleEditChange('name', e.target.value)}
                      />
                    ) : (
                      <DialogTitle className="text-2xl font-bold text-[#282828] flex items-center gap-2">
                        {account?.contactPersonName || account?.name}
                        {/* LinkedIn icon if linkedin_profile_url exists */}
                        {account && (account as any).linkedin_profile_url && (
                          <a
                            href={(account as any).linkedin_profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View LinkedIn Profile"
                            style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}
                          >
                            <span
                              className="linkedin-icon"
                              style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', transition: 'color 0.2s' }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="26"
                                height="26"
                                viewBox="0 0 48 48"
                                style={{ display: 'block' }}
                              >
                                <path
                                  fill="#868686"
                                  className="linkedin-bg"
                                  d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"
                                ></path>
                                <path
                                  fill="#FFF"
                                  d="M12 19H17V36H12zM14.485 17h-.028C12.965 17 12 15.888 12 14.499 12 13.08 12.995 12 14.514 12c1.521 0 2.458 1.08 2.486 2.499C17 15.887 16.035 17 14.485 17zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99C24.957 25.543 25 26.511 25 27v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36 36 36z"
                                ></path>
                              </svg>
                            </span>
                            <style jsx>{`
                              .linkedin-icon:hover .linkedin-bg {
                                fill: #0288D1;
                              }
                            `}</style>
                          </a>
                        )}
                      </DialogTitle>
                    )}
                    {editMode ? (
                      <>
                        <Button variant="ghost" size="icon" className="ml-1" onClick={handleSaveEdit}>
                          <CheckSquare className="h-5 w-5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="ml-1" onClick={handleCancelEdit}>
                          <X className="h-5 w-5 text-red-600" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="icon" className="ml-1" onClick={() => setEditMode(true)}>
                        <Pencil className="h-5 w-5 text-[#998876]" />
                      </Button>
                    )}
                  </div>
                  <p className="text-lg text-[#5E6156] leading-tight">{editMode ? (
                    <Input
                      className="text-lg text-[#5E6156] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                      value={editAccount.contactPersonName}
                      onChange={e => handleEditChange('contactPersonName', e.target.value)}
                    />
                  ) : (account?.jobTitle || 'Role/Title')}</p>
                  <p className="text-lg text-[#5E6156] leading-tight">{editMode ? (
                    <Input
                      className="text-lg text-[#5E6156] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                      value={editAccount.name}
                      onChange={e => handleEditChange('name', e.target.value)}
                    />
                  ) : (account?.name || 'Company')}</p>
                </div>
              </div>
              <div className="flex gap-4 mr-8">
                {ownerName && (
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
                  <Select value={account?.status || ''} onValueChange={async (val) => {
                    if (!account) return;
                    setStatusUpdating(true);
                    const status = val as AccountStatus;
                    const { error } = await supabase.from('account').update({ status }).eq('id', account.id);
                    if (!error) {
                      setAccount({ ...account, status });
                    }
                    setStatusUpdating(false);
                  }} disabled={statusUpdating}>
                    <SelectTrigger className={`gap-2 w-full border-[#CBCAC5] bg-[#F8F7F3] ${statusUpdating ? 'opacity-60' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="sm:w-fit">
                      {['Active', 'Inactive'].map(status => (
                        <SelectItem key={status} value={status} className="w-full">{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {statusUpdating && <span className="ml-2 text-xs text-[#998876]">Updating...</span>}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#EFEDE7] h-fit w-fit mx-auto grid grid-cols-3 items-center p-1 rounded-lg justify-center shadow-none">
            <TabsTrigger value="overview" className="text-base px-4 py-1.5 rounded-md flex items-center gap-2 data-[state=active]:bg-[#2B2521] data-[state=active]:text-white data-[state=active]:shadow-sm">
              <UserCheck className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-base px-4 py-1.5 rounded-md flex items-center gap-2 data-[state=active]:bg-[#2B2521] data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Activity className="h-4 w-4" /> Activity
            </TabsTrigger>
            <TabsTrigger value="email" className="text-base px-4 py-1.5 rounded-md flex items-center gap-2 data-[state=active]:bg-[#2B2521] data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Mail className="h-4 w-4" /> Email
            </TabsTrigger>
          </TabsList>
          <div className="bg-white rounded-b-md p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="bg-white border border-[#E5E3DF] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                      <UserCheck className="h-5 w-5 text-[#5E6156]" /> Contact Information
                    </h3>
                    <div className="space-y-2">
                      {account?.contactEmail && (
                        <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                          <Mail className="h-5 w-5 text-[#C57E94] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-[#5E6156]">Email</p>
                            <p className="text-base text-[#282828] font-medium break-all">{account.contactEmail?.includes(':mailto:') ? account.contactEmail.split(':mailto:')[0] : account.contactEmail}</p>
                          </div>
                        </div>
                      )}
                      {(account?.website || leadInfo?.website) && (
                        <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                          <Globe className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#3987BE]" />
                          <div>
                            <p className="text-sm text-[#5E6156]">Website</p>
                            <a href={account?.website || leadInfo?.website} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-[#282828] underline">{account?.website || leadInfo?.website}</a>
                          </div>
                        </div>
                      )}
                      {(account?.jobTitle || leadInfo?.jobTitle) && (
                        <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                          <UserCheck className="h-5 w-5 text-[#5E6156] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-[#5E6156]">Job Title</p>
                            <p className="text-base text-[#282828] font-medium">{account?.jobTitle || leadInfo?.jobTitle}</p>
                          </div>
                        </div>
                      )}
                      {account?.contactPhone && (
                        <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                          <Phone className="h-5 w-5 text-[#4B7B9D] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-[#5E6156]">Phone</p>
                            <p className="text-base text-[#282828] font-medium">{account.contactPhone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Company Information */}
                  <div className="bg-white border border-[#E5E3DF] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                      <Briefcase className="h-5 w-5 text-[#5E6156]" /> Company Information
                    </h3>
                    <div className="space-y-2">
                      {editMode ? (
                        <>
                          {/* Company Name */}
                          <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                            <Building2 className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Company</p>
                              <Input
                                className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                                value={editAccount.name}
                                onChange={e => handleEditChange('name', e.target.value)}
                              />
                            </div>
                          </div>
                          {/* Website */}
                          <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                            <Globe className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#3987BE]" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Website</p>
                              <Input
                                className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                                value={editAccount.website || leadInfo?.website || ''}
                                onChange={e => handleEditChange('website', e.target.value)}
                              />
                            </div>
                          </div>
                          {/* Industry */}
                          <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                            <Briefcase className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Industry</p>
                              <Input
                                className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                                value={editAccount.industry || leadInfo?.industry || ''}
                                onChange={e => handleEditChange('industry', e.target.value)}
                              />
                            </div>
                          </div>
                          {account?.description && (
                            <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                              <FileText className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-[#5E6156]">Description</p>
                                <Input
                                  className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md max-h-[160px]"
                                  value={editAccount.description}
                                  onChange={e => handleEditChange('description', e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                          {account?.type && (
                            <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                              <Tag className="h-5 w-5 text-[#5E6156] mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-[#5E6156]">Type</p>
                                <Select value={editAccount.type} onValueChange={val => handleEditChange('type', val)}>
                                  <SelectTrigger className="w-full border-[#E5E3DF] bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['Client', 'Channel Partner'].map(type => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {account?.name && (
                            <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                              <Building2 className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-[#5E6156]">Company</p>
                                <p className="text-base font-medium text-[#282828]">{account.name}</p>
                              </div>
                            </div>
                          )}
                          {(account?.website || leadInfo?.website) && (
                            <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                              <Globe className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#3987BE]" />
                              <div>
                                <p className="text-sm text-[#5E6156]">Website</p>
                                <a href={account?.website || leadInfo?.website} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-[#282828] underline">{account?.website || leadInfo?.website}</a>
                              </div>
                            </div>
                          )}
                          {(account?.industry || leadInfo?.industry) && (
                            <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                              <Briefcase className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-[#5E6156]">Industry</p>
                                <p className="text-base font-medium text-[#282828]">{account?.industry || leadInfo?.industry}</p>
                              </div>
                            </div>
                          )}
                          {account?.description && (
                            <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                              <FileText className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-[#5E6156]">Description</p>
                                <p className="text-base font-medium text-[#282828] overflow-scroll">{account.description}</p>
                              </div>
                            </div>
                          )}
                          {account?.type && (
                            <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                              <Tag className="h-5 w-5 text-[#5E6156] mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-[#5E6156]">Type</p>
                                <p className="text-base font-medium text-[#282828]">{account.type}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {/* Metrics & AI Recommendations */}
                  {loadingAI ? (
                    <div className="bg-white border border-[#E5E3DF] rounded-lg p-6">
                      <Skeleton className="h-8 w-1/3 rounded-md mb-2" />
                      <Skeleton className="h-8 w-2/3 rounded-md mb-2" />
                      <Skeleton className="h-6 w-1/2 rounded-md mb-2" />
                      <Skeleton className="h-64 w-full rounded-lg mb-2" />
                      <Skeleton className="h-64 w-full rounded-lg mb-2" />
                    </div>
                  ) : (
                    <div className="bg-white border border-[#E5E3DF] rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-[#5E6156]" /> Account Metrics
                      </h3>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Account Score</span>
                          <span className="font-semibold">{ai?.accountScore ?? ai?.score ?? 'N/A'}/100</span>
                        </div>
                        <div className="w-full bg-[#E5E3DF] rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full" style={{ width: `${ai?.accountScore ?? ai?.score ?? 0}%`, backgroundImage: 'linear-gradient(to right, #3987BE, #D48EA3)' }} />
                        </div>
                      </div>
                      <div className="mt-6 space-y-4">
                        <h4 className="text-lg font-semibold text-[#282828] flex items-center gap-2">
                          <BrainCircuit className="h-5 w-5 text-[#5E6156]" /> AI Recommendations
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-base font-semibold text-[#282828]">AI Recommendations</p>
                          <button
                            className="ml-auto px-2 py-1 text-xs rounded bg-[#E5E3DF] hover:bg-[#d4d2ce] text-[#3987BE] font-medium border border-[#C7C7C7]"
                            onClick={async () => {
                              setLoadingAI(true);
                              try {
                                const response = await fetch('/api/account-enrichment', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ accountId, triggerEnrichment: true, forceRefresh: true }),
                                });
                                if (!response.ok) {
                                  const errorData = await response.json();
                                  toast({ title: 'Regeneration Failed', description: errorData.error || 'Could not regenerate AI analysis.', variant: 'destructive' });
                                  setLoadingAI(false);
                                  return;
                                }
                                const data = await response.json();
                                setAI(data.ai_output || data);
                                if (onEnrichmentComplete) onEnrichmentComplete();
                              } catch (e) {
                                toast({ title: 'Regeneration Failed', description: 'Could not regenerate AI analysis.', variant: 'destructive' });
                              }
                              setLoadingAI(false);
                            }}
                            disabled={loadingAI}
                            title="Refresh AI analysis"
                          >
                            {loadingAI ? 'Regenerating...' : 'Regenerate'}
                          </button>
                        </div>
                        {ai ? (
                          <>
                            <div>
                              <p className="text-sm text-[#5E6156] mb-2 font-medium">Recommended Services</p>
                              <div className="flex flex-wrap gap-2">
                                {(ai.recommended_services || ai.recommendations || []).map((rec: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-[#F8F7F3] border-[#E5E3DF] text-[#282828] font-medium">{rec}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="bg-[#F8F7F3] p-3 rounded-md mb-2 h-full min-h-[140px] flex flex-col justify-start">
                              <p className="text-sm text-[#5E6156] mb-3 font-semibold flex items-center gap-1"><FileText className="h-5 w-5 text-[#916D5B]" /> Pitch Notes</p>
                              <p className="text-sm text-[#282828] overflow-scroll">{ai.pitch_notes || ai.pitchNotes || 'No pitch notes available.'}</p>
                            </div>
                            <div className="bg-[#F8F7F3] p-3 rounded-md h-full min-h-[140px] flex flex-col justify-start">
                              <p className="text-sm text-[#5E6156] mb-3 font-semibold flex items-center gap-1"><Lightbulb className="h-5 w-5 text-[#916D5B]" /> Use Case</p>
                              <p className="text-sm text-[#282828] max-h-[320px] overflow-scroll">{ai.use_case || ai.useCase || 'No use case available.'}</p>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-center text-[#998876]">Could not load AI recommendations.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="activity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                  <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Activity</div>
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
                            <Calendar mode="single" selected={updateDate} onSelect={handleUpdateDateSelect} initialFocus disabled={!!nextActionDate} />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 min-w-0">
                        <Label htmlFor="next-action-date" className="text-sm font-medium text-[#5E6156] mb-2 block">Next Action Date</Label>
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
                            <Calendar mode="single" selected={nextActionDate} onSelect={handleNextActionDateSelect} initialFocus disabled={!!updateDate} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label htmlFor="next-action-time" className="text-sm font-medium text-[#5E6156] mb-2 block">Next Action Time</Label>
                        <Input
                          type="time"
                          id="next-action-time"
                          step="1"
                          value={nextActionTime}
                          onChange={e => setNextActionTime(e.target.value)}
                          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
                          disabled={!!updateDate}
                        />
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
                  {logs.length > 0 ? (
                    <>
                      <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Activity</div>
                      <div className="relative">
                        <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                          {logs.map((log, idx) => (
                            <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-[#F8F7F3] border border-[#E5E3DF] hover:bg-[#EFEDE7] transition-colors">
                              <div className="flex-shrink-0 mt-1">
                                <FileText className="h-4 w-4 text-[#998876]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-[#282828] line-clamp-2">
                                    {log.content}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs bg-white border-[#CBCAC5] text-[#5E6156] font-medium">{log.type}</Badge>
                                  {log.nextActionDate ? (
                                    <span className="text-xs text-[#4B7B9D] font-semibold">
                                      {format(parseISO(log.nextActionDate), 'MMM dd, h:mm a')}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-[#998876] font-medium">
                                      {format(parseISO(log.date), 'MMM dd, h:mm a')}
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
                    <div className="text-xs text-muted-foreground">No activity updates yet.</div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="email">
              <div className="flex flex-col h-full min-h-[300px]">
                <div className="bg-white rounded-lg shadow-sm border border-[#E5E3DF] relative min-h-[200px] flex flex-col">
                  <div className="flex items-center justify-between px-0 pt-2 pb-3 border-b border-[#EFEDE7]">
                    <h4 className="text-lg font-semibold text-[#282828] flex items-center gap-2 pl-6">
                      <Mail className="h-5 w-5 text-[#5E6156]" /> Email to Account
                    </h4>
                    <div className="flex gap-2 pr-6">
                      <Button
                        variant="outline"
                        className="max-h-12 flex items-center gap-1 border-[#E5E3DF] text-[#282828] bg-white hover:bg-[#F8F7F3]"
                        onClick={handleCopyEmail}
                        disabled={!emailTabContent}
                      >
                        <CopyIcon className="h-4 w-4 mr-1" /> Copy
                      </Button>
                      <Button
                        variant="outline"
                        className="max-h-12 flex items-center gap-1 border-[#E5E3DF] text-[#282828] bg-white hover:bg-[#F8F7F3]"
                        onClick={() => {
                          setIsEditingEmail(true);
                          setEditedEmailContent(emailTabContent);
                        }}
                        disabled={!emailTabContent}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </div>
                  {/* Account email address with copy button */}
                  <div className="flex items-center gap-2 px-6 pt-4 pb-2">
                    <Mail className="h-5 w-5 text-[#C57E94]" />
                    <span className="text-base font-medium text-[#282828]">{account?.contactEmail}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1"
                      title="Copy email address"
                      onClick={() => account?.contactEmail && navigator.clipboard.writeText(account.contactEmail)}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-6 whitespace-pre-line text-[#282828] text-[16px] leading-relaxed font-normal">
                    {isEditingEmail ? (
                      <div className="flex flex-col gap-2">
                        <Input
                          value={editedSubject}
                          onChange={e => setEditedSubject(e.target.value)}
                          className="font-semibold text-lg text-[#282828] mb-3"
                          placeholder="Email Subject"
                        />
                        <Textarea
                          value={editedBody}
                          onChange={e => setEditedBody(e.target.value)}
                          className="text-[16px] text-[#282828] leading-relaxed min-h-[300px] resize-none"
                          placeholder="Email Body"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="add"
                            onClick={async () => {
                              const newEmail = `Subject: ${editedSubject}\n\n${editedBody}`;
                              const { error } = await supabase
                                .from('aianalysis')
                                .update({ email_template: newEmail })
                                .eq('entity_type', 'Account')
                                .eq('entity_id', account?.id);
                              if (!error) {
                                setIsEditingEmail(false);
                                setEmailTabContent(newEmail);
                                toast({ title: "Email updated", description: "The email template has been updated." });
                              } else {
                                toast({ title: "Update failed", description: error.message, variant: 'destructive' });
                              }
                            }}
                            disabled={!editedSubject || !editedBody || `Subject: ${editedSubject}\n\n${editedBody}` === emailTabContent}
                          >Save</Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingEmail(false)}
                          >Cancel</Button>
                        </div>
                      </div>
                    ) : isGeneratingEmail && !emailTabContent ? (
                      <span className="text-[#998876]">Generating email...</span>
                    ) : emailTabContent ? (
                      <>
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
                  <Button
                    variant="add"
                    className="max-h-12 flex items-center gap-1 absolute bottom-4 right-6 z-10"
                    disabled={!emailTabContent || emailSent}
                    onClick={handleSendEmail}
                  >
                    <SendIcon className="h-4 w-4 mr-1" /> {emailSent ? 'Sent' : 'Send'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        {showLogEmailDialog && (
          <AlertDialog open={true} onOpenChange={setShowLogEmailDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log Email Activity?</AlertDialogTitle>
                <AlertDialogDescription>
                  Do you want to log this email activity for this account and send the email?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="outline" onClick={() => setShowLogEmailDialog(false)}>No</Button>
                <Button variant="add" onClick={handleConfirmSendEmail}>Yes, Send & Log Activity</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DialogContent>
    </Dialog>
  );
} 
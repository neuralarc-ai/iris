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

interface AccountModalProps {
  accountId: string;
  open: boolean;
  onClose: () => void;
}

export default function AccountModal({ accountId, open, onClose }: AccountModalProps) {
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
  const [ai, setAI] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  });

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    const fetchData = async () => {
      // Fetch account
      const { data: acc } = await supabase.from('account').select('*').eq('id', accountId).single();
      // Map DB fields to camelCase
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
      // Fetch AI recommendations (replace with your real AI call)
      const { data: aiData } = await supabase.from('aianalysis').select('*').eq('entity_id', accountId).eq('entity_type', 'Account').order('created_at', { ascending: false }).limit(1).single();
      setAI(aiData);
      // Fetch users for assignment
      const { data: usersData } = await supabase.from('users').select('id, name, email');
      if (usersData) setUsers(usersData);
      setIsLoading(false);
    };
    fetchData();
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
    const { name, type, status, description, contactEmail, industry, contactPersonName, contactPhone } = editAccount;
    const { error } = await supabase.from('account').update({
      name,
      type,
      status,
      description,
      contact_email: contactEmail,
      industry,
      contact_person_name: contactPersonName,
      contact_phone: contactPhone,
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
      });
    }
    setEditMode(false);
  };

  // Placeholder for user's company info (customize as needed)
  const userCompany = {
    name: 'NeuralArc',
    website: 'https://neuralarc.com',
    contact: 'contact@neuralarc.com',
  };
  // Placeholder for current user (customize as needed)
  const currentUser = { name: ownerName || '[Your Name]', email: ownerName || '[Your Email]' };

  // Email generation logic
  const generateProfessionalEmail = async () => {
    setIsGeneratingEmail(true);
    // Compose recommended services string
    const services = (ai?.recommended_services || ai?.recommendations)?.length
      ? (ai.recommended_services || ai.recommendations).map((s: string) => `- ${s}`).join('\n')
      : '- AI-powered CRM\n- Sales Forecasting\n- Automated Reporting';
    // Simulate API call delay
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`Subject: Unlock Your Sales Potential at ${account?.name}
\nHi ${account?.contactPersonName},
\nI hope this message finds you well. My name is ${currentUser?.name || '[Your Name]'} from ${userCompany.name}. I wanted to introduce you to our platform, designed to help companies like ${account?.name} streamline sales processes, gain actionable insights, and boost conversions.
\nOur solution offers:\n${services}
\nI'd love to schedule a quick call to discuss how we can help ${account?.name} achieve its sales goals. Please let me know your availability, or feel free to reply directly to this email.
\nBest regards,\n${currentUser?.name || '[Your Name]'}\n${userCompany.name}\n${currentUser?.email || '[Your Email]'}\n${userCompany.website}`);
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
      generateProfessionalEmail().then(setEmailTabContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
                      <DialogTitle className="text-2xl font-bold text-[#282828]">{account?.contactPersonName || account?.name}</DialogTitle>
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
                    setIsLoading(true);
                    const status = val as AccountStatus;
                    const { error } = await supabase.from('account').update({ status }).eq('id', account.id);
                    if (!error) {
                      setAccount({ ...account, status });
                    }
                    setIsLoading(false);
                  }} disabled={isLoading}>
                    <SelectTrigger className={`gap-2 w-full border-[#CBCAC5] bg-[#F8F7F3] ${isLoading ? 'opacity-60' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="sm:w-fit">
                      {['Active', 'Inactive'].map(status => (
                        <SelectItem key={status} value={status} className="w-full">{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLoading && <span className="ml-2 text-xs text-[#998876]">Updating...</span>}
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
            {isLoading ? (
              <div className="space-y-6">
                {/* Overview Skeleton */}
                <Skeleton className="h-8 w-1/3 rounded-md mb-2" />
                <Skeleton className="h-8 w-2/3 rounded-md mb-2" />
                <Skeleton className="h-6 w-1/2 rounded-md mb-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-64 w-full rounded-lg mb-2" />
                  <Skeleton className="h-64 w-full rounded-lg mb-2" />
                </div>
              </div>
            ) : (
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div className="bg-white border border-[#E5E3DF] rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                        <UserCheck className="h-5 w-5 text-[#5E6156]" /> Contact Information
                      </h3>
                      <div className="space-y-2">
                        {account?.contactPersonName && (
                          <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                            <Users className="h-5 w-5 text-[#5E6156] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Contact Person</p>
                              <p className="text-base text-[#282828] font-medium">{account.contactPersonName}</p>
                            </div>
                          </div>
                        )}
                        {account?.contactEmail && (
                          <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                            <Mail className="h-5 w-5 text-[#C57E94] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Email</p>
                              <p className="text-base text-[#282828] font-medium break-all">{account.contactEmail}</p>
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
                        {account?.jobTitle && (
                          <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                            <UserCheck className="h-5 w-5 text-[#5E6156] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">Job Title</p>
                              <p className="text-base text-[#282828] font-medium">{account.jobTitle}</p>
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
                            <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                              <Globe className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#3987BE]" />
                              <div>
                                <p className="text-sm text-[#5E6156]">Website</p>
                                <Input
                                  className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                                  value={account?.website || ''}
                                  onChange={e => {}}
                                  disabled
                                />
                              </div>
                            </div>
                            <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                              <Briefcase className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-[#5E6156]">Industry</p>
                                <Input
                                  className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                                  value={editAccount.industry}
                                  onChange={e => handleEditChange('industry', e.target.value)}
                                />
                              </div>
                            </div>
                            {account && (account.country || (account as any).country) && (
                              <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-[#5E6156] mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-[#5E6156]">Country</p>
                                  <Input
                                    className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                                    value={account.country || (account as any).country}
                                    onChange={e => {}}
                                    disabled
                                  />
                                </div>
                              </div>
                            )}
                            <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                              <FileText className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-[#5E6156]">Description</p>
                                <Input
                                  className="text-base font-medium text-[#282828] bg-white border border-[#E5E3DF] px-2 py-1 rounded-md"
                                  value={editAccount.description}
                                  onChange={e => handleEditChange('description', e.target.value)}
                                />
                              </div>
                            </div>
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
                            {account?.website && (
                              <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                                <Globe className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#3987BE]" />
                                <div>
                                  <p className="text-sm text-[#5E6156]">Website</p>
                                  <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-[#282828] underline">{account.website}</a>
                                </div>
                              </div>
                            )}
                            {account?.industry && (
                              <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                                <Briefcase className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-[#5E6156]">Industry</p>
                                  <p className="text-base font-medium text-[#282828]">{account.industry}</p>
                                </div>
                              </div>
                            )}
                            {account && (account.country || (account as any).country) && (
                              <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-[#5E6156] mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-[#5E6156]">Country</p>
                                  <p className="text-base font-medium text-[#282828]">{account.country || (account as any).country}</p>
                                </div>
                              </div>
                            )}
                            {account?.description && (
                              <div className="bg-[#F8F7F3] p-3 rounded-md flex items-start gap-3">
                                <FileText className="h-5 w-5 text-[#998876] mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-[#5E6156]">Description</p>
                                  <p className="text-base font-medium text-[#282828]">{account.description}</p>
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
                  {/* Metrics & AI Recommendations */}
                  <div className="space-y-6">
                    <div className="bg-white border border-[#E5E3DF] rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-[#5E6156]" /> Account Metrics
                      </h3>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Account Score</span>
                          <span className="font-semibold">{ai?.score || 'N/A'}/100</span>
                        </div>
                        <div className="w-full bg-[#E5E3DF] rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full" style={{ width: `${ai?.score || 0}%`, backgroundImage: 'linear-gradient(to right, #3987BE, #D48EA3)' }} />
                        </div>
                      </div>
                      <div className="mt-6 space-y-4">
                        <h4 className="text-lg font-semibold text-[#282828] flex items-center gap-2">
                          <BrainCircuit className="h-5 w-5 text-[#5E6156]" /> AI Recommendations
                        </h4>
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
                            <div className="bg-[#F8F7F3] p-3 rounded-md mb-2 h-full min-h-[140px] max-h-[160px] flex flex-col justify-start">
                              <p className="text-sm text-[#5E6156] mb-2 font-semibold flex items-center gap-1.5"><FileText className="h-5 w-5" /> Pitch Notes</p>
                              <p className="text-sm text-[#5E6156]">{ai.pitch_notes || ai.pitchNotes || 'No pitch notes available.'}</p>
                            </div>
                            <div className="bg-[#F8F7F3] p-3 rounded-md h-full min-h-[140px] max-h-[160px] flex flex-col justify-start">
                              <p className="text-sm text-[#5E6156] mb-2 font-semibold flex items-center gap-1.5"><Lightbulb className="h-5 w-5" /> Use Case</p>
                              <p className="text-sm text-[#5E6156]">{ai.use_case || ai.useCase || 'No use case available.'}</p>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-center text-[#998876]">Could not load AI recommendations.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
            {isLoading ? (
              <div className="space-y-6">
                {/* Activity Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-64 w-full rounded-lg mb-2" />
                  <Skeleton className="h-64 w-full rounded-lg mb-2" />
                </div>
              </div>
            ) : (
              <TabsContent value="activity">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                    <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Add New Activity</div>
                    <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 min-w-0">
                          <Label htmlFor="update-type" className="text-sm font-medium text-[#5E6156] mb-2 block">Activity Type</Label>
                          <Select value={''} onValueChange={() => {}}>
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
                                value={''}
                                placeholder="dd/mm/yyyy"
                                readOnly
                                className="cursor-pointer bg-[#F8F7F3] border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </PopoverTrigger>
                            <PopoverContent align="start" className="p-0 w-auto border-[#CBCAC5] bg-white rounded-md shadow-lg">
                              <Calendar mode="single" selected={undefined} onSelect={() => {}} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="update-content" className="text-sm font-medium text-[#5E6156] mb-2 block">Activity Details</Label>
                        <Textarea
                          id="update-content"
                          value={''}
                          onChange={() => {}}
                          placeholder="Describe the call, meeting, email, or general update..."
                          className="min-h-[100px] resize-none border-[#CBCAC5] bg-[#F8F7F3] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
                        />
                      </div>
                      <DialogFooter className="pt-4">
                        <Button
                          type="button"
                          variant="add"
                          className="w-full bg-[#2B2521] text-white hover:bg-[#3a322c] rounded-md"
                          onClick={() => {}}
                          disabled={true}
                        >
                          <Activity className="mr-2 h-4 w-4" />
                          Add Activity
                        </Button>
                      </DialogFooter>
                    </form>
                  </div>
                  <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                    {logs.length > 0 ? (
                      <>
                        <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Recent Activity</div>
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
                      <div className="text-xs text-muted-foreground">No activity updates yet.</div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
            {isLoading ? (
              <div className="space-y-6">
                {/* Email Skeleton */}
                <Skeleton className="h-8 w-1/3 rounded-md mb-2" />
                <Skeleton className="h-24 w-full rounded-md mb-2" />
                <Skeleton className="h-16 w-2/3 rounded-md mb-2" />
                <Skeleton className="h-6 w-1/2 rounded-md" />
              </div>
            ) : (
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
                          <Mail className="h-4 w-4" /> Gmail
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
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 
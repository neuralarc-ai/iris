"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, User, Mail, Phone, Eye, CheckSquare, FileWarning, CalendarPlus, History, Linkedin, MapPin, Trash2, Pencil, X, FileText, Building2, UserCheck, Clock, Calendar as CalendarIcon, Activity, PlusCircle } from 'lucide-react';
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

export default function LeadCard({ lead, onLeadConverted, onLeadDeleted, onActivityLogged, selectMode = false, selected = false, onSelect, assignedUser, onStatusChange, users = [] }: LeadCardProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [updateType, setUpdateType] = React.useState('');
  const [updateContent, setUpdateContent] = React.useState('');
  const [updateDate, setUpdateDate] = React.useState<Date | undefined>(undefined);
  const [isLogging, setIsLogging] = React.useState(false);
  const updateTypes = ['General', 'Call', 'Meeting', 'Email'];
  const [editMode, setEditMode] = React.useState(false);
  const [editLead, setEditLead] = React.useState({
    companyName: lead.companyName,
    personName: lead.personName,
    email: lead.email,
    phone: lead.phone || '',
    country: lead.country || '',
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
      };

      setLogs(prev => [newUpdate, ...prev]);
      setUpdateType('');
      setUpdateContent('');
      setUpdateDate(undefined);

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

  const handleSaveEdit = () => {
    // TODO: Implement save to Supabase
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditLead({
      companyName: lead.companyName,
      personName: lead.personName,
      email: lead.email,
      phone: lead.phone || '',
      country: lead.country || '',
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

  return (
    <>
      <Card
        className={
          `border border-[#CBCAC5] bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full ${selectMode && selected ? 'ring-2 ring-[#97A487] ring-offset-2' : ''}`
        }
        onClick={selectMode ? onSelect : undefined}
        style={selectMode ? { cursor: 'pointer' } : {}}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-[#282828] truncate">
                {lead.companyName}
              </CardTitle>
              <CardDescription className="text-sm text-[#5E6156] flex items-center mt-1">
                <User className="mr-2 h-3.5 w-3.5 shrink-0" />
                {lead.personName}
              </CardDescription>
            </div>
            <Badge
              variant={getStatusBadgeVariant(lead.status)}
              className={`capitalize whitespace-nowrap text-xs font-medium px-2 py-1 ${getStatusBadgeColorClasses(lead.status)}`}
            >
              {lead.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow space-y-3 text-sm" onClick={selectMode ? undefined : () => setIsDialogOpen(true)} style={selectMode ? {} : { cursor: 'pointer' }}>
          {lead.email && (
            <div className="flex items-center text-[#5E6156]">
              <Mail className="mr-2 h-3.5 w-3.5 shrink-0 text-[#C57E94]" />
              <a href={`mailto:${lead.email}`} className="hover:text-[#C57E94] hover:underline truncate text-sm">
                {lead.email}
              </a>
            </div>
          )}
          
          {lead.phone && (
            <div className="flex items-center text-[#5E6156]">
              <Phone className="mr-2 h-3.5 w-3.5 shrink-0 text-[#4B7B9D]" />
              <span className="text-sm">{lead.phone}</span>
            </div>
          )}
          
          {lead.country && (
            <div className="flex items-center text-[#5E6156]">
              <MapPin className="mr-2 h-3.5 w-3.5 shrink-0 text-[#998876]" />
              <span className="text-sm">{lead.country}</span>
            </div>
          )}
          
          {assignedUser && (
            <div className="flex items-center text-[#5E6156]">
              <UserCheck className="mr-2 h-3.5 w-3.5 shrink-0 text-[#916D5B]" />
              <span className="text-sm">Assigned to: {assignedUser}</span>
            </div>
          )}
          
          <div className="pt-2 space-y-1.5 border-t border-[#E5E3DF]">
            <div className="text-xs text-[#998876] flex items-center">
              <CalendarIcon className="mr-1.5 h-3 w-3 shrink-0" />
              Created {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
            </div>
            <div className="text-xs text-[#998876] flex items-center">
              <Clock className="mr-1.5 h-3 w-3 shrink-0" />
              Updated {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-3 border-t border-[#E5E3DF] mt-auto">
          <div className="flex items-center justify-between w-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs border-[#CBCAC5] text-[#5E6156] hover:bg-[#F8F7F3] hover:text-[#282828] rounded-md"
              onClick={() => setIsViewDialogOpen(true)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View
            </Button>
            
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={0}>
                {canConvert && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        className="rounded-sm p-2 h-8 w-8 bg-[#998876] text-white hover:bg-[#998876]/80 border-0"
                        onClick={() => setIsAddOpportunityOpen(true)}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">New Opportunity</TooltipContent>
                  </Tooltip>
                )}
                
                {canConvert ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="add" 
                            className="rounded-sm p-2 h-8 w-8"
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Convert Lead to Account?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to convert this lead to an account? This action cannot be undone and the lead will be moved to your accounts list.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConvertLead} className="bg-[#2B2521] text-white rounded-md border-0 hover:bg-[#3a322c]">Convert</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">Convert Lead</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button size="sm" variant="outline" disabled className="rounded-sm p-2 h-8 w-8">
                    {lead.status === "Lost" ? <FileWarning className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
                  </Button>
                )}
                
                {canConvert && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="delete" 
                            className="rounded-sm p-2 h-8 w-8"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this lead? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteLead} className="bg-[#916D5B] text-white rounded-md border-0 hover:bg-[#a98a77]">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">Delete</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-white border border-[#CBCAC5] rounded-lg">
          <DialogHeader className="pb-4 border-b border-[#E5E3DF]">
            <DialogTitle className="flex items-center gap-2">
              {editMode ? (
                <Input
                  value={editLead.companyName}
                  onChange={e => handleEditChange('companyName', e.target.value)}
                  className="font-bold text-xl border-none bg-transparent px-0 focus:ring-0 focus:outline-none text-[#282828]"
                  placeholder="Company Name"
                />
              ) : (
                <span className="font-bold text-xl text-[#282828]">{editLead.companyName}</span>
              )}
              {!editMode && (
                <Button variant="ghost" size="icon" className="hover:bg-[#F8F7F3]" onClick={() => setEditMode(true)}>
                  <Pencil className="h-4 w-4 text-[#5E6156]" />
                </Button>
              )}
            </DialogTitle>
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex flex-row items-center gap-1">
                <span className="text-sm font-medium text-[#5E6156]">Contact Person: </span>
                {editMode ? (
                  <Input
                    value={editLead.personName}
                    onChange={e => handleEditChange('personName', e.target.value)}
                    className="border border-[#CBCAC5] bg-[#F8F7F3] px-3 py-2 rounded-md focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B]"
                    placeholder="Person Name"
                  />
                ) : (
                  <span className="text-[#282828] font-medium">{editLead.personName}</span>
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-[#5E6156]">Email Address: </span>
                {editMode ? (
                  <Input
                    value={editLead.email}
                    onChange={e => handleEditChange('email', e.target.value)}
                    className="border border-[#CBCAC5] bg-[#F8F7F3] px-3 py-2 rounded-md focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B]"
                    placeholder="Email"
                  />
                ) : (
                  <span className="text-[#282828] font-medium">{editLead.email}</span>
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-[#5E6156]">Phone Number: </span>
                {editMode ? (
                  <Input
                    value={editLead.phone}
                    onChange={e => handleEditChange('phone', e.target.value)}
                    className="border border-[#CBCAC5] bg-[#F8F7F3] px-3 py-2 rounded-md focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B]"
                    placeholder="Phone"
                  />
                ) : (
                  <span className="text-[#282828] font-medium">{editLead.phone || 'N/A'}</span>
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-[#5E6156]">Location: </span>
                {editMode ? (
                  <Select value={editLead.country} onValueChange={value => handleEditChange('country', value)}>
                    <SelectTrigger className="border border-[#CBCAC5] bg-[#F8F7F3] px-3 py-2 rounded-md focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B]">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-[#282828] font-medium">{editLead.country || 'N/A'}</span>
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-[#5E6156]">Status</span>
                <Select
                  value={editStatus}
                  onValueChange={value => handleStatusChange(value as LeadStatus)}
                  disabled={isUpdatingStatus || editStatus === 'Converted to Account' || editStatus === 'Lost'}
                >
                  <SelectTrigger className="border border-[#CBCAC5] bg-[#F8F7F3] px-3 py-2 rounded-md focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStatusOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isUpdatingStatus && <span className="ml-2 text-xs text-[#998876]">Updating...</span>}
              </div>
            </div>
          </DialogHeader>
          <div className="mt-6">
            {!editMode && logs.length > 0 && (
              <>
                <div className="text-xs font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Recent Activity</div>
                <div className="relative">
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
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
                  {logs.length > 3 && (
                    <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8" style={{background: 'linear-gradient(to bottom, transparent, #fff 90%)'}} />
                  )}
                </div>
              </>
            )}
            {editMode ? (
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#E5E3DF]">
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit} 
                  className="border-[#CBCAC5] text-[#5E6156] hover:bg-[#F8F7F3] hover:text-[#282828] rounded-md"
                >
                  Cancel
                </Button>
                <Button 
                  variant="add" 
                  onClick={handleSaveEdit}
                  className="bg-[#2B2521] text-white hover:bg-[#3a322c] rounded-md"
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <form className="space-y-4 mt-4" onSubmit={(e) => e.preventDefault()}>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Input
                          id="update-date"
                          type="text"
                          value={updateDate ? format(updateDate, 'dd/MM/yyyy') : ''}
                          placeholder="dd/mm/yyyy"
                          readOnly
                          className="cursor-pointer bg-[#F8F7F3] border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
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
            )}
          </div>
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
    </>
  );
}

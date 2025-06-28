"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, User, Mail, Phone, Eye, CheckSquare, FileWarning, CalendarPlus, History, Linkedin, MapPin, Trash2, Pencil, X } from 'lucide-react';
import type { Lead, Update } from '@/types';
import { add, formatDistanceToNow, format } from 'date-fns';
import { convertLeadToAccount, deleteLead, mockUsers } from '@/lib/data';
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

interface LeadCardProps {
  lead: Lead;
  onLeadConverted: (leadId: string, newAccountId: string) => void;
  onLeadDeleted?: (leadId: string) => void;
  onActivityLogged?: (leadId: string, activity: Update) => void;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  assignedUser?: string;
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
    case 'New': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    case 'Contacted': return 'bg-sky-500/20 text-sky-700 border-sky-500/30';
    case 'Qualified': return 'bg-teal-500/20 text-teal-700 border-teal-500/30';
    case 'Proposal Sent': return 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30';
    case 'Converted to Account': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'Lost': return 'bg-red-500/20 text-red-700 border-red-500/30';
    default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
  }
}

export default function LeadCard({ lead, onLeadConverted, onLeadDeleted, onActivityLogged, selectMode = false, selected = false, onSelect, assignedUser }: LeadCardProps) {
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
  const assignedUserObj = mockUsers.find(u => u.id === assignedUserId);

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
          }));
          setLogs(transformedLogs);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };

    fetchLogs();
  }, [lead.id]);

  const handleConvertLead = async () => {
    if (lead.status === "Converted to Account" || lead.status === "Lost") {
      toast({ title: "Action not allowed", description: "This lead has already been processed.", variant: "destructive" });
      return;
    }

    try {
      // Carry forward the assigned user from the lead
      const ownerId = lead.assignedUserId || lead.owner_id || localStorage.getItem('user_id');
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

      if (error) {
        throw error;
      }

      toast({ title: "Lead Deleted", description: lead.companyName + " has been deleted.", variant: "destructive" });
      onLeadDeleted && onLeadDeleted(lead.id);
    } catch (error) {
      console.error('Lead deletion failed:', error);
      toast({ 
        title: "Delete Failed", 
        description: error instanceof Error ? error.message : "Could not delete lead.", 
        variant: "destructive" 
      });
    }
  };

  const handleLogUpdate = async () => {
    if (!updateType || !updateContent.trim() || !updateDate) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    
    // Check for recent duplicate entries (within last 5 seconds)
    const recentDuplicate = logs.find(log => 
      log.content === updateContent.trim() && 
      log.type === updateType &&
      new Date().getTime() - new Date(log.createdAt).getTime() < 5000
    );
    
    if (recentDuplicate) {
      console.log('Duplicate activity detected, ignoring');
      toast({ title: "Warning", description: "This activity was already logged recently.", variant: "destructive" });
      return;
    }
    
    setIsLogging(true);
    try {
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');

      // Save to Supabase
      const { data, error } = await supabase.from('update').insert([
        {
          type: updateType,
          content: updateContent,
          updated_by_user_id: currentUserId,
          date: updateDate.toISOString(),
          lead_id: lead.id,
          opportunity_id: null,
          account_id: null,
        }
      ]).select().single();

      if (error) throw error;

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

      // Update local state
      setLogs(prev => [newUpdate, ...prev]);
      setUpdateType('');
      setUpdateContent('');
      setUpdateDate(undefined);
      toast({ title: 'Update logged', description: 'Your update has been logged.' });

      // Call the optional callback
      onActivityLogged && onActivityLogged(lead.id, newUpdate);
    } catch (error) {
      console.error('Failed to log update:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to log update. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLogging(false);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditLead(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = () => {
    // In a real app, update backend here
    setEditMode(false);
    toast({ title: 'Lead updated', description: 'Lead details have been updated.' });
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

  const handleAssignUser = (userId: string) => {
    setAssignedUserId(userId);
    // Optionally update mock data for demo
    lead.assignedUserId = userId;
  };

  return (
    <>
      <Card
        className={
          `shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full bg-white ${selectMode && selected ? 'ring-2 ring-[#97A487] ring-offset-2' : ''}`
        }
        onClick={selectMode ? onSelect : undefined}
        style={selectMode ? { cursor: 'pointer' } : {}}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-1">
            <CardTitle className="text-xl font-headline flex items-center text-foreground">
              <User className="mr-2 h-5 w-5 text-primary shrink-0" />
              {lead.companyName}
            </CardTitle>
             <Badge
              variant={getStatusBadgeVariant(lead.status)}
              className={`capitalize whitespace-nowrap ml-2 ${getStatusBadgeColorClasses(lead.status)}`}
            >
              {lead.status}
            </Badge>
          </div>
          <CardDescription className="text-sm text-muted-foreground flex items-center">
              <Users className="mr-2 h-4 w-4 shrink-0"/> {lead.personName}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2.5 text-sm" onClick={selectMode ? undefined : () => setIsDialogOpen(true)} style={selectMode ? {} : { cursor: 'pointer' }}>
          {lead.email && (
            <div className="flex items-center text-muted-foreground">
              <Mail className="mr-2 h-4 w-4 shrink-0" />
              <a href={`mailto:${lead.email}`} className="hover:text-primary hover:underline">{lead.email}</a>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center text-muted-foreground">
              <Phone className="mr-2 h-4 w-4 shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.linkedinProfileUrl && (
            <div className="flex items-center text-muted-foreground">
              <Linkedin className="mr-2 h-4 w-4 shrink-0" />
              <a href={lead.linkedinProfileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline truncate">
                {lead.linkedinProfileUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}
              </a>
            </div>
          )}
          {lead.country && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4 shrink-0" />
              <span>{lead.country}</span>
            </div>
          )}
          {assignedUser && (
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-4 w-4 shrink-0" />
              <span>Assigned to: {assignedUser}</span>
            </div>
          )}
          <div className="pt-2 space-y-1">
              <div className="text-xs text-muted-foreground flex items-center">
                  <CalendarPlus className="mr-1.5 h-3.5 w-3.5 shrink-0"/> Created: {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
              </div>
               <div className="text-xs text-muted-foreground flex items-center">
                  <History className="mr-1.5 h-3.5 w-3.5 shrink-0"/> Last Updated: {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
              </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 border-t mt-auto">
          <Button variant="outline" size="sm" className="mr-auto rounded-[2px]" onClick={() => setIsViewDialogOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <TooltipProvider delayDuration={0}>
          {canConvert ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="add" className='rounded-[2px] p-2'><CheckSquare className="h-4 w-4" /></Button>
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
                        <AlertDialogAction onClick={handleConvertLead} className="bg-[#2B2521] text-white rounded-[4px] border-0 hover:bg-[#3a322c]">Convert</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">Convert</TooltipContent>
              </Tooltip>
          ) : (
            <Button size="sm" variant="outline" disabled>
              {lead.status === "Lost" ? <FileWarning className="mr-2 h-4 w-4" /> : <CheckSquare className="mr-2 h-4 w-4" />}
              {lead.status === "Lost" ? "Lost" : "Converted"}
            </Button>
          )}
            {canConvert && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="delete" className="ml-2 rounded-[4px] p-2"><Trash2 className="h-4 w-4" /></Button>
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
                        <AlertDialogAction onClick={handleDeleteLead} className="bg-[#916D5B] text-white rounded-[4px] border-0 hover:bg-[#a98a77]">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">Delete</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </CardFooter>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editMode ? (
                <Input
                  value={editLead.companyName}
                  onChange={e => handleEditChange('companyName', e.target.value)}
                  className="font-bold text-3xl border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                  placeholder="Company Name"
                />
              ) : (
                <span className="font-bold text-3xl">{editLead.companyName}</span>
              )}
              {!editMode && (
                <Button variant="ghost" size="icon" className="ml-2" onClick={() => setEditMode(true)}>
                  <Pencil className="h-5 w-5" />
                </Button>
              )}
            </DialogTitle>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#55504C]">Name:</span>
                {editMode ? (
                  <Input
                    value={editLead.personName}
                    onChange={e => handleEditChange('personName', e.target.value)}
                    className="border border-muted/30 bg-[#EFEDE7] px-2 py-1 rounded focus:ring-0 focus:outline-none"
                    placeholder="Person Name"
                  />
                ) : (
                  <span className="text-[#282828]">{editLead.personName}</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-[#55504C]">Email:</span>{' '}
                {editMode ? (
                  <Input
                    value={editLead.email}
                    onChange={e => handleEditChange('email', e.target.value)}
                    className="border-muted/30 bg-[#EFEDE7] px-2 py-1 focus:ring-0 focus:outline-none"
                    placeholder="Email"
                  />
                ) : (
                  <span className="text-[#282828]">{editLead.email}</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-[#55504C]">Number:</span>{' '}
                {editMode ? (
                  <Input
                    value={editLead.phone}
                    onChange={e => handleEditChange('phone', e.target.value)}
                    className="border-muted/30 bg-[#EFEDE7] px-2 py-1 focus:ring-0 focus:outline-none"
                    placeholder="Phone"
                  />
                ) : (
                  <span className="text-[#282828]">{editLead.phone || 'N/A'}</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-[#55504C]">Location:</span>
                {editMode ? (
                  <Select value={editLead.country} onValueChange={value => handleEditChange('country', value)}>
                    <SelectTrigger className="border border-muted/30 bg-[#EFEDE7] px-2 py-1 rounded focus:ring-0 focus:outline-none">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-[#282828]">{editLead.country || 'N/A'}</span>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="mt-4">
            {!editMode && logs.length > 0 && (
              <>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Activity</div>
                <div className="relative">
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {logs.map((log, idx) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 rounded-r-sm bg-muted/30 border-l-4 border-muted">
                        <div className="flex-shrink-0 mt-1">
                          <CheckSquare className="h-4 w-4 text-primary shrink-0" />
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
                  {logs.length > 1 && (
                    <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8" style={{background: 'linear-gradient(to bottom, transparent, #fff 90%)'}} />
                  )}
                </div>
              </>
            )}
            {editMode ? (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                <Button variant="add" onClick={handleSaveEdit}>Save</Button>
              </div>
            ) : (
              <form className="space-y-4 mt-3" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="update-type">Update Type *</Label>
                    <Select value={updateType} onValueChange={setUpdateType}>
                      <SelectTrigger id="update-type" className="w-full mt-1">
                        <SelectValue placeholder="Select update type" />
                      </SelectTrigger>
                      <SelectContent>
                        {updateTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="update-date">Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Input
                          id="update-date"
                          type="text"
                          value={updateDate ? format(updateDate, 'dd/MM/yyyy') : ''}
                          placeholder="dd/mm/yyyy"
                          readOnly
                          className="mt-1 cursor-pointer bg-white"
                        />
                      </PopoverTrigger>
                      <PopoverContent align="start" className="p-0 w-auto border-none bg-[#CFD4C9] rounded-sm">
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
                  <Label htmlFor="update-content">Content *</Label>
                  <Textarea
                    id="update-content"
                    value={updateContent}
                    onChange={e => setUpdateContent(e.target.value)}
                    placeholder="Describe the call, meeting, email, or general update..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="add" 
                    className="w-full mt-2" 
                    onClick={handleLogUpdate} 
                    disabled={isLogging || !updateType || !updateContent.trim() || !updateDate}
                  >
                    {isLogging ? 'Adding...' : 'Add Activity'}
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
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div><span className="font-semibold">Company:</span> {lead.companyName}</div>
              <div><span className="font-semibold">Contact:</span> {lead.personName}</div>
              <div><span className="font-semibold">Email:</span> {lead.email}</div>
              <div><span className="font-semibold">Phone:</span> {lead.phone || 'N/A'}</div>
              <div><span className="font-semibold">Country:</span> {lead.country || 'N/A'}</div>
              <div><span className="font-semibold">Status:</span> {lead.status}</div>
              <div><span className="font-semibold">Created:</span> {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</div>
              <div><span className="font-semibold">Last Updated:</span> {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}</div>
            </div>
            <div className="pt-2">
              <span className="font-semibold">Assigned To:</span>
              <Select value={assignedUserId} onValueChange={handleAssignUser}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Assign to user" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignedUserObj && (
                <div className="mt-1 text-sm text-muted-foreground">Currently assigned to: <span className="font-medium">{assignedUserObj.name}</span></div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

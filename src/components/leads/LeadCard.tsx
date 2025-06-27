"use client";
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, User, Mail, Phone, Eye, CheckSquare, FileWarning, CalendarPlus, History, Linkedin, MapPin, Trash2, Pencil, X } from 'lucide-react';
import type { Lead, Update } from '@/types';
import { add, formatDistanceToNow, format } from 'date-fns';
import { convertLeadToAccount, deleteLead } from '@/lib/data';
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

interface LeadCardProps {
  lead: Lead;
  onLeadConverted: (leadId: string, newAccountId: string) => void;
  onLeadDeleted?: (leadId: string) => void;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
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

export default function LeadCard({ lead, onLeadConverted, onLeadDeleted, selectMode = false, selected = false, onSelect }: LeadCardProps) {
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

  const handleConvertLead = async () => {
    if (lead.status === "Converted to Account" || lead.status === "Lost") {
      toast({ title: "Action not allowed", description: "This lead has already been processed.", variant: "destructive" });
      return;
    }
    const newAccount = convertLeadToAccount(lead.id);
    if (newAccount) {
      toast({
        title: "Lead Converted!",
        description: `${lead.companyName} has been converted to an account: ${newAccount.name}.`,
        className: "bg-green-100 dark:bg-green-900 border-green-500"
      });
      onLeadConverted(lead.id, newAccount.id);
    } else {
      toast({ title: "Conversion Failed", description: "Could not convert lead to account.", variant: "destructive" });
    }
  };

  const canConvert = lead.status !== "Converted to Account" && lead.status !== "Lost";

  const handleDeleteLead = () => {
    if (deleteLead(lead.id)) {
      toast({ title: "Lead Deleted", description: `${lead.companyName} has been deleted.`, variant: "destructive" });
      onLeadDeleted && onLeadDeleted(lead.id);
    } else {
      toast({ title: "Delete Failed", description: "Could not delete lead.", variant: "destructive" });
    }
  };

  const handleLogUpdate = async () => {
    if (!updateType || !updateContent.trim() || !updateDate) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    setIsLogging(true);
    setTimeout(() => {
      setIsLogging(false);
      setUpdateType('');
      setUpdateContent('');
      setUpdateDate(undefined);
      setLogs(prev => [
        {
          id: `${Date.now()}`,
          type: updateType as Update['type'],
          content: updateContent,
          date: updateDate.toISOString(),
          leadId: lead.id,
          updatedByUserId: undefined,
          createdAt: new Date().toISOString(),
        },
        ...prev
      ]);
      toast({ title: 'Update logged', description: 'Your update has been logged.' });
    }, 1000);
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

  return (
    <>
      <Card
        className={
          `shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full bg-white ${selectMode && selected ? 'ring-2 ring-[#97A487] ring-offset-2' : ''}`
        }
        onClick={selectMode ? onSelect : () => setIsDialogOpen(true)}
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
        <CardContent className="flex-grow space-y-2.5 text-sm">
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
          <Button variant="outline" size="sm" asChild className="mr-auto rounded-[2px]">
            <Link href={`/leads?id=${lead.id}#details`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
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
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {editMode ? (
                <Input
                  value={editLead.companyName}
                  onChange={e => handleEditChange('companyName', e.target.value)}
                  className="font-semibold text-lg border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                  placeholder="Company Name"
                />
              ) : (
                editLead.companyName
              )}
              <Button variant="ghost" size="icon" className="ml-2" onClick={() => setEditMode(e => !e)}>
                {editMode ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
              </Button>
            </DialogTitle>
            <DialogDescription>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <div>
                  <span className="font-semibold">Name:</span>{' '}
                  {editMode ? (
                    <Input
                      value={editLead.personName}
                      onChange={e => handleEditChange('personName', e.target.value)}
                      className="border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                      placeholder="Person Name"
                    />
                  ) : (
                    editLead.personName
                  )}
                </div>
                <div>
                  <span className="font-semibold">Email:</span>{' '}
                  {editMode ? (
                    <Input
                      value={editLead.email}
                      onChange={e => handleEditChange('email', e.target.value)}
                      className="border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                      placeholder="Email"
                    />
                  ) : (
                    editLead.email
                  )}
                </div>
                <div>
                  <span className="font-semibold">Number:</span>{' '}
                  {editMode ? (
                    <Input
                      value={editLead.phone}
                      onChange={e => handleEditChange('phone', e.target.value)}
                      className="border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                      placeholder="Phone"
                    />
                  ) : (
                    editLead.phone || 'N/A'
                  )}
                </div>
                <div>
                  <span className="font-semibold">Location:</span>{' '}
                  {editMode ? (
                    <Input
                      value={editLead.country}
                      onChange={e => handleEditChange('country', e.target.value)}
                      className="border-none bg-transparent px-0 focus:ring-0 focus:outline-none"
                      placeholder="Location"
                    />
                  ) : (
                    editLead.country || 'N/A'
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="mb-2 text-sm font-semibold">Lead: {editLead.companyName}</div>
            <div className="mb-2 text-muted-foreground text-xs">
              {logs.length === 0 ? 'No log found' : ''}
            </div>
            {logs.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {logs.slice(0, 2).map((log, idx) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border-l-4 border-muted">
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
                {logs.length > 2 && (
                  <div className="flex items-center justify-center pt-2 border-t border-muted/30 overflow-hidden max-h-8 opacity-70">
                    <p className="text-xs text-muted-foreground truncate">
                      +{logs.length - 2} more activities
                    </p>
                  </div>
                )}
              </div>
            )}
            {editMode ? (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                <Button variant="add" onClick={handleSaveEdit}>Save</Button>
              </div>
            ) : (
              <form className="space-y-4">
                <div>
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
                <div>
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {updateDate ? format(updateDate, 'dd/MM/yyyy') : 'dd/mm/yyyy'}
                      </Button>
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
                <DialogFooter>
                  <Button type="button" variant="add" className="w-full mt-2" onClick={handleLogUpdate} disabled={isLogging}>
                    {isLogging ? 'Logging...' : 'Log Update'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

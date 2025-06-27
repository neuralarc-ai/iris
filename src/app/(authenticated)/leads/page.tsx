"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import LeadCard from '@/components/leads/LeadCard';
import { mockLeads as initialMockLeads } from '@/lib/data';
import type { Lead, LeadStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Search, ListFilter, List, Grid, Trash2, CheckSquare, UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

const leadStatusOptions: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal Sent", "Lost"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'table'>('list');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  useEffect(() => {
    setLeads([...initialMockLeads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, []);


  const filteredLeads = leads.filter(lead => {
    if (lead.status === 'Converted to Account') return false;
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      lead.companyName.toLowerCase().includes(searchTermLower) ||
      lead.personName.toLowerCase().includes(searchTermLower) ||
      (lead.email && lead.email.toLowerCase().includes(searchTermLower)) ||
      (lead.country && lead.country.toLowerCase().includes(searchTermLower));
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLeadAdded = (newLead: Lead) => {
    setLeads(prevLeads => [newLead, ...prevLeads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  };

  const handleLeadConverted = (convertedLeadId: string) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === convertedLeadId ? { ...lead, status: 'Converted to Account' as LeadStatus, updatedAt: new Date().toISOString() } : lead
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
  };

  const handleImportCsv = () => {
    setIsImportDialogOpen(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file: File) => {
    setIsUploading(true);
    setUploadSuccess(false);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        setIsImportDialogOpen(false);
        setUploadSuccess(false);
        toast({ title: 'Import Complete', description: 'Your file was parsed successfully.' });
      }, 1200);
    }, 1800);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]);
  };

  const handleExitSelectMode = () => {
    setSelectMode(false);
    setSelectedLeads([]);
  };

  return (
    <div className="max-w-[1440px] px-4 mx-auto w-full space-y-6">
      <PageTitle title="Lead Management" subtitle="Track and manage potential clients.">
        <div className="flex items-center gap-2">
            <Button onClick={handleImportCsv} className='bg-transparent border border-[#2B2521] text-[#2B2521] w-fit rounded-[4px]'>
                <Image src="/images/import.svg" alt="Import" width={20} height={20} className="mr-2" /> Import CSV
            </Button>
            <Button onClick={() => setIsAddLeadDialogOpen(true)} variant="add" className='w-fit'>
                <Image src="/images/add.svg" alt="Add" width={20} height={20} className="mr-2" /> Add New Lead
            </Button>
        </div>
      </PageTitle>

      <Card className="shadow duration-300">
         <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary"/> Filter & Search Leads
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={view === 'list' ? 'default' : 'outline'} size="icon" className="rounded-[4px]" onClick={() => setView('list')}><Grid className="h-5 w-5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={view === 'table' ? 'default' : 'outline'} size="icon" className="rounded-[4px]" onClick={() => setView('table')}><List className="h-5 w-5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search-leads">Search Leads</Label>
               <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="search-leads"
                    type="text"
                    placeholder="Search by company, name, email, country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-end gap-2 w-full">
              <div className="flex-1">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={(value: LeadStatus | 'all') => setStatusFilter(value)}>
                  <SelectTrigger id="status-filter" className="w-full mt-1">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {leadStatusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline-dark"
                className="h-10 px-3 text-sm rounded-md"
                style={{marginTop: '28px'}}
                onClick={() => selectMode ? handleExitSelectMode() : setSelectMode(true)}
              >
                {selectMode ? (
                  <><X className="mr-2 h-4 w-4" />Cancel</>
                ) : (
                  <><CheckSquare className="mr-2 h-4 w-4" />Select</>
                )}
              </Button>
            </div>
            </div>
          </div>
          {selectMode && (
            <div className="mt-4 rounded-lg border border-[#D6D8CE] bg-[#CFD4C9] flex items-center px-6 py-3 gap-4 min-h-[56px]">
              <span className="text-base text-foreground mr-4">Select leads to assign</span>
              <Button
                className="flex bg-white text-[#282828] hover:bg-white items-center gap-2 rounded-[6px] px-3 py-2 text-sm"
                onClick={handleSelectAll}
              >
                <input
                  type="checkbox"
                  checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                  readOnly
                  className="accent-[#97A487] border-none mr-2"
                />
                Select All ({filteredLeads.length})
              </Button>
              <Button
                variant="outline"
                className="text-[#282828] text-sm px-3 py-2"
                onClick={() => setSelectedLeads([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredLeads.length > 0 ? (
        view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onLeadConverted={handleLeadConverted}
              selectMode={selectMode}
              selected={selectedLeads.includes(lead.id)}
              onSelect={() => handleSelectLead(lead.id)}
            />
          ))}
        </div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] shadow">
            <Table className='rounded-[8px] bg-white'>
              <TableHeader>
                <TableRow className='bg-[#CBCAC5] hover:bg-[#CBCAC5]'>
                  {selectMode && <TableHead className='w-10'></TableHead>}
                  <TableHead className='text-[#282828] rounded-tl-[8px]'>Company</TableHead>
                  <TableHead className='text-[#282828]'>Contact Person</TableHead>
                  <TableHead className='text-[#282828]'>Email</TableHead>
                  <TableHead className='text-[#282828]'>Phone</TableHead>
                  <TableHead className='text-[#282828]'>Country</TableHead>
                  <TableHead className='text-[#282828]'>Status</TableHead>
                  <TableHead className='text-[#282828]'>Created</TableHead>
                  <TableHead className='text-[#282828] rounded-tr-[8px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className={`hover:bg-transparent ${selectMode && selectedLeads.includes(lead.id) ? 'ring-2 ring-[#97A487] ring-offset-2' : ''}`}
                    style={selectMode ? { cursor: 'pointer' } : {}}
                    onClick={selectMode ? () => handleSelectLead(lead.id) : undefined}
                  >
                    {selectMode && (
                      <TableCell className="w-10 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={e => { e.stopPropagation(); handleSelectLead(lead.id); }}
                          onClick={e => e.stopPropagation()}
                          className="accent-[#97A487] border-none h-4 w-4"
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-semibold text-foreground">{lead.companyName}</TableCell>
                    <TableCell>{lead.personName}</TableCell>
                    <TableCell><a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a></TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>{lead.country}</TableCell>
                    <TableCell><span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground" style={{background:'#b0aca7',color:'#23201d'}}>{lead.status}</span></TableCell>
                    <TableCell>{new Date(lead.createdAt).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell className="flex gap-2">
                      <TooltipProvider delayDuration={0}>
                        {lead.status !== "Converted to Account" && lead.status !== "Lost" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" onClick={() => handleLeadConverted(lead.id)} variant="add" className="rounded-[4px] p-2"><CheckSquare className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Convert</TooltipContent>
                          </Tooltip>
                        )}
                        {lead.status !== "Converted to Account" && lead.status !== "Lost" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="delete" className="rounded-[4px] p-2"><Trash2 className="h-4 w-4" /></Button>
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
                                    <AlertDialogAction onClick={() => {
                                      setLeads(prev => prev.filter(l => l.id !== lead.id));
                                      // Optionally, call deleteLead(lead.id) if you want to sync with mock data
                                    }} className="bg-[#916D5B] text-white rounded-[4px] border-0 hover:bg-[#a98a77]">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Leads Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new lead.</p>
        </div>
      )}
      <AddLeadDialog
        open={isAddLeadDialogOpen}
        onOpenChange={setIsAddLeadDialogOpen}
        onLeadAdded={handleLeadAdded}
      />
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Import Leads from File</DialogTitle>
            <DialogDescription>Upload a CSV or XLSX file to import leads in bulk.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AnimatePresence>
              {isUploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center h-40"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="mb-4"
                  >
                    <Image src="/images/import.svg" alt="Uploading" width={40} height={40} className="opacity-70" />
                  </motion.div>
                  <span className="text-muted-foreground text-sm">Parsing and uploading...</span>
                </motion.div>
              ) : uploadSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center h-40"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="mb-4"
                  >
                    <CheckSquare className="h-10 w-10 text-green-600" />
                  </motion.div>
                  <span className="text-green-700 text-sm">Import successful!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${dragActive ? 'border-primary bg-[#F8F7F3]' : 'border-[#CBCAC5] bg-[#F8F7F3]'}`}
                  onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload file"
                >
                  <UploadCloud className="h-10 w-10 text-primary mb-2" />
                  <span className="text-sm text-muted-foreground mb-1">Drag & drop your CSV, XLSX, or Excel file here</span>
                  <span className="text-xs text-muted-foreground">or click to browse</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <DialogFooter>
            <Button variant="outline-dark" onClick={() => setIsImportDialogOpen(false)} disabled={isUploading}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

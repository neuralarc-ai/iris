"use client";

import React, { useState, useEffect, useRef } from 'react';
import PageTitle from '@/components/common/PageTitle';
import LeadCard from '@/components/leads/LeadCard';
import RejectedLeadCard from '@/components/leads/RejectedLeadCard';
import ArchivedLeadCard from '@/components/leads/ArchivedLeadCard';
import type { Lead, LeadStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Search, ListFilter, List, Grid, Trash2, CheckSquare, UploadCloud, X, Users, AlertTriangle, Loader2, PlusCircle, Archive } from 'lucide-react';
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
import { supabase } from '@/lib/supabaseClient';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { archiveLeads, archiveLead, restoreLead } from '@/lib/archive';
import { Skeleton } from '@/components/ui/skeleton';
import CompanyProfileDialog from '@/components/layout/CompanyProfileDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import LeadDialog from '@/components/leads/LeadDialog';
import AddOpportunityDialog from '@/components/opportunities/AddOpportunityDialog';

const leadStatusOptions: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal Sent", "Lost"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rejectedLeads, setRejectedLeads] = useState<Lead[]>([]);
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'table'>('list');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'leads' | 'rejected' | 'archived'>('leads');
  const [users, setUsers] = useState<any[]>([]);
  const [role, setRole] = useState<string>('user');
  const [userId, setUserId] = useState<string>('');
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false);
  const [bulkAssignUser, setBulkAssignUser] = useState('');
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentRejectedPage, setCurrentRejectedPage] = useState(1);
  const [currentArchivedPage, setCurrentArchivedPage] = useState(1);
  const ITEMS_PER_PAGE = 16;

  const [leadEnrichments, setLeadEnrichments] = useState<Record<string, { leadScore?: number; recommendations?: string[]; pitchNotes?: string; useCase?: string } | undefined>>({});
  const [loadingEnrichments, setLoadingEnrichments] = useState<Record<string, boolean>>({});

  const [isCompanyProfileDialogOpen, setIsCompanyProfileDialogOpen] = useState(false);

  const [archivedByNames, setArchivedByNames] = useState<Record<string, string>>({});

  const [openLeadDialogId, setOpenLeadDialogId] = useState<string | null>(null);
  const [addOpportunityLeadId, setAddOpportunityLeadId] = useState<string | null>(null);
  const [convertLeadId, setConvertLeadId] = useState<string | null>(null);
  const [archiveLeadId, setArchiveLeadId] = useState<string | null>(null);

  // Fetch user names for archivedBy IDs
  useEffect(() => {
    const fetchArchivedByNames = async () => {
      const uniqueIds = Array.from(new Set(archivedLeads.map(l => l.archivedBy).filter(Boolean)));
      if (uniqueIds.length === 0) {
        setArchivedByNames({});
        return;
      }
      const { data, error } = await supabase.from('users').select('id, name').in('id', uniqueIds);
      if (!error && data) {
        const mapping: Record<string, string> = {};
        data.forEach((u: any) => { mapping[u.id] = u.name; });
        setArchivedByNames(mapping);
      }
    };
    fetchArchivedByNames();
  }, [archivedLeads]);

  // LeadCardSkeleton component
  const LeadCardSkeleton = () => (
    <div className="bg-white border border-[#E5E3DF] rounded-lg p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer">
      {/* Header: Name + Company */}
      <div className="mb-4">
        <Skeleton className="h-10 w-3/4 mb-2" /> {/* Company name */}
      </div>
      {/* Lead Score */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 flex-1" /> {/* Progress bar */}
        </div>
      </div>
      {/* Email + Phone */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-2/3" /> {/* Email */}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-1/2" /> {/* Phone */}
        </div>
      </div>
      {/* Actions Button */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E5E3DF]">
        <Skeleton className="h-8 w-full" /> {/* Actions button */}
      </div>
    </div>
  );

  useEffect(() => {
    const fetchLeadsAndUsers = async () => {
      setIsLoadingLeads(true);
      const localUserId = localStorage.getItem('user_id');
      setUserId(localUserId || '');
      // Fetch user role
      const { data: userData } = await supabase.from('users').select('role').eq('id', localUserId).single();
      setRole(userData?.role || 'user');
      // Fetch users for assigned to
      const { data: usersData } = await supabase.from('users').select('id, name');
      setUsers(usersData || []);
      // Fetch active leads
      let query = supabase.from('lead').select('*').eq('is_archived', false).order('updated_at', { ascending: false });
      if (userData?.role !== 'admin') {
        query = query.eq('owner_id', localUserId);
      }
      const { data, error } = await query;
      if (!error && data) {
        // Transform snake_case to camelCase and add missing fields
        const transformedLeads = data.map((lead: any) => ({
          id: lead.id,
          companyName: lead.company_name || '',
          personName: lead.person_name || '',
          phone: lead.phone || '',
          email: lead.email || '',
          linkedinProfileUrl: lead.linkedin_profile_url || '',
          country: lead.country || '',
          website: lead.website || '',
          status: lead.status || 'New',
          opportunityIds: [], // Not implemented yet
          updateIds: [], // Not implemented yet
          createdAt: lead.created_at || new Date().toISOString(),
          updatedAt: lead.updated_at || new Date().toISOString(),
          assignedUserId: lead.owner_id || '',
          rejectionReasons: [], // Not implemented yet
          industry: lead.industry || '',
          jobTitle: lead.job_title || '',
        }));
        setLeads(transformedLeads.filter((lead: any) => lead.status !== 'Converted to Account'));
      } else {
        setLeads([]);
      }

      // Fetch archived leads
      let archivedQuery = supabase.from('lead').select('*').eq('is_archived', true).order('archived_at', { ascending: false });
      if (userData?.role !== 'admin') {
        archivedQuery = archivedQuery.eq('owner_id', localUserId);
      }
      const { data: archivedData, error: archivedError } = await archivedQuery;
      if (!archivedError && archivedData) {
        const transformedArchivedLeads = archivedData.map((lead: any) => ({
          id: lead.id,
          companyName: lead.company_name || '',
          personName: lead.person_name || '',
          phone: lead.phone || '',
          email: lead.email || '',
          linkedinProfileUrl: lead.linkedin_profile_url || '',
          country: lead.country || '',
          website: lead.website || '',
          status: lead.status || 'New',
          opportunityIds: [],
          updateIds: [],
          createdAt: lead.created_at || new Date().toISOString(),
          updatedAt: lead.updated_at || new Date().toISOString(),
          assignedUserId: lead.owner_id || '',
          rejectionReasons: [],
          industry: lead.industry || '',
          jobTitle: lead.job_title || '',
          isArchived: true,
          archivedAt: lead.archived_at,
          archivedBy: lead.archived_by,
        }));
        setArchivedLeads(transformedArchivedLeads);
      } else {
        setArchivedLeads([]);
      }
      setIsLoadingLeads(false);
    };
    fetchLeadsAndUsers();
  }, [isAddLeadDialogOpen]);

  const filteredLeads = leads.filter(lead => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      (lead.companyName || '').toLowerCase().includes(searchTermLower) ||
      (lead.personName || '').toLowerCase().includes(searchTermLower) ||
      (lead.email && lead.email.toLowerCase().includes(searchTermLower)) ||
      (lead.country && lead.country.toLowerCase().includes(searchTermLower));
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic for leads
  const totalLeadsPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  // Sort the entire filteredLeads array by lead score ascending (lowest to highest), leads without a score at the end
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const aScore = leadEnrichments[a.id]?.leadScore;
    const bScore = leadEnrichments[b.id]?.leadScore;
    const aHasScore = typeof aScore === 'number';
    const bHasScore = typeof bScore === 'number';
    if (aHasScore && bHasScore) return aScore - bScore;
    if (aHasScore) return -1;
    if (bHasScore) return 1;
    return 0;
  });
  // Paginate after sorting so all pages and the whole table are in score order
  const paginatedLeads = sortedLeads.slice(startIndex, endIndex);

  // Filter rejected leads based on search term
  const filteredRejectedLeads = rejectedLeads.filter(lead =>
    lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.country && lead.country.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic for rejected leads
  const totalRejectedPages = Math.ceil(filteredRejectedLeads.length / ITEMS_PER_PAGE);
  const startRejectedIndex = (currentRejectedPage - 1) * ITEMS_PER_PAGE;
  const endRejectedIndex = startRejectedIndex + ITEMS_PER_PAGE;
  const paginatedRejectedLeads = filteredRejectedLeads.slice(startRejectedIndex, endRejectedIndex);

  // Filter archived leads based on search term
  const filteredArchivedLeads = archivedLeads.filter(lead =>
    lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.country && lead.country.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic for archived leads
  const totalArchivedPages = Math.ceil(filteredArchivedLeads.length / ITEMS_PER_PAGE);
  const startArchivedIndex = (currentArchivedPage - 1) * ITEMS_PER_PAGE;
  const endArchivedIndex = startArchivedIndex + ITEMS_PER_PAGE;
  const paginatedArchivedLeads = filteredArchivedLeads.slice(startArchivedIndex, endArchivedIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentRejectedPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentArchivedPage(1);
  }, [searchTerm]);

  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToRejectedPage = (page: number) => {
    setCurrentRejectedPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalLeadsPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextRejectedPage = () => {
    if (currentRejectedPage < totalRejectedPages) {
      setCurrentRejectedPage(currentRejectedPage + 1);
    }
  };

  const goToPreviousRejectedPage = () => {
    if (currentRejectedPage > 1) {
      setCurrentRejectedPage(currentRejectedPage - 1);
    }
  };

  const goToArchivedPage = (page: number) => {
    setCurrentArchivedPage(page);
  };

  const goToNextArchivedPage = () => {
    if (currentArchivedPage < totalArchivedPages) {
      setCurrentArchivedPage(currentArchivedPage + 1);
    }
  };

  const goToPreviousArchivedPage = () => {
    if (currentArchivedPage > 1) {
      setCurrentArchivedPage(currentArchivedPage - 1);
    }
  };

  const handleLeadAdded = (newLead: Lead) => {
    setLeads(prevLeads => [newLead, ...prevLeads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  };

  const handleLeadConverted = async (convertedLeadId: string, newAccountId: string) => {
    try {
      // Find the lead that was converted
      const convertedLead = leads.find(lead => lead.id === convertedLeadId);
      if (!convertedLead) {
        console.error('Converted lead not found in local state');
        return;
      }

      // Remove the converted lead from the leads list
      setLeads(prev => prev.filter(lead => lead.id !== convertedLeadId));

      // Create an opportunity automatically for the converted lead
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');

      // Create opportunity with default values
      const { error: opportunityError } = await supabase.from('opportunity').insert([
        {
          name: `Opportunity for ${convertedLead.companyName}`,
          account_id: newAccountId,
          status: 'Scope Of Work',
          value: 0, // Default value, can be updated later
          description: `Initial opportunity created from converted lead: ${convertedLead.personName} - ${convertedLead.companyName}`,
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(), // 3 months from now
          owner_id: currentUserId,
          currency: 'USD',
        }
      ]).select().single();

      if (opportunityError) {
        console.error('Failed to create opportunity:', opportunityError);
        // Don't throw error here as the lead conversion was successful
        toast({
          title: "Lead Converted",
          description: `${convertedLead.companyName} has been converted to an account. Opportunity creation failed - you can create one manually.`,
          className: "bg-yellow-100 dark:bg-yellow-900 border-yellow-500"
        });
      } else {
        toast({
          title: "Lead Converted Successfully!",
          description: `${convertedLead.companyName} has been converted to an account and an initial opportunity has been created.`,
          className: "bg-green-100 dark:bg-green-900 border-green-500"
        });
      }

    } catch (error) {
      console.error('Error in handleLeadConverted:', error);
      toast({
        title: "Error",
        description: "Lead was converted but there was an issue with the follow-up process.",
        variant: "destructive"
      });
    }
  };

  const addLeadToSupabase = async (leadData: any): Promise<Lead> => {
    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) throw new Error('User not authenticated');

    const { data, error } = await supabase.from('lead').insert([
      {
        company_name: leadData.companyName,
        person_name: leadData.personName,
        email: leadData.email,
        phone: leadData.phone || '',
        linkedin_profile_url: leadData.linkedinProfileUrl || '',
        country: leadData.country || '',
        website: leadData.website || '',
        industry: leadData.industry || '',
        job_title: leadData.jobTitle || '',
        status: 'New',
        owner_id: currentUserId,
      }
    ]).select().single();

    if (error || !data) throw error || new Error('Failed to create lead');

    // Transform the response to match Lead interface
    return {
      id: data.id,
      companyName: data.company_name || '',
      personName: data.person_name || '',
      phone: data.phone || '',
      email: data.email || '',
      linkedinProfileUrl: data.linkedin_profile_url || '',
      country: data.country || '',
      status: data.status || 'New',
      opportunityIds: [],
      updateIds: [],
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
      assignedUserId: data.owner_id || '',
      rejectionReasons: [],
    };
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

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setUploadSuccess(false);
    setImportProgress({ current: 0, total: 0, message: '' });
    
    try {
      console.log('🚀 Starting file import process...');
      console.log(' File name:', file.name);
      console.log('📏 File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please upload a valid CSV or Excel file.');
      }
      
      // Check file size (warn if very large)
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        console.warn(`Large file detected: ${fileSizeMB.toFixed(2)}MB. Processing may take longer.`);
      }
      
      // Read file as text and normalize line endings
      let text = await file.text();
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      console.log('📄 File content preview:', text.substring(0, 500) + '...');
      console.log('📊 Total file length:', text.length, 'characters');
      
      // Parse CSV with enhanced large file handling
      console.log('🔍 Starting CSV parsing...');
      const parsedLeads = await parseCSVFileLarge(text, file.name);
      console.log('✅ CSV parsing completed. Parsed leads:', parsedLeads.length);
      
      if (parsedLeads.length === 0) {
        console.error('❌ No leads parsed from CSV');
        throw new Error('No valid leads found in the file.');
      }
      
      console.log('🔍 Starting lead validation...');
      // Separate valid leads from rejected leads
      const validLeads: Array<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'opportunityIds' | 'updateIds'>> = [];
      const rejectedLeadsData: Array<{ leadData: any; reasons: string[] }> = [];
      
      parsedLeads.forEach((leadData, index) => {
        console.log(`🔍 Validating lead ${index + 1}:`, leadData);
        const rejectionCheck = shouldRejectLead(leadData);
        if (rejectionCheck.rejected) {
          console.log(`❌ Lead ${index + 1} rejected:`, rejectionCheck.reasons);
          rejectedLeadsData.push({ leadData, reasons: rejectionCheck.reasons });
        } else {
          console.log(`✅ Lead ${index + 1} accepted`);
          validLeads.push(leadData);
        }
      });
      
      console.log('📊 Validation results - Valid leads:', validLeads.length, 'Rejected leads:', rejectedLeadsData.length);
      
      // Process rejected leads first (regardless of whether there are valid leads)
      rejectedLeadsData.forEach(({ leadData, reasons }) => {
        console.log('Adding rejected lead:', leadData.companyName, 'Reasons:', reasons);
        addRejectedLead(leadData, reasons);
      });
      
      // If no valid leads, just show success message for rejected leads
      if (validLeads.length === 0) {
        console.log('📝 All leads were rejected - processing as rejected leads only');
        setImportProgress({ current: 0, total: 0, message: 'Import complete!' });
        
        setIsUploading(false);
        setUploadSuccess(true);
        
        toast({
          title: 'Import Completed',
          description: `All ${rejectedLeadsData.length} lead${rejectedLeadsData.length === 1 ? '' : 's'} were rejected and moved to the rejected leads section. Please review and approve them if needed.`,
          className: "bg-yellow-100 dark:bg-yellow-900 border-yellow-500"
        });
        
    setTimeout(() => {
          setIsImportDialogOpen(false);
          setUploadSuccess(false);
          setImportProgress({ current: 0, total: 0, message: '' });
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 1500);
        
        return; // Exit early since there are no valid leads to process
      }
      
      // Process valid leads in batches for large files
      const batchSize = 50; // Process 50 leads at a time
      const totalValidLeads = validLeads.length;
      let processedLeads: Lead[] = [];
      
      if (totalValidLeads > batchSize) {
        console.log(`Large file detected (${totalValidLeads} valid leads). Processing in batches of ${batchSize}...`);
        setImportProgress({ 
          current: 0, 
          total: totalValidLeads, 
          message: 'Processing large file...' 
        });
        
        for (let i = 0; i < totalValidLeads; i += batchSize) {
          const batch = validLeads.slice(i, i + batchSize);
          const batchNumber = Math.floor(i/batchSize) + 1;
          const totalBatches = Math.ceil(totalValidLeads/batchSize);
          
          console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} leads)`);
          setImportProgress({ 
            current: i + batch.length, 
            total: totalValidLeads, 
            message: `Processing batch ${batchNumber}/${totalBatches}...` 
          });
          
          const batchLeads = await Promise.all(batch.map(async (leadData) => {
            console.log('Adding lead:', leadData.companyName);
            return await addLeadToSupabase(leadData);
          }));
          
          processedLeads.push(...batchLeads);
          
          // Small delay to prevent browser freezing
          if (i + batchSize < totalValidLeads) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        setImportProgress({ current: totalValidLeads, total: totalValidLeads, message: 'Import complete!' });
      } else {
        // Small file - process all at once
        setImportProgress({ current: 0, total: totalValidLeads, message: 'Processing leads...' });
        
        processedLeads = await Promise.all(validLeads.map(async (leadData) => {
          console.log('Adding lead:', leadData.companyName);
          return await addLeadToSupabase(leadData);
        }));
        
        setImportProgress({ current: totalValidLeads, total: totalValidLeads, message: 'Import complete!' });
      }
      
      console.log('Total processed leads:', processedLeads.length);
      console.log('Total rejected leads:', rejectedLeadsData.length);
      
      // Update the leads state
      setLeads(prevLeads => {
        const newLeads = [...processedLeads, ...prevLeads].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        console.log('Updated leads state:', newLeads.length, 'total leads');
        return newLeads;
      });
      
      setIsUploading(false);
      setUploadSuccess(true);
      
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${processedLeads.length} lead${processedLeads.length === 1 ? '' : 's'}${rejectedLeadsData.length > 0 ? ` and ${rejectedLeadsData.length} rejected lead${rejectedLeadsData.length === 1 ? '' : 's'}` : ''}.`,
        className: "bg-green-100 dark:bg-green-900 border-green-500"
      });
      
      setTimeout(() => {
        setIsImportDialogOpen(false);
        setUploadSuccess(false);
        setImportProgress({ current: 0, total: 0, message: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 1500);
      
    } catch (error) {
      console.error('❌ Import error:', error);
      setIsUploading(false);
      setImportProgress({ current: 0, total: 0, message: '' });
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import leads. Please check your file format.',
        variant: "destructive"
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Enhanced CSV parsing function for large files
  const parseCSVFileLarge = async (csvText: string, fileName: string): Promise<Array<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'opportunityIds' | 'updateIds'>>> => {
    const normalizeHeader = (header: string) =>
      header.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row.');
    }
    // Parse and normalize header row
    const rawHeaders = lines[0].split(',');
    const headers = rawHeaders.map(normalizeHeader);
    
    console.log('🔍 CSV Headers Debug:');
    console.log('Raw headers:', rawHeaders);
    console.log('Normalized headers:', headers);
    
    // Expanded mapping dictionary (normalized keys)
    const columnMappings: Record<string, string> = {
      // Company
      'company': 'companyName', 'companyname': 'companyName', 'company name': 'companyName', 'organization': 'companyName', 'business': 'companyName', 'firm': 'companyName', 'corp': 'companyName', 'corporation': 'companyName', 'inc': 'companyName', 'llc': 'companyName',
      // Website
      'website': 'website', 'web': 'website', 'company website': 'website', 'site': 'website', 'url': 'website',
      // Person
      'name': 'personName', 'personname': 'personName', 'person name': 'personName', 'contact': 'personName', 'contactname': 'personName', 'contact person': 'personName', 'contactperson': 'personName', 'fullname': 'personName', 'full name': 'personName', 'ceo': 'personName', 'owner': 'personName', 'manager': 'personName', 'director': 'personName', 'rep': 'personName', 'representative': 'personName', 'key decision maker': 'personName', 'decision maker': 'personName', 'decisionmaker': 'personName', 'contact name': 'personName', 'primary contact': 'personName', 'primarycontact': 'personName',
      // Email
      'email': 'email', 'emailaddress': 'email', 'email address': 'email', 'mail': 'email', 'e-mail': 'email', 'e-mail address': 'email', 'contact email': 'email', 'contactemail': 'email', 'primary email': 'email', 'primaryemail': 'email',
      // Phone
      'phone': 'phone', 'phonenumber': 'phone', 'phone number': 'phone', 'telephone': 'phone', 'mobile': 'phone', 'tel': 'phone', 'cell': 'phone', 'cellphone': 'phone', 'cell phone': 'phone', 'workphone': 'phone', 'work phone': 'phone', 'contactnumber': 'phone', 'contact number': 'phone', 'contact phone': 'phone', 'contactphone': 'phone',
      // LinkedIn
      'linkedin': 'linkedinProfileUrl', 'linkedinprofile': 'linkedinProfileUrl', 'linkedin profile': 'linkedinProfileUrl', 'linkedinurl': 'linkedinProfileUrl', 'linkedin url': 'linkedinProfileUrl', 'linkedinprofileurl': 'linkedinProfileUrl', 'linkedin profile url': 'linkedinProfileUrl',
      // Country
      'country': 'country', 'location': 'country', 'region': 'country', 'nation': 'country', 'state': 'country', 'province': 'country', 'territory': 'country', 'countryregion': 'country', 'country region': 'country', 'country/region': 'country',
      // Industry
      'industry': 'industry', 'sector': 'industry', 'business type': 'industry',
      // Job Title
      'jobtitle': 'jobTitle', 'job title': 'jobTitle', 'title': 'jobTitle', 'position': 'jobTitle', 'role': 'jobTitle',
    };
    // Map headers to fields
    const fieldMappings: Record<string, number> = {};
    const requiredFields = ['companyName', 'personName', 'email'];
    const optionalFields = ['phone', 'linkedinProfileUrl', 'country'];
    // Exact/normalized mapping
    headers.forEach((header, idx) => {
      if (columnMappings[header]) {
        fieldMappings[columnMappings[header]] = idx;
        console.log(`✅ Mapped "${rawHeaders[idx]}" (${header}) -> ${columnMappings[header]}`);
      }
    });
    // Partial/fuzzy matching for unmapped required fields
    requiredFields.concat(optionalFields).forEach(field => {
      if (fieldMappings[field] === undefined) {
        for (let i = 0; i < headers.length; i++) {
          if (fieldMappings[field] !== undefined) break;
          const header = headers[i];
          if (columnMappings[header]?.toLowerCase() === field) {
            fieldMappings[field] = i;
            console.log(`🔍 Fuzzy matched "${rawHeaders[i]}" (${header}) -> ${field}`);
            break;
          }
          // Partial match fallback
          if (header.includes(field.replace('Name', '').toLowerCase()) || field.toLowerCase().includes(header)) {
            fieldMappings[field] = i;
            console.log(`🔍 Partial matched "${rawHeaders[i]}" (${header}) -> ${field}`);
            break;
          }
        }
      }
    });
    // Content-based fallback for email/phone
    if (fieldMappings['email'] === undefined) {
      for (let i = 0; i < headers.length; i++) {
        if (lines[1].split(',')[i]?.includes('@')) {
          fieldMappings['email'] = i;
          console.log(`🔍 Content-detected email in "${rawHeaders[i]}"`);
          break;
        }
      }
    }
    if (fieldMappings['phone'] === undefined) {
      for (let i = 0; i < headers.length; i++) {
        if (/\d{7,}/.test(lines[1].split(',')[i] || '')) {
          fieldMappings['phone'] = i;
          console.log(`🔍 Content-detected phone in "${rawHeaders[i]}"`);
          break;
        }
      }
    }
    
    console.log('📊 Final field mappings:', fieldMappings);
    
    // Validate required fields
    const missingFields = requiredFields.filter(field => fieldMappings[field] === undefined);
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      console.error('Available headers:', rawHeaders);
      throw new Error(`CSV must contain columns for: ${missingFields.join(', ')}. Found columns: ${rawHeaders.join(', ')}`);
    }
    // Parse data rows
    const leads: Array<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'opportunityIds' | 'updateIds'>> = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const leadData: any = {};
      Object.entries(fieldMappings).forEach(([field, idx]) => {
        // Only strip quotes, do not split on colon
        const value = values[idx]?.replace(/^"|"$/g, '') || '';
        leadData[field] = value;
      });
      leads.push(leadData);
    }
    
    console.log('📈 Parsed leads count:', leads.length);
    console.log('📋 Sample lead data:', leads[0]);
    
    return leads;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSelectAll = () => {
    console.log('Select All clicked. Current selected:', selectedLeads.length, 'Total filtered:', filteredLeads.length);
    if (selectedLeads.length === filteredLeads.length) {
      console.log('Deselecting all');
      setSelectedLeads([]);
    } else {
      console.log('Selecting all');
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    console.log('Select Lead clicked:', leadId, 'Currently selected:', selectedLeads.includes(leadId));
    setSelectedLeads(prev => {
      const newSelection = prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId];
      console.log('New selection:', newSelection);
      return newSelection;
    });
  };

  const handleExitSelectMode = () => {
    setSelectMode(false);
    setSelectedLeads([]);
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignUser || selectedLeads.length === 0) {
      toast({ title: "Error", description: "Please select a user and at least one lead.", variant: "destructive" });
      return;
    }

    setIsBulkAssigning(true);
    try {
      // Update all selected leads in Supabase
      const { error } = await supabase
        .from('lead')
        .update({ owner_id: bulkAssignUser })
        .in('id', selectedLeads);

      if (error) {
        throw error;
      }

      // Update local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          selectedLeads.includes(lead.id) 
            ? { ...lead, assignedUserId: bulkAssignUser }
            : lead
        )
      );

      toast({
        title: "Bulk Assignment Successful",
        description: `${selectedLeads.length} lead${selectedLeads.length === 1 ? '' : 's'} assigned to ${users.find(u => u.id === bulkAssignUser)?.name || 'selected user'}.`,
      });

      // Reset and close dialog
      setSelectedLeads([]);
      setSelectMode(false);
      setIsBulkAssignDialogOpen(false);
      setBulkAssignUser('');
    } catch (error) {
      console.error("Bulk assignment failed:", error);
      toast({ title: "Error", description: "Failed to assign leads. Please try again.", variant: "destructive" });
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedLeads.length === 0) {
      toast({ title: "Error", description: "Please select at least one lead to archive.", variant: "destructive" });
      return;
    }

    setIsBulkDeleting(true);
    try {
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');
      
      await archiveLeads(selectedLeads, currentUserId);

      // Update local state
      setLeads(prevLeads => 
        prevLeads.filter(lead => !selectedLeads.includes(lead.id))
      );

      toast({
        title: "Bulk Archive Successful",
        description: `${selectedLeads.length} lead${selectedLeads.length === 1 ? '' : 's'} and all related activity logs moved to archive.`,
        variant: "destructive"
      });

      // Reset and close dialog
      setSelectedLeads([]);
      setSelectMode(false);
      setIsBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error("Bulk archive failed:", error);
      toast({ title: "Error", description: "Failed to archive leads. Please try again.", variant: "destructive" });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Helper function to determine if a lead should be rejected
  const shouldRejectLead = (leadData: any): { rejected: boolean; reasons: string[] } => {
    const reasons: string[] = [];
    
    // Clean and validate company name
    const cleanCompanyName = leadData.companyName?.trim() || '';
    if (!cleanCompanyName || cleanCompanyName.length < 2 || cleanCompanyName.toLowerCase() === 'not available') {
      reasons.push('Invalid or missing company name');
    }
    
    // Clean and validate person name
    const cleanPersonName = leadData.personName?.trim() || '';
    if (!cleanPersonName || cleanPersonName.length < 2 || cleanPersonName.toLowerCase() === 'not available') {
      reasons.push('Invalid or missing contact name');
    }
    
    // Clean and validate email (handle mailto: format)
    const cleanEmail = leadData.email?.trim() || '';
    const emailWithoutMailto = cleanEmail.split(':')[0]; // Remove mailto: prefix if present
    if (!emailWithoutMailto || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailWithoutMailto)) {
      reasons.push('Invalid or missing email address');
    }
    
    // Check for suspicious or incomplete data (only if we have the data)
    if (emailWithoutMailto && (emailWithoutMailto.includes('example.com') || emailWithoutMailto.includes('test.com'))) {
      reasons.push('Example/test email address detected');
    }
    
    if (leadData.phone && leadData.phone.trim() && leadData.phone.trim().length < 7) {
      reasons.push('Phone number too short');
    }
    
    // Check for duplicate email (against both leads and rejected leads)
    const allEmails = [...leads, ...rejectedLeads].map(lead => lead.email);
    if (emailWithoutMailto && allEmails.includes(emailWithoutMailto)) {
      reasons.push('Duplicate email address');
    }
    
    return {
      rejected: reasons.length > 0,
      reasons
    };
  };

  // Helper function to add a rejected lead
  const addRejectedLead = (leadData: any, reasons: string[]): Lead => {
    const rejectedLead: Lead = {
      id: `rejected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyName: leadData.companyName || 'Unknown Company',
      personName: leadData.personName || 'Unknown Contact',
      email: leadData.email || 'no-email@example.com',
      phone: leadData.phone || '',
      linkedinProfileUrl: leadData.linkedinProfileUrl || '',
      country: leadData.country || '',
      status: 'Rejected' as LeadStatus,
      opportunityIds: [],
      updateIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rejectionReasons: reasons // Add rejection reasons to the lead
    };
    
    setRejectedLeads(prev => [rejectedLead, ...prev]);
    return rejectedLead;
  };

  // Helper function to approve a rejected lead
  const handleApproveRejectedLead = async (rejectedLeadId: string) => {
    const rejectedLead = rejectedLeads.find(lead => lead.id === rejectedLeadId);
    if (!rejectedLead) return;

    try {
      // Save to Supabase
      const approvedLead = await addLeadToSupabase({
        companyName: rejectedLead.companyName,
        personName: rejectedLead.personName,
        email: rejectedLead.email,
        phone: rejectedLead.phone,
        linkedinProfileUrl: rejectedLead.linkedinProfileUrl,
        country: rejectedLead.country,
      });

      // Add to regular leads
      setLeads(prev => [approvedLead, ...prev]);
      
      // Remove from rejected leads
      setRejectedLeads(prev => prev.filter(lead => lead.id !== rejectedLeadId));
      
      toast({
        title: 'Lead Approved',
        description: `${approvedLead.companyName} has been approved and moved to leads.`,
        className: "bg-green-100 dark:bg-green-900 border-green-500"
      });
    } catch (error) {
      console.error('Failed to approve lead:', error);
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve lead. Please try again.',
        variant: "destructive"
      });
    }
  };

  // Helper function to delete a rejected lead
  const handleDeleteRejectedLead = (rejectedLeadId: string) => {
    setRejectedLeads(prev => prev.filter(lead => lead.id !== rejectedLeadId));
    
    toast({
      title: 'Rejected Lead Deleted',
      description: 'The rejected lead has been permanently deleted.',
      className: "bg-blue-100 dark:bg-blue-900 border-blue-500"
    });
  };

  // Helper function to update a rejected lead
  const handleUpdateRejectedLead = (rejectedLeadId: string, updatedData: Partial<Lead>) => {
    setRejectedLeads(prev => prev.map(lead => 
      lead.id === rejectedLeadId 
        ? { ...lead, ...updatedData, updatedAt: new Date().toISOString() }
        : lead
    ));
    
    toast({
      title: 'Lead Updated',
      description: 'The rejected lead has been updated successfully.',
      className: "bg-blue-100 dark:bg-blue-900 border-blue-500"
    });
  };

  const handleRestoreArchivedLead = async (archivedLeadId: string) => {
    try {
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');
      
      await restoreLead(archivedLeadId, currentUserId);
      
      // Remove from archived leads
      setArchivedLeads(prev => prev.filter(lead => lead.id !== archivedLeadId));
      
      toast({
        title: 'Lead Restored',
        description: 'The archived lead has been restored successfully.',
        className: "bg-green-100 dark:bg-green-900 border-green-500"
      });
    } catch (error) {
      console.error('Failed to restore lead:', error);
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore lead. Please try again.',
        variant: "destructive"
      });
    }
  };

  // Add the useEffect here, after paginatedLeads is defined
  useEffect(() => {
    // Fetch enrichment for all paginated leads
    paginatedLeads.forEach((lead) => {
      if (leadEnrichments[lead.id] === undefined && !loadingEnrichments[lead.id]) {
        setLoadingEnrichments(prev => ({ ...prev, [lead.id]: true }));
        (async () => {
          try {
            const { data } = await supabase
              .from('aianalysis')
              .select('ai_output')
              .eq('entity_type', 'Lead')
              .eq('entity_id', lead.id)
              .eq('analysis_type', 'enrichment')
              .eq('status', 'success')
              .order('last_refreshed_at', { ascending: false })
              .limit(1)
              .single();
            // Ensure ai_output is passed as enrichmentData, including emailTemplate
            setLeadEnrichments(prev => ({ ...prev, [lead.id]: data?.ai_output || null }));
          } catch (error: any) {
            // Handle error silently
            console.error('Error fetching enrichment:', error);
          } finally {
            setLoadingEnrichments(prev => ({ ...prev, [lead.id]: false }));
          }
        })();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedLeads]);

  return (
    <div className="max-w-[1440px] px-4 mx-auto w-full space-y-6 pb-6">
      <PageTitle title="Lead Management" subtitle="Track and manage potential clients.">
        <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => setSelectMode(true)} 
              className='bg-transparent hover:bg-[#E6D0D7] border border-[#5E6156] text-[#5E6156] rounded-[4px]'
            >
              <Users className="mr-2 h-4 w-4" /> Select
            </Button>
            <Button onClick={handleImportCsv} className='bg-transparent border border-[#2B2521] text-[#2B2521] w-fit rounded-[4px] hover:bg-[#CFB496]'>
                <Image src="/images/import.svg" alt="Import" width={20} height={20} className="mr-2" /> Import CSV
            </Button>
            <Button onClick={() => setIsAddLeadDialogOpen(true)} variant="add" className='w-fit'>
                <Image src="/images/add.svg" alt="Add" width={20} height={20} className="mr-2" /> Add New Lead
            </Button>
        </div>
      </PageTitle>

      <Card className="duration-300 bg-transparent shadow-none border-none">
         <CardHeader className="flex flex-row items-center justify-between p-0 pb-0">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative w-[60%]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="search-leads"
                    type="text"
                  placeholder="Search leads by name, company, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white rounded-sm border-[#E5E3DF] shadow-sm hover:shadow-md transition-all duration-300 ease-in-out w-full min-h-12 hover:bg-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex bg-white max-w-10 border-[#E5E3DF] shadow-sm items-center gap-2 min-w-[140px] max-h-12 hover:bg-white hover:shadow-md transition-all duration-300 ease-in-out">
                    <ListFilter className="h-5 w-5 text-primary" />
                    Sort & Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className='max-w-[160px] border-[#E5E3DF] rounded-sm h-fit bg-white'>
                  <DropdownMenuLabel className='text-[#282828] text-base border-b'>Status</DropdownMenuLabel>
                  <div className="flex flex-col gap-1 mt-1">
                    <button
                      className={`w-full text-left px-3 py-1 rounded hover:bg-[#EFEDE7] text-[#282828] bg-white ${statusFilter === 'all' ? 'bg-[#EFEDE7]' : ''}`}
                      onClick={() => setStatusFilter('all')}
                      type="button"
                    >
                      All Statuses
                    </button>
                    {leadStatusOptions.map(status => (
                      <button
                        key={status}
                        className={`w-full text-left px-3 py-1 rounded hover:bg-[#EFEDE7] text-[#282828] bg-white ${statusFilter === status ? 'bg-[#EFEDE7]' : ''}`}
                        onClick={() => setStatusFilter(status)}
                        type="button"
                      >
                        {status}
                      </button>
                    ))}
              </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center border border-[#E5E3DF] shadow-sm hover:shadow-md transition-all duration-300 ease-in-out bg-white rounded-[4px] p-1 gap-1 hover:bg-white">
              <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className={`rounded-[2px] ${view === 'list' ? 'text-[#2B2521]' : 'text-[#2B2521]'}`}
                  onClick={() => setView('list')}
                  aria-label="Grid View"
                >
                  <Grid className="h-5 w-5" />
                </Button>
                <Button
                  variant={view === 'table' ? 'default' : 'ghost'}
                  size="icon"
                  className={`rounded-[2px] ${view === 'table' ? 'text-[#2B2521]' : 'text-[#2B2521]'}`}
                  onClick={() => setView('table')}
                  aria-label="List View"
                >
                  <List className="h-5 w-5" />
              </Button>
            </div>
            </div>
        </CardHeader>
        <CardContent className="p-0 bg-transparent">
          {selectMode && (
            <div className="mt-4 rounded-lg border border-[#D6D8CE] bg-[#CFD4C9] flex items-center px-3 py-3 gap-4 min-h-[56px] justify-between">
              <div className="flex items-center gap-4">
                <span className="text-base text-foreground mr-4">Select leads to assign</span>
                <Button
                  className="flex bg-white text-[#282828] hover:bg-white items-center gap-2 rounded-[6px] px-3 py-2 text-sm"
                  onClick={handleSelectAll}
                >
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={handleSelectAll}
                    className="accent-[#97A487] border-none h-4 w-4 mr-2"
                  />
                  Select All ({filteredLeads.length})
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="bg-[#B9B6B1] border-none text-[#282828]/80 hover:bg-[#B9B6B1]/80 hover:text-[#282828] text-sm"
                  onClick={handleExitSelectMode}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              <Button
                variant="add"
                  className="text-white text-sm"
                  onClick={() => setIsBulkAssignDialogOpen(true)}
                disabled={selectedLeads.length === 0}
                >
                  Assign {selectedLeads.length} Lead{selectedLeads.length === 1 ? '' : 's'}
                </Button>
                <Button
                  variant="destructive"
                  className="bg-[#916D5B] text-white hover:bg-[#916D5B]/80 text-sm"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  disabled={selectedLeads.length === 0}
              >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedLeads.length} Lead{selectedLeads.length === 1 ? '' : 's'}
              </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation - Show when there are rejected leads or archived leads */}
      {(rejectedLeads.length > 0 || archivedLeads.length > 0) && (
        <div className="flex items-center space-x-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          {/* Accepted tab always visible */}
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
              activeTab === 'leads'
                ? 'bg-white dark:bg-gray-800 text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              Accepted
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'leads'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {filteredLeads.length}
              </span>
            </span>
          </button>

          {/* Only show Rejected tab if there are rejected leads */}
          {rejectedLeads.length > 0 && (
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'rejected'
                  ? 'bg-white dark:bg-gray-800 text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="flex items-center gap-2">
                Rejected
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {filteredRejectedLeads.length}
                </span>
              </span>
            </button>
          )}

          {/* Only show Archived tab if there are archived leads */}
          {archivedLeads.length > 0 && (
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'archived'
                  ? 'bg-white dark:bg-gray-800 text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="flex items-center gap-2">
                Archived
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'archived'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {filteredArchivedLeads.length}
                </span>
              </span>
            </button>
          )}
        </div>
      )}

      {/* Content - Show leads directly when no rejected leads or archived leads, or in tabs when there are rejected leads or archived leads */}
      {(rejectedLeads.length === 0 && archivedLeads.length === 0) ? (
        /* No rejected leads - show leads directly */
        <div className="mt-6">
      {isLoadingLeads ? (
        // Show skeleton cards during initial loading
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredLeads.length > 0 ? (
        view === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              assignedUser={users.find(u => u.id === lead.assignedUserId)?.name || ''}
              onLeadConverted={handleLeadConverted}
              onLeadDeleted={(leadId: string) => {
                setLeads(prev => prev.filter(l => l.id !== leadId));
              }}
              onStatusChange={(newStatus) => {
                setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
              }}
              selectMode={selectMode}
              selected={selectedLeads.includes(lead.id)}
              onSelect={() => handleSelectLead(lead.id)}
              users={users}
              role={role}
              enrichmentData={leadEnrichments[lead.id]}
              isEnrichmentLoading={loadingEnrichments[lead.id]}
            />
          ))}
        </div>
        ) : (
              <div className="rounded-lg border">
                <Table>
              <TableHeader>
                    <TableRow>
                      {selectMode && <TableHead className="w-10"></TableHead>}
                      <TableHead className='text-[#282828]'>Company</TableHead>
                      <TableHead className='text-[#282828]'>Contact</TableHead>
                  <TableHead className='text-[#282828]'>Email</TableHead>
                  <TableHead className='text-[#282828]'>Phone</TableHead>
                  <TableHead className='text-[#282828]'>Country</TableHead>
                  <TableHead className='text-[#282828]'>Status</TableHead>
                  <TableHead className='text-[#282828]'>Created</TableHead>
                      {role === 'admin' && <TableHead className='text-[#282828]'>Assigned To</TableHead>}
                  <TableHead className='text-[#282828] rounded-tr-[8px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                  <TableRow
                    className={`hover:bg-transparent`}
                        onClick={selectMode ? (e) => {
                          const target = e.target as HTMLElement;
                          if (!target.closest('input[type="checkbox"]') && !target.closest('button')) {
                            handleSelectLead(lead.id);
                          }
                      } : (e) => {
                        const target = e.target as HTMLElement;
                        if (!target.closest('input[type="checkbox"]') && !target.closest('button')) {
                          setOpenLeadDialogId(lead.id);
                        }
                      }}
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
                      <TableCell><a href={`mailto:${lead.email}`} className="text-primary hover:underline" onClick={e => e.stopPropagation()}>{lead.email}</a></TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>{lead.country}</TableCell>
                    <TableCell><span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground" style={{background:'#b0aca7',color:'#23201d'}}>{lead.status}</span></TableCell>
                    <TableCell>{new Date(lead.createdAt).toLocaleDateString('en-GB')}</TableCell>
                        {role === 'admin' && <TableCell>{users.find(u => u.id === lead.assignedUserId)?.name || ''}</TableCell>}
                      <TableCell className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <TooltipProvider delayDuration={0}>
                        {lead.status !== "Converted to Account" && lead.status !== "Lost" && (
                          <>
                              {/* Add Opportunity Button */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="rounded-sm p-2 h-8 w-8 bg-[#97A487] text-white hover:bg-[#97A487]/80 border-0"
                                    onClick={() => setAddOpportunityLeadId(lead.id)}
                                >
                                  <PlusCircle className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                                <TooltipContent side="top" align="center">Add Opportunity</TooltipContent>
                          </Tooltip>
                              {/* Convert to Account Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="add" 
                                      className="rounded-sm p-2 h-8 w-8"
                                    onClick={() => setConvertLeadId(lead.id)}
                                    disabled={(lead.status as LeadStatus) === 'Converted to Account' || (lead.status as LeadStatus) === 'Lost'}
                                    >
                                      <CheckSquare className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center">Convert to Account</TooltipContent>
                              </Tooltip>
                              {/* Archive Button */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="delete" 
                                    className="rounded-sm p-2 h-8 w-8"
                                    onClick={() => setArchiveLeadId(lead.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center">Archive</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                    {/* LeadDialog for this row */}
                    {openLeadDialogId === lead.id && (
                      <LeadDialog
                        open={true}
                        onOpenChange={(open) => setOpenLeadDialogId(open ? lead.id : null)}
                        lead={lead}
                        onLeadConverted={handleLeadConverted}
                        onLeadDeleted={(leadId: string) => {
                          setLeads(prev => prev.filter(l => l.id !== leadId));
                          setOpenLeadDialogId(null);
                        }}
                        users={users}
                        role={role}
                        enrichmentData={leadEnrichments[lead.id]}
                        isEnrichmentLoading={loadingEnrichments[lead.id]}
                      />
                    )}
                    {/* AddOpportunityDialog for this row */}
                    {addOpportunityLeadId === lead.id && (
                      <AddOpportunityDialog
                        open={true}
                        onOpenChange={(open) => setAddOpportunityLeadId(open ? lead.id : null)}
                        accountId={undefined}
                      />
                    )}
                    {/* Convert to Account AlertDialog for this row */}
                    {convertLeadId === lead.id && (
                      <AlertDialog open={true} onOpenChange={(open) => setConvertLeadId(open ? lead.id : null)}>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Convert Lead to Account?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to convert this lead to an account? This action cannot be undone and the lead will be moved to your accounts list.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setConvertLeadId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={async () => {
                              setConvertLeadId(null);
                              // Use the same logic as handleConvertLead in LeadCard
                              if ((lead.status as LeadStatus) === "Converted to Account" || (lead.status as LeadStatus) === "Lost") {
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
                                    website: lead.website,
                                    industry: lead.industry,
                                    job_title: lead.jobTitle,
                                    linkedin_profile_url: lead.linkedinProfileUrl,
                                    country: lead.country,
                                  }
                                ]).select().single();
                                if (accountError || !accountData) {
                                  throw accountError || new Error('Failed to create account');
                                }
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
                                handleLeadConverted(lead.id, accountData.id);
                              } catch (error) {
                                console.error('Lead conversion failed:', error);
                                toast({ 
                                  title: "Conversion Failed", 
                                  description: error instanceof Error ? error.message : "Could not convert lead to account.", 
                                  variant: "destructive" 
                                });
                              }
                            }} className="bg-[#2B2521] text-white rounded-md border-0 hover:bg-[#3a322c]">Convert</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                    )}
                    {/* Archive AlertDialog for this row */}
                    {archiveLeadId === lead.id && (
                      <AlertDialog open={true} onOpenChange={(open) => setArchiveLeadId(open ? lead.id : null)}>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Archive Lead?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to archive this lead? It will be moved to the archive section and can be restored later.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setArchiveLeadId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={async () => {
                              setArchiveLeadId(null);
                                          try {
                                            const currentUserId = localStorage.getItem('user_id');
                                            if (!currentUserId) throw new Error('User not authenticated');
                                            await archiveLead(lead.id, currentUserId);
                                            toast({
                                              title: "Lead Archived",
                                              description: `${lead.companyName} and all related activity logs have been moved to archive.`,
                                              variant: "destructive"
                                            });
                                            setLeads(prev => prev.filter(l => l.id !== lead.id));
                                          } catch (error) {
                                            console.error('Lead archiving failed:', error);
                                            toast({ 
                                              title: "Archiving Failed", 
                                              description: error instanceof Error ? error.message : "Could not archive lead.", 
                                              variant: "destructive" 
                                            });
                                          }
                            }} className="bg-[#916D5B] text-white rounded-md border-0 hover:bg-[#a98a77]">Archive</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                        )}
                  </React.Fragment>
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
          
          {/* Pagination for leads */}
          {!isLoadingLeads && filteredLeads.length > ITEMS_PER_PAGE && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={goToPreviousPage}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
                      </PaginationItem>
                      {currentPage > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}
                  
                  {/* Page numbers around current page */}
                  {Array.from({ length: Math.min(5, totalLeadsPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalLeadsPages - 4, currentPage - 2)) + i;
                    if (pageNum <= totalLeadsPages) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            onClick={() => goToPage(pageNum)}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Last page */}
                  {currentPage < totalLeadsPages - 2 && (
                    <>
                      {currentPage < totalLeadsPages - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink onClick={() => goToPage(totalLeadsPages)}>{totalLeadsPages}</PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={goToNextPage}
                      className={currentPage === totalLeadsPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      ) : (
        /* Has rejected leads - show tabbed content */
        <>
          {/* Accepted Leads Tab Content */}
          {activeTab === 'leads' && (
            <div className="mt-6">
              {isLoadingLeads ? (
                // Show skeleton cards during initial loading
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }, (_, i) => (
                    <LeadCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredLeads.length > 0 ? (
                view === 'list' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {paginatedLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        assignedUser={users.find(u => u.id === lead.assignedUserId)?.name || ''}
                        onLeadConverted={handleLeadConverted}
                        onLeadDeleted={(leadId: string) => {
                          setLeads(prev => prev.filter(l => l.id !== leadId));
                        }}
                        onStatusChange={(newStatus) => {
                          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
                        }}
                        selectMode={selectMode}
                        selected={selectedLeads.includes(lead.id)}
                        onSelect={() => handleSelectLead(lead.id)}
                        users={users}
                        role={role}
                        enrichmentData={leadEnrichments[lead.id]}
                        isEnrichmentLoading={loadingEnrichments[lead.id]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {selectMode && <TableHead className="w-10"></TableHead>}
                          <TableHead className='text-[#282828]'>Company</TableHead>
                          <TableHead className='text-[#282828]'>Contact</TableHead>
                          <TableHead className='text-[#282828]'>Email</TableHead>
                          <TableHead className='text-[#282828]'>Phone</TableHead>
                          <TableHead className='text-[#282828]'>Country</TableHead>
                          <TableHead className='text-[#282828]'>Status</TableHead>
                          <TableHead className='text-[#282828]'>Created</TableHead>
                          {role === 'admin' && <TableHead className='text-[#282828]'>Assigned To</TableHead>}
                          <TableHead className='text-[#282828] rounded-tr-[8px]'>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedLeads.map((lead) => (
                          <React.Fragment key={lead.id}>
                          <TableRow
                            className={`hover:bg-transparent`}
                            onClick={selectMode ? (e) => {
                              const target = e.target as HTMLElement;
                              if (!target.closest('input[type="checkbox"]') && !target.closest('button')) {
                                handleSelectLead(lead.id);
                              }
                              } : (e) => {
                                const target = e.target as HTMLElement;
                                if (!target.closest('input[type="checkbox"]') && !target.closest('button')) {
                                  setOpenLeadDialogId(lead.id);
                                }
                              }}
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
                              <TableCell><a href={`mailto:${lead.email}`} className="text-primary hover:underline" onClick={e => e.stopPropagation()}>{lead.email}</a></TableCell>
                            <TableCell>{lead.phone || '-'}</TableCell>
                            <TableCell>{lead.country}</TableCell>
                            <TableCell><span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground" style={{background:'#b0aca7',color:'#23201d'}}>{lead.status}</span></TableCell>
                            <TableCell>{new Date(lead.createdAt).toLocaleDateString('en-GB')}</TableCell>
                            {role === 'admin' && <TableCell>{users.find(u => u.id === lead.assignedUserId)?.name || ''}</TableCell>}
                              <TableCell className="flex gap-2" onClick={e => e.stopPropagation()}>
                              <TooltipProvider delayDuration={0}>
                        {lead.status !== "Converted to Account" && lead.status !== "Lost" && (
                                  <>
                                      {/* Add Opportunity Button */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          className="rounded-sm p-2 h-8 w-8 bg-[#97A487] text-white hover:bg-[#97A487]/80 border-0"
                                            onClick={() => setAddOpportunityLeadId(lead.id)}
                                        >
                                          <PlusCircle className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                        <TooltipContent side="top" align="center">Add Opportunity</TooltipContent>
                                    </Tooltip>
                                      {/* Convert to Account Button */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                                            <Button 
                                              size="sm" 
                                              variant="add" 
                                              className="rounded-sm p-2 h-8 w-8"
                                            onClick={() => setConvertLeadId(lead.id)}
                                            disabled={(lead.status as LeadStatus) === 'Converted to Account' || (lead.status as LeadStatus) === 'Lost'}
                                            >
                                              <CheckSquare className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" align="center">Convert to Account</TooltipContent>
                                      </Tooltip>
                                      {/* Archive Button */}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            size="sm" 
                                            variant="delete" 
                                            className="rounded-sm p-2 h-8 w-8"
                                            onClick={() => setArchiveLeadId(lead.id)}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" align="center">Archive</TooltipContent>
                                      </Tooltip>
                                    </>
                                  )}
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                            {/* LeadDialog for this row */}
                            {openLeadDialogId === lead.id && (
                              <LeadDialog
                                open={true}
                                onOpenChange={(open) => setOpenLeadDialogId(open ? lead.id : null)}
                                lead={lead}
                                onLeadConverted={handleLeadConverted}
                                onLeadDeleted={(leadId: string) => {
                                  setLeads(prev => prev.filter(l => l.id !== leadId));
                                  setOpenLeadDialogId(null);
                                }}
                                users={users}
                                role={role}
                                enrichmentData={leadEnrichments[lead.id]}
                                isEnrichmentLoading={loadingEnrichments[lead.id]}
                              />
                            )}
                            {/* AddOpportunityDialog for this row */}
                            {addOpportunityLeadId === lead.id && (
                              <AddOpportunityDialog
                                open={true}
                                onOpenChange={(open) => setAddOpportunityLeadId(open ? lead.id : null)}
                                accountId={undefined}
                              />
                            )}
                            {/* Convert to Account AlertDialog for this row */}
                            {convertLeadId === lead.id && (
                              <AlertDialog open={true} onOpenChange={(open) => setConvertLeadId(open ? lead.id : null)}>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                              <AlertDialogTitle>Convert Lead to Account?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                                Are you sure you want to convert this lead to an account? This action cannot be undone and the lead will be moved to your accounts list.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setConvertLeadId(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={async () => {
                                      setConvertLeadId(null);
                                      // Use the same logic as handleConvertLead in LeadCard
                                      if ((lead.status as LeadStatus) === "Converted to Account" || (lead.status as LeadStatus) === "Lost") {
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
                                            website: lead.website,
                                            industry: lead.industry,
                                            job_title: lead.jobTitle,
                                            linkedin_profile_url: lead.linkedinProfileUrl,
                                            country: lead.country,
                                          }
                                        ]).select().single();
                                        if (accountError || !accountData) {
                                          throw accountError || new Error('Failed to create account');
                                        }
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
                                        handleLeadConverted(lead.id, accountData.id);
                                      } catch (error) {
                                        console.error('Lead conversion failed:', error);
                                        toast({ 
                                          title: "Conversion Failed", 
                                          description: error instanceof Error ? error.message : "Could not convert lead to account.", 
                                          variant: "destructive" 
                                        });
                                      }
                                    }} className="bg-[#2B2521] text-white rounded-md border-0 hover:bg-[#3a322c]">Convert</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                            )}
                            {/* Archive AlertDialog for this row */}
                            {archiveLeadId === lead.id && (
                              <AlertDialog open={true} onOpenChange={(open) => setArchiveLeadId(open ? lead.id : null)}>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Archive Lead?</AlertDialogTitle>
                                                                          <AlertDialogDescription>
                                        Are you sure you want to archive this lead? It will be moved to the archive section and can be restored later.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setArchiveLeadId(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={async () => {
                                      setArchiveLeadId(null);
                                                  try {
                                                    const currentUserId = localStorage.getItem('user_id');
                                                    if (!currentUserId) throw new Error('User not authenticated');
                                                    await archiveLead(lead.id, currentUserId);
                                                    toast({
                                                      title: "Lead Archived",
                                                      description: `${lead.companyName} and all related activity logs have been moved to archive.`,
                                                      variant: "destructive"
                                                    });
                                      setLeads(prev => prev.filter(l => l.id !== lead.id));
                                                  } catch (error) {
                                                    console.error('Lead archiving failed:', error);
                                                    toast({ 
                                                      title: "Archiving Failed", 
                                                      description: error instanceof Error ? error.message : "Could not archive lead.", 
                                                      variant: "destructive" 
                                                    });
                                                  }
                                    }} className="bg-[#916D5B] text-white rounded-md border-0 hover:bg-[#a98a77]">Archive</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                        )}
                          </React.Fragment>
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
              
              {/* Pagination for accepted leads in tabbed view */}
              {!isLoadingLeads && filteredLeads.length > ITEMS_PER_PAGE && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={goToPreviousPage}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
                          </PaginationItem>
                          {currentPage > 4 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      
                      {/* Page numbers around current page */}
                      {Array.from({ length: Math.min(5, totalLeadsPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalLeadsPages - 4, currentPage - 2)) + i;
                        if (pageNum <= totalLeadsPages) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink 
                                onClick={() => goToPage(pageNum)}
                                isActive={currentPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      {/* Last page */}
                      {currentPage < totalLeadsPages - 2 && (
                        <>
                          {currentPage < totalLeadsPages - 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink onClick={() => goToPage(totalLeadsPages)}>{totalLeadsPages}</PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={goToNextPage}
                          className={currentPage === totalLeadsPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}

          {/* Rejected Leads Tab Content */}
          {activeTab === 'rejected' && (
            <div className="mt-6">
              {filteredRejectedLeads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {paginatedRejectedLeads.map((lead) => (
                    <RejectedLeadCard
                      key={lead.id}
                      lead={lead}
                      onApprove={handleApproveRejectedLead}
                      onDelete={handleDeleteRejectedLead}
                      onUpdate={handleUpdateRejectedLead}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
                  <p className="text-xl font-semibold text-foreground mb-2">No Rejected Leads</p>
                  <p className="text-muted-foreground">All imported leads have passed validation.</p>
                </div>
              )}
              
              {/* Pagination for rejected leads */}
              {filteredRejectedLeads.length > ITEMS_PER_PAGE && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={goToPreviousRejectedPage}
                          className={currentRejectedPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {/* First page */}
                      {currentRejectedPage > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => goToRejectedPage(1)}>1</PaginationLink>
                          </PaginationItem>
                          {currentRejectedPage > 4 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      
                      {/* Page numbers around current page */}
                      {Array.from({ length: Math.min(5, totalRejectedPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalRejectedPages - 4, currentRejectedPage - 2)) + i;
                        if (pageNum <= totalRejectedPages) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink 
                                onClick={() => goToRejectedPage(pageNum)}
                                isActive={currentRejectedPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      {/* Last page */}
                      {currentRejectedPage < totalRejectedPages - 2 && (
                        <>
                          {currentRejectedPage < totalRejectedPages - 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink onClick={() => goToRejectedPage(totalRejectedPages)}>{totalRejectedPages}</PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={goToNextRejectedPage}
                          className={currentRejectedPage === totalRejectedPages ? "pointer-events-none opacity-50" : "cursor-pointer bg-[#E6D2C9]"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}

          {/* Archived Leads Tab Content */}
          {activeTab === 'archived' && (
            <div className="mt-6">
              {filteredArchivedLeads.length > 0 ? (
                view === 'list' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {paginatedArchivedLeads.map((lead) => (
                      <ArchivedLeadCard
                        key={lead.id}
                        lead={lead}
                        userNamesById={archivedByNames}
                        onRestore={handleRestoreArchivedLead}
                        onDelete={handleDeleteRejectedLead}
                        onUpdate={handleUpdateRejectedLead}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='text-[#282828]'>Company</TableHead>
                          <TableHead className='text-[#282828]'>Contact</TableHead>
                          <TableHead className='text-[#282828]'>Email</TableHead>
                          <TableHead className='text-[#282828]'>Phone</TableHead>
                          <TableHead className='text-[#282828]'>Country</TableHead>
                          <TableHead className='text-[#282828]'>Status</TableHead>
                          <TableHead className='text-[#282828]'>Archived By</TableHead>
                          <TableHead className='text-[#282828]'>Archived Date</TableHead>
                          <TableHead className='text-[#282828] rounded-tr-[8px]'>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedArchivedLeads.map((lead) => (
                          <React.Fragment key={lead.id}>
                            <TableRow
                              className={`hover:bg-transparent`}
                              onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (!target.closest('button')) {
                                  // Open archived lead dialog or show details
                                  console.log('View archived lead details:', lead.id);
                                }
                              }}
                            >
                              <TableCell className="font-semibold text-foreground">{lead.companyName}</TableCell>
                              <TableCell>{lead.personName}</TableCell>
                              <TableCell><a href={`mailto:${lead.email}`} className="text-primary hover:underline" onClick={e => e.stopPropagation()}>{lead.email}</a></TableCell>
                              <TableCell>{lead.phone || '-'}</TableCell>
                              <TableCell>{lead.country}</TableCell>
                              <TableCell><span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground" style={{background:'#b0aca7',color:'#23201d'}}>{lead.status}</span></TableCell>
                              <TableCell>{archivedByNames[lead.archivedBy || ''] || '-'}</TableCell>
                              <TableCell>{lead.archivedAt ? new Date(lead.archivedAt).toLocaleDateString('en-GB') : '-'}</TableCell>
                              <TableCell className="flex gap-2" onClick={e => e.stopPropagation()}>
                                <TooltipProvider delayDuration={0}>
                                  {/* Restore Button */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="add" 
                                        className="rounded-sm p-2 h-8 w-8"
                                        onClick={() => handleRestoreArchivedLead(lead.id)}
                                      >
                                        <CheckSquare className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="center">Restore Lead</TooltipContent>
                                  </Tooltip>
                                  {/* Delete Button */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="delete" 
                                        className="rounded-sm p-2 h-8 w-8"
                                        onClick={() => handleDeleteRejectedLead(lead.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="center">Delete Permanently</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                <div className="text-center py-16">
                  <Archive className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
                  <p className="text-xl font-semibold text-foreground mb-2">No Archived Leads</p>
                  <p className="text-muted-foreground">No leads have been archived yet.</p>
                </div>
              )}
              
              {/* Pagination for archived leads */}
              {filteredArchivedLeads.length > ITEMS_PER_PAGE && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={goToPreviousArchivedPage}
                          className={currentArchivedPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {/* First page */}
                      {currentArchivedPage > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => goToArchivedPage(1)}>1</PaginationLink>
                          </PaginationItem>
                          {currentArchivedPage > 4 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      
                      {/* Page numbers around current page */}
                      {Array.from({ length: Math.min(5, totalArchivedPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalArchivedPages - 4, currentArchivedPage - 2)) + i;
                        if (pageNum <= totalArchivedPages) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink 
                                onClick={() => goToArchivedPage(pageNum)}
                                isActive={currentArchivedPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      {/* Last page */}
                      {currentArchivedPage < totalArchivedPages - 2 && (
                        <>
                          {currentArchivedPage < totalArchivedPages - 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink onClick={() => goToArchivedPage(totalArchivedPages)}>{totalArchivedPages}</PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={goToNextArchivedPage}
                          className={currentArchivedPage === totalArchivedPages ? "pointer-events-none opacity-50" : "cursor-pointer bg-[#E6D2C9]"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </>
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
                  <span className="text-muted-foreground text-sm mb-2">{importProgress.message}</span>
                  {importProgress.total > 0 && (
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{importProgress.current} / {importProgress.total}</span>
                        <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
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
      <Dialog open={isBulkAssignDialogOpen} onOpenChange={setIsBulkAssignDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Bulk Assign Leads</DialogTitle>
            <DialogDescription>
              Assign {selectedLeads.length} selected lead{selectedLeads.length === 1 ? '' : 's'} to a team member.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="bulk-assign-user">Select User</Label>
              <Select value={bulkAssignUser} onValueChange={setBulkAssignUser}>
                <SelectTrigger id="bulk-assign-user" className="w-full">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline-dark" onClick={() => setIsBulkAssignDialogOpen(false)} disabled={isBulkAssigning}>
              Cancel
            </Button>
            <Button 
              variant="add" 
              disabled={!bulkAssignUser || isBulkAssigning} 
              onClick={handleBulkAssign}
            >
              {isBulkAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign ${selectedLeads.length} Lead${selectedLeads.length === 1 ? '' : 's'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
                            <DialogTitle>Bulk Archive Leads</DialogTitle>
                          <DialogDescription>
                Are you sure you want to archive {selectedLeads.length} selected lead{selectedLeads.length === 1 ? '' : 's'}? They will be moved to the archive section and can be restored later.
              </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will permanently delete the selected leads from the system.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline-dark" onClick={() => setIsBulkDeleteDialogOpen(false)} disabled={isBulkDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              disabled={isBulkDeleting} 
                              onClick={handleBulkArchive}
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Archive ${selectedLeads.length} Lead${selectedLeads.length === 1 ? '' : 's'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CompanyProfileDialog
        open={isCompanyProfileDialogOpen}
        onOpenChange={setIsCompanyProfileDialogOpen}
        onImportLeadsFile={(file) => {
          setIsCompanyProfileDialogOpen(false);
          setIsImportDialogOpen(false); // Ensure only one import dialog is open
          handleFile(file);
        }}
      />
    </div>
  );
}

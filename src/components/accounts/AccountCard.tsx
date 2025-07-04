"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ListChecks, PlusCircle, Eye, Users, Mail, Phone, Tag, Trash2, FileText, MoreHorizontal } from 'lucide-react';
import type { Account, DailyAccountSummary as AIDailySummary, Opportunity, Update, UpdateType } from '@/types';
import { generateDailyAccountSummary } from '@/ai/flows/daily-account-summary';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import AccountModal from './AccountModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface AccountCardProps {
  account: Account;
  view?: 'grid' | 'table';
  onNewOpportunity?: () => void;
  owner?: string;
  onAccountDeleted?: (accountId: string) => void;
  onAccountUpdated?: (updatedAccount: any) => void;
}

export default function AccountCard({ account, onNewOpportunity, owner, onAccountDeleted, onAccountUpdated }: AccountCardProps) {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [aiEnrichment, setAiEnrichment] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [enrichmentUpdated, setEnrichmentUpdated] = useState(0);

  // Map fields for runtime compatibility (camelCase preferred, fallback to snake_case)
  const contactPersonName = account.contactPersonName || (account as any).contact_person_name || account.name;
  const contactEmail = account.contactEmail || (account as any).contact_email || '';
  const contactPhone = account.contactPhone || (account as any).contact_phone || '';

  useEffect(() => {
    // Fetch opportunities for this account
    const fetchOpportunities = async () => {
      const { data, error } = await supabase
        .from('opportunity')
        .select('*')
        .eq('account_id', account.id);
      if (!error && data) setOpportunities(data);
      else setOpportunities([]);
    };
    fetchOpportunities();
  }, [account.id]);

  useEffect(() => {
    // Fetch AI score for this account from aianalysis
    const fetchAiScore = async () => {
      const { data } = await supabase
        .from('aianalysis')
        .select('match_score')
        .eq('entity_type', 'Account')
        .eq('entity_id', account.id)
        .eq('status', 'success')
        .order('last_refreshed_at', { ascending: false })
        .limit(1)
        .single();
      setAiScore(data?.match_score ?? null);
    };
    fetchAiScore();
  }, [account.id, enrichmentUpdated]);

  useEffect(() => {
    setIsAiLoading(true);
    const fetchAiEnrichment = async () => {
      const { data } = await supabase
        .from('aianalysis')
        .select('ai_output')
        .eq('entity_type', 'Account')
        .eq('entity_id', account.id)
        .eq('analysis_type', 'enrichment')
        .eq('status', 'success')
        .order('last_refreshed_at', { ascending: false })
        .limit(1)
        .single();
      setAiEnrichment(data?.ai_output || null);
      setIsAiLoading(false);
    };
    fetchAiEnrichment();
  }, [account.id, enrichmentUpdated]);

  return (
    <Card
      className="border border-[#E5E3DF] bg-white rounded-sm shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full p-4"
      onClick={() => setModalOpen(true)}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-bold text-[#282828] leading-tight truncate">{contactPersonName}</div>
            <div className="text-base text-[#5E6156] font-medium mt-0.5 truncate">{account.name}</div>
          </div>
        </div>
        <div className="mt-3 text-sm font-medium text-[#5E6156]">Account Score</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-full bg-[#E5E3DF] rounded-full h-2 overflow-hidden">
            {aiScore !== null ? (
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${aiScore}%`,
                  backgroundImage: 'linear-gradient(to right, #3987BE, #D48EA3)',
                }}
              />
            ) : (
              <div className="h-2 rounded-full bg-[#E5E3DF]" style={{ width: '100%' }} />
            )}
          </div>
          <div className="text-sm font-semibold text-[#282828] ml-2 flex flex-row items-center flex-shrink-0">
            {aiScore !== null ? `${aiScore}%` : 'N/A'}
          </div>
        </div>
        <div className="mt-4 space-y-1.5 text-[15px]">
          <div className="text-[#5E6156] truncate">
            <span className="font-medium">Email: {contactEmail || 'N/A'} </span>
          </div>
          <div className="text-[#5E6156] truncate">
            <span className="font-medium">Phone:</span> <span className="text-[#282828]">{contactPhone || 'N/A'}</span>
          </div>
          <div className="text-[#5E6156] truncate">
            <span className="font-medium">Opportunities:</span> <span className="text-[#282828]">{opportunities.length}</span>
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
            <DropdownMenuItem onClick={onNewOpportunity} className="min-h-[44px] text-[#282828] bg-[#fff] focus:bg-[#F8F7F3] focus:text-black flex items-center gap-2 cursor-pointer">
              <PlusCircle className="h-5 w-5 text-[#282828]" /> Add Opportunity
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="min-h-[44px] bg-[#fff] flex items-center gap-2 text-[#916D5B] focus:bg-[#F8F7F3] focus:text-[#916D5B] cursor-pointer">
              <Trash2 className="h-5 w-5 text-[#916D5B]" /> Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <AccountModal
        accountId={account.id}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aiEnrichment={aiEnrichment}
        isAiLoading={isAiLoading}
        onEnrichmentComplete={() => setEnrichmentUpdated(v => v + 1)}
      />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDeleteDialog(false); if (onAccountDeleted) onAccountDeleted(account.id); }} className="bg-[#916D5B] text-white rounded-md border-0 hover:bg-[#a98a77]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
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
import { archiveAccount } from '@/lib/archive';
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
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleArchiveAccount = async () => {
    setIsDeleting(true);
    try {
      const currentUserId = localStorage.getItem('user_id');
      if (!currentUserId) throw new Error('User not authenticated');
      
      await archiveAccount(account.id, currentUserId);
      
      setShowDeleteDialog(false);
      toast({
        title: "Account archived",
        description: "Account and all related data have been moved to archive.",
      });
      
      if (onAccountDeleted) {
        onAccountDeleted(account.id);
      }
    } catch (error) {
      console.error("Failed to archive account:", error);
      toast({
        title: "Error",
        description: "Failed to archive account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      className="border border-[#E5E3DF] bg-white rounded-sm shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full p-4"
      onClick={() => setModalOpen(true)}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center min-w-0 w-full">
            <div className="text-xl font-bold text-[#282828] leading-tight truncate">{contactPersonName}
              {/* LinkedIn icon if linkedin_profile_url exists */}
              {(account as any).linkedin_profile_url && (
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
            </div>
            {/* Status badge at far right */}
            <span className="ml-auto flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border bg-[#C57E94]/10 text-[#C57E94] border-[#C57E94]/20">{account.status}</span>
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
            <span className="font-medium">Email: {contactEmail?.includes(':mailto:') ? contactEmail.split(':mailto:')[0] : contactEmail || 'N/A'} </span>
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
              <Trash2 className="h-5 w-5 text-[#916D5B]" /> Archive Account
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
            <AlertDialogTitle>Archive Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this account? It will be moved to the archive section and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchiveAccount} 
              className="bg-[#916D5B] text-white rounded-md border-0 hover:bg-[#a98a77]"
              disabled={isDeleting}
            >
              {isDeleting ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
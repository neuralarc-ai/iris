"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ListChecks, PlusCircle, Eye, MessageSquareHeart, Lightbulb, Users, Mail, Phone, Tag, Trash2 } from 'lucide-react';
import type { Account, DailyAccountSummary as AIDailySummary, Opportunity } from '@/types';
import { getOpportunitiesByAccount } from '@/lib/data';
import { generateDailyAccountSummary } from '@/ai/flows/daily-account-summary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

interface AccountCardProps {
  account: Account;
  view?: 'grid' | 'table';
}

export default function AccountCard({ account, view = 'grid' }: AccountCardProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [dailySummary, setDailySummary] = useState<AIDailySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setOpportunities(getOpportunitiesByAccount(account.id));
  }, [account.id]);

  const fetchDailySummary = async () => {
    setIsLoadingSummary(true);
    try {
      const summary = await generateDailyAccountSummary({
        accountId: account.id,
        accountName: account.name,
        recentUpdates: "Placeholder: Recent updates indicate active engagement.", 
        keyMetrics: "Placeholder: Key metrics are trending positively.", 
      });
      setDailySummary(summary);
    } catch (error) {
      console.error(`Failed to fetch summary for ${account.name}:`, error);
      // Set a default error state for summary to inform user
      setDailySummary({ summary: "Could not load AI summary.", relationshipHealth: "Unknown" });
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  useEffect(() => {
    if (account.status === 'Active') {
        fetchDailySummary();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id, account.name, account.status]);

  // Placeholder for delete handler
  const handleDeleteAccount = () => {
    // Implement actual delete logic as needed
    setDeleteDialogOpen(false);
    // Optionally show a toast or update parent state
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full bg-white">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-xl font-headline flex items-center text-foreground">
            <Briefcase className="mr-2 h-5 w-5 text-primary shrink-0" />
            {account.name}
          </CardTitle>
          <Badge 
            variant={account.status === 'Active' ? 'default' : 'secondary'} 
            className={`capitalize whitespace-nowrap ml-2 ${account.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-amber-500/20 text-amber-700 border-amber-500/30'}`}
          >
            {account.status}
          </Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground flex items-center">
            <Tag className="mr-2 h-4 w-4 shrink-0"/> {account.type}
            {account.industry && <span className="mx-1 text-muted-foreground/50">|</span>}
            {account.industry && <span className="text-xs">{account.industry}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <p className="text-muted-foreground line-clamp-2">{account.description}</p>
        
        {account.contactPersonName && (
            <div className="flex items-center text-muted-foreground">
                <Users className="mr-2 h-4 w-4 shrink-0"/>
                {account.contactPersonName}
            </div>
        )}
        {account.contactEmail && (
            <div className="flex items-center text-muted-foreground">
                <Mail className="mr-2 h-4 w-4 shrink-0"/>
                {account.contactEmail}
            </div>
        )}
         {account.contactPhone && (
            <div className="flex items-center text-muted-foreground">
                <Phone className="mr-2 h-4 w-4 shrink-0"/>
                {account.contactPhone}
            </div>
        )}

        <div className="text-sm flex items-center text-foreground font-medium">
          <ListChecks className="mr-2 h-4 w-4 text-primary" />
          <span>{opportunities.length} Active Opportunit{opportunities.length !== 1 ? 'ies' : 'y'}</span> 
        </div>

        {account.status === 'Active' && (
          <div className="pt-3 border-t mt-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center">
              <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-yellow-500" /> AI Daily Brief
            </h4>
            {isLoadingSummary ? (
              <div className="flex items-center space-x-2 h-10">
                <LoadingSpinner size={16} /> 
                <span className="text-xs text-muted-foreground">Generating brief...</span>
              </div>
            ) : dailySummary ? (
              <div className="space-y-1">
                <p className="text-xs text-foreground line-clamp-2">{dailySummary.summary}</p>
                <div className="flex items-center text-xs">
                  <MessageSquareHeart className="mr-1.5 h-3.5 w-3.5 text-pink-500" />
                  <span className="font-medium text-foreground">Health:</span>&nbsp;
                  <span className="text-muted-foreground">{dailySummary.relationshipHealth}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground h-10 flex items-center">No AI brief available for this account.</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 border-t mt-auto">
        <TooltipProvider delayDuration={0}>
          {view === 'grid' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" asChild className="rounded-[4px] p-2 mr-auto"><Link href={`/accounts?id=${account.id}#details`}><Eye className="h-4 w-4" /></Link></Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" asChild variant="add" className="rounded-[4px] p-2"><Link href={`/opportunities/new?accountId=${account.id}`}><PlusCircle className="h-4 w-4" /></Link></Button>
            </TooltipTrigger>
            <TooltipContent>New Opportunity</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="delete" className="rounded-[4px] p-2 ml-2"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the account and all its data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="justify-center">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-[#916D5B] text-white rounded-[4px] border-0 hover:bg-[#a98a77]">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}

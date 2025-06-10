
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, DollarSign, ListChecks, PlusCircle, Eye, MessageSquare, Heart, Lightbulb } from 'lucide-react'; // Added Lightbulb
import type { Account, DailyAccountSummary as AIDailySummary, Opportunity } from '@/types'; // Renamed Project to Opportunity
import { getOpportunitiesByAccount } from '@/lib/data'; // Renamed
import { generateDailyAccountSummary } from '@/ai/flows/daily-account-summary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface AccountCardProps {
  account: Account;
}

export default function AccountCard({ account }: AccountCardProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]); // Renamed
  const [dailySummary, setDailySummary] = useState<AIDailySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    setOpportunities(getOpportunitiesByAccount(account.id)); // Renamed
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
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  useEffect(() => {
    if (account.status === 'Active') {
        fetchDailySummary();
    }
  }, [account.id, account.name, account.status]);


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-headline flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-primary" />
              {account.name}
            </CardTitle>
            <CardDescription>{account.type}</CardDescription>
          </div>
          <Badge variant={account.status === 'Active' ? 'default' : 'secondary'} className="capitalize bg-opacity-70">
            {account.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{account.description}</p>
        
        <div className="text-sm flex items-center">
          <ListChecks className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{opportunities.length} Opportunit{opportunities.length !== 1 ? 'ies' : 'y'}</span> 
        </div>

        {account.status === 'Active' && (
          <div className="pt-2 border-t mt-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center">
              <Lightbulb className="mr-1 h-3 w-3 text-yellow-500" /> AI Daily Summary
            </h4>
            {isLoadingSummary ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size={16} /> 
                <span className="text-xs text-muted-foreground">Generating...</span>
              </div>
            ) : dailySummary ? (
              <>
                <p className="text-xs text-foreground line-clamp-2 mb-1">{dailySummary.summary}</p>
                <div className="flex items-center text-xs">
                  <Heart className="mr-1 h-3 w-3 text-destructive" />
                  <span className="font-medium">Health:</span>&nbsp;
                  <span className="text-muted-foreground">{dailySummary.relationshipHealth}</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No summary available.</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/accounts?id=${account.id}#details`}> 
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
        <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Opportunity
        </Button>
      </CardFooter>
    </Card>
  );
}

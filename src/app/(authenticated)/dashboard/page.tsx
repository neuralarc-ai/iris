"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { generateDailyAccountSummary } from '@/ai/flows/daily-account-summary';
import { mockAccounts } from '@/lib/data';
import type { Account, DailyAccountSummary as AIDailySummary } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Link from 'next/link';

interface DailySummary extends AIDailySummary {
  accountId: string;
  accountName: string;
}

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchSummaries = async () => {
    setIsLoading(true);
    try {
      const activeAccounts = mockAccounts.filter(acc => acc.status === 'Active');
      const summaryPromises = activeAccounts.map(async (account) => {
        // In a real app, recentUpdates and keyMetrics would be fetched from a DB
        const aiSummary = await generateDailyAccountSummary({
          accountId: account.id,
          accountName: account.name,
          recentUpdates: "Recent activities show consistent engagement.", // Placeholder
          keyMetrics: "Key metrics are stable with positive growth in user activity.", // Placeholder
        });
        return { ...aiSummary, accountId: account.id, accountName: account.name };
      });
      const results = await Promise.all(summaryPromises);
      setSummaries(results);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to fetch daily summaries:", error);
      // Potentially show a toast message here
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  return (
    <div className="container mx-auto">
      <PageTitle title="Daily AI Dashboard">
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-sm text-muted-foreground">
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchSummaries} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageTitle>

      {isLoading && summaries.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <Card key={i} className="shadow-md">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 animate-pulse mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full animate-pulse mb-2"></div>
                <div className="h-4 bg-muted rounded w-full animate-pulse mb-2"></div>
                <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
              </CardContent>
              <CardFooter>
                 <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : summaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaries.map((summary) => (
            <Card key={summary.accountId} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-headline">{summary.accountName}</CardTitle>
                <CardDescription>AI Generated Daily Brief</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-foreground mb-3">{summary.summary}</p>
                <div className="mt-auto">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Relationship Health</h4>
                  <Badge 
                    variant={
                      summary.relationshipHealth.toLowerCase().includes('healthy') ? 'default' : 
                      summary.relationshipHealth.toLowerCase().includes('risk') ? 'destructive' : 'secondary'
                    }
                    className="capitalize bg-opacity-70"
                  >
                    {summary.relationshipHealth}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/accounts?id=${summary.accountId}`}>View Account</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
         !isLoading && <p className="text-center text-muted-foreground py-10">No active accounts found or unable to generate summaries.</p>
      )}
    </div>
  );
}

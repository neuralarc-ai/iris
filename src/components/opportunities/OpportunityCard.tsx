
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChartBig, DollarSign, CalendarDays, Eye, AlertTriangle, CheckCircle2, Briefcase, Lightbulb } from 'lucide-react';
import type { Opportunity, OpportunityForecast as AIOpportunityForecast, Account } from '@/types';
import { Progress } from "@/components/ui/progress";
import {format, differenceInDays, parseISO} from 'date-fns';
import { aiPoweredOpportunityForecasting } from '@/ai/flows/ai-powered-opportunity-forecasting';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getAccountById } from '@/lib/data';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const getStatusGrayscale = (status: Opportunity['status']): string => {
  switch (status) {
    case 'Need Analysis': return 'text-gray-400';
    case 'Negotiation': return 'text-gray-500';
    case 'In Progress': return 'text-gray-700';
    case 'On Hold': return 'text-gray-600';
    case 'Completed': return 'text-gray-800';
    case 'Cancelled': return 'text-gray-300';
    default: return 'text-gray-500';
  }
};

const calculateProgress = (startDate: string, endDate: string, status: Opportunity['status']): number => {
  if (status === 'Completed') return 100;
  if (status === 'Cancelled' || status === 'Need Analysis') return 0;

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const today = new Date();

  if (today < start) return 0;
  if (today > end) return 100;

  const totalDuration = differenceInDays(end, start);
  const elapsedDuration = differenceInDays(today, start);

  if (totalDuration <= 0) return 0;

  return Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
};


export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const [forecast, setForecast] = useState<AIOpportunityForecast | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [associatedAccount, setAssociatedAccount] = useState<Account | undefined>(undefined);

  useEffect(() => {
    if (opportunity.accountId) {
      setAssociatedAccount(getAccountById(opportunity.accountId));
    }
  }, [opportunity.accountId]);

  const fetchForecast = async () => {
    setIsLoadingForecast(true);
    try {
      const forecastData = await aiPoweredOpportunityForecasting({
        opportunityName: opportunity.name,
        opportunityDescription: opportunity.description,
        opportunityTimeline: `Start: ${format(parseISO(opportunity.startDate), 'MMM dd, yyyy')}, End: ${format(parseISO(opportunity.endDate), 'MMM dd, yyyy')}`,
        opportunityValue: opportunity.value,
        opportunityStatus: opportunity.status,
        recentUpdates: "Placeholder: Updates show steady progress.",
      });
      setForecast(forecastData);
    } catch (error) {
      console.error(`Failed to fetch forecast for ${opportunity.name}:`, error);
    } finally {
      setIsLoadingForecast(false);
    }
  };

  useEffect(() => {
    // Only fetch if essential opportunity data is present
    if(opportunity.name && opportunity.startDate && opportunity.endDate && opportunity.value && opportunity.status && opportunity.description) {
        fetchForecast();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity.id, opportunity.name, opportunity.startDate, opportunity.endDate, opportunity.value, opportunity.status, opportunity.description]);

  const progress = calculateProgress(opportunity.startDate, opportunity.endDate, opportunity.status);
  const isAtRisk = forecast?.bottleneckIdentification && forecast.bottleneckIdentification !== "No major bottlenecks identified." && forecast.bottleneckIdentification !== "None" && forecast.bottleneckIdentification.toLowerCase() !== "none identified";
  const opportunityHealthIcon = isAtRisk ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />;
  const opportunityHealthText = isAtRisk ? "Potential Risk" : "On Track";

  const accountName = associatedAccount?.name;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-headline flex items-center">
              <BarChartBig className="mr-2 h-5 w-5 text-primary" />
              {opportunity.name}
            </CardTitle>
            <CardDescription className={`${getStatusGrayscale(opportunity.status)} flex items-center`}>
              Status: {opportunity.status}
              {accountName && (
                <>
                  <span className="mx-1">|</span>
                  <Briefcase className="mr-1 h-4 w-4 text-muted-foreground" />
                  For: {accountName}
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            <DollarSign className="mr-1 h-3 w-3" />
            {opportunity.value.toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{opportunity.description}</p>

        <div className="text-sm">
          <div className="flex items-center text-muted-foreground mb-1">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>{format(parseISO(opportunity.startDate), 'MMM dd, yyyy')} - {format(parseISO(opportunity.endDate), 'MMM dd, yyyy')}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Progress: {Math.round(progress)}%</span>
            <div className="flex items-center gap-1">
              {opportunityHealthIcon} {opportunityHealthText}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t mt-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center">
                <Lightbulb className="mr-1 h-3 w-3 text-yellow-500" /> AI Forecast
            </h4>
          {isLoadingForecast ? (
            <div className="flex items-center space-x-2">
                <LoadingSpinner size={16} />
                <span className="text-xs text-muted-foreground">Generating...</span>
            </div>
          ) : forecast ? (
            <>
              <p className="text-xs text-foreground line-clamp-1 mb-0.5">
                <span className="font-medium">Est. Completion:</span> {forecast.completionDateEstimate}
              </p>
              <p className="text-xs text-foreground line-clamp-1">
                 <span className="font-medium">Bottlenecks:</span> {forecast.bottleneckIdentification || "None"}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No forecast available or not applicable.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/opportunities/${opportunity.id}`}> {/* Changed to a detail page link */}
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

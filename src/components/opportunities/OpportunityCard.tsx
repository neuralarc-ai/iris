
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChartBig, DollarSign, CalendarDays, Eye, AlertTriangle, CheckCircle2, Briefcase, Lightbulb, TrendingUp, Users, Clock } from 'lucide-react';
import type { Opportunity, OpportunityForecast as AIOpportunityForecast, Account } from '@/types';
import { Progress } from "@/components/ui/progress";
import {format, differenceInDays, parseISO, formatDistanceToNowStrict} from 'date-fns';
import { aiPoweredOpportunityForecasting } from '@/ai/flows/ai-powered-opportunity-forecasting';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getAccountById } from '@/lib/data';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const getStatusBadgeColorClasses = (status: Opportunity['status']): string => {
  switch (status) {
    case 'Need Analysis': return 'bg-sky-500/20 text-sky-700 border-sky-500/30';
    case 'Negotiation': return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
    case 'In Progress': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    case 'On Hold': return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    case 'Completed': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'Cancelled': return 'bg-red-500/20 text-red-700 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};


const calculateProgress = (startDate: string, endDate: string, status: Opportunity['status']): number => {
  if (status === 'Completed') return 100;
  if (status === 'Cancelled') return 0;
  if (status === 'Need Analysis' && new Date() < parseISO(startDate)) return 0;


  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const today = new Date();

  if (today < start) return 5; // Slight progress if it hasn't started but not cancelled
  if (today >= end && status !== 'Completed') return 95; // Near completion if past end date but not marked complete

  const totalDuration = differenceInDays(end, start);
  const elapsedDuration = differenceInDays(today, start);

  if (totalDuration <= 0) return status === 'In Progress' || status === 'Negotiation' || status === 'On Hold' ? 50 : 0;

  return Math.min(98, Math.max(5, (elapsedDuration / totalDuration) * 100)); // Ensure progress is between 5 and 98 unless completed/cancelled
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
      setForecast({ timelinePrediction: "N/A", completionDateEstimate: "N/A", revenueForecast: opportunity.value, bottleneckIdentification: "Error fetching forecast."});
    } finally {
      setIsLoadingForecast(false);
    }
  };

  useEffect(() => {
    if(opportunity.status !== 'Completed' && opportunity.status !== 'Cancelled' && opportunity.name && opportunity.startDate && opportunity.endDate && opportunity.value && opportunity.status && opportunity.description) {
        fetchForecast();
    } else {
      setForecast(null); // No forecast for completed/cancelled
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity.id, opportunity.name, opportunity.startDate, opportunity.endDate, opportunity.value, opportunity.status, opportunity.description]);

  const progress = calculateProgress(opportunity.startDate, opportunity.endDate, opportunity.status);
  const isAtRisk = forecast?.bottleneckIdentification && forecast.bottleneckIdentification.toLowerCase() !== "none identified" && forecast.bottleneckIdentification.toLowerCase() !== "none" && forecast.bottleneckIdentification !== "Error fetching forecast." && forecast.bottleneckIdentification.length > 0;
  
  let opportunityHealthIcon = <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
  let opportunityHealthText = "On Track";
  if (forecast?.bottleneckIdentification === "Error fetching forecast.") {
    opportunityHealthIcon = <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />;
    opportunityHealthText = "Forecast Error";
  } else if (isAtRisk) {
    opportunityHealthIcon = <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
    opportunityHealthText = "Potential Risk";
  }


  const accountName = associatedAccount?.name;
  const timeRemaining = (status: Opportunity['status']): string => {
    if (status === 'Completed' || status === 'Cancelled') return status;
    const end = parseISO(opportunity.endDate);
    const now = new Date();
    if (now > end) return `Overdue by ${formatDistanceToNowStrict(end, {addSuffix: false})}`;
    return `${formatDistanceToNowStrict(end, {addSuffix: false})} left`;
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-xl font-headline flex items-center text-foreground">
            <BarChartBig className="mr-2 h-5 w-5 text-primary shrink-0" />
            {opportunity.name}
          </CardTitle>
          <Badge variant="secondary" className={`capitalize whitespace-nowrap ml-2 ${getStatusBadgeColorClasses(opportunity.status)}`}>
            {opportunity.status}
          </Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
            {accountName && (
                <span className="flex items-center">
                  <Briefcase className="mr-1.5 h-4 w-4 shrink-0" /> For: {accountName}
                </span>
            )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3.5 text-sm">
        <div className="flex items-center text-foreground">
            <DollarSign className="mr-2 h-4 w-4 text-green-600 shrink-0" />
            <span className="font-medium">Quoted Value:</span>
            <span className="ml-1.5 text-muted-foreground">${opportunity.value.toLocaleString()}</span>
        </div>

        <p className="text-muted-foreground line-clamp-2">{opportunity.description}</p>

        <div>
          <div className="flex items-center text-muted-foreground mb-1">
            <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
            <span>{format(parseISO(opportunity.startDate), 'MMM dd, yyyy')} - {format(parseISO(opportunity.endDate), 'MMM dd, yyyy')}</span>
          </div>
          <Progress value={progress} className="h-2 my-1" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center"><Clock className="mr-1 h-3 w-3 shrink-0"/>{timeRemaining(opportunity.status)}</span>
            <div className="flex items-center gap-1">
              {opportunityHealthIcon} {opportunityHealthText}
            </div>
          </div>
        </div>

        {(forecast || isLoadingForecast) && opportunity.status !== 'Completed' && opportunity.status !== 'Cancelled' && (
            <div className="pt-3 border-t mt-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center">
                    <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-yellow-500" /> AI Forecast
                </h4>
            {isLoadingForecast ? (
                <div className="flex items-center space-x-2 h-12">
                    <LoadingSpinner size={16} />
                    <span className="text-xs text-muted-foreground">Generating forecast...</span>
                </div>
            ) : forecast ? (
                <div className="space-y-1 text-xs">
                <p className="text-foreground line-clamp-1">
                    <span className="font-medium">Est. Completion:</span> {forecast.completionDateEstimate}
                </p>
                <p className="text-foreground line-clamp-2 leading-snug">
                    <span className="font-medium">Bottlenecks:</span> {forecast.bottleneckIdentification || "None identified"}
                </p>
                </div>
            ) : (
                <p className="text-xs text-muted-foreground h-12 flex items-center">No AI forecast data for this opportunity.</p>
            )}
            </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 border-t mt-auto">
        <Button variant="outline" size="sm" asChild className="ml-auto">
          <Link href={`/opportunities/${opportunity.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

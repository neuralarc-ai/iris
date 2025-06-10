
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChartBig, DollarSign, CalendarDays, Eye, AlertTriangle, CheckCircle2, Briefcase, Users, Lightbulb } from 'lucide-react'; // Renamed ListChecks to BarChartBig, Added Lightbulb
import type { Opportunity, OpportunityForecast as AIOpportunityForecast, Account, Lead } from '@/types'; // Renamed
import { Progress } from "@/components/ui/progress";
import {format, differenceInDays, parseISO} from 'date-fns';
import { aiPoweredOpportunityForecasting } from '@/ai/flows/ai-powered-opportunity-forecasting'; // Renamed
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getAccountById, getLeadById } from '@/lib/data';

interface OpportunityCardProps { // Renamed
  opportunity: Opportunity; // Renamed
}

const getStatusGrayscale = (status: Opportunity['status']): string => { // Renamed
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

const calculateProgress = (startDate: string, endDate: string, status: Opportunity['status']): number => { // Renamed
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


export default function OpportunityCard({ opportunity }: OpportunityCardProps) { // Renamed
  const [forecast, setForecast] = useState<AIOpportunityForecast | null>(null); // Renamed
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [associatedEntity, setAssociatedEntity] = useState<Account | Lead | undefined>(undefined);
  const [entityType, setEntityType] = useState<'Account' | 'Lead' | null>(null);

  useEffect(() => {
    if (opportunity.accountId) { // Renamed
      setAssociatedEntity(getAccountById(opportunity.accountId)); // Renamed
      setEntityType('Account');
    } else if (opportunity.leadId) { // Renamed
      setAssociatedEntity(getLeadById(opportunity.leadId)); // Renamed
      setEntityType('Lead');
    }
  }, [opportunity.accountId, opportunity.leadId]); // Renamed
  
  const fetchForecast = async () => {
    setIsLoadingForecast(true);
    try {
      const forecastData = await aiPoweredOpportunityForecasting({ // Renamed
        opportunityName: opportunity.name, // Renamed
        opportunityDescription: opportunity.description, // Renamed
        opportunityTimeline: `Start: ${format(parseISO(opportunity.startDate), 'MMM dd, yyyy')}, End: ${format(parseISO(opportunity.endDate), 'MMM dd, yyyy')}`, // Renamed
        opportunityValue: opportunity.value, // Renamed
        opportunityStatus: opportunity.status, // Renamed
        recentUpdates: "Placeholder: Updates show steady progress.",
      });
      setForecast(forecastData);
    } catch (error) {
      console.error(`Failed to fetch forecast for ${opportunity.name}:`, error); // Renamed
    } finally {
      setIsLoadingForecast(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [opportunity.id, opportunity.name, opportunity.startDate, opportunity.endDate, opportunity.value, opportunity.status, opportunity.description]); // Renamed

  const progress = calculateProgress(opportunity.startDate, opportunity.endDate, opportunity.status); // Renamed
  const isAtRisk = forecast?.bottleneckIdentification && forecast.bottleneckIdentification !== "No major bottlenecks identified." && forecast.bottleneckIdentification !== "None";
  const opportunityHealthIcon = isAtRisk ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />; // Renamed
  const opportunityHealthText = isAtRisk ? "Potential Risk" : "On Track"; // Renamed

  const entityName = entityType === 'Account' ? (associatedEntity as Account)?.name : (associatedEntity as Lead)?.companyName;
  const EntityIcon = entityType === 'Account' ? Briefcase : Users;


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-headline flex items-center">
              <BarChartBig className="mr-2 h-5 w-5 text-primary" /> {/* Renamed Icon */}
              {opportunity.name} {/* Renamed */}
            </CardTitle>
            <CardDescription className={`${getStatusGrayscale(opportunity.status)} flex items-center`}> {/* Renamed */}
              Status: {opportunity.status} {/* Renamed */}
              {entityName && (
                <>
                  <span className="mx-1">|</span> 
                  <EntityIcon className="mr-1 h-4 w-4 text-muted-foreground" /> 
                  For: {entityName}
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
            <DollarSign className="mr-1 h-3 w-3" />
            {opportunity.value.toLocaleString()} {/* Renamed */}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{opportunity.description}</p> {/* Renamed */}
        
        <div className="text-sm">
          <div className="flex items-center text-muted-foreground mb-1">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>{format(parseISO(opportunity.startDate), 'MMM dd, yyyy')} - {format(parseISO(opportunity.endDate), 'MMM dd, yyyy')}</span> {/* Renamed */}
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Progress: {Math.round(progress)}%</span>
            <div className="flex items-center gap-1">
              {opportunityHealthIcon} {opportunityHealthText} {/* Renamed */}
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
            <p className="text-xs text-muted-foreground">No forecast available.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/opportunities?id=${opportunity.id}#details`}>  {/* Renamed */}
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

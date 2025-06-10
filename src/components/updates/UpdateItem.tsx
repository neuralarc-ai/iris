
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Eye, Lightbulb, CheckSquare, Repeat, MessageSquare, Users, Mail, BarChartBig } from 'lucide-react'; // Added BarChartBig
import type { Update, UpdateInsights as AIUpdateInsights, Opportunity } from '@/types'; // Renamed Project to Opportunity
import {format, parseISO} from 'date-fns';
import { generateInsights } from '@/ai/flows/intelligent-insights';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { mockOpportunities, getOpportunityById } from '@/lib/data'; // Renamed mockProjects, added getOpportunityById
import Link from 'next/link';


interface UpdateItemProps {
  update: Update;
}

const getUpdateTypeIcon = (type: Update['type']) => {
  switch (type) {
    case 'Call': return <MessageSquare className="h-4 w-4 text-primary" />; 
    case 'Meeting': return <Users className="h-4 w-4 text-primary" />;
    case 'Email': return <Mail className="h-4 w-4 text-primary" />;
    default: return <MessageSquare className="h-4 w-4 text-primary" />; 
  }
};


export default function UpdateItem({ update }: UpdateItemProps) {
  const [insights, setInsights] = useState<Partial<AIUpdateInsights> | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [opportunity, setOpportunity] = useState<Opportunity | undefined>(undefined); // Renamed project to opportunity

  useEffect(() => {
    setOpportunity(getOpportunityById(update.opportunityId)); // Renamed project to opportunity, used getOpportunityById
  }, [update.opportunityId]); // Renamed

  const fetchInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const aiData = await generateInsights({ communicationHistory: update.content });
      setInsights({
        summary: aiData.updateSummary?.summary,
        actionItems: aiData.updateSummary?.actionItems?.split('\n').filter(Boolean),
        followUpSuggestions: aiData.updateSummary?.followUpSuggestions?.split('\n').filter(Boolean),
        sentiment: aiData.communicationAnalysis?.sentimentAnalysis,
      });
    } catch (error) {
      console.error(`Failed to fetch insights for update ${update.id}:`, error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (update.content && update.content.length > 10) { 
        fetchInsights();
    } else {
        setInsights(null); 
    }
  }, [update.id, update.content]);
  
  const UpdateIcon = getUpdateTypeIcon(update.type);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-headline flex items-center">
            {UpdateIcon}
            <span className="ml-2">Update: {format(parseISO(update.date), 'MMM dd, yyyy')}</span>
          </CardTitle>
          <Badge variant="secondary" className="capitalize bg-opacity-70">{update.type}</Badge>
        </div>
        {opportunity && ( // Renamed
          <CardDescription className="flex items-center">
            <BarChartBig className="mr-1 h-4 w-4 text-muted-foreground" /> {/* Added Icon */}
            Opportunity: {opportunity.name} {/* Renamed */}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground line-clamp-3">{update.content}</p>
        
        {isLoadingInsights ? (
          <div className="flex items-center space-x-2 pt-2 border-t mt-3">
            <LoadingSpinner size={16} />
            <span className="text-xs text-muted-foreground">Analyzing update...</span>
          </div>
        ) : insights && (insights.summary || (insights.actionItems && insights.actionItems.length > 0) || (insights.followUpSuggestions && insights.followUpSuggestions.length > 0)) ? (
          <div className="pt-3 border-t mt-3 space-y-2 text-xs">
            <div className="flex items-center text-muted-foreground">
              <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
              <h4 className="font-semibold uppercase">AI Insights</h4>
            </div>
            {insights.summary && (
              <div>
                <strong className="text-foreground">Summary:</strong>
                <p className="text-muted-foreground ml-1 line-clamp-2">{insights.summary}</p>
              </div>
            )}
            {insights.actionItems && insights.actionItems.length > 0 && (
              <div>
                <strong className="text-foreground flex items-center"><CheckSquare className="mr-1 h-3 w-3" />Action Items:</strong>
                <ul className="list-disc list-inside ml-1">
                  {insights.actionItems.slice(0,2).map((item, idx) => <li key={idx} className="text-muted-foreground line-clamp-1">{item}</li>)}
                  {insights.actionItems.length > 2 && <li className="text-muted-foreground">...and more</li>}
                </ul>
              </div>
            )}
            {insights.followUpSuggestions && insights.followUpSuggestions.length > 0 && (
               <div>
                <strong className="text-foreground flex items-center"><Repeat className="mr-1 h-3 w-3" />Follow-up:</strong>
                 <p className="text-muted-foreground ml-1 line-clamp-1">{insights.followUpSuggestions[0]}</p>
               </div>
            )}
            {insights.sentiment && (
              <div>
                <strong className="text-foreground">Sentiment:</strong>
                <span className="text-muted-foreground ml-1">{insights.sentiment}</span>
              </div>
            )}
          </div>
        ) : (
          !isLoadingInsights && update.content && update.content.length > 10 && 
          <p className="text-xs text-muted-foreground pt-2 border-t mt-3">No specific AI insights generated for this update.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/updates?id=${update.id}#details`}> 
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

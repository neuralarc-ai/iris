
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Eye, Lightbulb, CheckSquare, Repeat, MessageSquare, Users, Mail, BarChartBig, Brain, Activity, ThumbsUp, ThumbsDown, MessageCircleMore, Briefcase } from 'lucide-react';
import type { Update, UpdateInsights as AIUpdateInsights, Opportunity } from '@/types';
import {format, parseISO} from 'date-fns';
import { generateInsights, RelationshipHealthOutput } from '@/ai/flows/intelligent-insights'; // Import RelationshipHealthOutput
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getOpportunityById } from '@/lib/data';
import Link from 'next/link';


interface UpdateItemProps {
  update: Update;
}

const getUpdateTypeIcon = (type: Update['type']) => {
  switch (type) {
    case 'Call': return <MessageCircleMore className="h-5 w-5 text-primary shrink-0" />; 
    case 'Meeting': return <Users className="h-5 w-5 text-primary shrink-0" />;
    case 'Email': return <Mail className="h-5 w-5 text-primary shrink-0" />;
    default: return <MessageSquare className="h-5 w-5 text-primary shrink-0" />; 
  }
};

const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return <Activity className="h-3.5 w-3.5"/>;
    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes("positive")) return <ThumbsUp className="h-3.5 w-3.5 text-green-500"/>;
    if (lowerSentiment.includes("negative")) return <ThumbsDown className="h-3.5 w-3.5 text-red-500"/>;
    if (lowerSentiment.includes("neutral")) return <Activity className="h-3.5 w-3.5 text-yellow-500"/>;
    return <Activity className="h-3.5 w-3.5"/>;
}


export default function UpdateItem({ update }: UpdateItemProps) {
  const [insights, setInsights] = useState<Partial<AIUpdateInsights> & { relationshipHealth?: RelationshipHealthOutput | null } | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [opportunity, setOpportunity] = useState<Opportunity | undefined>(undefined);

  useEffect(() => {
    setOpportunity(getOpportunityById(update.opportunityId));
  }, [update.opportunityId]);

  const fetchInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const aiData = await generateInsights({ communicationHistory: update.content });
      setInsights({
        summary: aiData.updateSummary?.summary,
        actionItems: aiData.updateSummary?.actionItems?.split('\n').filter(s => s.trim().length > 0 && !s.trim().startsWith('-')).map(s => s.replace(/^- /, '')),
        followUpSuggestions: aiData.updateSummary?.followUpSuggestions?.split('\n').filter(s => s.trim().length > 0 && !s.trim().startsWith('-')).map(s => s.replace(/^- /, '')),
        sentiment: aiData.communicationAnalysis?.sentimentAnalysis,
        relationshipHealth: aiData.relationshipHealth,
      });
    } catch (error) {
      console.error(`Failed to fetch insights for update ${update.id}:`, error);
      setInsights({ summary: "Could not load AI insights.", sentiment: "Unknown" });
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (update.content && update.content.length > 20) { // Only fetch for substantial content
        fetchInsights();
    } else {
        setInsights(null); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update.id, update.content]);
  
  const UpdateIcon = getUpdateTypeIcon(update.type);
  const SentimentIcon = getSentimentIcon(insights?.sentiment);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-xl font-headline flex items-center text-foreground">
            {UpdateIcon}
            <span className="ml-2.5">Update: {format(parseISO(update.date), 'MMM dd, yyyy')}</span>
          </CardTitle>
          <Badge variant="secondary" className="capitalize whitespace-nowrap ml-2 bg-accent text-accent-foreground">
            {update.type}
          </Badge>
        </div>
        {opportunity && (
          <CardDescription className="text-sm text-muted-foreground flex items-center">
            <Briefcase className="mr-2 h-4 w-4 shrink-0" /> {/* Changed to Briefcase for opportunity association */}
            Opportunity: {opportunity.name}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3.5 text-sm">
        <p className="text-foreground leading-relaxed line-clamp-4">{update.content}</p>
        
        {(isLoadingInsights || insights) && (
          <div className="pt-3.5 border-t mt-3.5 space-y-2">
            <div className="flex items-center text-muted-foreground">
              <Brain className="mr-2 h-4 w-4 text-primary" /> {/* Changed Icon */}
              <h4 className="font-semibold uppercase text-xs">AI-Powered Insights</h4>
            </div>
            {isLoadingInsights ? (
              <div className="flex items-center space-x-2 h-16">
                <LoadingSpinner size={16} />
                <span className="text-xs text-muted-foreground">Analyzing update details...</span>
              </div>
            ) : insights ? (
              <div className="space-y-2 text-xs">
                {insights.summary && (
                  <div>
                    <strong className="text-foreground">Summary:</strong>
                    <p className="text-muted-foreground ml-1 line-clamp-2 leading-snug">{insights.summary}</p>
                  </div>
                )}
                {insights.actionItems && insights.actionItems.length > 0 && (
                  <div>
                    <strong className="text-foreground flex items-center"><CheckSquare className="mr-1.5 h-3.5 w-3.5 shrink-0" />Action Items:</strong>
                    <ul className="list-disc list-inside ml-2 space-y-0.5">
                      {insights.actionItems.slice(0,2).map((item, idx) => <li key={idx} className="text-muted-foreground line-clamp-1">{item}</li>)}
                      {insights.actionItems.length > 2 && <li className="text-muted-foreground text-xs">...and more</li>}
                    </ul>
                  </div>
                )}
                {insights.followUpSuggestions && insights.followUpSuggestions.length > 0 && (
                   <div>
                    <strong className="text-foreground flex items-center"><Repeat className="mr-1.5 h-3.5 w-3.5 shrink-0" />Follow-up:</strong>
                     <p className="text-muted-foreground ml-1 line-clamp-1">{insights.followUpSuggestions[0]}</p>
                   </div>
                )}
                <div className="flex items-center">
                  <strong className="text-foreground flex items-center">{SentimentIcon}<span className="ml-1">Sentiment:</span></strong>
                  <span className="text-muted-foreground ml-1.5">{insights.sentiment || "Not analyzed"}</span>
                </div>
                 {insights.relationshipHealth && (
                    <div>
                        <strong className="text-foreground">Relationship Health:</strong>
                        <p className="text-muted-foreground ml-1 line-clamp-2 leading-snug">{insights.relationshipHealth.summary} (Score: {insights.relationshipHealth.healthScore.toFixed(2)})</p>
                    </div>
                 )}
              </div>
            ) : (
                <p className="text-xs text-muted-foreground h-16 flex items-center">No specific AI insights for this update.</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 border-t mt-auto">
        <Button variant="outline" size="sm" asChild className="ml-auto">
          <Link href={`/updates?id=${update.id}#details`}> 
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

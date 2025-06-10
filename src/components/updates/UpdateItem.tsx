"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Eye, Lightbulb, Tag, CheckSquare, Repeat, MessageCircle } from 'lucide-react';
import type { Update, UpdateInsights as AIUpdateInsights, Project } from '@/types';
import {format, parseISO} from 'date-fns';
import { generateInsights } from '@/ai/flows/intelligent-insights'; // Assuming this provides update specific insights
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { mockProjects } from '@/lib/data'; // To get project name

interface UpdateItemProps {
  update: Update;
}

const getUpdateTypeIcon = (type: Update['type']) => {
  switch (type) {
    case 'Call': return <MessageCircle className="h-4 w-4 text-primary" />;
    case 'Meeting': return <Users className="h-4 w-4 text-primary" />; // Users not in lucide, use placeholder
    case 'Email': return <Mail className="h-4 w-4 text-primary" />; // Mail not in lucide, use placeholder
    default: return <MessageSquare className="h-4 w-4 text-primary" />;
  }
};
// Placeholder for missing icons
const Users = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const Mail = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;


export default function UpdateItem({ update }: UpdateItemProps) {
  const [insights, setInsights] = useState<Partial<AIUpdateInsights> | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [project, setProject] = useState<Project | undefined>(undefined);

  useEffect(() => {
    setProject(mockProjects.find(p => p.id === update.projectId));
  }, [update.projectId]);

  const fetchInsights = async () => {
    setIsLoadingInsights(true);
    try {
      // generateInsights flow from intelligent-insights.ts expects 'communicationHistory'
      // We'll pass the update content as communicationHistory for summarization/action items.
      const aiData = await generateInsights({ communicationHistory: update.content });
      // The generateInsights flow returns a complex object. We need updateSummary part.
      setInsights({
        summary: aiData.updateSummary?.summary,
        actionItems: aiData.updateSummary?.actionItems?.split('\n').filter(Boolean), // Assuming action items are newline separated
        followUpSuggestions: aiData.updateSummary?.followUpSuggestions?.split('\n').filter(Boolean),
        sentiment: aiData.communicationAnalysis?.sentimentAnalysis, // Example of using another part
      });
    } catch (error) {
      console.error(`Failed to fetch insights for update ${update.id}:`, error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchInsights();
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
          <Badge variant="secondary" className="capitalize bg-gray-200 text-gray-700">{update.type}</Badge>
        </div>
        {project && <CardDescription>Project: {project.name}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground line-clamp-3">{update.content}</p>
        
        {isLoadingInsights ? (
          <div className="flex items-center space-x-2 pt-2 border-t mt-3">
            <LoadingSpinner size={16} />
            <span className="text-xs text-muted-foreground">Analyzing update...</span>
          </div>
        ) : insights && (insights.summary || insights.actionItems?.length || insights.followUpSuggestions?.length) ? (
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
          <p className="text-xs text-muted-foreground pt-2 border-t mt-3">No AI insights generated for this update.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/updates?id=${update.id}#details`}> {/* Simplified link */}
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, AlertTriangle, Lightbulb, BarChartHorizontalBig, CalendarClock, DollarSign, AlertCircle, CheckCircle, History } from 'lucide-react';
import { aiPoweredOpportunityForecasting } from '@/ai/flows/ai-powered-opportunity-forecasting';
import { mockOpportunities, mockLeads, getRecentUpdates } from '@/lib/data';
import type { Opportunity, OpportunityForecast, Lead, OpportunityStatus, Update } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import UpdateItem from '@/components/updates/UpdateItem';

interface OpportunityWithForecast extends Opportunity {
  forecast?: OpportunityForecast;
}

const getStatusBadgeVariant = (status: OpportunityStatus | undefined): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Need Analysis': return 'outline';
    case 'Negotiation': return 'secondary';
    case 'In Progress': return 'default';
    case 'Completed': return 'default';
    case 'On Hold': return 'secondary';
    case 'Cancelled': return 'destructive';
    default: return 'secondary';
  }
};


export default function DashboardPage() {
  const [forecastedOpportunities, setForecastedOpportunities] = useState<OpportunityWithForecast[]>([]);
  const [overallSalesForecast, setOverallSalesForecast] = useState<string | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const activeOpportunities = mockOpportunities.filter(
        opp => opp.status !== 'Completed' && opp.status !== 'Cancelled'
      ).slice(0, 2); 

      const forecastPromises = activeOpportunities.map(async (opp) => {
        try {
          const forecast = await aiPoweredOpportunityForecasting({
            opportunityName: opp.name,
            opportunityDescription: opp.description,
            opportunityTimeline: `Start: ${format(parseISO(opp.startDate), 'MMM dd, yyyy')}, End: ${format(parseISO(opp.endDate), 'MMM dd, yyyy')}`,
            opportunityValue: opp.value,
            opportunityStatus: opp.status,
            recentUpdates: "Recent updates indicate steady progress and positive client feedback.",
          });
          return { ...opp, forecast };
        } catch (e) {
          console.error(`Failed to get forecast for ${opp.name}`, e);
          return { ...opp, forecast: undefined };
        }
      });

      const results = await Promise.all(forecastPromises);
      setForecastedOpportunities(results);

      if (results.length > 0) {
        setOverallSalesForecast(`Optimistic outlook for next quarter with strong potential from key deals like ${results[0]?.name}. Predicted revenue growth is positive, with several opportunities nearing completion.`);
      } else {
        setOverallSalesForecast("No active opportunities to forecast. Add new opportunities to see AI-powered sales predictions.");
      }
      
      setRecentUpdates(getRecentUpdates(2)); 
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setOverallSalesForecast("Error fetching sales forecast data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const opportunityStatusData = useMemo(() => {
    const counts: Record<OpportunityStatus, number> = {
      "Need Analysis": 0, "Negotiation": 0, "In Progress": 0,
      "On Hold": 0, "Completed": 0, "Cancelled": 0,
    };
    mockOpportunities.forEach(opp => { counts[opp.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, count: value })).filter(item => item.count > 0);
  }, []);

  return (
    <div className="container mx-auto space-y-8"> 
      <PageTitle title="Intelligent Sales Dashboard">
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-sm text-muted-foreground">
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageTitle>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <TrendingUp className="mr-3 h-6 w-6 text-primary" />
            AI Sales Forecast Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !overallSalesForecast ? (
            <div className="h-10 bg-muted/50 rounded animate-pulse w-3/4"></div>
          ) : (
            <p className="text-foreground text-base leading-relaxed">{overallSalesForecast || "No forecast available."}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold flex items-center text-foreground mb-4">
                <History className="mr-3 h-6 w-6 text-blue-500" />
                Recent Activity Stream
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                {isLoading && recentUpdates.length === 0 ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <Card key={`update-skeleton-${i}`} className="shadow-md animate-pulse h-full">
                            <CardHeader><div className="h-5 bg-muted/50 rounded w-1/2"></div></CardHeader>
                            <CardContent className="space-y-2">
                                <div className="h-4 bg-muted/50 rounded w-full"></div>
                                <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                            </CardContent>
                        </Card>
                    ))
                ) : recentUpdates.length > 0 ? (
                    recentUpdates.map(update => (
                        <UpdateItem key={update.id} update={update} />
                    ))
                ) : (
                    !isLoading && <p className="text-muted-foreground text-center py-4 md:col-span-2">No recent updates found.</p>
                )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold flex items-center text-foreground mb-4 mt-8">
                <Lightbulb className="mr-3 h-6 w-6 text-yellow-500" />
                Key Opportunity Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                {isLoading && forecastedOpportunities.length === 0 ? (
                Array.from({ length: 2 }).map((_, i) => ( 
                    <Card key={i} className="shadow-md animate-pulse h-full">
                    <CardHeader>
                        <div className="h-6 bg-muted/50 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-muted/50 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="h-4 bg-muted/50 rounded w-full"></div>
                        <div className="h-4 bg-muted/50 rounded w-5/6"></div>
                        <div className="h-4 bg-muted/50 rounded w-full mt-2"></div>
                    </CardContent>
                    </Card>
                ))
                ) : forecastedOpportunities.length > 0 ? (
                forecastedOpportunities.map((opp) => (
                    <Card key={opp.id} className="shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{opp.name}</CardTitle>
                        <Badge variant={getStatusBadgeVariant(opp.status)} className={`${opp.status === 'Completed' ? 'bg-green-500 text-white' : ''} ${getStatusBadgeVariant(opp.status) === 'default' && opp.status !== 'Completed' ? 'bg-blue-500 text-white' : ''}`}>
                            {opp.status}
                        </Badge>
                        </div>
                        <CardDescription className="flex items-center text-sm pt-1">
                        <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" /> Value: ${opp.value.toLocaleString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm flex-grow">
                        {opp.forecast ? (
                        <>
                            <div className="flex items-center">
                            <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">Est. Completion:</span>
                            <span className="ml-1 text-muted-foreground">{opp.forecast.completionDateEstimate}</span>
                            </div>
                            <div className="flex items-center">
                            <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">Revenue Forecast:</span>
                            <span className="ml-1 text-muted-foreground">${opp.forecast.revenueForecast.toLocaleString()}</span>
                            </div>
                            <div className="flex items-start">
                            {opp.forecast.bottleneckIdentification && opp.forecast.bottleneckIdentification.toLowerCase() !== "none identified" && opp.forecast.bottleneckIdentification.toLowerCase() !== "none" && opp.forecast.bottleneckIdentification.length > 0 && !opp.forecast.bottleneckIdentification.startsWith("Error") && !opp.forecast.bottleneckIdentification.startsWith("AI could not generate") && !opp.forecast.bottleneckIdentification.startsWith("Rate limit") ? <AlertCircle className="mr-2 h-4 w-4 text-destructive mt-0.5 shrink-0" /> : <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5 shrink-0" />}
                            <div>
                                <span className="font-medium text-foreground">Potential Bottlenecks:</span>
                                <p className="ml-1 text-muted-foreground leading-snug">{opp.forecast.bottleneckIdentification || "None identified"}</p>
                            </div>
                            </div>
                        </>
                        ) : (
                        <p className="text-muted-foreground">AI forecast not available.</p>
                        )}
                    </CardContent>
                    <CardFooter className="pt-4 border-t mt-auto">
                        <Button variant="outline" size="sm" asChild className="ml-auto">
                        <Link href={`/opportunities/${opp.id}`}>View Opportunity</Link>
                        </Button>
                    </CardFooter>
                    </Card>
                ))
                ) : (
                !isLoading && <p className="text-muted-foreground md:col-span-2 text-center py-4">No active opportunities with forecasts to display.</p>
                )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6 flex flex-col">
           <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col bg-green-50 dark:bg-green-900/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BarChartHorizontalBig className="mr-3 h-5 w-5 text-primary" />
                Opportunities Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              {isLoading && opportunityStatusData.length === 0 ? (
                <div className="h-64 bg-muted/50 rounded animate-pulse"></div>
              ) : opportunityStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={opportunityStatusData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} interval={0}/>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        itemStyle={{ color: "hsl(var(--primary))" }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}/>
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                 !isLoading && <p className="text-muted-foreground">No opportunity data for chart.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col bg-amber-50 dark:bg-amber-900/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="mr-3 h-5 w-5 text-primary" />
                Lead Engagement (Simulated)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow">
              <p className="text-sm text-muted-foreground">
                This section would display real-time insights from lead activities. Direct social media tracking is a complex integration.
              </p>
              <ul className="space-y-2 text-xs">
                {mockLeads.slice(0,2).map(lead => (
                  <li key={lead.id} className="border-l-2 border-primary pl-3 py-1 bg-secondary/30 rounded-r-md">
                    <span className="font-semibold text-foreground">{lead.personName}</span> <span className="text-muted-foreground">({lead.companyName})</span>: Recent mock activity shows interest in AI solutions.
                  </li>
                ))}
              </ul>
            </CardContent>
             <CardFooter className="pt-4 mt-auto">
                <Button variant="outline" size="sm" asChild className="ml-auto">
                    <Link href="/leads">View All Leads</Link>
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}


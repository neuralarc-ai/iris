
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, AlertTriangle, Lightbulb, BarChartHorizontalBig } from 'lucide-react';
import { aiPoweredOpportunityForecasting } from '@/ai/flows/ai-powered-opportunity-forecasting';
import { mockOpportunities, mockLeads } from '@/lib/data';
import type { Opportunity, OpportunityForecast, Lead, OpportunityStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface OpportunityWithForecast extends Opportunity {
  forecast?: OpportunityForecast;
  accountName?: string; // Assuming we might want to show account name later
}

const getStatusBadgeVariant = (status: OpportunityStatus | undefined): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Need Analysis': return 'outline';
    case 'Negotiation': return 'secondary';
    case 'In Progress': return 'default';
    case 'Completed': return 'default'; // Success style for completed
    case 'On Hold': return 'secondary';
    case 'Cancelled': return 'destructive';
    default: return 'secondary';
  }
};


export default function DashboardPage() {
  const [forecastedOpportunities, setForecastedOpportunities] = useState<OpportunityWithForecast[]>([]);
  const [overallSalesForecast, setOverallSalesForecast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch forecasts for active opportunities (e.g., not 'Completed' or 'Cancelled')
      const activeOpportunities = mockOpportunities.filter(
        opp => opp.status !== 'Completed' && opp.status !== 'Cancelled'
      ).slice(0, 5); // Limit for demo purposes

      const forecastPromises = activeOpportunities.map(async (opp) => {
        try {
          const forecast = await aiPoweredOpportunityForecasting({
            opportunityName: opp.name,
            opportunityDescription: opp.description,
            opportunityTimeline: `Start: ${format(parseISO(opp.startDate), 'MMM dd, yyyy')}, End: ${format(parseISO(opp.endDate), 'MMM dd, yyyy')}`,
            opportunityValue: opp.value,
            opportunityStatus: opp.status,
            recentUpdates: "Recent updates indicate steady progress and positive client feedback.", // Placeholder
          });
          return { ...opp, forecast };
        } catch (e) {
          console.error(`Failed to get forecast for ${opp.name}`, e);
          return { ...opp, forecast: undefined }; // Handle individual forecast failure
        }
      });

      const results = await Promise.all(forecastPromises);
      setForecastedOpportunities(results);

      // Generate an overall sales forecast summary (simplified AI call for demo)
      if (results.length > 0) {
        // In a real app, this would be a more sophisticated prompt considering all forecasts
        const forecastSummaryPrompt = `Based on the following opportunities and their forecasts, provide a brief (1-2 sentences) optimistic sales outlook for the next quarter: ${results.map(r => `${r.name} (Value: ${r.value}, Est. Completion: ${r.forecast?.completionDateEstimate || 'N/A'})`).join(', ')}`;
        // This is a mock AI call for brevity. Replace with actual Genkit flow if needed.
        setOverallSalesForecast(`Optimistic outlook for next quarter with strong potential from key deals like ${results[0]?.name}. Predicted revenue growth is positive, with several opportunities nearing completion.`);
      } else {
        setOverallSalesForecast("No active opportunities to forecast. Add new opportunities to see AI-powered sales predictions.");
      }

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
      "Need Analysis": 0,
      "Negotiation": 0,
      "In Progress": 0,
      "On Hold": 0,
      "Completed": 0,
      "Cancelled": 0,
    };
    mockOpportunities.forEach(opp => {
      counts[opp.status]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, count: value })).filter(item => item.count > 0);
  }, [mockOpportunities]); // Recompute only if mockOpportunities change

  return (
    <div className="container mx-auto">
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

      {/* Overall AI Sales Forecast */}
      <Card className="mb-6 shadow-lg bg-gradient-to-r from-primary/5 via-background to-background">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            AI Sales Forecast Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !overallSalesForecast ? (
            <div className="h-10 bg-muted rounded animate-pulse w-3/4"></div>
          ) : (
            <p className="text-foreground text-base">{overallSalesForecast || "No forecast available."}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Key Opportunity Forecasts Section */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-headline font-semibold flex items-center">
            <Lightbulb className="mr-2 h-6 w-6 text-yellow-500" />
            Key Opportunity Insights
          </h2>
          {isLoading && forecastedOpportunities.length === 0 ? (
            [1,2].map(i => (
              <Card key={i} className="shadow-md animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 "></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </CardContent>
              </Card>
            ))
          ) : forecastedOpportunities.length > 0 ? (
            forecastedOpportunities.map((opp) => (
              <Card key={opp.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-headline">{opp.name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(opp.status)} className={`${opp.status === 'Completed' ? 'bg-green-500 text-white' : ''}`}>
                        {opp.status}
                    </Badge>
                  </div>
                  <CardDescription>Value: ${opp.value.toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  {opp.forecast ? (
                    <>
                      <p className="text-sm mb-1"><span className="font-semibold">Est. Completion:</span> {opp.forecast.completionDateEstimate}</p>
                      <p className="text-sm mb-1"><span className="font-semibold">Revenue Forecast:</span> ${opp.forecast.revenueForecast.toLocaleString()}</p>
                      <p className="text-sm"><span className="font-semibold">Potential Bottlenecks:</span> {opp.forecast.bottleneckIdentification || "None identified"}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">AI forecast not available for this opportunity.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/opportunities/${opp.id}`}>View Opportunity</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            !isLoading && <p className="text-muted-foreground">No active opportunities with forecasts to display.</p>
          )}
        </div>

        {/* Sales Pipeline Chart Section */}
        <div className="lg:col-span-1">
           <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center">
                <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" />
                Opportunities Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && opportunityStatusData.length === 0 ? (
                <div className="h-64 bg-muted rounded animate-pulse"></div>
              ) : opportunityStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={opportunityStatusData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} interval={0}/>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                 !isLoading && <p className="text-muted-foreground">No opportunity data for chart.</p>
              )}
            </CardContent>
          </Card>

          {/* Lead Activity Highlights Placeholder */}
          <Card className="shadow-md mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Lead Engagement (Simulated)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section would display real-time insights from lead activities (e.g., LinkedIn updates, company news).
                Currently, direct social media tracking is a complex integration.
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {mockLeads.slice(0,2).map(lead => (
                  <li key={lead.id} className="border-l-2 border-primary pl-2">
                    <span className="font-semibold">{lead.personName}</span> ({lead.companyName}): Recent mock activity shows interest in AI solutions.
                  </li>
                ))}
              </ul>
            </CardContent>
             <CardFooter>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/leads">View All Leads</Link>
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

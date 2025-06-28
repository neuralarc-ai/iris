"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, Lightbulb, BarChartHorizontalBig, History } from 'lucide-react';
import { aiPoweredOpportunityForecasting } from '@/ai/flows/ai-powered-opportunity-forecasting';
import { mockOpportunities, mockLeads, getRecentUpdates } from '@/lib/data';
import type { Opportunity, OpportunityForecast, Update } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import UpdateItem from '@/components/updates/UpdateItem';
import OpportunityCard from '@/components/opportunities/OpportunityCard';

interface OpportunityWithForecast extends Opportunity {
  forecast?: OpportunityForecast;
}

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
        opp => opp.status !== 'Win' && opp.status !== 'Loss'
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
    const counts: Record<string, number> = {
      "Scope Of Work": 0, "Proposal": 0, "Negotiation": 0,
      "On Hold": 0, "Win": 0, "Loss": 0,
    };
    mockOpportunities.forEach(opp => { 
      counts[opp.status] = (counts[opp.status] || 0) + 1; 
    });
    return Object.entries(counts).map(([name, value]) => ({ name, count: value })).filter(item => item.count > 0);
  }, []);

  return (
    <div className="max-w-[1440px] px-4 mx-auto w-full space-y-10 md:space-y-12"> 
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

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-40 relative overflow-hidden">
        <img src="/images/ai-forecast.png" alt="AI Forecast" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative z-10 flex items-center h-full pl-8">
          <span className="text-3xl font-bold text-white tracking-wide drop-shadow-lg">AI Features Coming Soon !</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Opportunities Pipeline + Lead Engagement */}
        <div className="md:col-span-1 space-y-8 flex flex-col sticky top-6 h-fit">
           <Card className="border border-[#CBCAC5] bg-white rounded-lg shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-[#282828]">
                <BarChartHorizontalBig className="mr-3 h-5 w-5 text-[#916D5B]" />
                Opportunities Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              {isLoading && opportunityStatusData.length === 0 ? (
                <div className="h-64 bg-[#CBCAC5]/50 rounded animate-pulse"></div>
              ) : opportunityStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={opportunityStatusData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBCAC5" />
                    <XAxis type="number" stroke="#55504C" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#55504C" fontSize={12} width={100} interval={0}/>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#EFEDE7",
                            borderColor: "#CBCAC5",
                            borderRadius: 8,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
                        }}
                        labelStyle={{ color: "#282828" }}
                        itemStyle={{ color: "#916D5B" }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px", color: '#55504C'}}/>
                    <Bar dataKey="count" fill="#916D5B" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                 !isLoading && <p className="text-muted-foreground">No opportunity data for chart.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-[#CBCAC5] bg-white rounded-sm shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-[#282828]">
                <Users className="mr-3 h-5 w-5 text-[#916D5B]" />
                Lead Engagement (Simulated)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow">
              <p className="text-sm text-muted-foreground">
                This section would display real-time insights from lead activities. Direct social media tracking is a complex integration.
              </p>
              <ul className="space-y-2 text-xs">
                {mockLeads.slice(0,2).map(lead => (
                  <li key={lead.id} className="border-l-2 border-[#916D5B] pl-3 py-1 bg-[#CFB496]/20 rounded-r-md">
                    <span className="font-semibold text-[#282828]">{lead.personName}</span> <span className="text-muted-foreground">({lead.companyName})</span>: Recent mock activity shows interest in AI solutions.
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

        {/* RIGHT COLUMN: Recent Activity Stream + Key Opportunity Insights */}
        <div className="md:col-span-2">
          <div className="bg-transparent py-4 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center text-foreground mb-4">
                  <History className="mr-3 h-6 w-6 text-[#916D5B]" />
                  Recent Activity Stream
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                  {isLoading && recentUpdates.length === 0 ? (
                      Array.from({ length: 2 }).map((_, i) => (
                          <Card key={`update-skeleton-${i}`} className="shadow-md rounded-sm animate-pulse h-full">
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
              <h2 className="text-xl font-semibold flex items-center text-foreground mb-4 mt-8">
                  <Lightbulb className="mr-3 h-6 w-6 text-[#916D5B]" />
                  Key Opportunity Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                  {isLoading && forecastedOpportunities.length === 0 ? (
                  Array.from({ length: 2 }).map((_, i) => ( 
                      <Card key={i} className="shadow-md rounded-sm animate-pulse h-full">
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
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))
                  ) : (
                  !isLoading && <p className="text-muted-foreground md:col-span-2 text-center py-4">No active opportunities with forecasts to display.</p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


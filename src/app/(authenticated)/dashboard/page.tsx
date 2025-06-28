"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, Lightbulb, BarChartHorizontalBig, History } from 'lucide-react';
import { aiPoweredOpportunityForecasting } from '@/ai/flows/ai-powered-opportunity-forecasting';
import { mockOpportunities, mockLeads, getRecentUpdates } from '@/lib/data';
import type { Opportunity, OpportunityForecast, Update, Account } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import UpdateItem from '@/components/activity/UpdateItem';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import { supabase } from '@/lib/supabaseClient';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Image from 'next/image';

interface OpportunityWithForecast extends Opportunity {
  forecast?: OpportunityForecast;
}

// Status to color mapping
const statusColorMap = {
  "Scope Of Work": "#C57E94",
  "Proposal": "#4B7B9D",
  "Negotiation": "#5E6156",
  "On Hold": "#998876",
  "Win": "#916D5B",
  "Loss": "#CBCAC5"
};

const statusOrder = [
  "Scope Of Work",
  "Proposal",
  "Negotiation",
  "On Hold",
  "Win",
  "Loss"
];

export default function DashboardPage() {
  const [forecastedOpportunities, setForecastedOpportunities] = useState<OpportunityWithForecast[]>([]);
  const [overallSalesForecast, setOverallSalesForecast] = useState<string | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<Update[]>([]);
  const [latestOpportunities, setLatestOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [opportunityStatusCounts, setOpportunityStatusCounts] = useState<{ name: string, count: number }[]>([]);

  // Fetch current user ID on component mount
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    setCurrentUserId(userId);
  }, []);

  const fetchDashboardData = async () => {
    if (!currentUserId) {
      console.error('No user ID found');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all opportunities for the current user (for status counts)
      const { data: allOpportunities, error: allOpportunitiesError } = await supabase
        .from('opportunity')
        .select('status')
        .eq('owner_id', currentUserId);

      if (allOpportunitiesError) {
        console.error('Error fetching all opportunities for status counts:', allOpportunitiesError);
        setOpportunityStatusCounts([]);
      } else if (allOpportunities) {
        // Count each status
        const counts: Record<string, number> = {
          "Scope Of Work": 0, "Proposal": 0, "Negotiation": 0,
          "On Hold": 0, "Win": 0, "Loss": 0,
        };
        allOpportunities.forEach((opp: any) => {
          if (counts.hasOwnProperty(opp.status)) {
            counts[opp.status]++;
          }
        });
        setOpportunityStatusCounts(statusOrder.map(name => ({ name, count: counts[name] })));
      }

      // Fetch latest 2 updates for the current user
      const { data: updatesData, error: updatesError } = await supabase
        .from('update')
        .select(`
          id,
          type,
          content,
          updated_by_user_id,
          date,
          created_at,
          lead_id,
          opportunity_id,
          account_id
        `)
        .eq('updated_by_user_id', currentUserId)
        .order('date', { ascending: false })
        .limit(2);

      if (updatesError) {
        console.error('Error fetching updates:', updatesError);
        setRecentUpdates([]);
      } else if (updatesData) {
        const transformedUpdates: Update[] = updatesData.map((update: any) => ({
          id: update.id,
          type: update.type,
          content: update.content || '',
          updatedByUserId: update.updated_by_user_id,
          date: update.date || update.created_at || new Date().toISOString(),
          createdAt: update.created_at || new Date().toISOString(),
          leadId: update.lead_id,
          opportunityId: update.opportunity_id,
          accountId: update.account_id,
        }));
        setRecentUpdates(transformedUpdates);
      } else {
        setRecentUpdates([]);
      }

      // Fetch latest 2 opportunities for the current user
      const { data: opportunitiesData, error: opportunitiesError } = await supabase
        .from('opportunity')
        .select(`
          id,
          name,
          account_id,
          status,
          value,
          description,
          start_date,
          end_date,
          created_at,
          updated_at,
          owner_id
        `)
        .eq('owner_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (opportunitiesError) {
        console.error('Error fetching opportunities:', opportunitiesError);
        setLatestOpportunities([]);
      } else if (opportunitiesData) {
        const transformedOpportunities: Opportunity[] = opportunitiesData.map((opp: any) => ({
          id: opp.id,
          name: opp.name,
          accountId: opp.account_id,
          status: opp.status,
          value: opp.value || 0,
          description: opp.description || '',
          startDate: opp.start_date || new Date().toISOString(),
          endDate: opp.end_date || new Date().toISOString(),
          updateIds: [],
          createdAt: opp.created_at || new Date().toISOString(),
          updatedAt: opp.updated_at || new Date().toISOString(),
        }));
        setLatestOpportunities(transformedOpportunities);

        // Fetch account names for opportunities
        if (opportunitiesData.length > 0) {
          const accountIds = opportunitiesData.map(opp => opp.account_id).filter(Boolean);
          if (accountIds.length > 0) {
            const { data: accountsData } = await supabase
              .from('account')
              .select('id, name')
              .in('id', accountIds);
            
            // Create a map of account IDs to names
            const accountMap = new Map();
            if (accountsData) {
              accountsData.forEach(account => {
                accountMap.set(account.id, account.name);
              });
            }

            // Update opportunities with account names
            setLatestOpportunities(prev => prev.map(opp => ({
              ...opp,
              accountName: accountMap.get(opp.accountId) || 'Unknown Account'
            })));
          }
        }
      } else {
        setLatestOpportunities([]);
      }

      // Generate overall sales forecast
      if (opportunitiesData && opportunitiesData.length > 0) {
        const totalValue = opportunitiesData.reduce((sum, opp) => sum + (opp.value || 0), 0);
        setOverallSalesForecast(`Optimistic outlook for next quarter with strong potential from key deals. Total pipeline value: $${totalValue.toLocaleString()}. Several opportunities are in active stages.`);
      } else {
        setOverallSalesForecast("No active opportunities to forecast. Add new opportunities to see AI-powered sales predictions.");
      }
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setOverallSalesForecast("Error fetching sales forecast data.");
      setRecentUpdates([]);
      setLatestOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchDashboardData();
    }
  }, [currentUserId]);

  return (
    <div className="max-w-[1440px] px-4 mx-auto w-full pb-8 space-y-10 md:space-y-12"> 
      <PageTitle title="Intelligent Sales Dashboard">
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-sm text-muted-foreground">
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={isLoading || !currentUserId}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageTitle>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-40 relative overflow-hidden border-none">
        <Image src="/images/ai-forecast.png" alt="AI Forecast" fill className="absolute inset-0 w-full h-full object-cover" priority />
        <div className="relative z-10 flex items-center h-full pl-8">
          <span className="text-3xl font-bold text-white drop-shadow-lg">AI Features Coming Soon!</span>
        </div>
      </Card>

      {!currentUserId ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size={32} />
          <span className="ml-2 text-muted-foreground">Loading user data...</span>
        </div>
      ) : (
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
                {isLoading && opportunityStatusCounts.length === 0 ? (
                  <div className="h-64 bg-[#CBCAC5]/50 rounded animate-pulse"></div>
                ) : opportunityStatusCounts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={opportunityStatusCounts} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBCAC5" />
                      <XAxis type="number" stroke="#55504C" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#55504C" fontSize={12} width={100} interval={0}/>
                      <Tooltip
                          contentStyle={{
                              backgroundColor: "rgba(239, 237, 231, 0.7)",
                              borderColor: "#CBCAC5",
                              borderRadius: 8,
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
                          }}
                          labelStyle={{ color: "#282828" }}
                          itemStyle={{ color: "#916D5B" }}
                      />
                      <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px", color: '#55504C'}}/>
                      <Bar dataKey="count">
                        {opportunityStatusCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={statusColorMap[entry.name as keyof typeof statusColorMap] || "#CBCAC5"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                   !isLoading && <p className="text-muted-foreground">No opportunity data for chart.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border border-[#CBCAC5] bg-white rounded-sm shadow-sm flex flex-col min-h-[402px]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-[#282828]">
                  <Users className="mr-3 h-5 w-5 text-[#916D5B]" />
                  Lead Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col items-center animate-fade-in">
                  {/* Modern chat bubbles with gradient */}
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2 drop-shadow-lg">
                    <defs>
                      <linearGradient id="leadGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#C57E94"/>
                        <stop offset="1" stopColor="#4B7B9D"/>
                      </linearGradient>
                    </defs>
                    <ellipse cx="32" cy="32" rx="30" ry="28" fill="url(#leadGradient)" fillOpacity="0.13"/>
                    <rect x="16" y="22" width="32" height="16" rx="8" fill="#fff" stroke="#C57E94" strokeWidth="2.5"/>
                    <rect x="24" y="34" width="16" height="8" rx="4" fill="#F8F7F3" stroke="#4B7B9D" strokeWidth="2"/>
                    <circle cx="24" cy="30" r="2" fill="#C57E94"/>
                    <circle cx="32" cy="30" r="2" fill="#C57E94"/>
                    <circle cx="40" cy="30" r="2" fill="#C57E94"/>
                  </svg>
                  <span className="text-xl font-semibold text-[#916D5B] text-center">Lead engagement tools are on the way!</span>
                </div>
                <p className="text-base text-muted-foreground max-w-xs text-center">Soon you'll be able to track, nurture, and convert leads with AI-powered insights. Stay tuned!</p>
              </CardContent>
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
                        !isLoading && (
                          <div className="col-span-2 flex flex-col items-center justify-center bg-white rounded-[8px] h-[343px] shadow-sm border text-center gap-4 animate-fade-in">
                            {/* Pastel calendar with magnifier */}
                            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                              <defs>
                                <linearGradient id="activityGradient" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#998876"/>
                                  <stop offset="1" stopColor="#CBCAC5"/>
                                </linearGradient>
                              </defs>
                              <rect x="8" y="16" width="32" height="24" rx="6" fill="#F8F7F3" stroke="url(#activityGradient)" strokeWidth="2"/>
                              <rect x="12" y="20" width="24" height="8" rx="2" fill="#CBCAC5"/>
                              <circle cx="40" cy="40" r="7" fill="#fff" stroke="#C57E94" strokeWidth="2"/>
                              <path d="M44 44L48 48" stroke="#C57E94" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <span className="text-lg text-muted-foreground font-medium text-center">No recent activity yet</span>
                            <span className="text-sm text-muted-foreground text-center">Once you start engaging, updates will appear here!</span>
                          </div>
                        )
                    )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold flex items-center text-foreground mb-4 mt-8">
                    <Lightbulb className="mr-3 h-6 w-6 text-[#916D5B]" />
                    Key Opportunity Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                    {isLoading && latestOpportunities.length === 0 ? (
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
                    ) : latestOpportunities.length > 0 ? (
                    latestOpportunities.map((opp) => (
                      <OpportunityCard key={opp.id} opportunity={opp} accountName={(opp as any).accountName} />
                    ))
                    ) : (
                        !isLoading && (
                          <div className="col-span-2 flex flex-col items-center justify-center bg-white rounded-[8px] h-[343px] shadow-sm border text-center gap-4 animate-fade-in">
                            {/* Hopeful horizon icon */}
                            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                              <defs>
                                <linearGradient id="oppGradient" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#5E6156"/>
                                  <stop offset="1" stopColor="#C57E94"/>
                                </linearGradient>
                              </defs>
                              <ellipse cx="28" cy="40" rx="20" ry="8" fill="#F8F7F3"/>
                              <rect x="16" y="24" width="24" height="10" rx="5" fill="url(#oppGradient)" fillOpacity="0.18"/>
                              <circle cx="28" cy="29" r="5" fill="#CBCAC5"/>
                              <rect x="26" y="34" width="4" height="6" rx="2" fill="#C57E94"/>
                            </svg>
                            <span className="text-lg text-muted-foreground font-medium text-center">No opportunities found</span>
                            <span className="text-sm text-muted-foreground text-center">Add your first opportunity to get started!</span>
                          </div>
                        )
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


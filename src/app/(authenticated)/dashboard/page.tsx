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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [opportunityStatusCounts, setOpportunityStatusCounts] = useState<{ name: string, count: number }[]>([]);

  // Fetch current user ID and role on component mount
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    setCurrentUserId(userId);
    if (userId) {
      supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) setUserRole(data.role);
          else setUserRole(null);
        });
    } else {
      setUserRole(null);
    }
  }, []);

  const fetchDashboardData = async () => {
    if (!currentUserId || !userRole) {
      console.error('No user ID or role found');
      return;
    }
    setIsLoading(true);
    try {
      // Opportunities Pipeline (status counts)
      let oppStatusQuery = supabase.from('opportunity').select('status');
      if (userRole !== 'admin') oppStatusQuery = oppStatusQuery.eq('owner_id', currentUserId);
      const { data: allOpportunities, error: allOpportunitiesError } = await oppStatusQuery;
      if (allOpportunitiesError) {
        console.error('Error fetching all opportunities for status counts:', allOpportunitiesError);
        setOpportunityStatusCounts([]);
      } else if (allOpportunities) {
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

      // Recent Updates
      let updatesQuery = supabase
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
        .order('date', { ascending: false })
        .limit(2);
      if (userRole !== 'admin') updatesQuery = updatesQuery.eq('updated_by_user_id', currentUserId);
      const { data: updatesData, error: updatesError } = await updatesQuery;
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

      // Latest Opportunities
      let oppsQuery = supabase
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
        .order('created_at', { ascending: false })
        .limit(2);
      if (userRole !== 'admin') oppsQuery = oppsQuery.eq('owner_id', currentUserId);
      const { data: opportunitiesData, error: opportunitiesError } = await oppsQuery;
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
            const accountMap = new Map();
            if (accountsData) {
              accountsData.forEach(account => {
                accountMap.set(account.id, account.name);
              });
            }
            setLatestOpportunities(prev => prev.map(opp => ({
              ...opp,
              accountName: accountMap.get(opp.accountId) || 'Unknown Account'
            })));
          }
        }
      } else {
        setLatestOpportunities([]);
      }

      // Sales Forecast
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
    if (currentUserId && userRole) {
      fetchDashboardData();
    }
  }, [currentUserId, userRole]);

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

      {!currentUserId ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size={32} />
          <span className="ml-2 text-muted-foreground">Loading user data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-5 grid-rows-4 gap-4">
          {/* 1. Opportunities Pipeline */}
          <div className="col-span-2 row-span-2">
            <Card className="border border-[#E5E3DF] bg-white rounded-sm shadow-sm flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-[#282828]">
                  <BarChartHorizontalBig className="mr-3 h-5 w-5 text-[#916D5B]" />
                  Opportunities Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center">
                {isLoading && opportunityStatusCounts.length === 0 ? (
                  <div className="h-64 bg-[#CBCAC5]/50 rounded animate-pulse w-full"></div>
                ) : opportunityStatusCounts.length > 0 && opportunityStatusCounts.some(s => s.count > 0) ? (
                  <div className="w-full flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        {/* Overlay: inner/outer circles and X/Y axes */}
                        <svg width="100%" height="100%" viewBox="0 0 260 260" style={{ position: 'absolute', pointerEvents: 'none' }}>
                          {/* Outer circle */}
                          <circle cx="130" cy="130" r="100" fill="none" stroke="#CBCAC5" strokeWidth="1.5" />
                          {/* Inner circle */}
                          <circle cx="130" cy="130" r="60" fill="none" stroke="#CBCAC5" strokeWidth="1.5" />
                          {/* X axis */}
                          <line x1="20" y1="130" x2="240" y2="130" stroke="#E5E3DF" strokeWidth="2" strokeDasharray="4 4" />
                          {/* Y axis */}
                          <line x1="130" y1="20" x2="130" y2="240" stroke="#E5E3DF" strokeWidth="2" strokeDasharray="4 4" />
                        </svg>
                        <Pie
                          data={opportunityStatusCounts.filter(s => s.count > 0)}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={0.5}
                          startAngle={90}
                          endAngle={-270}
                          stroke="#fff"
                          isAnimationActive={true}
                          cornerRadius={4}
                        >
                          {opportunityStatusCounts.filter(s => s.count > 0).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={statusColorMap[entry.name as keyof typeof statusColorMap] || "#CBCAC5"}
                              style={{ cursor: 'pointer' }}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(239, 237, 231, 0.9)",
                            borderColor: "#CBCAC5",
                            borderRadius: 8,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
                          }}
                          labelStyle={{ color: "#282828" }}
                          itemStyle={{ color: "#916D5B" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                      {opportunityStatusCounts.filter(s => s.count > 0).map((entry, idx) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: statusColorMap[entry.name as keyof typeof statusColorMap] || '#CBCAC5' }}></span>
                          <span className="text-xs text-[#282828] font-medium">{entry.name} ({entry.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  !isLoading && (
                    <div className="h-64 w-full flex items-center justify-center bg-white rounded-[8px] shadow-sm border text-center">
                      <span className="text-lg text-muted-foreground font-medium">No opportunity data for chart.</span>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* 2. Key Opportunity Insights */}
          <div className="col-span-3 row-span-2 col-start-3">
            <Card className="border border-[#E5E3DF] bg-white rounded-sm shadow-sm flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-[#282828]">
                  <Lightbulb className="mr-3 h-5 w-5 text-[#916D5B]" />
                  Key Opportunity Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col gap-4">
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
              </CardContent>
            </Card>
          </div>

          {/* 3. Lead Engagement */}
          <div className="col-span-2 row-span-2 row-start-3">
            <Card className="border border-[#E5E3DF] bg-white rounded-sm shadow-sm flex flex-col min-h-[402px] h-full">
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

          {/* 4. Recent Activity Stream */}
          <div className="col-span-3 row-span-2 col-start-3 row-start-3">
            <Card className="border border-[#E5E3DF] bg-white rounded-sm shadow-sm flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-[#282828]">
                  <History className="mr-3 h-5 w-5 text-[#916D5B]" />
                  Recent Activity Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col gap-4">
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
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}


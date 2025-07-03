"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, Lightbulb, BarChartHorizontalBig, History, Clock, Flame, ThumbsUp } from 'lucide-react';
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
import LeadEngagementCard from '@/components/activity/LeadEngagementCard';
import { motion } from 'framer-motion';
import SleekLoader from '@/components/common/SleekLoader';

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

// Animation variants (refactored for sleeker, modern feel, no scale)
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};
const fadeUpStaggerParent = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.10,
      delayChildren: 0.18,
    },
  },
};
const fadeUpStaggerCard = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

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
  const [engagementLeads, setEngagementLeads] = useState<any[]>([]);
  const [engagementAI, setEngagementAI] = useState<Record<string, any>>({});
  const [engagementUpdates, setEngagementUpdates] = useState<Record<string, any[]>>({});
  const [isLoadingEngagement, setIsLoadingEngagement] = useState(true);
  const [leadSegment, setLeadSegment] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');
  const [metrics, setMetrics] = useState({
    pipelineValue: 0,
    pipelineValueDelta: 0,
    pipelineValuePrev: 0,
    activeOpps: 0,
    activeOppsDelta: 0,
    activeOppsPrev: 0,
    newLeads: 0,
    newLeadsDelta: 0,
    newLeadsPrev: 0,
    conversionRate: 0,
    conversionRateDelta: 0,
    conversionRatePrev: 0,
  });
  const [showDashboard, setShowDashboard] = useState(false);

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
    setIsLoadingEngagement(true);
    try {
      // Opportunities Pipeline (status counts)
      let oppStatusQuery = supabase.from('opportunity').select('*');
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

      // --- Lead Engagement Data ---
      // 1. Fetch leads for user
      let leadsQuery = supabase.from('lead').select('*').order('updated_at', { ascending: false });
      if (userRole !== 'admin') leadsQuery = leadsQuery.eq('owner_id', currentUserId);
      const { data: leadsData, error: leadsError } = await leadsQuery;
      if (leadsError || !leadsData) {
        setEngagementLeads([]);
        setEngagementAI({});
        setEngagementUpdates({});
        setIsLoadingEngagement(false);
      } else {
        setEngagementLeads(leadsData.map((lead: any) => ({
          id: lead.id,
          companyName: lead.company_name || '',
          personName: lead.person_name || '',
          email: lead.email || '',
          status: lead.status || '',
        })));
        // 2. Fetch latest aianalysis for each lead (enrichment, success)
        const leadIds = leadsData.map((l: any) => l.id);
        const aiQuery = supabase
          .from('aianalysis')
          .select('entity_id, match_score, use_case, pitch_notes, email_template, entity_type')
          .in('entity_id', leadIds)
          .eq('entity_type', 'Lead')
          .eq('analysis_type', 'enrichment')
          .eq('status', 'success');
        const { data: aiData, error: aiError } = await aiQuery;
        const aiMap: Record<string, any> = {};
        if (aiData) {
          aiData.forEach((ai: any) => {
            // Only keep the latest per lead
            if (!aiMap[ai.entity_id]) aiMap[ai.entity_id] = ai;
          });
        }
        setEngagementAI(aiMap);
        // 3. Fetch last 2 updates for each lead
        const updatesQuery = supabase
          .from('update')
          .select('lead_id, type, content, date')
          .in('lead_id', leadIds)
          .order('date', { ascending: false });
        const { data: updatesData, error: updatesError } = await updatesQuery;
        const updatesMap: Record<string, any[]> = {};
        if (updatesData) {
          updatesData.forEach((u: any) => {
            if (!u.lead_id) return;
            if (!updatesMap[u.lead_id]) updatesMap[u.lead_id] = [];
            if (updatesMap[u.lead_id].length < 2) updatesMap[u.lead_id].push(u);
          });
        }
        setEngagementUpdates(updatesMap);
        setIsLoadingEngagement(false);
      }

      // --- Metrics Calculation ---
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      // Opportunities
      const openOpps = (allOpportunities || []).filter((opp: any) => opp.status !== 'Win' && opp.status !== 'Loss');
      const openOppsPrev = (allOpportunities || []).filter((opp: any) => {
        const created = new Date(opp.created_at || opp.createdAt);
        return opp.status !== 'Win' && opp.status !== 'Loss' && created >= startOfPrevMonth && created <= endOfPrevMonth;
      });
      const pipelineValue = openOpps.reduce((sum, opp) => sum + (opp.value || 0), 0);
      const pipelineValuePrev = openOppsPrev.reduce((sum, opp) => sum + (opp.value || 0), 0);
      const activeOpps = openOpps.length;
      const activeOppsPrev = openOppsPrev.length;
      // Leads
      const leadsThisMonth = (leadsData || []).filter((lead: any) => new Date(lead.created_at || lead.createdAt) >= startOfMonth);
      const leadsPrevMonth = (leadsData || []).filter((lead: any) => {
        const created = new Date(lead.created_at || lead.createdAt);
        return created >= startOfPrevMonth && created <= endOfPrevMonth;
      });
      const newLeads = leadsThisMonth.length;
      const newLeadsPrev = leadsPrevMonth.length;
      // Conversion Rate
      const convertedLeadsThisMonth = leadsThisMonth.filter((lead: any) => lead.status === 'Converted to Account').length;
      const convertedLeadsPrevMonth = leadsPrevMonth.filter((lead: any) => lead.status === 'Converted to Account').length;
      const conversionRate = newLeads > 0 ? Math.round((convertedLeadsThisMonth / newLeads) * 100) : 0;
      const conversionRatePrev = newLeadsPrev > 0 ? Math.round((convertedLeadsPrevMonth / newLeadsPrev) * 100) : 0;
      // Deltas
      const pipelineValueDelta = pipelineValuePrev > 0 ? Math.round(((pipelineValue - pipelineValuePrev) / pipelineValuePrev) * 100) : 0;
      const activeOppsDelta = activeOppsPrev > 0 ? activeOpps - activeOppsPrev : 0;
      const newLeadsDelta = newLeadsPrev > 0 ? newLeads - newLeadsPrev : 0;
      const conversionRateDelta = conversionRatePrev !== 0 ? conversionRate - conversionRatePrev : 0;
      setMetrics({
        pipelineValue,
        pipelineValueDelta,
        pipelineValuePrev,
        activeOpps,
        activeOppsDelta,
        activeOppsPrev,
        newLeads,
        newLeadsDelta,
        newLeadsPrev,
        conversionRate,
        conversionRateDelta,
        conversionRatePrev,
      });

      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setOverallSalesForecast("Error fetching sales forecast data.");
      setRecentUpdates([]);
      setLatestOpportunities([]);
      setIsLoadingEngagement(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId && userRole) {
      fetchDashboardData();
    }
  }, [currentUserId, userRole]);

  // Wait for all main data to load, then show dashboard after a minimum delay
  useEffect(() => {
    if (!isLoading && !isLoadingEngagement) {
      const minDelay = 600; // ms
      const timer = setTimeout(() => setShowDashboard(true), minDelay);
      return () => clearTimeout(timer);
    } else {
      setShowDashboard(false);
    }
  }, [isLoading, isLoadingEngagement]);

  useEffect(() => {
    // Only auto-switch if currently on Hot, not loading, and Hot is empty but Warm is not
    if (!isLoadingEngagement && leadSegment === 'Hot') {
      const getSegment = (score?: number) => {
        if (score === undefined) return 'Cold';
        if (score >= 80) return 'Hot';
        if (score >= 50) return 'Warm';
        return 'Cold';
      };
      const hotLeads = engagementLeads.filter(lead => {
        const ai = engagementAI[lead.id] || {};
        if (lead.status === 'Converted to Account') return false;
        if (ai.entity_type === 'Account') return false;
        return getSegment(ai.match_score) === 'Hot';
      });
      const warmLeads = engagementLeads.filter(lead => {
        const ai = engagementAI[lead.id] || {};
        if (lead.status === 'Converted to Account') return false;
        if (ai.entity_type === 'Account') return false;
        return getSegment(ai.match_score) === 'Warm';
      });
      if (hotLeads.length === 0 && warmLeads.length > 0) {
        setLeadSegment('Warm');
      }
    }
  }, [isLoadingEngagement, engagementLeads, engagementAI, leadSegment]);

  if (!showDashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] w-full">
        <SleekLoader />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] px-4 mx-auto w-full pb-8 space-y-4">
      {/* 1. Title Animation */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ type: 'spring', stiffness: 60, damping: 18, duration: 0.5, ease: 'easeOut' }}
      >
        <PageTitle title="Intelligent Sales Dashboard" />
      </motion.div>

      {/* 2. Metrics Row Animation (staggered cards) */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={fadeUpStaggerParent}
        initial="hidden"
        animate="visible"
      >
        {/* Each card gets its own fadeUpStaggerCard */}
        <motion.div variants={fadeUpStaggerCard} transition={{ type: 'spring', stiffness: 70, damping: 16, duration: 0.42, ease: 'easeOut' }}>
          <div className="rounded-md bg-white p-6 flex flex-col justify-between min-h-[120px] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium text-[#232323]">Pipeline Value</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${metrics.pipelineValueDelta >= 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{metrics.pipelineValueDelta >= 0 ? '+' : ''}{metrics.pipelineValueDelta}%</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold text-[#18181B] tracking-tight">${metrics.pipelineValue.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground ml-2">${metrics.pipelineValuePrev.toLocaleString()} <span className="text-xs">(last month)</span></span>
            </div>
          </div>
        </motion.div>
        <motion.div variants={fadeUpStaggerCard} transition={{ type: 'spring', stiffness: 70, damping: 16, duration: 0.42, ease: 'easeOut' }}>
          <div className="rounded-md bg-white p-6 flex flex-col justify-between min-h-[120px] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium text-[#232323]">Active Oppotunities</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${metrics.activeOppsDelta >= 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{metrics.activeOppsDelta >= 0 ? '+' : ''}{metrics.activeOppsDelta}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold text-[#18181B] tracking-tight">{metrics.activeOpps}</span>
              <span className="text-sm text-muted-foreground ml-2">{metrics.activeOppsPrev} <span className="text-xs">(last month)</span></span>
            </div>
          </div>
        </motion.div>
        <motion.div variants={fadeUpStaggerCard} transition={{ type: 'spring', stiffness: 70, damping: 16, duration: 0.42, ease: 'easeOut' }}>
          <div className="rounded-md bg-white p-6 flex flex-col justify-between min-h-[120px] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium text-[#232323]">New Leads</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${metrics.newLeadsDelta >= 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{metrics.newLeadsDelta >= 0 ? '+' : ''}{metrics.newLeadsDelta}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold text-[#18181B] tracking-tight">{metrics.newLeads}</span>
              <span className="text-sm text-muted-foreground ml-2">{metrics.newLeadsPrev} <span className="text-xs">(last month)</span></span>
            </div>
          </div>
        </motion.div>
        <motion.div variants={fadeUpStaggerCard} transition={{ type: 'spring', stiffness: 70, damping: 16, duration: 0.42, ease: 'easeOut' }}>
          <div className="rounded-md bg-white p-6 flex flex-col justify-between min-h-[120px] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium text-[#232323]">Conversion Rate</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${metrics.conversionRateDelta >= 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{metrics.conversionRateDelta >= 0 ? '+' : ''}{metrics.conversionRateDelta}%</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold text-[#18181B] tracking-tight">{metrics.conversionRate}%</span>
              <span className="text-sm text-muted-foreground ml-2">{metrics.conversionRatePrev}% <span className="text-xs">(last month)</span></span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 3. Top Row Animation */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ type: 'spring', stiffness: 60, damping: 18, duration: 0.4, ease: 'easeOut', delay: 0.45 }}
        className="flex flex-col gap-4"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ type: 'spring', stiffness: 60, damping: 18, duration: 0.4, ease: 'easeOut', delay: 0.5 }}
          className="grid grid-cols-6 gap-4"
        >
          {/* Opportunities Pipeline */}
          <motion.div variants={fadeUp} transition={{ type: 'spring', stiffness: 60, damping: 18, duration: 0.5, ease: 'easeOut' }} className="col-span-2">
            <Card className="bg-white rounded-md shadow-sm flex flex-col h-full">
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
                          paddingAngle={2}
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
          </motion.div>
          {/* Key Opportunity Insights */}
          <motion.div variants={fadeUp} transition={{ type: 'spring', stiffness: 60, damping: 18, duration: 0.4, ease: 'easeOut' }} className="col-span-4">
            <Card className="bg-white rounded-md shadow-sm flex flex-col h-full">
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
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 4. Bottom Row Animation */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ type: 'spring', stiffness: 60, damping: 18, duration: 0.4, ease: 'easeOut', delay: 0.7 }}
        className="flex flex-col gap-4"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ type: 'spring', stiffness: 60, damping: 18, duration: 0.4, ease: 'easeOut', delay: 0.75 }}
          className="grid grid-cols-6 gap-4"
        >
          {/* Lead Engagement */}
          <motion.div variants={fadeUp} transition={{ type: 'spring', stiffness: 60, damping: 18, duration: 0.5, ease: 'easeOut' }} className="col-span-2">
            <Card className="bg-white rounded-md shadow-sm flex flex-col min-h-[402px] h-full">
              <CardHeader className="flex flex-col gap-2 justify-between">
                <div className="flex items-center">
                  <Users className="mr-3 h-5 w-5 text-[#916D5B]" />
                  <CardTitle className="text-lg flex items-center text-[#282828]">
                    Lead Engagement
                  </CardTitle>
                </div>
                <div className="flex flex-row gap-2">
                  <Button
                    type="button"
                    onClick={() => setLeadSegment('Hot')}
                    className={`rounded-full px-4 py-1 shadow-sm max-h-10 hover:bg-[#D48EA3]/10 transition-colors font-${leadSegment === 'Hot' ? 'semibold' : 'normal'} focus:outline-none border ${leadSegment === 'Hot' ? 'bg-[#D48EA3] hover:bg-[#D48EA3] text-white border-transparent' : 'bg-white text-[#D48EA3] border-[#D48EA3]'}`}
                  >
                    <Flame className={`h-4 w-4 ${leadSegment === 'Hot' ? 'text-white' : 'text-[#D48EA3]'}`} /> Hot
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setLeadSegment('Warm')}
                    className={`rounded-full px-4 py-1 shadow-sm max-h-10 hover:bg-[#916D5B]/10 transition-colors font-${leadSegment === 'Warm' ? 'semibold' : 'normal'} focus:outline-none border ${leadSegment === 'Warm' ? 'bg-[#916D5B] hover:bg-[#916D5B] text-white border-transparent' : 'bg-white text-[#916D5B] border-[#916D5B]'}`}
                  >
                    <ThumbsUp className={`h-4 w-4 ${leadSegment === 'Warm' ? 'text-white' : 'text-[#916D5B]'}`} /> Warm
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setLeadSegment('Cold')}
                    className={`rounded-full px-4 py-1 shadow-sm max-h-10 hover:bg-[#3987BE]/10 transition-colors font-${leadSegment === 'Cold' ? 'semibold' : 'normal'} focus:outline-none border ${leadSegment === 'Cold' ? 'bg-[#3987BE] hover:bg-[#3987BE] text-white border-transparent' : 'bg-white text-[#3987BE] border-[#3987BE]'}`}
                  >
                    <Users className={`h-4 w-4 ${leadSegment === 'Cold' ? 'text-white' : 'text-[#3987BE]'}`} /> Cold
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative flex-grow flex flex-col gap-4 overflow-scroll max-h-[490px] h-full">
                {isLoadingEngagement ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mb-2 animate-pulse" />
                    <span>Loading engagement data...</span>
                  </div>
                ) : (
                  <LeadEngagementCard
                    leads={engagementLeads}
                    aianalysis={engagementAI}
                    updates={engagementUpdates}
                    segment={leadSegment}
                  />
                )}
              </CardContent>
                <div className="pointer-events-none absolute rounded-b-sm left-0 right-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white to-40%" />
            </Card>
          </motion.div>
          {/* Recent Activity Stream */}
          <motion.div variants={fadeUp} transition={{ type: 'spring', stiffness: 60, damping: 18, duration: 0.4, ease: 'easeOut' }} className="col-span-4">
            <Card className="bg-white rounded-md shadow-sm flex flex-col h-full">
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
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}


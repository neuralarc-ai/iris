import React, { useState } from 'react';
import { Users, Mail, Flame, ThumbsUp, Clipboard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types for props
interface LeadEngagementCardProps {
  leads?: Array<{
    id: string;
    companyName: string;
    personName: string;
    email: string;
    status?: string;
    matchScore?: number;
    avatarUrl?: string;
  }>;
  aianalysis?: Record<string, {
    match_score?: number;
    use_case?: string;
    pitch_notes?: string;
    email_template?: string;
    entity_type?: string;
  }>;
  updates?: Record<string, Array<{
    type: string;
    content: string;
    date: string;
  }>>;
  segment: 'Hot' | 'Warm' | 'Cold';
}

const getSegment = (score?: number) => {
  if (score === undefined) return 'Cold';
  if (score >= 80) return 'Hot';
  if (score >= 50) return 'Warm';
  return 'Cold';
};

const LeadEngagementCard: React.FC<LeadEngagementCardProps> = ({ leads = [], aianalysis = {}, updates = {}, segment }) => {
  // Filter leads by segment prop, skip those with status 'Converted to Account' or entity_type 'Account' in aianalysis
  const filteredLeads = leads.filter(lead => {
    const ai = aianalysis[lead.id] || {};
    // Skip if lead is converted or AI entity_type is Account
    if (lead.status === 'Converted to Account') return false;
    if (ai.entity_type === 'Account') return false;
    return getSegment(ai.match_score) === segment;
  });
  // Sort by match_score desc
  const sortedLeads = [...filteredLeads].sort((a, b) => (aianalysis[b.id]?.match_score ?? 0) - (aianalysis[a.id]?.match_score ?? 0));
  const topLeads = sortedLeads.slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Leads */}
      {topLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mb-2" />
          <span>No leads in this segment.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {topLeads.map(lead => {
            const ai = aianalysis[lead.id] || {};
            const recentUpdates = updates[lead.id] || [];
            return (
              <div key={lead.id} className="border border-[#E5E3DF] rounded-sm p-4 flex flex-col gap-2 bg-[#FAFAFA]">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-[#E6D0D7] flex items-center justify-center font-bold text-lg text-[#916D5B]">
                    {lead.personName?.[0] || lead.companyName?.[0] || '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#282828]">{lead.personName}</span>
                    <span className="text-xs text-muted-foreground">{lead.companyName}</span>
                  </div>
                  <span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-[#E5E3DF] text-[#282828]">
                    Score: {ai.match_score ?? 'N/A'}
                  </span>
                </div>
                {/* AI Next Action */}
                {ai.use_case || ai.pitch_notes ? (
                  <div className="text-sm text-[#5E6156] mt-1">
                    <span className="font-medium">AI Suggests:</span> {ai.use_case || ai.pitch_notes}
                  </div>
                ) : null}
                {/* Suggested Email */}
                {ai.email_template ? (
                  <div className="bg-white border border-[#E5E3DF] rounded p-2 mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#916D5B]" />
                    <span className="text-xs font-mono text-[#282828] flex-1">{ai.email_template}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => navigator.clipboard.writeText(ai.email_template!)}
                      title="Copy email template"
                    >
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeadEngagementCard; 
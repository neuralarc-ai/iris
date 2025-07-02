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
    matchScore?: number;
    avatarUrl?: string;
  }>;
  aianalysis?: Record<string, {
    match_score?: number;
    use_case?: string;
    pitch_notes?: string;
    email_template?: string;
  }>;
  updates?: Record<string, Array<{
    type: string;
    content: string;
    date: string;
  }>>;
}

const SEGMENTS = [
  { label: 'Hot', icon: <Flame className="h-4 w-4 text-red-500" /> },
  { label: 'Warm', icon: <ThumbsUp className="h-4 w-4 text-yellow-500" /> },
  { label: 'Cold', icon: <Users className="h-4 w-4 text-blue-400" /> },
];

const getSegment = (score?: number) => {
  if (score === undefined) return 'Cold';
  if (score >= 80) return 'Hot';
  if (score >= 50) return 'Warm';
  return 'Cold';
};

const LeadEngagementCard: React.FC<LeadEngagementCardProps> = ({ leads = [], aianalysis = {}, updates = {} }) => {
  const [segment, setSegment] = useState('Hot');
  // Filter leads by segment
  const filteredLeads = leads.filter(lead => getSegment(aianalysis[lead.id]?.match_score) === segment);
  // Sort by match_score desc
  const sortedLeads = [...filteredLeads].sort((a, b) => (aianalysis[b.id]?.match_score ?? 0) - (aianalysis[a.id]?.match_score ?? 0));
  const topLeads = sortedLeads.slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      {/* Segment Filters */}
      <div className="flex gap-2 mb-2">
        {SEGMENTS.map(s => (
          <Button
            key={s.label}
            variant={segment === s.label ? 'default' : 'outline'}
            size="sm"
            className={`rounded-full px-4 flex items-center gap-1 ${segment === s.label ? 'bg-[#E6D0D7] text-[#2B2521]' : 'text-[#282828]'}`}
            onClick={() => setSegment(s.label)}
          >
            {s.icon}
            {s.label}
          </Button>
        ))}
      </div>
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
                {/* Recent Engagement */}
                <div className="mt-2">
                  <span className="text-xs font-semibold text-[#916D5B]">Recent Activity:</span>
                  {recentUpdates.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      No recent activity
                    </div>
                  ) : (
                    <ul className="text-xs mt-1 space-y-1">
                      {recentUpdates.slice(0, 2).map((u, idx) => (
                        <li key={idx} className="flex gap-2 items-center">
                          <span className="font-medium">{u.type}:</span>
                          <span>{u.content}</span>
                          <span className="ml-auto text-muted-foreground">{new Date(u.date).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeadEngagementCard; 
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  MessageCircleMore, 
  Users, 
  Mail, 
  Clock,
  Sunrise,
  Sun,
  Moon
} from 'lucide-react';
import type { Update, Opportunity, Account, Lead } from '@/types';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

interface UpcomingActivitiesGridProps {
  updates: Update[];
  onCardClick?: (entityType: 'lead' | 'account' | 'opportunity', entityId: string) => void;
}

interface ActivityWithEntity extends Update {
  entityName?: string;
  entityType?: 'lead' | 'account' | 'opportunity';
  entityId?: string;
}

const getUpdateTypeIcon = (type: Update['type']) => {
  switch (type) {
    case 'Call': return <MessageCircleMore className="h-4 w-4 text-[#4B7B9D]" />;
    case 'Meeting': return <Users className="h-4 w-4 text-[#5E6156]" />;
    case 'Email': return <Mail className="h-4 w-4 text-[#C57E94]" />;
    case 'General':
    default: return <MessageSquare className="h-4 w-4 text-[#998876]" />;
  }
};

const getActivityTypeBadgeClasses = (type: Update['type']) => {
  switch (type) {
    case 'Call': return 'bg-[#E6F4F1] text-[#1B6B5C] border-none'; // teal
    case 'Meeting': return 'bg-[#F3E8FF] text-[#7C3AED] border-none'; // purple
    case 'Email': return 'bg-[#FFF4E6] text-[#B45309] border-none'; // orange
    case 'General':
    default: return 'bg-[#F3F4F6] text-[#374151] border-none'; // gray
  }
};

const getTimeSlot = (date: Date): 'morning' | 'afternoon' | 'evening' => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
};

const formatTime = (date: Date): string => {
  return format(date, 'h:mm a');
};

const formatDate = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM dd');
};

const getTimeSlotIcon = (slot: 'morning' | 'afternoon' | 'evening') => {
  switch (slot) {
    case 'morning': return <Sunrise className="h-5 w-5 text-[#3987BE]" />;
    case 'afternoon': return <Sun className="h-5 w-5 text-[#916D5B]" />;
    case 'evening': return <Moon className="h-5 w-5 text-[#D48EA3]" />;
  }
};

const getTimeSlotTitle = (slot: 'morning' | 'afternoon' | 'evening') => {
  switch (slot) {
    case 'morning': return 'Morning (5AM - 12PM)';
    case 'afternoon': return 'Afternoon (12PM - 5PM)';
    case 'evening': return 'Evening (5PM - 12AM)';
  }
};

const getTimeSlotHeaderBg = (slot: 'morning' | 'afternoon' | 'evening') => {
  switch (slot) {
    case 'morning': return 'bg-[#C5DAE5]';
    case 'afternoon': return 'bg-[#E2D4C3]';
    case 'evening': return 'bg-[#E6D0D7]';
  }
};

const getTimeSlotBadgeColor = (slot: 'morning' | 'afternoon' | 'evening') => {
  switch (slot) {
    case 'morning': return 'bg-[#3987BE] text-white';
    case 'afternoon': return 'bg-[#C5B496] text-white';
    case 'evening': return 'bg-[#D48EA3] text-white';
  }
};

export default function UpcomingActivitiesGrid({ updates, onCardClick }: UpcomingActivitiesGridProps) {
  const [activitiesWithEntities, setActivitiesWithEntities] = useState<ActivityWithEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntityData = async () => {
      if (!updates.length) {
        setActivitiesWithEntities([]);
        setIsLoading(false);
        return;
      }

      try {
        const enrichedActivities: ActivityWithEntity[] = [];

        for (const update of updates) {
          let entityName = '';
          let entityType: 'lead' | 'account' | 'opportunity' | undefined;
          let entityId = '';

          if (update.opportunityId) {
            // Fetch opportunity
            const { data: oppData } = await supabase
              .from('opportunity')
              .select('name')
              .eq('id', update.opportunityId)
              .single();
            
            if (oppData) {
              entityName = oppData.name;
              entityType = 'opportunity';
              entityId = update.opportunityId;
            }
          } else if (update.leadId) {
            // Fetch lead
            const { data: leadData } = await supabase
              .from('lead')
              .select('person_name, company_name')
              .eq('id', update.leadId)
              .single();
            
            if (leadData) {
              entityName = `${leadData.person_name} (${leadData.company_name})`;
              entityType = 'lead';
              entityId = update.leadId;
            }
          } else if (update.accountId) {
            // Fetch account
            const { data: accData } = await supabase
              .from('account')
              .select('name')
              .eq('id', update.accountId)
              .single();
            
            if (accData) {
              entityName = accData.name;
              entityType = 'account';
              entityId = update.accountId;
            }
          }

          enrichedActivities.push({
            ...update,
            entityName,
            entityType,
            entityId,
          });
        }

        setActivitiesWithEntities(enrichedActivities);
      } catch (error) {
        console.error('Error fetching entity data:', error);
        setActivitiesWithEntities(updates.map(update => ({ ...update })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntityData();
  }, [updates]);

  // Group activities by time slot (only future activities)
  const now = new Date();
  const groupedActivities = activitiesWithEntities.reduce((acc, activity) => {
    if (!activity.nextActionDate) return acc;
    
    try {
      const date = parseISO(activity.nextActionDate);
      
      // Only include future activities
      if (date <= now) return acc;
      
      const timeSlot = getTimeSlot(date);
      
      if (!acc[timeSlot]) {
        acc[timeSlot] = [];
      }
      
      acc[timeSlot].push(activity);
    } catch (error) {
      console.error('Error parsing date for activity:', activity.id, error);
    }
    
    return acc;
  }, {} as Record<'morning' | 'afternoon' | 'evening', ActivityWithEntity[]>);

  // Sort activities within each time slot by time
  Object.keys(groupedActivities).forEach(slot => {
    groupedActivities[slot as keyof typeof groupedActivities].sort((a, b) => {
      try {
        const dateA = parseISO(a.nextActionDate!);
        const dateB = parseISO(b.nextActionDate!);
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.error('Error sorting activities:', error);
        return 0;
      }
    });
  });

  const timeSlots: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];

  if (isLoading) {
    return (
      <div className="h-[343px] grid grid-cols-1 md:grid-cols-3 gap-0 bg-white rounded-lg overflow-hidden">
        {timeSlots.map((slot, index) => (
          <div key={slot} className="relative">
            <div className={`p-4 ${getTimeSlotHeaderBg(slot)}`}>
              <div className="flex items-center text-[#282828]">
                {getTimeSlotIcon(slot)}
                <span className="ml-2 text-sm font-semibold">{getTimeSlotTitle(slot)}</span>
              </div>
            </div>
            <div className="p-4 h-[calc(343px-80px)] overflow-y-auto">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
            {index < timeSlots.length - 1 && (
              <div className="absolute right-0 top-0 bottom-0 w-px bg-[#E5E3DF]"></div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-[343px] grid grid-cols-1 md:grid-cols-3 border-[] gap-0 bg-white rounded-lg overflow-hidden">
      {timeSlots.map((slot, index) => {
        const activities = groupedActivities[slot] || [];
        
        return (
          <div key={slot} className="relative flex flex-col">
            {/* Header - Fixed */}
            <div className={`p-4 h-[55px] ${getTimeSlotHeaderBg(slot)} flex-shrink-0`}>
              <div className="flex items-center justify-between text-[#282828]">
                <div className="flex items-center">
                  {getTimeSlotIcon(slot)}
                  <span className="ml-2 text-sm font-semibold">{getTimeSlotTitle(slot)}</span>
                </div>
                {activities.length > 0 && (
                  <Badge variant="secondary" className={`text-xs ${getTimeSlotBadgeColor(slot)}`}>
                    {activities.length}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 p-4 overflow-y-scroll bg-[#FAFAFA]">
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map(activity => {
                    try {
                      const date = parseISO(activity.nextActionDate!);
                      const time = formatTime(date);
                      const dateStr = formatDate(date);
                    
                      return (
                        <Card
                          key={activity.id}
                          className="border border-[#E5E3DF] bg-[#F8F7F3] rounded-sm shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer p-3"
                          onClick={() => {
                            if (activity.entityType && activity.entityId && onCardClick) {
                              onCardClick(activity.entityType, activity.entityId);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white flex items-center justify-center mt-0.5">
                              {getUpdateTypeIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-[#282828] truncate">
                                  {activity.entityName || 'Unknown Entity'}
                                </span>
                                <span className="text-xs text-[#916D5B] font-medium">
                                  {time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={`text-xs ${getActivityTypeBadgeClasses(activity.type)}`}>
                                  {activity.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {dateStr}
                                </span>
                              </div>
                              {activity.content && (
                                <p className="text-xs text-[#5E6156] line-clamp-2 leading-relaxed">
                                  {activity.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    } catch (error) {
                      console.error('Error rendering activity:', activity.id, error);
                      return null;
                    }
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-sm">No activities scheduled</span>
                </div>
              )}
            </div>
            
            {/* Vertical Separator */}
            {index < timeSlots.length - 1 && (
              <div className="absolute right-0 top-0 bottom-0 w-px bg-[#FAFAFA]"></div>
            )}
          </div>
        );
      })}
    </div>
  );
} 
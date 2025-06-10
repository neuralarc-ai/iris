
"use client";
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, User, Mail, Phone, Eye, CheckSquare, FileWarning, CalendarPlus, History, Linkedin, MapPin } from 'lucide-react';
import type { Lead } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { convertLeadToAccount } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

interface LeadCardProps {
  lead: Lead;
  onLeadConverted: (leadId: string, newAccountId: string) => void;
}

const getStatusBadgeVariant = (status: Lead['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'New': return 'secondary';
    case 'Contacted': return 'outline';
    case 'Qualified': return 'default';
    case 'Proposal Sent': return 'default';
    case 'Converted to Account': return 'default';
    case 'Lost': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusBadgeColorClasses = (status: Lead['status']): string => {
  switch (status) {
    case 'New': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    case 'Contacted': return 'bg-sky-500/20 text-sky-700 border-sky-500/30';
    case 'Qualified': return 'bg-teal-500/20 text-teal-700 border-teal-500/30';
    case 'Proposal Sent': return 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30';
    case 'Converted to Account': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'Lost': return 'bg-red-500/20 text-red-700 border-red-500/30';
    default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
  }
}

export default function LeadCard({ lead, onLeadConverted }: LeadCardProps) {
  const { toast } = useToast();

  const handleConvertLead = async () => {
    if (lead.status === "Converted to Account" || lead.status === "Lost") {
      toast({ title: "Action not allowed", description: "This lead has already been processed.", variant: "destructive" });
      return;
    }
    const newAccount = convertLeadToAccount(lead.id);
    if (newAccount) {
      toast({
        title: "Lead Converted!",
        description: `${lead.companyName} has been converted to an account: ${newAccount.name}.`,
        className: "bg-green-100 dark:bg-green-900 border-green-500"
      });
      onLeadConverted(lead.id, newAccount.id);
    } else {
      toast({ title: "Conversion Failed", description: "Could not convert lead to account.", variant: "destructive" });
    }
  };

  const canConvert = lead.status !== "Converted to Account" && lead.status !== "Lost";

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-xl font-headline flex items-center text-foreground">
            <User className="mr-2 h-5 w-5 text-primary shrink-0" />
            {lead.companyName}
          </CardTitle>
           <Badge
            variant={getStatusBadgeVariant(lead.status)}
            className={`capitalize whitespace-nowrap ml-2 ${getStatusBadgeColorClasses(lead.status)}`}
          >
            {lead.status}
          </Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground flex items-center">
            <Users className="mr-2 h-4 w-4 shrink-0"/> {lead.personName}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2.5 text-sm">
        {lead.email && (
          <div className="flex items-center text-muted-foreground">
            <Mail className="mr-2 h-4 w-4 shrink-0" />
            <a href={`mailto:${lead.email}`} className="hover:text-primary hover:underline">{lead.email}</a>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center text-muted-foreground">
            <Phone className="mr-2 h-4 w-4 shrink-0" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.linkedinProfileUrl && (
          <div className="flex items-center text-muted-foreground">
            <Linkedin className="mr-2 h-4 w-4 shrink-0" />
            <a href={lead.linkedinProfileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline truncate">
              {lead.linkedinProfileUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}
            </a>
          </div>
        )}
        {lead.country && (
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4 shrink-0" />
            <span>{lead.country}</span>
          </div>
        )}
        <div className="pt-2 space-y-1">
            <div className="text-xs text-muted-foreground flex items-center">
                <CalendarPlus className="mr-1.5 h-3.5 w-3.5 shrink-0"/> Created: {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
            </div>
             <div className="text-xs text-muted-foreground flex items-center">
                <History className="mr-1.5 h-3.5 w-3.5 shrink-0"/> Last Updated: {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
            </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t mt-auto">
        <Button variant="outline" size="sm" asChild className="mr-auto">
          <Link href={`/leads?id=${lead.id}#details`}> {/* This link might be for a detail view not yet implemented */}
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
        {canConvert ? (
             <Button size="sm" onClick={handleConvertLead}>
                <CheckSquare className="mr-2 h-4 w-4" /> Convert
             </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            {lead.status === "Lost" ? <FileWarning className="mr-2 h-4 w-4" /> : <CheckSquare className="mr-2 h-4 w-4" />}
            {lead.status === "Lost" ? "Lost" : "Converted"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

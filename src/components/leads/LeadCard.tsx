
"use client";
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, User, Mail, Phone, Eye, CheckSquare, FileWarning } from 'lucide-react';
import type { Lead } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { convertLeadToAccount } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

interface LeadCardProps {
  lead: Lead;
  onLeadConverted: (leadId: string, newAccountId: string) => void; // Callback to update parent state
}

const getStatusBadgeVariant = (status: Lead['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'New': return 'secondary';
    case 'Contacted': return 'outline';
    case 'Qualified': return 'default';
    case 'Proposal Sent': return 'default';
    case 'Converted to Account': return 'default'; // Should look like success
    case 'Lost': return 'destructive';
    default: return 'secondary';
  }
};

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
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-headline flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              {lead.companyName}
            </CardTitle>
            <CardDescription className="flex items-center">
              <User className="mr-1 h-4 w-4 text-muted-foreground" /> {lead.personName}
            </CardDescription>
          </div>
          <Badge
            variant={getStatusBadgeVariant(lead.status)}
            className={`capitalize ${lead.status === "Converted to Account" ? 'bg-green-600 text-white' : ''} ${lead.status === "Qualified" || lead.status === "Proposal Sent" ? 'bg-primary text-primary-foreground' : ''}`}
          >
            {lead.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <div className="text-sm flex items-center text-muted-foreground">
          <Mail className="mr-2 h-4 w-4" />
          <span>{lead.email}</span>
        </div>
        {lead.phone && (
          <div className="text-sm flex items-center text-muted-foreground">
            <Phone className="mr-2 h-4 w-4" />
            <span>{lead.phone}</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground pt-1">
            Created: {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
        </div>
         <div className="text-xs text-muted-foreground">
            Last Updated: {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/leads?id=${lead.id}#details`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
        {canConvert ? (
             <Button size="sm" variant="default" onClick={handleConvertLead} className="bg-primary hover:bg-primary/90">
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

    
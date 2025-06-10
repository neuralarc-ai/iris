
"use client";
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, User, Mail, Phone, Eye, DollarSign, Edit3, CheckSquare } from 'lucide-react'; // Edit3 for convert, CheckSquare for mark qualified
import type { Lead } from '@/types';
import { formatDistanceToNow } from 'date-fns';


interface LeadCardProps {
  lead: Lead;
}

const getStatusBadgeVariant = (status: Lead['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'New': return 'secondary';
    case 'Contacted': return 'outline';
    case 'Qualified': return 'default'; // Using 'default' (primary bg) for important positive status
    case 'Proposal Sent': return 'default';
    case 'Converted to Account': return 'default'; // Success variant might be greenish
    case 'Lost': return 'destructive';
    default: return 'secondary';
  }
};

export default function LeadCard({ lead }: LeadCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-headline flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" /> {/* Users icon for company */}
              {lead.companyName}
            </CardTitle>
            <CardDescription>Lead - {lead.personName}</CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(lead.status)} className="capitalize">
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
          <Link href={`/leads?id=${lead.id}#details`}> {/* Simplified link for now */}
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
        {/* Placeholder for future actions */}
        {lead.status !== 'Converted to Account' && lead.status !== 'Lost' && (
             <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                <CheckSquare className="mr-2 h-4 w-4" /> Convert
             </Button>
        )}
      </CardFooter>
    </Card>
  );
}

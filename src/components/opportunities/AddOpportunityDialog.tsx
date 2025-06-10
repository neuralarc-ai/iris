
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Opportunity, Lead } from '@/types'; // Renamed Project to Opportunity
import { addOpportunity, mockLeads } from '@/lib/data'; // Renamed addProject, imported mockLeads
import { Loader2, BarChartBig, User } from 'lucide-react'; // Changed icon

interface AddOpportunityDialogProps { // Renamed
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpportunityAdded?: (newOpportunity: Opportunity) => void; // Renamed
}

export default function AddOpportunityDialog({ open, onOpenChange, onOpportunityAdded }: AddOpportunityDialogProps) { // Renamed
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState<number | string>(''); // Can be string during input
  const [selectedLeadId, setSelectedLeadId] = useState<string | ''>('');

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedLeadId || value === '' || Number(value) <= 0) {
      toast({ title: "Error", description: "Opportunity Name, selected Lead, and a valid positive Quoted Amount are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const newOpportunityData = {
        name,
        description,
        value: Number(value),
        leadId: selectedLeadId,
      };
      // For now, we are creating opportunities linked to leads.
      // Account linking can be added if a lead is converted or if direct account opportunities are needed.
      const newOpportunity = addOpportunity(newOpportunityData); 
      
      toast({
        title: "Opportunity Created",
        description: `Opportunity "${name}" has been successfully added for lead ${mockLeads.find(l => l.id === selectedLeadId)?.companyName}.`,
      });
      
      onOpportunityAdded?.(newOpportunity); // Renamed
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create opportunity:", error); // Renamed
      toast({ title: "Error", description: "Failed to create opportunity. Please try again.", variant: "destructive" }); // Renamed
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setValue('');
    setSelectedLeadId('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChartBig className="mr-2 h-5 w-5" /> Add New Opportunity {/* Renamed */}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new sales opportunity.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="opportunity-name">Opportunity Name <span className="text-destructive">*</span></Label> {/* Renamed */}
            <Input id="opportunity-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Q4 Enterprise Deal" disabled={isLoading} /> {/* Renamed */}
          </div>
          
          <div>
            <Label htmlFor="opportunity-lead">Associated Lead <span className="text-destructive">*</span></Label>
            <Select value={selectedLeadId} onValueChange={(value: string) => setSelectedLeadId(value)} disabled={isLoading}>
              <SelectTrigger id="opportunity-lead">
                <SelectValue placeholder="Select a lead" />
              </SelectTrigger>
              <SelectContent>
                {mockLeads.filter(lead => lead.status !== 'Converted to Account' && lead.status !== 'Lost').map(lead => (
                  <SelectItem key={lead.id} value={lead.id}>
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      {lead.companyName} ({lead.personName})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="opportunity-description">Description</Label> {/* Renamed */}
            <Textarea 
              id="opportunity-description" // Renamed
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Brief overview of the opportunity, client needs, etc." 
              disabled={isLoading}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="opportunity-value">Quoted Amount <span className="text-destructive">*</span></Label> {/* Renamed */}
            <Input 
              id="opportunity-value" // Renamed
              type="number" 
              value={value} 
              onChange={(e) => setValue(e.target.value)} 
              placeholder="e.g., 50000" 
              disabled={isLoading} 
              min="0"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Opportunity"} {/* Renamed */}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

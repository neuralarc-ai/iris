
"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Lead, ExtractedLeadInfo } from '@/types';
import { addLead } from '@/lib/data';
import { countries } from '@/lib/countryData';
import { extractLeadInfoFromCard } from '@/ai/flows/extract-lead-from-card';
import { Loader2, UserPlus, UploadCloud, ScanLine, FileText } from 'lucide-react';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadAdded?: (newLead: Lead) => void;
}

export default function AddLeadDialog({ open, onOpenChange, onLeadAdded }: AddLeadDialogProps) {
  const [companyName, setCompanyName] = useState('');
  const [personName, setPersonName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinProfileUrl, setLinkedinProfileUrl] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [businessCardImage, setBusinessCardImage] = useState<File | null>(null);
  const [businessCardPreview, setBusinessCardPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBusinessCardImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessCardPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setBusinessCardImage(null);
      setBusinessCardPreview(null);
    }
  };

  const handleExtractFromCard = async () => {
    if (!businessCardImage) {
      toast({ title: "No Image", description: "Please select a business card image first.", variant: "destructive" });
      return;
    }
    setIsOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(businessCardImage);
      reader.onload = async (e) => {
        const imageDataUri = e.target?.result as string;
        if (imageDataUri) {
          const extractedData: ExtractedLeadInfo | null = await extractLeadInfoFromCard({ imageDataUri });
          if (extractedData) {
            setPersonName(extractedData.personName || '');
            setCompanyName(extractedData.companyName || '');
            setEmail(extractedData.email || '');
            setPhone(extractedData.phone || '');
            toast({ title: "Data Extracted", description: "Lead details extracted from the business card. Please review." });
          } else {
            toast({ title: "OCR Failed", description: "Could not extract details from the card. Please enter manually.", variant: "destructive" });
          }
        }
      };
      reader.onerror = () => {
         toast({ title: "Error Reading File", description: "Could not read the image file.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to extract lead info from card:", error);
      toast({ title: "OCR Error", description: "An error occurred during business card processing.", variant: "destructive" });
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !personName.trim() || !email.trim()) {
      toast({ title: "Error", description: "Company Name, Person's Name, and Email are required.", variant: "destructive" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (linkedinProfileUrl && !linkedinProfileUrl.startsWith('http')) {
        toast({ title: "Invalid URL", description: "LinkedIn Profile URL must be a valid URL (e.g., https://linkedin.com/in/...)", variant: "destructive" });
        return;
    }


    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 700)); 
      
      const newLeadData = {
        companyName,
        personName,
        email,
        phone,
        linkedinProfileUrl,
        country,
      };
      const newLead = addLead(newLeadData); 
      
      toast({
        title: "Lead Created",
        description: `${personName} from ${companyName} has been successfully added as a lead.`,
      });
      
      onLeadAdded?.(newLead);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create lead:", error);
      toast({ title: "Error", description: "Failed to create lead. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setPersonName('');
    setEmail('');
    setPhone('');
    setLinkedinProfileUrl('');
    setCountry('');
    setBusinessCardImage(null);
    setBusinessCardPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" /> Add New Lead
          </DialogTitle>
          <DialogDescription>
            Enter details or upload a business card to create a new lead.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-3 max-h-[70vh] overflow-y-auto pr-2">
          <div className="p-4 border rounded-md bg-muted/30 space-y-3">
            <Label htmlFor="business-card-upload" className="flex items-center text-sm font-medium">
              <UploadCloud className="mr-2 h-4 w-4 text-primary" /> Upload Business Card (Optional)
            </Label>
            <Input 
              id="business-card-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="text-xs"
              ref={fileInputRef}
              disabled={isLoading || isOcrLoading}
            />
            {businessCardPreview && (
              <div className="mt-2 text-center">
                <img src={businessCardPreview} alt="Business card preview" className="max-w-full max-h-32 mx-auto rounded-md border" />
              </div>
            )}
            {businessCardImage && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleExtractFromCard} 
                disabled={isOcrLoading || isLoading} 
                className="w-full mt-2"
              >
                {isOcrLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                Extract Info from Card
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <Label htmlFor="lead-person-name">Person's Name <span className="text-destructive">*</span></Label>
              <Input id="lead-person-name" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="e.g., John Doe" disabled={isLoading || isOcrLoading} />
            </div>
             <div>
              <Label htmlFor="lead-company-name">Company Name <span className="text-destructive">*</span></Label>
              <Input id="lead-company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., Acme Innovations" disabled={isLoading || isOcrLoading} />
            </div>
            <div>
              <Label htmlFor="lead-email">Email <span className="text-destructive">*</span></Label>
              <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john.doe@acme.com" disabled={isLoading || isOcrLoading} />
            </div>
            <div>
              <Label htmlFor="lead-phone">Phone</Label>
              <Input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., (555) 123-4567" disabled={isLoading || isOcrLoading} />
            </div>
            <div>
              <Label htmlFor="lead-linkedin">LinkedIn Profile URL</Label>
              <Input id="lead-linkedin" type="url" value={linkedinProfileUrl} onChange={(e) => setLinkedinProfileUrl(e.target.value)} placeholder="e.g., https://linkedin.com/in/johndoe" disabled={isLoading || isOcrLoading} />
            </div>
            <div>
              <Label htmlFor="lead-country">Country</Label>
              <Select value={country} onValueChange={setCountry} disabled={isLoading || isOcrLoading}>
                <SelectTrigger id="lead-country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Countries</SelectLabel>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading || isOcrLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isOcrLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

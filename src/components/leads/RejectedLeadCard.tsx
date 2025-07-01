import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Mail, Phone, MapPin, Edit } from 'lucide-react';
import { Lead } from '@/types';

interface RejectedLeadCardProps {
  lead: Lead;
  onApprove?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  onUpdate?: (leadId: string, updatedLead: Partial<Lead>) => void;
}

export default function RejectedLeadCard({ lead, onApprove, onDelete, onUpdate }: RejectedLeadCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editData, setEditData] = React.useState({
    companyName: lead.companyName,
    personName: lead.personName,
    email: lead.email,
    phone: lead.phone || '',
    linkedinProfileUrl: lead.linkedinProfileUrl || '',
    country: lead.country || '',
    jobTitle: lead.jobTitle || '',
    website: lead.website || '',
    industry: lead.industry || '',
  });

  const handleEditChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(lead.id, editData);
    }
    setIsEditModalOpen(false);
  };

  const handleCancel = () => {
    setEditData({
      companyName: lead.companyName,
      personName: lead.personName,
      email: lead.email,
      phone: lead.phone || '',
      linkedinProfileUrl: lead.linkedinProfileUrl || '',
      country: lead.country || '',
      jobTitle: lead.jobTitle || '',
      website: lead.website || '',
      industry: lead.industry || '',
    });
    setIsEditModalOpen(false);
  };

  return (
    <>
      <Card className="shadow-sm border-l-4 border-l-red-500 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                {lead.companyName || <span className="italic text-muted-foreground">No Company</span>}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                {lead.personName || <span className="italic">No Name</span>}
              </p>
            </div>
            <Badge variant="destructive" className="text-xs px-2 py-1">
              Rejected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Contact Information */}
          <div className="space-y-1.5">
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.country && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{lead.country}</span>
              </div>
            )}
          </div>
          {/* Rejection Reasons */}
          {lead.rejectionReasons && lead.rejectionReasons.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-red-700 dark:text-red-400">Rejection Reasons:</h4>
              <div className="space-y-1">
                {lead.rejectionReasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs" 
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            {onApprove && (
              <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-200 hover:bg-green-50 h-8 text-xs" onClick={() => onApprove(lead.id)}>
                Approve
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs" onClick={() => onDelete(lead.id)}>
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] bg-white dark:bg-gray-900">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div>Edit Rejected Lead</div>
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  Update the lead information
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Edit Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={editData.companyName}
                    onChange={(e) => handleEditChange('companyName', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personName" className="text-sm font-medium">
                    Contact Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="personName"
                    value={editData.personName}
                    onChange={(e) => handleEditChange('personName', e.target.value)}
                    placeholder="Enter contact name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => handleEditChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-sm font-medium">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={editData.jobTitle}
                    onChange={(e) => handleEditChange('jobTitle', e.target.value)}
                    placeholder="Enter job title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                  <Input
                    id="country"
                    value={editData.country}
                    onChange={(e) => handleEditChange('country', e.target.value)}
                    placeholder="Enter country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                  <Input
                    id="website"
                    value={editData.website}
                    onChange={(e) => handleEditChange('website', e.target.value)}
                    placeholder="Enter website URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                  <Input
                    id="industry"
                    value={editData.industry}
                    onChange={(e) => handleEditChange('industry', e.target.value)}
                    placeholder="Enter industry"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="linkedinProfileUrl" className="text-sm font-medium">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedinProfileUrl"
                    value={editData.linkedinProfileUrl}
                    onChange={(e) => handleEditChange('linkedinProfileUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="w-full sm:w-auto order-3 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-3"
              onClick={handleSave}
            >
              <Edit className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
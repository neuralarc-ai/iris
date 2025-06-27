import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertTriangle, Mail, Phone, MapPin, ExternalLink, CheckCircle, XCircle, Edit } from 'lucide-react';
import { Lead } from '@/types';

interface RejectedLeadCardProps {
  lead: Lead;
  onApprove?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  onUpdate?: (leadId: string, updatedLead: Partial<Lead>) => void;
}

export default function RejectedLeadCard({ lead, onApprove, onDelete, onUpdate }: RejectedLeadCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isConfirmApproveOpen, setIsConfirmApproveOpen] = React.useState(false);
  const [editData, setEditData] = React.useState({
    companyName: lead.companyName,
    personName: lead.personName,
    email: lead.email,
    phone: lead.phone || '',
    linkedinProfileUrl: lead.linkedinProfileUrl || '',
    country: lead.country || ''
  });

  const handleCardClick = () => {
    setIsEditModalOpen(true);
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
      country: lead.country || ''
    });
    setIsEditModalOpen(false);
  };

  const handleApprove = () => {
    // Open confirmation dialog
    setIsConfirmApproveOpen(true);
  };

  const handleConfirmApprove = () => {
    if (onUpdate) {
      onUpdate(lead.id, editData);
    }
    
    if (onApprove) {
      onApprove(lead.id);
    }
    
    setIsEditModalOpen(false);
    setIsConfirmApproveOpen(false);
  };

  return (
    <>
      <Card 
        className="shadow-sm border-l-4 border-l-red-500 hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {lead.companyName}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{lead.personName}</p>
            </div>
            <Badge variant="destructive" className="text-xs px-2 py-1">
              Rejected
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Contact Information */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="text-primary hover:underline text-sm">
                {lead.email}
              </a>
            </div>
            
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{lead.phone}</span>
              </div>
            )}
            
            {lead.country && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{lead.country}</span>
              </div>
            )}
            
            {lead.linkedinProfileUrl && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <a 
                  href={lead.linkedinProfileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  LinkedIn Profile
                </a>
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
                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Created Date */}
          <div className="text-xs text-muted-foreground pt-1">
            Created: {new Date(lead.createdAt).toLocaleDateString('en-GB')}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            {onApprove && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50 h-8 text-xs"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit & Approve
              </Button>
            )}
            {onDelete && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
                onClick={() => onDelete(lead.id)}
              >
                <XCircle className="h-3 w-3 mr-1" />
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
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Edit className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div>Edit Rejected Lead</div>
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  Fix the issues and approve this lead
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Lead Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Company:</span>
                  <span className="ml-2 font-medium">{lead.companyName}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Contact:</span>
                  <span className="ml-2 font-medium">{lead.personName}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="ml-2 font-medium">{lead.email}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                  <span className="ml-2 font-medium">{lead.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Rejection Reasons */}
            {lead.rejectionReasons && lead.rejectionReasons.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Issues to Fix
                </h4>
                <div className="space-y-2">
                  {lead.rejectionReasons.map((reason, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Form */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Update Information</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={editData.companyName}
                    onChange={(e) => setEditData(prev => ({ ...prev, companyName: e.target.value }))}
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
                    onChange={(e) => setEditData(prev => ({ ...prev, personName: e.target.value }))}
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
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedinProfileUrl" className="text-sm font-medium">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedinProfileUrl"
                    value={editData.linkedinProfileUrl}
                    onChange={(e) => setEditData(prev => ({ ...prev, linkedinProfileUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                  <Input
                    id="country"
                    value={editData.country}
                    onChange={(e) => setEditData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Enter country"
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
              variant="outline" 
              className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20 w-full sm:w-auto order-2"
              onClick={handleSave}
            >
              <Edit className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto order-1 sm:order-3"
              onClick={handleApprove}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Approval */}
      <AlertDialog open={isConfirmApproveOpen} onOpenChange={setIsConfirmApproveOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Lead?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="space-y-3">
                <p>
                  Are you sure you want to approve this lead? This will:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Move the lead from "Rejected" to "Accepted"</li>
                  <li>Set the lead status to "New"</li>
                  <li>Make it available for normal lead management</li>
                </ul>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lead Details:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>{editData.companyName}</strong> - {editData.personName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{editData.email}</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmApproveOpen(false)}
              className="w-full sm:w-auto h-11 rounded-[4px] border border-[#2B2521] text-[#2B2521] font-medium text-base hover:bg-[#F8F7F3] transition"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApprove}
              className="w-full sm:w-auto h-11 rounded-[4px] bg-[#34A853] hover:bg-[#25953c] text-white font-semibold text-base flex items-center justify-center gap-2 px-6 transition"
            >
              <CheckCircle className="h-5 w-5 mr-1 -ml-1" />
              Approve
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 
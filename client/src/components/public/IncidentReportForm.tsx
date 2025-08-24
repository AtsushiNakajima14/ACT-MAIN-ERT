import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface IncidentReportFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IncidentReportForm({ isOpen, onClose }: IncidentReportFormProps) {
  const [formData, setFormData] = useState({
    location: '',
    description: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest('POST', '/api/user-reports', {
        type: 'emergency_report',
        title: 'Emergency Incident',
        message: data.description,
        location: data.location,
        priority: 'critical',
        metadata: {}
      });
    },
    onSuccess: () => {
      toast({
        title: "Emergency Report Sent",
        description: "Your emergency report has been submitted with CRITICAL PRIORITY. The team will respond immediately.",
      });
      onClose();
      setFormData({
        location: '',
        description: '',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-reports?pending=true'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit incident report. Please try again.",
        variant: "destructive",
      });
      console.error('Incident report error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modern-card border-l-4 border-l-emergency-red shadow-modern-xl max-w-lg" data-testid="incident-report-modal">
        <DialogHeader className="bg-gradient-to-r from-emergency-red-light to-red-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl p-6 -m-6 mb-6">
          <DialogTitle className="flex items-center space-x-3 text-emergency-red text-xl font-semibold">
            <div className="p-2 bg-emergency-red/10 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <span>Report Emergency</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="incident-report-form">
            <div>
              <Label htmlFor="incidentLocation" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Location *</span>
              </Label>
              <Input
                id="incidentLocation"
                placeholder="Where did this occur?"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="mt-2 modern-input"
                data-testid="input-incident-location"
              />
            </div>


            <div>
              <Label htmlFor="incidentDescription" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Description *</span>
              </Label>
              <Textarea
                id="incidentDescription"
                rows={4}
                placeholder="Describe the incident..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-2 modern-input"
                data-testid="textarea-incident-description"
              />
            </div>

            <Button
              type="submit"
              className="w-full emergency-gradient text-white font-bold py-4 text-lg modern-button hover:scale-105 transform transition-all duration-200 shadow-lg emergency-pulse"
              disabled={submitMutation.isPending}
              data-testid="button-submit-incident-report"
            >
              {submitMutation.isPending ? (
                <>Submitting...</>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Submit Emergency Report
                </>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

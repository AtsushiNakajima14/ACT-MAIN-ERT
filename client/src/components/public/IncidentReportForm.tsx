import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, MapPin, FileText, Wifi, WifiOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface IncidentReportFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IncidentReportForm({ isOpen, onClose }: IncidentReportFormProps) {
  const [formData, setFormData] = useState({
    location: '',
    description: '',
  });
  const [isQueuedOffline, setIsQueuedOffline] = useState(false);
  const [queuedSubmissionId, setQueuedSubmissionId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  
  // Listen for service worker messages about offline submissions
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'submission-queued') {
        setIsQueuedOffline(true);
        setQueuedSubmissionId(event.data.data.id);
        toast({
          title: "Emergency Report Queued",
          description: "You're offline, but your emergency report has been queued and will be submitted when connection is restored.",
          variant: "default",
        });
      } else if (event.data?.type === 'submission-success' && event.data.data.id === queuedSubmissionId) {
        setIsQueuedOffline(false);
        setQueuedSubmissionId(null);
        toast({
          title: "Emergency Report Sent",
          description: "Your queued emergency report has been successfully submitted!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/user-reports'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user-reports?pending=true'] });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [queuedSubmissionId, toast, queryClient]);

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/user-reports', {
        type: 'emergency_report',
        title: 'Emergency Incident',
        message: data.description,
        location: data.location,
        priority: 'critical',
        metadata: {}
      });
      
      // Check if the response indicates offline queuing
      const responseData = await response.json();
      return responseData;
    },
    onSuccess: (responseData) => {
      if (responseData?.offline || responseData?.queuedForSync) {
        // This is handled by the service worker message listener
        setIsQueuedOffline(true);
      } else {
        toast({
          title: "Emergency Report Sent",
          description: "Your emergency report has been submitted with CRITICAL PRIORITY. The team will respond immediately.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/user-reports'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user-reports?pending=true'] });
      }
      
      onClose();
      setFormData({
        location: '',
        description: '',
      });
    },
    onError: (error) => {
      // Only show error if we're actually online and it wasn't handled by service worker
      if (isOnline) {
        toast({
          title: "Error",
          description: "Failed to submit incident report. Please try again.",
          variant: "destructive",
        });
      }
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
          {/* Offline indicator */}
          {!isOnline && (
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Offline Mode:</strong> Your emergency report will be queued and submitted when connection is restored.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Queued submission indicator */}
          {isQueuedOffline && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Report Queued:</strong> Your emergency report is waiting to be sent when connection returns.
              </AlertDescription>
            </Alert>
          )}
          
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

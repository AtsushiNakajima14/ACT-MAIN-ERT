import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Users, MapPin, MessageSquare, WifiOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface HelpRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpRequestForm({ isOpen, onClose }: HelpRequestFormProps) {
  const [formData, setFormData] = useState({
    location: '',
    message: '',
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
          title: "Help Request Queued",
          description: "You're offline, but your help request has been queued and will be submitted when connection is restored.",
          variant: "default",
        });
      } else if (event.data?.type === 'submission-success' && event.data.data.id === queuedSubmissionId) {
        setIsQueuedOffline(false);
        setQueuedSubmissionId(null);
        toast({
          title: "Help Request Sent",
          description: "Your queued help request has been successfully submitted!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/user-reports'] });
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
        type: 'help_request',
        title: 'Help Request',
        message: data.message,
        location: data.location,
        priority: 'low',
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
          title: "Help Request Sent",
          description: "Your help request has been sent to the team. They will assist you when available.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/user-reports'] });
      }
      
      onClose();
      setFormData({
        location: '',
        message: '',
      });
    },
    onError: (error) => {
      // Only show error if we're actually online and it wasn't handled by service worker
      if (isOnline) {
        toast({
          title: "Error",
          description: "Failed to send help request. Please try again.",
          variant: "destructive",
        });
      }
      console.error('Help request error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.message) {
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
      <DialogContent className="modern-card border-l-4 border-l-act-yellow shadow-modern-xl max-w-lg" data-testid="help-request-modal">
        <DialogHeader className="bg-gradient-to-r from-act-yellow-light to-yellow-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl p-6 -m-6 mb-6">
          <DialogTitle className="flex items-center space-x-3 text-act-yellow text-xl font-semibold">
            <div className="p-2 bg-act-yellow/10 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <span>Request Emergency Help</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Offline indicator */}
          {!isOnline && (
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Offline Mode:</strong> Your help request will be queued and submitted when connection is restored.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Queued submission indicator */}
          {isQueuedOffline && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Request Queued:</strong> Your help request is waiting to be sent when connection returns.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="help-request-form">

            <div>
              <Label htmlFor="location" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Your Location *</span>
              </Label>
              <Input
                id="location"
                placeholder="Building, Room Number, or Description"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="mt-2 modern-input"
                data-testid="input-location"
              />
            </div>


            <div>
              <Label htmlFor="message" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Description *</span>
              </Label>
              <Textarea
                id="message"
                rows={4}
                placeholder="Describe your situation..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="mt-2 modern-input"
                data-testid="textarea-message"
              />
            </div>


            <Button
              type="submit"
              className="w-full warning-gradient text-white font-semibold py-4 text-lg modern-button hover:scale-105 transform transition-all duration-200 shadow-lg"
              disabled={submitMutation.isPending}
              data-testid="button-submit-help-request"
            >
              {submitMutation.isPending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send Help Request
                </>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

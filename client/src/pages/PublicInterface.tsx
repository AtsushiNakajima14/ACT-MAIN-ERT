import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Phone, MessageCircle, MapPin, Clock, Users, BriefcaseMedical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WebSocketMessage } from '@/lib/types';
import EmergencyContactCard from '@/components/public/EmergencyContactCard';
import HelpRequestForm from '@/components/public/HelpRequestForm';
import IncidentReportForm from '@/components/public/IncidentReportForm';
import StatusDisplay from '@/components/public/StatusDisplay';
import { EmergencyAlert } from '@shared/schema';

export default function PublicInterface() {
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const queryClient = useQueryClient();

  const { isConnected, sendMessage } = useWebSocket((message: WebSocketMessage) => {
    try {
      switch (message.type) {
        case 'emergency-alert-broadcast':
          setEmergencyAlerts(prev => [message.data, ...prev]);
          break;
        case 'emergency-alert-deactivated':
          setEmergencyAlerts(prev => prev.filter(alert => alert.id !== message.data.id));
          break;
        case 'system-status-updated':
          queryClient.invalidateQueries({ queryKey: ['/api/system-status'] });
          queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  useEffect(() => {
    if (isConnected) {
      sendMessage({ type: 'join-public' });
    }
  }, [isConnected, sendMessage]);

  const { data: activeAlerts = [] } = useQuery<EmergencyAlert[]>({
    queryKey: ['/api/emergency-alerts'],
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (activeAlerts.length > 0 && emergencyAlerts.length === 0) {
      setEmergencyAlerts(activeAlerts);
    }
  }, [activeAlerts.length]);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'evacuation':
        return 'bg-emergency-red border-red-600';
      case 'warning':
        return 'bg-act-yellow border-yellow-600';
      case 'drill':
        return 'bg-act-blue border-blue-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
     
      {emergencyAlerts.length > 0 && (
        <div className="bg-emergency-red text-white p-4 shadow-lg" data-testid="emergency-alerts">
          <div className="max-w-7xl mx-auto">
            {emergencyAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center space-x-3 mb-2 last:mb-0">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
                <div>
                  <span className="font-bold">{alert.title}</span>
                  <span className="ml-2">{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-modern-xl border-b-4 border-act-blue">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-6 sm:space-y-0">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center shadow-modern-lg ring-4 ring-act-blue/20">
                <img 
                  src="/ACTIEF-ERT.jpg" 
                  alt="ACT Emergency Response Team Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1" data-testid="header-title">
                  Emergency Response Team
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-1">
                  Asian College of Technology - Main Campus
                </p>
                <p className="text-xs sm:text-sm text-act-blue font-semibold bg-act-blue/10 px-3 py-1 rounded-full inline-block">
                  "Let's do BETTER let's ACT together"
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto text-left sm:text-right space-y-3">
              <Button 
                asChild
                variant="outline" 
                size="sm"
                className="bg-act-blue text-white border-act-blue hover:bg-blue-700 w-full sm:w-auto"
                data-testid="button-operator-access"
              >
                <a href="/operator">Operator Access</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            <Card className="modern-card border-l-4 border-l-emergency-red shadow-modern-xl hover:shadow-modern-2xl transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-emergency-red-light to-red-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl border-b border-red-200/30">
                <CardTitle className="flex items-center space-x-3 text-emergency-red">
                  <div className="p-2 bg-emergency-red/10 rounded-lg">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <span className="font-semibold">Emergency Situation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base leading-relaxed">
                  Report a critical emergency situation immediately. This will alert the response team with CRITICAL PRIORITY.
                </p>
                <Button 
                  onClick={() => setShowIncidentForm(true)}
                  className="w-full emergency-gradient text-white font-bold modern-button hover:scale-105 transform transition-all duration-200"
                  data-testid="button-report-emergency"
                >
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  REPORT EMERGENCY
                </Button>
              </CardContent>
            </Card>

            <EmergencyContactCard />

            <StatusDisplay />
          </div>

          <div className="space-y-4 sm:space-y-6">
            
            <Card className="modern-card border-l-4 border-l-act-yellow shadow-modern-lg hover:shadow-modern-xl transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-act-yellow-light to-yellow-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl border-b border-yellow-200/30">
                <CardTitle className="flex items-center space-x-3 text-act-yellow">
                  <div className="p-2 bg-act-yellow/10 rounded-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <span className="font-semibold">Need Help?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base leading-relaxed">
                  Get assistance from our team for non-emergency situations.
                </p>
                <Button 
                  onClick={() => setShowHelpForm(true)}
                  className="w-full warning-gradient text-white font-semibold modern-button hover:scale-105 transform transition-all duration-200"
                  data-testid="button-get-help"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Get Help
                </Button>
              </CardContent>
            </Card>

            
            <Card className="modern-card border-l-4 border-l-gray-400 shadow-modern-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl border-b border-gray-200/30">
                <CardTitle className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <div className="p-2 bg-gray-400/10 rounded-lg">
                    <Shield className="h-6 w-6" />
                  </div>
                  <span className="font-semibold">Emergency Guidelines</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start space-x-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      <strong>Stay Calm:</strong> Provide clear location details
                    </p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      <strong>Be Specific:</strong> Describe the emergency type
                    </p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <BriefcaseMedical className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      <strong>Medical Station:</strong> 8th Floor, Student Lounge, Cyber Tower 2
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      <HelpRequestForm 
        isOpen={showHelpForm}
        onClose={() => setShowHelpForm(false)}
      />
      
      <IncidentReportForm
        isOpen={showIncidentForm}
        onClose={() => setShowIncidentForm(false)}
      />
      
    </div>
  );
}

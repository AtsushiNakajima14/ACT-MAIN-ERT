import { useState } from 'react';
import { Shield, AlertTriangle, Phone, MessageCircle, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import IncidentReportForm from '@/components/public/IncidentReportForm';

export default function EmergencyPublicPage() {
  const [showReportForm, setShowReportForm] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="bg-white shadow-lg border-b-4 border-act-blue">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-act-blue rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Emergency Response Team
                </h1>
                <p className="text-lg text-gray-600">
                  Asian College of Technology - Main Campus
                </p>
                <p className="text-sm text-act-blue font-semibold">
                  "Let's do BETTER let's ACT together"
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-green-600 font-semibold">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>ERT Team Available</span>
              </div>
              <p className="text-sm text-gray-600">Emergency Response</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-semibold">All systems operational - ERT Team ready for emergency response</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <Card className="border-2 border-red-200 shadow-lg">
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="h-6 w-6" />
                  <span>Report Emergency</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 mb-4">
                  If you have an emergency or need immediate assistance, report it here. 
                  Our Emergency Response Team will be notified instantly.
                </p>
                <Button 
                  onClick={() => setShowReportForm(true)}
                  className="emergency-gradient text-white font-bold py-3 px-6 text-lg emergency-pulse"
                  data-testid="button-report-emergency"
                >
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  REPORT EMERGENCY
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center space-x-2 text-blue-700">
                  <Phone className="h-6 w-6" />
                  <span>Emergency Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Emergency Hotline</p>
                        <p className="text-xl font-bold text-green-600">+961 8 097 532</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button 
                      asChild
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      data-testid="button-facebook-chat"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <MessageCircle className="h-5 w-5" />
                        <span>Emergency Chat Support</span>
                      </span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="space-y-6">
            
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <Shield className="h-6 w-6" />
                  <span>Current Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">ERT Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      READY
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Response Time</span>
                    <span className="text-green-600 font-semibold">2-5 minutes</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>


            <Card className="border-2 border-yellow-200 shadow-lg">
              <CardHeader className="bg-yellow-50">
                <CardTitle className="text-yellow-700">Emergency Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-gray-700">
                      <strong>Stay Calm:</strong> Provide clear location details
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-gray-700">
                      <strong>Be Specific:</strong> Describe the emergency type
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <BriefcaseMedical className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-gray-700">
                      <strong>Medical Station:</strong> 8th Floor, Student Lounge, Cyber Tower 2
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Emergency Report Form Modal */}
      {showReportForm && (
        <IncidentReportForm 
          isOpen={showReportForm}
          onClose={() => setShowReportForm(false)}
        />
      )}
    </div>
  );
}
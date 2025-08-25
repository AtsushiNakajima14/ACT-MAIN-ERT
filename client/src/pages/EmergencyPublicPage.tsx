import { useState } from 'react';
import { Shield, AlertTriangle, Phone, MessageCircle, MapPin, Clock, BriefcaseMedical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import IncidentReportForm from '@/components/public/IncidentReportForm';

export default function EmergencyPublicPage() {
  const [showReportForm, setShowReportForm] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="bg-white shadow-lg border-b-4 border-act-blue">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-act-blue rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  Emergency Response Team
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-tight">
                  Asian College of Technology - Main Campus
                </p>
                <p className="text-xs sm:text-sm text-act-blue font-semibold">
                  "Let's do BETTER let's ACT together"
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto text-left sm:text-right">
              <div className="flex items-center space-x-2 text-green-600 font-semibold">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm sm:text-base">ERT Team Available</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Emergency Response</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-green-800 font-semibold text-sm sm:text-base leading-relaxed">All systems operational - ERT Team ready for emergency response</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            <Card className="border-2 border-red-200 shadow-lg">
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="h-6 w-6" />
                  <span>Report Emergency</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                  If you have an emergency or need immediate assistance, report it here. 
                  Our Emergency Response Team will be notified instantly.
                </p>
                <Button 
                  onClick={() => setShowReportForm(true)}
                  className="emergency-gradient text-white font-bold py-3 px-4 sm:px-6 text-sm sm:text-base lg:text-lg emergency-pulse w-full min-h-[48px]"
                  data-testid="button-report-emergency"
                >
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
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
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 sm:p-4 bg-green-50 rounded-lg">
                      <Phone className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">Emergency Hotline</p>
                        <p className="text-lg sm:text-xl font-bold text-green-600">+961 8 097 532</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button 
                      asChild
                      className="w-full bg-blue-600 hover:bg-blue-700 min-h-[48px] text-sm sm:text-base"
                      data-testid="button-facebook-chat"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Emergency Chat Support</span>
                      </span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="space-y-4 sm:space-y-6">
            
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <Shield className="h-6 w-6" />
                  <span>Current Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 text-sm sm:text-base">ERT Status</span>
                    <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-semibold">
                      READY
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 text-sm sm:text-base">Response Time</span>
                    <span className="text-green-600 font-semibold text-sm sm:text-base">2-5 minutes</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>


            <Card className="border-2 border-yellow-200 shadow-lg">
              <CardHeader className="bg-yellow-50">
                <CardTitle className="text-yellow-700">Emergency Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-yellow-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 leading-relaxed">
                      <strong>Stay Calm:</strong> Provide clear location details
                    </p>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 leading-relaxed">
                      <strong>Be Specific:</strong> Describe the emergency type
                    </p>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-yellow-50 rounded-lg">
                    <BriefcaseMedical className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 leading-relaxed">
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
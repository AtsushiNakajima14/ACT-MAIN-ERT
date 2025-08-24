import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmergencyContactCard() {
  const handleCallEmergency = () => {
    window.open('tel:+96180975532', '_self');
  };

  const handleEmergencyChat = () => {
    window.open('https://www.facebook.com/profile.php?id=100089529462572', '_blank');
  };

  return (
    <Card className="modern-card border-l-4 border-l-emergency-red shadow-modern-lg group hover:shadow-modern-xl transition-all duration-200" data-testid="emergency-contact-card">
      <CardHeader className="bg-gradient-to-r from-emergency-red-light to-red-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl border-b border-red-200/30">
        <CardTitle className="flex items-center space-x-3 text-emergency-red">
          <div className="p-2 bg-emergency-red/10 rounded-lg">
            <Phone className="h-6 w-6" />
          </div>
          <span className="font-semibold">Emergency Contact</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-xl border border-green-200/50">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Phone className="h-6 w-6 text-green-600 flex-shrink-0" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Emergency Hotline</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 tracking-wide" data-testid="emergency-number">
                  +961 8 097 532
                </p>
              </div>
            </div>
            <Button 
              className="w-full success-gradient text-white py-4 font-semibold text-sm sm:text-base modern-button hover:scale-105 transform transition-all duration-200"
              onClick={handleCallEmergency}
              data-testid="button-call-emergency"
            >
              <Phone className="h-5 w-5 mr-2" />
              Call Now
            </Button>
          </div>
          <div className="space-y-4">
            <Button 
              className="w-full act-gradient text-white py-4 font-semibold text-sm sm:text-base modern-button hover:scale-105 transform transition-all duration-200"
              onClick={handleEmergencyChat}
              data-testid="button-emergency-chat"
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Emergency Chat Support</span>
              <span className="sm:hidden">Emergency Chat</span>
            </Button>
            <div className="text-center p-3 bg-blue-50/50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Leon Kilat St. corner N.B. Bacalso Ave., Cebu City, Philippines
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

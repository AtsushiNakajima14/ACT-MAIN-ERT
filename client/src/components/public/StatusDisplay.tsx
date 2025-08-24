import { useQuery } from '@tanstack/react-query';
import { Shield, Clock, Users, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemStatus, TeamMember } from '@shared/schema';

export default function StatusDisplay() {
  const { data: systemStatus = [] } = useQuery<SystemStatus[]>({
    queryKey: ['/api/system-status'],
    refetchInterval: 3000,
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    refetchInterval: 2000,
  });

  const onDutyMembers = teamMembers.filter(member => 
    member.status === 'on_duty' || member.status === 'available'
  );

  const getStatusIcon = (status: string) => {
    return status === 'operational' ? (
      <CheckCircle className="h-4 w-4 text-status-green" />
    ) : (
      <Clock className="h-4 w-4 text-act-yellow" />
    );
  };

  const getStatusText = (component: SystemStatus) => {
    if (component.component === 'medical_supplies') {
      return `${component.level || 0}% Stocked`;
    }
    if (component.component === 'vehicles') {
      return `${component.level || 0}% Ready`;
    }
    return component.status === 'operational' ? 'All Systems Active' : 'Limited Operation';
  };

  return (
    <Card className="modern-card border-l-4 border-l-status-green shadow-modern-lg group" data-testid="status-display">
      <CardHeader className="bg-gradient-to-r from-status-green-light to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl border-b border-green-200/30">
        <CardTitle className="flex items-center space-x-3 text-status-green">
          <div className="p-2 bg-status-green/10 rounded-lg">
            <Shield className="h-6 w-6" />
          </div>
          <span className="font-semibold">Current Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-5" data-testid="status-items">
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-xl border border-green-200/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300 flex items-center font-semibold">
                <div className="p-2 bg-status-green/10 rounded-lg mr-3">
                  <Users className="h-4 w-4 text-status-green" />
                </div>
                ERT Team Members
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-status-green rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-status-green" data-testid="team-count">
                  {onDutyMembers.length} On Duty
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-700/70 rounded-lg border border-green-100/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        member.status === 'on_duty' ? 'bg-status-green animate-pulse' :
                        member.status === 'available' ? 'bg-blue-500' :
                        member.status === 'off_duty' ? 'bg-gray-400' :
                        'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100" data-testid={`member-name-${member.id}`}>
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300" data-testid={`member-role-${member.id}`}>
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      member.status === 'on_duty' ? 'bg-status-green/20 text-status-green' :
                      member.status === 'available' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                      member.status === 'off_duty' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                      'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                    }`} data-testid={`member-status-${member.id}`}>
                      {member.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No team member information available</p>
                </div>
              )}
            </div>
          </div>
          

          {systemStatus.map((component) => (
            <div key={component.id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200">
              <span className="text-gray-700 dark:text-gray-300 capitalize font-medium">
                {component.component.replace('_', ' ')}
              </span>
              <div className="flex items-center space-x-3">
                {getStatusIcon(component.status)}
                <span className={`text-sm font-semibold ${
                  component.status === 'operational' ? 'text-status-green' : 'text-act-yellow'
                }`} data-testid={`status-${component.component}`}>
                  {getStatusText(component)}
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200/50 bg-gray-50/30 dark:bg-gray-800/30 rounded-lg p-3">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useQuery } from '@tanstack/react-query';
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamMember } from '@shared/schema';

interface TeamStatusPanelProps {
  onNavigateToTeam?: () => void;
}

export default function TeamStatusPanel({ onNavigateToTeam }: TeamStatusPanelProps) {
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    refetchInterval: 2000, 
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_duty':
      case 'available':
        return 'bg-status-green';
      case 'off_duty':
        return 'bg-gray-400';
      case 'unavailable':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'on_duty':
        return 'On Duty';
      case 'available':
        return 'Available';
      case 'off_duty':
        return 'Off Duty';
      case 'unavailable':
        return 'Unavailable';
      default:
        return status;
    }
  };

  const handleViewAllTeam = () => {
    if (onNavigateToTeam) {
      onNavigateToTeam();
    }
  };

  return (
    <Card className="modern-card border-l-4 border-l-act-blue shadow-modern-lg" data-testid="team-status-panel">
      <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-act-blue-light to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
        <CardTitle className="text-gray-900 dark:text-gray-100 font-semibold">Team Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4" data-testid="team-members-list">
          {teamMembers.slice(0, 5).map((member) => (
            <div 
              key={member.id} 
              className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200"
              data-testid={`team-member-${member.id}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 ${getStatusColor(member.status)} rounded-xl flex items-center justify-center shadow-sm`}>
                  <User className="text-white h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100" data-testid="member-name">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium" data-testid="member-role">
                    {member.role}
                  </p>
                </div>
              </div>
              <Badge 
                className={`${getStatusColor(member.status)} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm`}
                data-testid={`member-status-${member.status}`}
              >
                {getStatusDisplay(member.status)}
              </Badge>
            </div>
          ))}
        </div>

        <Button 
          variant="ghost"
          className="w-full mt-6 bg-act-blue/10 hover:bg-act-blue/20 text-act-blue font-semibold modern-button transition-all duration-200"
          onClick={handleViewAllTeam}
          data-testid="button-view-all-team"
        >
          View All Team Members
        </Button>
      </CardContent>
    </Card>
  );
}

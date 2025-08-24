import { MapPin, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Incident } from '@shared/schema';

interface IncidentCardProps {
  incident: Incident;
}

export default function IncidentCard({ incident }: IncidentCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'border-l-4 border-emergency-red bg-emergency-red-light shadow-modern-lg hover:shadow-modern-xl';
      case 'medium':
        return 'border-l-4 border-act-yellow bg-act-yellow-light shadow-modern hover:shadow-modern-lg';
      case 'low':
        return 'border-l-4 border-act-blue bg-act-blue-light shadow-modern hover:shadow-modern-lg';
      default:
        return 'border-l-4 border-gray-400 bg-gray-50 shadow-modern hover:shadow-modern-lg';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'bg-emergency-red text-white shadow-sm';
      case 'medium':
        return 'bg-act-yellow text-white shadow-sm';
      case 'low':
        return 'bg-act-blue text-white shadow-sm';
      default:
        return 'bg-gray-500 text-white shadow-sm';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const incidentDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - incidentDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  const handleRespond = async () => {
    try {
      const response = await fetch(`/api/incidents/${incident.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'in_progress' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update incident status');
      }
      
    } catch (error) {
      console.error('Error responding to incident:', error);
    }
  };

  return (
    <div 
      className={`modern-card rounded-xl p-6 transition-all duration-200 ${getPriorityColor(incident.priority)} group hover:translate-y-[-2px]`}
      data-testid={`incident-card-${incident.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <Badge 
              className={`${getPriorityBadgeColor(incident.priority)} text-xs font-semibold px-3 py-1 rounded-full`}
              data-testid={`priority-badge-${incident.priority}`}
            >
              {incident.priority.toUpperCase()}
            </Badge>
            <span className="text-sm text-gray-500 flex items-center font-medium">
              <Clock className="h-3 w-3 mr-1" />
              {getTimeAgo(incident.createdAt?.toString() || new Date().toISOString())}
            </span>
          </div>
          
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-lg" data-testid="incident-title">
            {incident.title}
          </h4>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed" data-testid="incident-description">
            {incident.description}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center font-medium" data-testid="incident-location">
              <MapPin className="h-4 w-4 mr-1" />
              {incident.location}
            </span>
            {incident.assignedTo && (
              <span className="flex items-center font-medium" data-testid="incident-assigned">
                <User className="h-4 w-4 mr-1" />
                Assigned
              </span>
            )}
          </div>
        </div>
        
        <div className="ml-4">
          <Button 
            className={`${incident.priority === 'critical' || incident.priority === 'high'
              ? 'emergency-gradient hover:scale-105' 
              : incident.priority === 'medium'
              ? 'warning-gradient hover:scale-105'
              : 'act-gradient hover:scale-105'} text-white font-semibold modern-button transform transition-all duration-200`}
            onClick={handleRespond}
            data-testid={`button-respond-${incident.id}`}
          >
            Respond
          </Button>
        </div>
      </div>
    </div>
  );
}

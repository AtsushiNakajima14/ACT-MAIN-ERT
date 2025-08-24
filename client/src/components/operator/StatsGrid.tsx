import { AlertTriangle, Users, Clock, Shield, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardStats } from '@/lib/types';

interface StatsGridProps {
  stats?: DashboardStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const statsData = [
    {
      title: 'Active Incidents',
      subtitle: 'Emergency Response',
      value: stats?.activeIncidents || 0,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
      testId: 'stat-active-incidents',
      priority: 'critical'
    },
    {
      title: 'Team On Duty',
      subtitle: 'Available Personnel',
      value: stats?.teamOnDuty || '0/0',
      icon: Users,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      textColor: 'text-emerald-700',
      iconColor: 'text-emerald-600',
      testId: 'stat-team-on-duty',
      priority: 'normal'
    },
    {
      title: 'Pending Reports',
      subtitle: 'Awaiting Review',
      value: stats?.pendingReports || 0,
      icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100',
      textColor: 'text-amber-700',
      iconColor: 'text-amber-600',
      testId: 'stat-pending-reports',
      priority: 'medium'
    },
    {
      title: 'System Status',
      subtitle: 'Operations Center',
      value: 'Online',
      icon: Activity,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      testId: 'stat-system-status',
      priority: 'normal'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6" data-testid="stats-grid">
      {statsData.map((stat, index) => (
        <Card 
          key={index} 
          className={`stat-card overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-lg ${
            stat.priority === 'critical' ? 'ring-2 ring-red-200' : ''
          }`}
        >
          <CardContent className={`p-4 lg:p-6 bg-gradient-to-br ${stat.bgGradient} dark:from-slate-800 dark:to-slate-700`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <stat.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.iconColor} mr-2 flex-shrink-0`} />
                  <h3 className={`text-xs lg:text-sm font-semibold ${stat.textColor} truncate`}>
                    {stat.title}
                  </h3>
                </div>
                <p className={`text-2xl lg:text-3xl font-bold ${stat.textColor} mb-1 tracking-tight`} data-testid={stat.testId}>
                  {stat.value}
                </p>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="truncate">{stat.subtitle}</span>
                </div>
              </div>
            </div>
            
            {stat.priority === 'critical' && typeof stat.value === 'number' && stat.value > 0 && (
              <div className="mt-4 relative">
                <div className="w-full bg-red-200 dark:bg-red-900 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <span className="text-xs text-red-600 font-medium mt-1 block">Action Required</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

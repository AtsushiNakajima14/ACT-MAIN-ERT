import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, AlertTriangle, Users, Clock, Plus, LogOut, User, Menu, X, MapPin, 
  Bell, Activity, Radio, Phone, MessageSquare, Home, Settings, Search
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth, useLogout } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WebSocketMessage, DashboardStats } from '@/lib/types';

const playNotificationSound = (soundType: 'emergency' | 'alert' | 'info' = 'alert') => {
  try {
    const emergencyBeep = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmBUDkF83e3mhRoHFYPa5NmhVQ0KWqDr5qBLFAbR2fzlij0PDXrE7ufMhSYCM4LT6tiJWwwDV6vs6Z1NExH0';
    
    const baseVolume = soundType === 'emergency' ? 1.0 : 0.6;
    
    if (soundType === 'emergency') {
      const createAndPlayAudioBurst = () => {
        const audioInstances: HTMLAudioElement[] = [];
        
        for (let i = 0; i < 8; i++) {
          const audio = new Audio(emergencyBeep);
          audio.volume = baseVolume;
          audioInstances.push(audio);
        }
        
        audioInstances.forEach(audio => audio.play());
      };
      
      createAndPlayAudioBurst(); 
      setTimeout(() => createAndPlayAudioBurst(), 150);
      setTimeout(() => createAndPlayAudioBurst(), 300);
      setTimeout(() => createAndPlayAudioBurst(), 450);
      setTimeout(() => createAndPlayAudioBurst(), 600);
      setTimeout(() => createAndPlayAudioBurst(), 750);
      setTimeout(() => createAndPlayAudioBurst(), 900);
      setTimeout(() => createAndPlayAudioBurst(), 1050);

      setTimeout(() => {
        createAndPlayAudioBurst(); 
        setTimeout(() => createAndPlayAudioBurst(), 150);
        setTimeout(() => createAndPlayAudioBurst(), 300);
        setTimeout(() => createAndPlayAudioBurst(), 450);
      }, 1500);
      
    } else {

      const audio = new Audio(emergencyBeep);
      audio.volume = baseVolume;
      audio.play();
    }
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};

const playEmergencyNotification = () => playNotificationSound('emergency');
const playIncidentNotification = (priority: string) => {
  const soundType = priority === 'critical' ? 'emergency' : 'alert';
  playNotificationSound(soundType);
};
const playNewReportNotification = (isEmergency: boolean) => {
  playNotificationSound(isEmergency ? 'emergency' : 'info');
};
import StatsGrid from '@/components/operator/StatsGrid';
import IncidentCard from '@/components/operator/IncidentCard';
import UserReportsPanel from '@/components/operator/UserReportsPanel';
import TeamStatusPanel from '@/components/operator/TeamStatusPanel';
import AddTeamMemberModal from '@/components/operator/AddTeamMemberModal';
import { NotificationSettings } from '@/components/NotificationSettings';
import { NetworkStatus, DataFreshnessIndicator } from '@/components/offline-indicator';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Incident, UserReport, TeamMember } from '@shared/schema';

export default function OperatorDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logout = useLogout();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { isSubscribed, isSupported, subscribe, isLoading: pushLoading } = usePushNotifications();
  const isOnline = useOnlineStatus();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (error) {
      toast({
        title: 'Logout Error',
        description: 'Failed to logout properly, but you\'ll be redirected',
        variant: 'destructive',
      });
      window.location.href = '/';
    }
  };

  const [wasConnected, setWasConnected] = useState(true);

  const { isConnected, sendMessage, reconnectAttempts, maxReconnectAttempts } = useWebSocket((message: WebSocketMessage) => {
    try {
      switch (message.type) {
        case 'user-report-created':
          setActiveView('reports');
          if (message.data?.type === 'emergency_report') {
            playEmergencyNotification();
            toast({
              title: '🚨 EMERGENCY REPORT',
              description: `Critical emergency at ${message.data.location}`,
              className: 'bg-red-50 border-red-200 text-red-800',
            });
          } else {
            playNewReportNotification(false);
            toast({
              title: '📋 NEW HELP REQUEST',
              description: 'A new help request has been received and is now pending.',
              className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            });
          }
          queryClient.invalidateQueries({ queryKey: ['/api/user-reports'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
          break;
        case 'user-report-updated':
          queryClient.invalidateQueries({ queryKey: ['/api/user-reports'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
          break;
        case 'incident-created':
         
          if (message.data?.priority) {
            playIncidentNotification(message.data.priority);
          } else {
            playEmergencyNotification();
          }
          toast({
            title: '🚨 NEW INCIDENT',
            description: `${message.data?.priority?.toUpperCase() || 'CRITICAL'}: ${message.data?.title || 'Emergency Incident'}`,
            className: 'bg-red-50 border-red-200 text-red-800',
          });
          queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
          break;
        case 'incident-updated':
        case 'incident-assigned':
          queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
          break;
        case 'emergency-report-converted':
         
          playEmergencyNotification();
          toast({
            title: '🚨 EMERGENCY ESCALATED',
            description: 'Emergency report converted to active incident',
            className: 'bg-red-50 border-red-200 text-red-800',
          });
         
          queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
          queryClient.invalidateQueries({ queryKey: ['/api/user-reports'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
          break;
        case 'team-status-updated':
          queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
          break;
        case 'system-status-updated':
          queryClient.invalidateQueries({ queryKey: ['/api/system-status'] });
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  useEffect(() => {
    if (isConnected) {
      sendMessage({ type: 'join-operator' });
    }
  }, [isConnected, sendMessage]);
  
  useEffect(() => {
    if (isConnected && !wasConnected) {
    
      toast({
        title: '🟢 Connection Restored',
        description: 'Real-time notifications are now active. All systems operational.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      playNotificationSound('info');
    } else if (!isConnected && wasConnected) {
     
      toast({
        title: '🔴 Connection Lost',
        description: 'Using backup polling for notifications. Attempting to reconnect...',
        className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      });
    }
    setWasConnected(isConnected);
  }, [isConnected, wasConnected, toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard-stats'],
    refetchInterval: isConnected ? 10000 : 2000, 
    enabled: !!user && user.role === 'operator',
  });

  const { data: activeIncidents = [] } = useQuery<Incident[]>({
    queryKey: ['/api/incidents?active=true'],
    refetchInterval: isConnected ? 5000 : 1000, 
    enabled: !!user && user.role === 'operator',
  });

  const { data: criticalEmergencyReports = [] } = useQuery<UserReport[]>({
    queryKey: ['/api/user-reports?pending=true'],
    refetchInterval: isConnected ? 5000 : 1000, 
    enabled: true, 
    select: (reports: UserReport[]) => reports.filter(report => 
      report.type === 'emergency_report' && report.priority === 'critical'
    ),
  });

  const { data: allTeamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    refetchInterval: isConnected ? 10000 : 3000, 
    enabled: !!user,
  });


  const createNewIncident = async () => {
    try {
      const incidentData = {
        title: 'New Emergency Incident',
        description: 'test incident for system testing :3',
        priority: 'high',
        location: 'Main Campus',
        coordinates: { lat: 34.0522, lng: -118.2437 }
      };

      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(incidentData)
      });

      if (!response.ok) {
        throw new Error('Failed to create incident');
      }

      toast({
        title: 'Incident Created',
        description: 'New incident has been added to the system',
      });
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create new incident',
        variant: 'destructive',
      });
    }
  };

  const updateTeamMemberStatus = async (memberId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/team-members/${memberId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update team member status');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      
      toast({
        title: 'Status Updated',
        description: 'Team member status has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update team member status',
        variant: 'destructive',
      });
    }
  };

  const removeTeamMember = async (memberId: string, memberName: string) => {
    console.log('removeTeamMember called with:', { memberId, memberName });
    
    if (!confirm(`Are you sure you want to remove ${memberName} from the team? This action cannot be undone.`)) {
      console.log('User cancelled removal');
      return;
    }

    console.log('Starting removal process for member:', memberId);

    try {
      const response = await fetch(`/api/team-members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete failed with response:', errorText);
        throw new Error(`Failed to remove team member: ${response.status}`);
      }

      const result = await response.json();
      console.log('Delete successful:', result);

      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      
      toast({
        title: 'Member Removed',
        description: `${memberName} has been removed from the team`,
      });
    } catch (error) {
      console.error('Remove team member error:', error);
      toast({
        title: 'Removal Failed',
        description: `Failed to remove team member: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const addNewTeamMember = () => {
    setShowAddMemberModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      
      <header className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 shadow-2xl sticky top-0 z-50 border-b-4 border-red-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
          
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                <img 
                  src="/ACTIEF-ERT.jpg" 
                  alt="ACT Emergency Response Team Logo" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-white font-bold text-sm sm:text-lg tracking-tight truncate" data-testid="header-title">
                  ACT MAIN - ERT
                </h1>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`}></div>
                    <span className="text-white/90 text-xs font-medium hidden sm:inline">
                      {isConnected ? 'Live' : reconnectAttempts >= maxReconnectAttempts ? 'Connection Failed' : `Reconnecting (${reconnectAttempts}/${maxReconnectAttempts})`}
                    </span>
                    <span className="text-white/90 text-xs font-medium sm:hidden">
                      {isConnected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-blue-400' : 'bg-orange-400 animate-pulse'
                    }`}></div>
                    <span className="text-white/90 text-xs font-medium hidden sm:inline">
                      {isOnline ? 'Online' : 'Offline Mode'}
                    </span>
                  </div>
                  
                  <span className="text-white/70 text-xs hidden md:inline">{currentTime}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              
              {(stats?.activeIncidents || 0) > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2 sm:px-3 py-1 flex items-center space-x-1 sm:space-x-2">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-300 animate-pulse" />
                  <span className="text-white text-xs sm:text-sm font-semibold">{stats?.activeIncidents}</span>
                </div>
              )}
              
              <div className="hidden lg:flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2">
                <User className="h-4 w-4 text-white/80" />
                <span className="text-white text-sm font-medium truncate max-w-[100px]">{user?.username}</span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/10 border border-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm min-h-[40px] px-2 sm:px-3"
                onClick={handleLogout}
                disabled={logout.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 z-50 shadow-2xl safe-area-inset-bottom">
          <div className="grid grid-cols-5 h-16 pb-safe">
            {[
              { id: 'dashboard', icon: Home, label: 'Home', badge: null },
              { id: 'incidents', icon: AlertTriangle, label: 'Incidents', badge: activeIncidents.length },
              { id: 'team', icon: Users, label: 'Team', badge: null },
              { id: 'reports', icon: MessageSquare, label: 'Reports', badge: stats?.pendingReports || 0 },
              { id: 'notifications', icon: Bell, label: 'Alerts', badge: null }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center justify-center space-y-1 relative transition-all duration-200 min-h-[44px] px-1 ${
                  activeView === item.id 
                    ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge !== null && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold min-w-[20px]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium truncate max-w-full">{item.label}</span>
                {activeView === item.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400"></div>
                )}
              </button>
            ))}
          </div>
        </nav>
      )}

      {!isMobile && (
        <aside className="fixed left-0 top-16 bottom-0 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-gray-200 dark:border-slate-700 shadow-xl z-40">
          <div className="p-6 h-full overflow-y-auto">
           
            <div className="mb-8">
              <h2 className="text-slate-900 dark:text-slate-100 font-bold text-xl mb-4">ADMIN PANEL</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg">
                  <AlertTriangle className="h-5 w-5 mb-2" />
                  <div className="text-2xl font-bold">{stats?.activeIncidents || 0}</div>
                  <div className="text-red-100 text-sm">Active</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
                  <Users className="h-5 w-5 mb-2" />
                  <div className="text-2xl font-bold">{stats?.teamOnDuty || '0/0'}</div>
                  <div className="text-green-100 text-sm">On Duty</div>
                </div>
              </div>
            </div>

            <nav className="space-y-2 mb-8" data-testid="nav-menu">
              {[
                { id: 'dashboard', icon: Home, label: 'Dashboard', badge: null },
                { id: 'incidents', icon: AlertTriangle, label: 'Active Incidents', badge: activeIncidents.length },
                { id: 'team', icon: Users, label: 'Team Management', badge: null },
                { id: 'reports', icon: MessageSquare, label: 'User Reports', badge: stats?.pendingReports || 0 },
                { id: 'notifications', icon: Bell, label: 'Emergency Alerts', badge: null }
              ].map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start h-12 text-left ${
                    activeView === item.id 
                      ? 'bg-red-50 text-red-700 border-r-4 border-red-600 dark:bg-red-900/20 dark:text-red-400' 
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => setActiveView(item.id)}
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                  {item.badge !== null && item.badge > 0 && (
                    <Badge className="ml-auto bg-red-600 text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </nav>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Actions</h3>
              <Button 
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold h-12 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={createNewIncident}
                data-testid="button-new-incident"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Emergency
              </Button>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold h-12 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={addNewTeamMember}
                data-testid="button-add-team-member"
              >
                <User className="h-5 w-5 mr-2" />
                Add Team Member
              </Button>
            </div>
          </div>
        </aside>
      )}

      <main className={`${isMobile ? 'pb-20' : 'ml-72'} min-h-screen pt-2 sm:pt-4`}>
        <div className={`p-3 sm:p-4 ${isMobile ? 'max-w-full' : 'max-w-6xl mx-auto'}`}>

            {activeView === 'dashboard' && (
              <>
             
                <div className="space-y-2 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">System Overview</h2>
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <NetworkStatus />
                      <DataFreshnessIndicator data={stats} />
                    </div>
                  </div>
                  <StatsGrid stats={stats} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  
                  <div className="lg:col-span-2">
                    <Card className="modern-card border-l-4 border-l-emergency-red shadow-modern-lg">
                      <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-emergency-red-light to-red-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                          <div className="flex flex-col space-y-2">
                            <CardTitle className="text-gray-900 dark:text-gray-100 text-xl font-semibold">Active Incidents</CardTitle>
                            <div className="flex items-center space-x-3">
                              <DataFreshnessIndicator data={activeIncidents} />
                              {!isOnline && (
                                <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                                  ⚠️ Offline Mode - Data may be outdated
                                </span>
                              )}
                            </div>
                          </div>
                          <Button 
                            className="act-gradient text-white font-semibold modern-button hover:scale-105 transform transition-all duration-200 w-full sm:w-auto"
                            size={isMobile ? "sm" : "default"}
                            onClick={createNewIncident}
                            disabled={!isOnline}
                            data-testid="button-new-incident-main"
                          >
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">{isOnline ? 'New Incident' : 'Offline'}</span>
                            <span className="sm:hidden">{isOnline ? 'New' : 'Off'}</span>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4" data-testid="incidents-list">
                          
                          {criticalEmergencyReports.map((report) => (
                            <div 
                              key={`emergency-${report.id}`}
                              className="border-l-4 border-emergency-red bg-emergency-red-light shadow-modern-lg hover:shadow-modern-xl p-6 rounded-xl transition-all duration-200 hover:translate-y-[-1px]"
                              data-testid={`emergency-report-${report.id}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <AlertTriangle className="h-5 w-5 text-emergency-red" />
                                    <Badge className="bg-emergency-red text-white shadow-sm font-bold text-xs px-3 py-1 rounded-full">
                                      CRITICAL EMERGENCY
                                    </Badge>
                                    <span className="text-xs text-gray-500 flex items-center font-medium">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {Math.floor((new Date().getTime() - new Date(report.createdAt?.toString() || '').getTime()) / (1000 * 60))}m ago
                                    </span>
                                  </div>
                                  
                                  <h3 className="text-lg font-semibold text-emergency-red mb-2">
                                    {report.title || 'Emergency Report'}
                                  </h3>
                                  
                                  <p className="text-gray-700 mb-2 leading-relaxed">
                                    {report.message}
                                  </p>
                                  
                                  <div className="flex items-center text-sm text-gray-600">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    <span>{report.location}</span>
                                  </div>
                                </div>
                                
                                <Button 
                                  className="emergency-gradient text-white font-bold transform transition-all duration-200 hover:scale-105 emergency-pulse"
                                  onClick={async () => {
                                    try {
                                      await fetch(`/api/user-reports/${report.id}/status`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({ status: 'reviewed', reviewedBy: user?.id })
                                      });
                                      
                                      toast({
                                        title: "Emergency Response Initiated",
                                        description: "Emergency report marked as being handled.",
                                      });
                                    } catch (error) {
                                      console.error('Error responding to emergency:', error);
                                    }
                                  }}
                                  data-testid={`button-respond-emergency-${report.id}`}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  RESPOND NOW
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          {activeIncidents.map((incident) => (
                            <IncidentCard key={incident.id} incident={incident} />
                          ))}
                          
                          {activeIncidents.length === 0 && criticalEmergencyReports.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                              <p className="font-medium text-lg">No active incidents or emergency reports</p>
                              <p className="text-sm">All incidents are resolved and no critical emergencies pending</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <UserReportsPanel />
                    <TeamStatusPanel onNavigateToTeam={() => setActiveView('team')} />
                  </div>
                </div>
              </>
            )}

            {activeView === 'incidents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900">Incident Management</h2>
                  <Button 
                    className="bg-act-blue hover:bg-blue-700 text-white font-medium"
                    onClick={createNewIncident}
                    data-testid="button-new-incident-page"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Incident
                  </Button>
                </div>
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-6">
                    <div className="space-y-4" data-testid="incidents-full-list">
                      {activeIncidents.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium mb-2">No Active Incidents</h3>
                          <p>All incidents have been resolved or no new incidents reported.</p>
                        </div>
                      ) : (
                        activeIncidents.map((incident) => (
                          <IncidentCard key={incident.id} incident={incident} />
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === 'team' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-2">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Team Management</h2>
                    <div className="flex items-center space-x-3">
                      <NetworkStatus />
                      <DataFreshnessIndicator data={allTeamMembers} />
                      {!isOnline && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                          📱 Offline Mode - Team actions will be queued
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    className="bg-act-blue hover:bg-blue-700 text-white font-medium"
                    onClick={addNewTeamMember}
                    disabled={!isOnline}
                    data-testid="button-add-team-member"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isOnline ? 'Add Team Member' : 'Offline'}
                  </Button>
                </div>
                
                <Card className="shadow-sm border border-gray-200">
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-gray-900">All Team Members ({allTeamMembers.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4" data-testid="all-team-members-list">
                      {allTeamMembers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium mb-2">No Team Members</h3>
                          <p>Add team members to start managing your emergency response team.</p>
                        </div>
                      ) : (
                        allTeamMembers.map((member) => (
                          <div 
                            key={member.id} 
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                            data-testid={`team-member-full-${member.id}`}
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                member.status === 'on_duty' || member.status === 'available' 
                                  ? 'bg-status-green' 
                                  : member.status === 'off_duty'
                                  ? 'bg-gray-400'
                                  : 'bg-red-500'
                              }`}>
                                <User className="text-white h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900" data-testid="member-name-full">
                                  {member.name}
                                </h3>
                                <p className="text-sm text-gray-600" data-testid="member-role-full">
                                  {member.role}
                                </p>
                                {member.contactNumber && (
                                  <p className="text-xs text-gray-500">📞 {member.contactNumber}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <select 
                                value={member.status}
                                onChange={(e) => updateTeamMemberStatus(member.id, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-act-blue"
                                data-testid={`status-select-${member.id}`}
                              >
                                <option value="available">Available</option>
                                <option value="on_duty">On Duty</option>
                                <option value="off_duty">Off Duty</option>
                                <option value="unavailable">Unavailable</option>
                              </select>
                              
                              <Badge 
                                className={`${
                                  member.status === 'on_duty' || member.status === 'available' 
                                    ? 'bg-status-green' 
                                    : member.status === 'off_duty'
                                    ? 'bg-gray-400'
                                    : 'bg-red-500'
                                } text-white text-xs font-medium px-3 py-1`}
                                data-testid={`member-status-full-${member.status}`}
                              >
                                {member.status === 'on_duty' ? 'On Duty' :
                                 member.status === 'available' ? 'Available' :
                                 member.status === 'off_duty' ? 'Off Duty' : 'Unavailable'}
                              </Badge>
                              
                              <Button 
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                                onClick={() => removeTeamMember(member.id, member.name)}
                                data-testid={`button-remove-${member.id}`}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === 'reports' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-2">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">User Reports Management</h2>
                    <div className="flex items-center space-x-3">
                      <NetworkStatus />
                      <DataFreshnessIndicator data={stats} />
                      {!isOnline && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                          📱 Offline Mode - Report actions will be queued
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UserReportsPanel />
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="border-b border-gray-200">
                      <CardTitle className="text-gray-900">Report Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-700">Resolved</h3>
                            <p className="text-2xl font-bold text-green-600">{stats?.resolvedReports || 0}</p>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-yellow-700">Pending</h3>
                            <p className="text-2xl font-bold text-yellow-600">{stats?.pendingReports || 0}</p>
                          </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-700">Report management interface allows reviewing and responding to user-submitted emergency reports and help requests.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeView === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Emergency Alert Settings</h2>
                  <Badge variant="outline" className="text-sm">
                    Force Notifications
                  </Badge>
                </div>
                
                <div className="flex justify-center">
                  <NotificationSettings />
                </div>
                
                <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="text-gray-900 dark:text-gray-100">How It Works</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Instant Alerts</p>
                          <p>Receive immediate notifications when incidents or help requests are reported, even if the app is closed.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-green-600 dark:text-green-400 text-xs font-bold">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Mobile Ready</p>
                          <p>Works on mobile devices, tablets, and desktop browsers with vibration and sound alerts.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-orange-600 dark:text-orange-400 text-xs font-bold">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Always On</p>
                          <p>Continue receiving critical alerts even when your device screen is off or you're using other apps.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>

      {isMobile && (
        <button
          onClick={createNewIncident}
          className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-all duration-300 hover:scale-110 active:scale-95"
          data-testid="fab-new-incident"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <AddTeamMemberModal 
        isOpen={showAddMemberModal} 
        onClose={() => setShowAddMemberModal(false)} 
      />
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UserReport } from '@shared/schema';

export default function UserReportsPanel() {
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: allUserReports = [] } = useQuery<UserReport[]>({
    queryKey: ['/api/user-reports'],
    refetchInterval: 1000, 
    enabled: true, 
  });

  const userReports = allUserReports.filter((report: UserReport) => report.type === 'help_request');
  
  const pendingReports = userReports.filter((report: UserReport) => report.status === 'pending');

  const getReportTypeColor = (type: string, priority: string) => {
    if (type === 'emergency_report' || priority === 'critical') {
      return 'border-l-4 border-emergency-red bg-emergency-red-light shadow-modern-lg hover:shadow-modern-xl';
    }
    switch (type) {
      case 'help_request':
        return 'border-l-4 border-act-yellow bg-act-yellow-light shadow-modern hover:shadow-modern-lg';
      default:
        return 'border-l-4 border-gray-400 bg-gray-50 shadow-modern hover:shadow-modern-lg';
    }
  };

  const getReportTypeDisplay = (type: string) => {
    switch (type) {
      case 'emergency_report':
        return 'EMERGENCY REPORT';
      case 'help_request':
        return 'Help Request';
      default:
        return 'General Request';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-emergency-red text-white shadow-sm font-bold';
      case 'high':
        return 'bg-red-500 text-white shadow-sm';
      case 'medium':
        return 'bg-act-yellow text-white shadow-sm';
      case 'low':
        return 'bg-act-blue text-white shadow-sm';
      default:
        return 'bg-gray-500 text-white shadow-sm';
    }
  };

  const sortReports = (reports: UserReport[]) => {
    return [...reports].sort((a, b) => {
      
      if (a.type === 'emergency_report' && b.type !== 'emergency_report') return -1;
      if (b.type === 'emergency_report' && a.type !== 'emergency_report') return 1;
      
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      
      return aPriority - bPriority;
    });
  };

  const sortedPendingReports = sortReports(pendingReports);

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const reportDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  const handleViewDetails = (report: UserReport) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/user-reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'reviewed' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update report status');
      }
      
      toast({
        title: "Report Resolved",
        description: "The help request has been marked as resolved.",
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: "Error",
        description: "Failed to resolve report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderReportCard = (report: UserReport) => (
    <div 
      key={report.id} 
      className={`${getReportTypeColor(report.type, report.priority)} p-4 rounded-xl transition-all duration-200 hover:translate-y-[-1px]`}
      data-testid={`user-report-${report.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {report.type === 'emergency_report' && (
            <AlertTriangle className="h-4 w-4 text-emergency-red" />
          )}
          {report.status === 'reviewed' && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <span className={`text-sm font-semibold ${report.type === 'emergency_report' ? 'text-emergency-red' : 'text-gray-900 dark:text-gray-100'}`} data-testid="report-type">
            {getReportTypeDisplay(report.type)}
          </span>
          <Badge className={`${getPriorityBadgeColor(report.priority)} text-xs px-2 py-0.5 rounded-full uppercase`}>
            {report.priority}
          </Badge>
          {report.status === 'reviewed' && (
            <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
              RESOLVED
            </Badge>
          )}
        </div>
        <span className="text-xs text-gray-500 flex items-center font-medium">
          <Clock className="h-3 w-3 mr-1" />
          {getTimeAgo(report.createdAt?.toString() || new Date().toISOString())}
        </span>
      </div>
      
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed" data-testid="report-message">
        {report.message.length > 100 ? `${report.message.substring(0, 100)}...` : report.message}
      </p>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 flex items-center font-medium" data-testid="report-location">
          <MapPin className="h-3 w-3 mr-1" />
          {report.location}
        </span>
        <Button 
          variant="ghost" 
          size="sm"
          className={`text-xs font-semibold modern-button px-3 py-1 ${
            report.type === 'emergency_report' 
              ? 'text-emergency-red hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20' 
              : 'text-act-blue hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
          onClick={() => handleViewDetails(report)}
          data-testid={`button-view-report-${report.id}`}
        >
          {report.type === 'emergency_report' ? 'RESPOND NOW' : 'View Details'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Card className="modern-card shadow-modern-lg" data-testid="user-reports-panel">
        <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
          <CardTitle className="text-gray-900 dark:text-gray-100 font-semibold">Help Requests</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">Assistance requests from public interface</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Pending Reports Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="h-4 w-4 text-yellow-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Pending Reports ({pendingReports.length})</h3>
            </div>
            <div className="space-y-4" data-testid="pending-reports-list">
              {sortedPendingReports.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">No pending help requests</p>
                  <p className="text-sm">All help requests have been resolved</p>
                </div>
              ) : (
                sortedPendingReports.slice(0, 5).map(renderReportCard)
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedReport?.type === 'emergency_report' && (
                <AlertTriangle className="h-5 w-5 text-emergency-red" />
              )}
              {selectedReport?.status === 'reviewed' && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <span>{selectedReport ? getReportTypeDisplay(selectedReport.type) : 'Report Details'}</span>
              {selectedReport && (
                <Badge className={`${getPriorityBadgeColor(selectedReport.priority)} text-xs px-2 py-0.5 rounded-full uppercase`}>
                  {selectedReport.priority}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              View and manage help request details
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-semibold text-gray-700">Location:</label>
                  <p className="text-gray-600">{selectedReport.location}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Submitted:</label>
                  <p className="text-gray-600">{getTimeAgo(selectedReport.createdAt?.toString() || new Date().toISOString())}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Priority:</label>
                  <p className="text-gray-600 capitalize">{selectedReport.priority}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Status:</label>
                  <p className="text-gray-600 capitalize">{selectedReport.status}</p>
                </div>
              </div>
              
              <div>
                <label className="font-semibold text-gray-700">Message:</label>
                <p className="text-gray-600 mt-2 p-3 bg-gray-50 rounded-lg">{selectedReport.message}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-testid="button-close-dialog"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            {selectedReport && selectedReport.status === 'pending' && (
              <Button
                onClick={() => handleResolveReport(selectedReport.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-resolve-report"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

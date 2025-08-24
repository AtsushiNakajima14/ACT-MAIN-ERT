export interface WebSocketMessage {
  type: string;
  data?: any;
}

export interface DashboardStats {
  activeIncidents: number;
  teamOnDuty: string;
  pendingReports: number;
  resolvedReports: number;
  avgResponseTime: string;
}

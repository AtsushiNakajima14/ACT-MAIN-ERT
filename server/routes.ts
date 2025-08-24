import type { Express } from "express";
import { createServer, type Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertUserReportSchema, insertIncidentSchema, insertEmergencyAlertSchema, insertTeamMemberSchema, insertPushSubscriptionSchema } from "@shared/schema";
import { z } from "zod";
import { getSession, setupAuthRoutes, requireOperator } from "./auth";
import { sendIncidentNotification, sendHelpRequestNotification, VAPID_PUBLIC_KEY } from "./pushNotifications";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.use(getSession());
  
  setupAuthRoutes(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();
  const operatorClients = new Set<WebSocket>();
  const publicClients = new Set<WebSocket>();

  wss.on('connection', (ws, request) => {
    console.log('New WebSocket connection');
    clients.add(ws);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join-operator':
            operatorClients.add(ws);
            break;
          case 'join-public':
            publicClients.add(ws);
            break;
          case 'leave-operator':
            operatorClients.delete(ws);
            break;
          case 'leave-public':
            publicClients.delete(ws);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      operatorClients.delete(ws);
      publicClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
      operatorClients.delete(ws);
      publicClients.delete(ws);
    });
  });

  const broadcastToOperators = (data: any) => {
    operatorClients.forEach(client => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error broadcasting to operator client:', error);
        operatorClients.delete(client);
      }
    });
  };

  const broadcastToPublic = (data: any) => {
    publicClients.forEach(client => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error broadcasting to public client:', error);
        publicClients.delete(client);
      }
    });
  };

  const broadcastToAll = (data: any) => {
    clients.forEach(client => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        clients.delete(client);
      }
    });
  };

  app.get('/api/team-members', async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ message: 'Failed to fetch team members' });
    }
  });

  app.patch('/api/team-members/:id/status', requireOperator, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const member = await storage.updateTeamMemberStatus(id, status);
      
      broadcastToAll({
        type: 'team-status-updated',
        data: member
      });
      
      res.json(member);
    } catch (error) {
      console.error('Error updating team member status:', error);
      res.status(500).json({ message: 'Failed to update team member status' });
    }
  });

  app.post('/api/team-members', requireOperator, async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(validatedData);
      
      broadcastToAll({
        type: 'team-member-added',
        data: member
      });
      
      res.status(201).json(member);
    } catch (error) {
      console.error('Error creating team member:', error);
      res.status(500).json({ message: 'Failed to create team member' });
    }
  });

  app.delete('/api/team-members/:id', requireOperator, async (req, res) => {
    try {
      const { id } = req.params;
      
      const member = await storage.getTeamMember(id);
      if (!member) {
        return res.status(404).json({ message: 'Team member not found' });
      }
      
      await storage.deleteTeamMember(id);
      
      broadcastToAll({
        type: 'team-member-removed',
        data: { id, name: member.name }
      });
      
      res.json({ message: 'Team member removed successfully' });
    } catch (error) {
      console.error('Error removing team member:', error);
      res.status(500).json({ message: 'Failed to remove team member' });
    }
  });

  app.get('/api/incidents', requireOperator, async (req, res) => {
    try {
      const { active } = req.query;
      const incidents = active === 'true' 
        ? await storage.getActiveIncidents()
        : await storage.getIncidents();
      res.json(incidents);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      res.status(500).json({ message: 'Failed to fetch incidents' });
    }
  });

  app.post('/api/incidents', requireOperator, async (req, res) => {
    try {
      const validatedData = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(validatedData);
      
      broadcastToAll({
        type: 'incident-created',
        data: incident
      });

      await sendIncidentNotification(incident);
      
      res.status(201).json(incident);
    } catch (error) {
      console.error('Error creating incident:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid incident data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create incident' });
      }
    }
  });

  app.patch('/api/incidents/:id/status', requireOperator, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const incident = await storage.updateIncidentStatus(id, status);
      
      broadcastToAll({
        type: 'incident-updated',
        data: incident
      });
      
      res.json(incident);
    } catch (error) {
      console.error('Error updating incident status:', error);
      res.status(500).json({ message: 'Failed to update incident status' });
    }
  });

  app.patch('/api/incidents/:id/assign', requireOperator, async (req, res) => {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      
      const incident = await storage.assignIncident(id, assignedTo);
      
      broadcastToOperators({
        type: 'incident-assigned',
        data: incident
      });
      
      res.json(incident);
    } catch (error) {
      console.error('Error assigning incident:', error);
      res.status(500).json({ message: 'Failed to assign incident' });
    }
  });

  app.get('/api/user-reports', async (req, res) => {
    try {
      const { pending } = req.query;
      const reports = pending === 'true'
        ? await storage.getPendingUserReports()
        : await storage.getUserReports();
      res.json(reports);
    } catch (error) {
      console.error('Error fetching user reports:', error);
      res.status(500).json({ message: 'Failed to fetch user reports' });
    }
  });

  app.post('/api/user-reports', async (req, res) => {
    try {
      const validatedData = insertUserReportSchema.parse(req.body);
      const report = await storage.createUserReport(validatedData);
      
      if (report.type === 'emergency_report') {
        try {
          const incidentData = {
            title: report.title || 'Emergency Incident',
            description: report.message,
            priority: 'critical' as const,
            status: 'active' as const,
            location: report.location,
            reportedBy: null, 
            coordinates: report.coordinates as any,
          };
          
          const incident = await storage.createIncident(incidentData);
          
          // Immediately broadcast to operators for instant updates
          broadcastToAll({
            type: 'incident-created',
            data: incident
          });
          
          broadcastToOperators({
            type: 'emergency-report-converted',
            data: { report, incident }
          });

          // Send response immediately so frontend gets confirmation
          res.status(201).json({ report, incident });

          // Run slower operations in parallel without blocking the response
          Promise.all([
            storage.updateUserReportStatus(report.id, 'reviewed', undefined),
            sendHelpRequestNotification(report),
            sendIncidentNotification(incident)
          ]).catch(error => {
            console.error('Error in background operations for emergency report:', error);
          });
          
        } catch (incidentError) {
          console.error('Error creating incident from emergency report:', incidentError);
          
          // Immediately broadcast to operators
          broadcastToOperators({
            type: 'user-report-created',
            data: report
          });

          // Send response immediately
          res.status(201).json(report);

          // Send notification in background
          sendHelpRequestNotification(report).catch(error => {
            console.error('Error sending help request notification:', error);
          });
        }
      } else {
        // Immediately broadcast to operators for instant updates
        broadcastToOperators({
          type: 'user-report-created',
          data: report
        });

        // Send response immediately
        res.status(201).json(report);

        // Send notification in background
        sendHelpRequestNotification(report).catch(error => {
          console.error('Error sending help request notification:', error);
        });
      }
    } catch (error) {
      console.error('Error creating user report:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid report data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create user report' });
      }
    }
  });

  app.patch('/api/user-reports/:id/status', requireOperator, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reviewedBy } = req.body;
      
      const report = await storage.updateUserReportStatus(id, status, reviewedBy);
      
      broadcastToOperators({
        type: 'user-report-updated',
        data: report
      });
      
      res.json(report);
    } catch (error) {
      console.error('Error updating user report status:', error);
      res.status(500).json({ message: 'Failed to update user report status' });
    }
  });

  
  app.get('/api/emergency-alerts', async (req, res) => {
    try {
      const alerts = await storage.getActiveEmergencyAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
      res.status(500).json({ message: 'Failed to fetch emergency alerts' });
    }
  });

  app.post('/api/emergency-alerts', requireOperator, async (req, res) => {
    try {
      const validatedData = insertEmergencyAlertSchema.parse({
        ...req.body,
        createdBy: (req as any).user.id
      });
      const alert = await storage.createEmergencyAlert(validatedData);
      
      broadcastToAll({
        type: 'emergency-alert-broadcast',
        data: alert
      });
      
      const notificationPayload: any = {
        title: `🚨 ${alert.type.toUpperCase()}: ${alert.title}`,
        body: alert.message,
        tag: `emergency-${alert.id}`,
        url: '/operator',
        data: {
          type: 'emergency_alert',
          id: alert.id,
          priority: alert.priority,
          alertType: alert.type,
        },
      };
      
      const notificationResults = await (await import('./pushNotifications')).sendNotificationToAllOperators(
        notificationPayload, 
        alert.id, 
        'emergency_alert'
      );
      
      console.log(`📊 Emergency alert "${alert.title}" sent to ${notificationResults.total} devices: ${notificationResults.successful} delivered, ${notificationResults.failed} failed`);
      
      res.status(201).json({
        ...alert,
        notificationResults
      });
    } catch (error) {
      console.error('Error creating emergency alert:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid alert data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create emergency alert' });
      }
    }
  });

  app.patch('/api/emergency-alerts/:id/deactivate', requireOperator, async (req, res) => {
    try {
      const { id } = req.params;
      const alert = await storage.deactivateEmergencyAlert(id);
      
      broadcastToAll({
        type: 'emergency-alert-deactivated',
        data: alert
      });
      
      res.json(alert);
    } catch (error) {
      console.error('Error deactivating emergency alert:', error);
      res.status(500).json({ message: 'Failed to deactivate emergency alert' });
    }
  });

  app.get('/api/emergency-alerts/pending', async (req, res) => {
    try {
      const alerts = await storage.getActiveEmergencyAlerts();
     
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const recentCriticalAlerts = alerts.filter(alert => 
        alert.priority === 'critical' && 
        alert.createdAt && 
        new Date(alert.createdAt) > sixHoursAgo
      );
      res.json(recentCriticalAlerts);
    } catch (error) {
      console.error('Error fetching pending emergency alerts:', error);
      res.status(500).json({ message: 'Failed to fetch pending alerts' });
    }
  });

  app.post('/api/notifications/confirm-delivery', async (req, res) => {
    try {
      const { deliveryId } = req.body;
      
      if (!deliveryId) {
        return res.status(400).json({ message: 'Delivery ID is required' });
      }
      
      await storage.updateNotificationDeliveryStatus(deliveryId, 'delivered');
      
      console.log(`✅ Notification delivery confirmed: ${deliveryId}`);
      res.json({ success: true, deliveryId });
    } catch (error) {
      console.error('Error confirming notification delivery:', error);
      res.status(500).json({ message: 'Failed to confirm delivery' });
    }
  });

  app.post('/api/notifications/track-action', async (req, res) => {
    try {
      const { deliveryId, action, timestamp } = req.body;
      
      if (!deliveryId || !action) {
        return res.status(400).json({ message: 'Delivery ID and action are required' });
      }
      
      console.log(`📊 Notification action tracked: ${action} for delivery ${deliveryId} at ${new Date(timestamp).toISOString()}`);
      
      if (action === 'dismissed') {
        await storage.updateNotificationDeliveryStatus(deliveryId, 'dismissed');
      } else if (action === 'acknowledged') {
        await storage.updateNotificationDeliveryStatus(deliveryId, 'acknowledged');
      }
      
      res.json({ success: true, deliveryId, action });
    } catch (error) {
      console.error('Error tracking notification action:', error);
      res.status(500).json({ message: 'Failed to track action' });
    }
  });

  app.get('/api/system-status', async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error('Error fetching system status:', error);
      res.status(500).json({ message: 'Failed to fetch system status' });
    }
  });

  app.patch('/api/system-status/:component', requireOperator, async (req, res) => {
    try {
      const { component } = req.params;
      const { status, level, notes } = req.body;
      
      const systemStatus = await storage.updateSystemStatus(component, status, level, notes);
      
      broadcastToAll({
        type: 'system-status-updated',
        data: systemStatus
      });
      
      res.json(systemStatus);
    } catch (error) {
      console.error('Error updating system status:', error);
      res.status(500).json({ message: 'Failed to update system status' });
    }
  });

  app.get('/api/dashboard-stats', requireOperator, async (req, res) => {
    try {
      const [activeIncidents, teamMembers, allUserReports] = await Promise.all([
        storage.getActiveIncidents(),
        storage.getTeamMembers(),
        storage.getUserReports(),
      ]);

      const onDutyMembers = teamMembers.filter(member => 
        member.status === 'on_duty' || member.status === 'available'
      );

      const pendingReports = allUserReports.filter(report => report.status === 'pending');
      const resolvedReports = allUserReports.filter(report => report.status === 'reviewed');

      const stats = {
        activeIncidents: activeIncidents.length,
        teamOnDuty: `${onDutyMembers.length}/${teamMembers.length}`,
        pendingReports: pendingReports.length,
        resolvedReports: resolvedReports.length,
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  app.get('/api/vapid-public-key', (req, res) => {
    try {
      res.json({ publicKey: VAPID_PUBLIC_KEY });
    } catch (error) {
      console.error('Error fetching VAPID public key:', error);
      res.status(500).json({ message: 'Failed to fetch VAPID public key' });
    }
  });

  app.post('/api/push-subscription/validate', async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ message: 'Endpoint is required' });
      }
      
      const subscription = await storage.getPushSubscriptionByEndpoint(endpoint);
      if (subscription && subscription.isActive) {
        res.json({ valid: true, subscription });
      } else {
        res.status(404).json({ valid: false, message: 'Subscription not found or inactive' });
      }
    } catch (error) {
      console.error('Error validating push subscription:', error);
      res.status(500).json({ message: 'Failed to validate push subscription' });
    }
  });

  app.post('/api/push-subscription', async (req, res) => {
    try {
      const validatedData = insertPushSubscriptionSchema.parse(req.body);
      const subscription = await storage.createPushSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error) {
      console.error('Error creating push subscription:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid subscription data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create push subscription' });
      }
    }
  });

  app.delete('/api/push-subscription', async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ message: 'Endpoint is required' });
      }
      
      await storage.deletePushSubscription(endpoint);
      res.status(200).json({ message: 'Push subscription deleted' });
    } catch (error) {
      console.error('Error deleting push subscription:', error);
      res.status(500).json({ message: 'Failed to delete push subscription' });
    }
  });

  return httpServer;
}

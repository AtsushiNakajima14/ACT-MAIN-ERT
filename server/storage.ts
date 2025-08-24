import {
  type User,
  type InsertUser,
  type TeamMember,
  type InsertTeamMember,
  type Incident,
  type InsertIncident,
  type UserReport,
  type InsertUserReport,
  type EmergencyAlert,
  type InsertEmergencyAlert,
  type SystemStatus,
  type InsertSystemStatus,
  type PushSubscription,
  type InsertPushSubscription,
  type NotificationDelivery,
  type InsertNotificationDelivery,
  users,
  teamMembers,
  incidents,
  userReports,
  emergencyAlerts,
  systemStatus,
  pushSubscriptions,
  notificationDeliveries,
} from "@shared/schema";
import { hashPassword } from "./auth";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  init(): Promise<void>;

  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMemberStatus(id: string, status: string): Promise<TeamMember>;
  deleteTeamMember(id: string): Promise<void>;


  getIncidents(): Promise<Incident[]>;
  getActiveIncidents(): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncidentStatus(id: string, status: string): Promise<Incident>;
  assignIncident(id: string, assignedTo: string): Promise<Incident>;

  getUserReports(): Promise<UserReport[]>;
  getPendingUserReports(): Promise<UserReport[]>;
  getUserReport(id: string): Promise<UserReport | undefined>;
  createUserReport(report: InsertUserReport): Promise<UserReport>;
  updateUserReportStatus(id: string, status: string, reviewedBy?: string): Promise<UserReport>;



  getActiveEmergencyAlerts(): Promise<EmergencyAlert[]>;
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  deactivateEmergencyAlert(id: string): Promise<EmergencyAlert>;


  getSystemStatus(): Promise<SystemStatus[]>;
  updateSystemStatus(component: string, status: string, level?: number, notes?: string): Promise<SystemStatus>;


  getPushSubscriptions(): Promise<PushSubscription[]>;
  getActivePushSubscriptions(): Promise<PushSubscription[]>;
  getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | undefined>;
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  updatePushSubscription(endpoint: string, updates: Partial<PushSubscription>): Promise<PushSubscription>;
  deletePushSubscription(endpoint: string): Promise<void>;
  updatePushSubscriptionLastUsed(endpoint: string): Promise<void>;
  deactivatePushSubscription(endpoint: string): Promise<void>;
  

  createNotificationDelivery(delivery: InsertNotificationDelivery): Promise<NotificationDelivery>;
  updateNotificationDeliveryStatus(id: string, status: string, errorMessage?: string): Promise<NotificationDelivery>;
  updateNotificationDeliveryRetryCount(id: string, retryCount: number): Promise<NotificationDelivery>;
  getFailedNotificationDeliveries(): Promise<NotificationDelivery[]>;
}


class InMemoryStorage implements IStorage {
  private data: {
    users: Map<string, User>;
    teamMembers: Map<string, TeamMember>;
    incidents: Map<string, Incident>;
    userReports: Map<string, UserReport>;
    emergencyAlerts: Map<string, EmergencyAlert>;
    systemStatus: Map<string, SystemStatus>;
    pushSubscriptions: Map<string, PushSubscription>;
    notificationDeliveries: Map<string, NotificationDelivery>;
  };
  private isInitialized = false;

  constructor() {
    this.data = {
      users: new Map(),
      teamMembers: new Map(),
      incidents: new Map(),
      userReports: new Map(),
      emergencyAlerts: new Map(),
      systemStatus: new Map(),
      pushSubscriptions: new Map(),
      notificationDeliveries: new Map()
    };
  }

  generateId(): string {
    return crypto.randomUUID();
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    

    if (this.data.users.size === 0) {
      await this.seedDefaultData();
    }
    
    this.isInitialized = true;
  }

  private async seedDefaultData(): Promise<void> {

    console.log('🔧 Ensuring admin credentials exist...');
    
    const adminUsername = 'operator';
    const adminPassword = 'ert2025!';
    

    const existingAdmin = await this.getUserByUsername(adminUsername);
    
    if (!existingAdmin) {
      console.log('🔨 Creating admin user...');
      const hashedPassword = await hashPassword(adminPassword);
      
      await this.createUser({
        username: adminUsername,
        password: hashedPassword,
        role: 'operator'
      });
      
      console.log('✅ Admin user created successfully!');
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('   Role: operator');
      console.log('🚨 IMPORTANT: These credentials persist across hosting environments.');
    } else {
      console.log('✅ Admin user already exists');
    }

    await this.updateSystemStatus('medical_supplies', 'operational', 100, 'Supplies adequate');
    await this.updateSystemStatus('communication', 'operational', 100, 'All systems operational');
  }


  async getUser(id: string): Promise<User | undefined> {
    return this.data.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.data.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {

    const hashedPassword = insertUser.password.startsWith('$2b$') 
      ? insertUser.password 
      : await hashPassword(insertUser.password);
    
    const user: User = {
      id: this.generateId(),
      username: insertUser.username,
      password: hashedPassword,
      role: insertUser.role || 'operator',
      createdAt: new Date()
    };

    this.data.users.set(user.id, user);
    return user;
  }


  async getTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.data.teamMembers.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    return this.data.teamMembers.get(id);
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const newMember: TeamMember = {
      id: this.generateId(),
      name: member.name,
      role: member.role,
      status: member.status || 'available',
      contactNumber: member.contactNumber || null,
      specializations: member.specializations || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.data.teamMembers.set(newMember.id, newMember);
    return newMember;
  }

  async updateTeamMemberStatus(id: string, status: string): Promise<TeamMember> {
    const existing = this.data.teamMembers.get(id);
    if (!existing) throw new Error('Team member not found');

    const updated = { ...existing, status, updatedAt: new Date() };
    this.data.teamMembers.set(id, updated);
    return updated;
  }

  async deleteTeamMember(id: string): Promise<void> {
    this.data.teamMembers.delete(id);
  }


  async getIncidents(): Promise<Incident[]> {
    const incidents = Array.from(this.data.incidents.values());
    return incidents.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getActiveIncidents(): Promise<Incident[]> {
    const incidents = Array.from(this.data.incidents.values()).filter(i => i.status === 'active');
    return incidents.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    return this.data.incidents.get(id);
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const newIncident: Incident = {
      id: this.generateId(),
      title: incident.title,
      description: incident.description,
      priority: incident.priority,
      status: incident.status || 'active',
      location: incident.location,
      assignedTo: incident.assignedTo || null,
      reportedBy: incident.reportedBy || null,
      coordinates: incident.coordinates || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: incident.resolvedAt || null
    };

    this.data.incidents.set(newIncident.id, newIncident);
    return newIncident;
  }

  async updateIncidentStatus(id: string, status: string): Promise<Incident> {
    const existing = this.data.incidents.get(id);
    if (!existing) throw new Error('Incident not found');

    const updateData: any = { ...existing, status, updatedAt: new Date() };
    if (status === "resolved" || status === "closed") {
      updateData.resolvedAt = new Date();
    }

    this.data.incidents.set(id, updateData);
    return updateData;
  }

  async assignIncident(id: string, assignedTo: string): Promise<Incident> {
    const existing = this.data.incidents.get(id);
    if (!existing) throw new Error('Incident not found');

    const updated = { ...existing, assignedTo, updatedAt: new Date() };
    this.data.incidents.set(id, updated);
    return updated;
  }


  async getUserReports(): Promise<UserReport[]> {
    const reports = Array.from(this.data.userReports.values());
    return reports.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getPendingUserReports(): Promise<UserReport[]> {
    const reports = Array.from(this.data.userReports.values()).filter(r => r.status === 'pending');
    return reports.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getUserReport(id: string): Promise<UserReport | undefined> {
    return this.data.userReports.get(id);
  }

  async createUserReport(report: InsertUserReport): Promise<UserReport> {
    const newReport: UserReport = {
      id: this.generateId(),
      type: report.type,
      title: report.title || null,
      message: report.message,
      location: report.location,
      contactInfo: report.contactInfo || null,
      priority: report.priority || 'medium',
      status: report.status || 'pending',
      coordinates: report.coordinates || null,
      shareLocation: report.shareLocation || null,
      metadata: report.metadata || null,
      createdAt: new Date(),
      reviewedAt: null,
      reviewedBy: null
    };

    this.data.userReports.set(newReport.id, newReport);
    return newReport;
  }

  async updateUserReportStatus(id: string, status: string, reviewedBy?: string): Promise<UserReport> {
    const existing = this.data.userReports.get(id);
    if (!existing) throw new Error('User report not found');

    const updateData: any = { ...existing, status, reviewedAt: new Date() };
    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
    }

    this.data.userReports.set(id, updateData);
    return updateData;
  }


  async getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
    const alerts = Array.from(this.data.emergencyAlerts.values()).filter(a => a.isActive);
    const now = new Date();
    
    return alerts
      .filter(alert => !alert.expiresAt || new Date(alert.expiresAt) > now)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const newAlert: EmergencyAlert = {
      id: this.generateId(),
      title: alert.title,
      message: alert.message,
      type: alert.type,
      priority: alert.priority || 'high',
      isActive: alert.isActive ?? true,
      createdBy: alert.createdBy,
      expiresAt: alert.expiresAt || null,
      createdAt: new Date()
    };

    this.data.emergencyAlerts.set(newAlert.id, newAlert);
    return newAlert;
  }

  async deactivateEmergencyAlert(id: string): Promise<EmergencyAlert> {
    const existing = this.data.emergencyAlerts.get(id);
    if (!existing) throw new Error('Emergency alert not found');

    const updated = { ...existing, isActive: false };
    this.data.emergencyAlerts.set(id, updated);
    return updated;
  }


  async getSystemStatus(): Promise<SystemStatus[]> {
    return Array.from(this.data.systemStatus.values()).sort((a, b) => a.component.localeCompare(b.component));
  }

  async updateSystemStatus(component: string, status: string, level?: number, notes?: string): Promise<SystemStatus> {

    let existing: SystemStatus | undefined;
    for (const statusItem of Array.from(this.data.systemStatus.values())) {
      if (statusItem.component === component) {
        existing = statusItem;
        break;
      }
    }

    const updateData: SystemStatus = {
      id: existing?.id || this.generateId(),
      component,
      status,
      level: level ?? null,
      notes: notes ?? null,
      lastUpdated: new Date(),
    };

    this.data.systemStatus.set(updateData.id, updateData);
    return updateData;
  }


  async getPushSubscriptions(): Promise<PushSubscription[]> {
    return Array.from(this.data.pushSubscriptions.values());
  }

  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const newSubscription: PushSubscription = {
      id: this.generateId(),
      ...subscription,
      userId: subscription.userId ?? null,
      deviceType: subscription.deviceType ?? null,
      deviceName: subscription.deviceName ?? null,
      userAgent: subscription.userAgent ?? null,
      platform: subscription.platform ?? null,
      isActive: subscription.isActive ?? true,
      failureCount: 0,
      lastSuccessfulNotification: null,
      lastFailureReason: null,
      createdAt: new Date(),
      lastUsed: new Date(),
      updatedAt: new Date(),
    };

    this.data.pushSubscriptions.set(newSubscription.endpoint, newSubscription);
    return newSubscription;
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    this.data.pushSubscriptions.delete(endpoint);
  }

  async getActivePushSubscriptions(): Promise<PushSubscription[]> {
    return Array.from(this.data.pushSubscriptions.values()).filter(sub => sub.isActive);
  }

  async getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | undefined> {
    return this.data.pushSubscriptions.get(endpoint);
  }

  async updatePushSubscription(endpoint: string, updates: Partial<PushSubscription>): Promise<PushSubscription> {
    const existing = this.data.pushSubscriptions.get(endpoint);
    if (!existing) throw new Error('Push subscription not found');

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.data.pushSubscriptions.set(endpoint, updated);
    return updated;
  }

  async updatePushSubscriptionLastUsed(endpoint: string): Promise<void> {
    const subscription = this.data.pushSubscriptions.get(endpoint);
    if (subscription) {
      const updated = { ...subscription, lastUsed: new Date(), updatedAt: new Date() };
      this.data.pushSubscriptions.set(endpoint, updated);
    }
  }

  async deactivatePushSubscription(endpoint: string): Promise<void> {
    const subscription = this.data.pushSubscriptions.get(endpoint);
    if (subscription) {
      const updated = { ...subscription, isActive: false, updatedAt: new Date() };
      this.data.pushSubscriptions.set(endpoint, updated);
    }
  }


  async createNotificationDelivery(delivery: InsertNotificationDelivery): Promise<NotificationDelivery> {
    const newDelivery: NotificationDelivery = {
      id: this.generateId(),
      subscriptionId: delivery.subscriptionId,
      alertId: delivery.alertId ?? null,
      messageType: delivery.messageType,
      status: delivery.status,
      errorMessage: delivery.errorMessage ?? null,
      retryCount: delivery.retryCount ?? 0,
      maxRetries: delivery.maxRetries ?? 3,
      sentAt: new Date(),
      deliveredAt: null,
    };

    this.data.notificationDeliveries.set(newDelivery.id, newDelivery);
    return newDelivery;
  }

  async updateNotificationDeliveryStatus(id: string, status: string, errorMessage?: string): Promise<NotificationDelivery> {
    const existing = this.data.notificationDeliveries.get(id);
    if (!existing) throw new Error('Notification delivery not found');

    const updated = { 
      ...existing, 
      status, 
      errorMessage: errorMessage || null,
      deliveredAt: status === 'delivered' ? new Date() : existing.deliveredAt
    };
    
    this.data.notificationDeliveries.set(id, updated);
    return updated;
  }

  async getFailedNotificationDeliveries(): Promise<NotificationDelivery[]> {
    return Array.from(this.data.notificationDeliveries.values())
      .filter(delivery => 
        delivery.status === 'failed' && 
        (delivery.retryCount ?? 0) < (delivery.maxRetries ?? 3)
      );
  }

  async updateNotificationDeliveryRetryCount(id: string, retryCount: number): Promise<NotificationDelivery> {
    const existing = this.data.notificationDeliveries.get(id);
    if (!existing) throw new Error('Notification delivery not found');

    const updated = { 
      ...existing, 
      retryCount,
      status: 'retry'
    };
    
    this.data.notificationDeliveries.set(id, updated);
    return updated;
  }

}

class DatabaseStorage implements IStorage {
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    // Ensure admin credentials exist
    console.log('🔧 Ensuring admin credentials exist in database...');
    
    const adminUsername = 'operator';
    const adminPassword = 'ert2025!';
    
    const existingAdmin = await this.getUserByUsername(adminUsername);
    
    if (!existingAdmin) {
      await this.createUser({
        username: adminUsername,
        password: adminPassword,
        role: 'operator'
      });
      console.log('✅ Admin user created in database');
    }
    
    // Seed default system status
    const existingStatus = await this.getSystemStatus();
    if (existingStatus.length === 0) {
      await this.updateSystemStatus('Emergency Response System', 'operational', 1, 'System is running normally');
      console.log('✅ Default system status created in database');
    }
    
    this.isInitialized = true;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = insertUser.password.startsWith('$2b$') 
      ? insertUser.password 
      : await hashPassword(insertUser.password);
    
    const result = await db.insert(users).values({
      username: insertUser.username,
      password: hashedPassword,
      role: insertUser.role || 'operator',
    }).returning();
    
    return result[0];
  }

  // Team member methods
  async getTeamMembers(): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).orderBy(teamMembers.name);
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return result[0];
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const result = await db.insert(teamMembers).values(member).returning();
    return result[0];
  }

  async updateTeamMemberStatus(id: string, status: string): Promise<TeamMember> {
    const result = await db.update(teamMembers)
      .set({ status, updatedAt: new Date() })
      .where(eq(teamMembers.id, id))
      .returning();
    
    if (result.length === 0) throw new Error('Team member not found');
    return result[0];
  }

  async deleteTeamMember(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  // Incident methods
  async getIncidents(): Promise<Incident[]> {
    return await db.select().from(incidents).orderBy(desc(incidents.createdAt));
  }

  async getActiveIncidents(): Promise<Incident[]> {
    return await db.select().from(incidents)
      .where(eq(incidents.status, 'active'))
      .orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    const result = await db.select().from(incidents).where(eq(incidents.id, id));
    return result[0];
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const result = await db.insert(incidents).values(incident).returning();
    return result[0];
  }

  async updateIncidentStatus(id: string, status: string): Promise<Incident> {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === "resolved" || status === "closed") {
      updateData.resolvedAt = new Date();
    }

    const result = await db.update(incidents)
      .set(updateData)
      .where(eq(incidents.id, id))
      .returning();
    
    if (result.length === 0) throw new Error('Incident not found');
    return result[0];
  }

  async assignIncident(id: string, assignedTo: string): Promise<Incident> {
    const result = await db.update(incidents)
      .set({ assignedTo, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning();
    
    if (result.length === 0) throw new Error('Incident not found');
    return result[0];
  }

  // User report methods
  async getUserReports(): Promise<UserReport[]> {
    return await db.select().from(userReports).orderBy(desc(userReports.createdAt));
  }

  async getPendingUserReports(): Promise<UserReport[]> {
    return await db.select().from(userReports)
      .where(eq(userReports.status, 'pending'))
      .orderBy(desc(userReports.createdAt));
  }

  async getUserReport(id: string): Promise<UserReport | undefined> {
    const result = await db.select().from(userReports).where(eq(userReports.id, id));
    return result[0];
  }

  async createUserReport(report: InsertUserReport): Promise<UserReport> {
    const result = await db.insert(userReports).values(report).returning();
    return result[0];
  }

  async updateUserReportStatus(id: string, status: string, reviewedBy?: string): Promise<UserReport> {
    const updateData: any = { status, reviewedAt: new Date() };
    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
    }

    const result = await db.update(userReports)
      .set(updateData)
      .where(eq(userReports.id, id))
      .returning();
    
    if (result.length === 0) throw new Error('User report not found');
    return result[0];
  }

  // Emergency alert methods
  async getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
    return await db.select().from(emergencyAlerts)
      .where(eq(emergencyAlerts.isActive, true))
      .orderBy(desc(emergencyAlerts.createdAt));
  }

  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const result = await db.insert(emergencyAlerts).values(alert).returning();
    return result[0];
  }

  async deactivateEmergencyAlert(id: string): Promise<EmergencyAlert> {
    const result = await db.update(emergencyAlerts)
      .set({ isActive: false })
      .where(eq(emergencyAlerts.id, id))
      .returning();
    
    if (result.length === 0) throw new Error('Emergency alert not found');
    return result[0];
  }

  // System status methods
  async getSystemStatus(): Promise<SystemStatus[]> {
    return await db.select().from(systemStatus).orderBy(desc(systemStatus.lastUpdated));
  }

  async updateSystemStatus(component: string, status: string, level?: number, notes?: string): Promise<SystemStatus> {
    // Try to update existing status first
    const existing = await db.select().from(systemStatus)
      .where(eq(systemStatus.component, component));
    
    if (existing.length > 0) {
      const result = await db.update(systemStatus)
        .set({ status, level, notes, lastUpdated: new Date() })
        .where(eq(systemStatus.component, component))
        .returning();
      return result[0];
    } else {
      // Create new status entry
      const result = await db.insert(systemStatus).values({
        component,
        status,
        level,
        notes
      }).returning();
      return result[0];
    }
  }

  // Push subscription methods
  async getPushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions).orderBy(desc(pushSubscriptions.createdAt));
  }

  async getActivePushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.isActive, true))
      .orderBy(desc(pushSubscriptions.lastUsed));
  }

  async getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | undefined> {
    const result = await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    return result[0];
  }

  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const result = await db.insert(pushSubscriptions).values(subscription).returning();
    return result[0];
  }

  async updatePushSubscription(endpoint: string, updates: Partial<PushSubscription>): Promise<PushSubscription> {
    const result = await db.update(pushSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .returning();
    
    if (result.length === 0) throw new Error('Push subscription not found');
    return result[0];
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async updatePushSubscriptionLastUsed(endpoint: string): Promise<void> {
    await db.update(pushSubscriptions)
      .set({ lastUsed: new Date() })
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async deactivatePushSubscription(endpoint: string): Promise<void> {
    await db.update(pushSubscriptions)
      .set({ isActive: false })
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }

  // Notification delivery methods
  async createNotificationDelivery(delivery: InsertNotificationDelivery): Promise<NotificationDelivery> {
    const result = await db.insert(notificationDeliveries).values(delivery).returning();
    return result[0];
  }

  async updateNotificationDeliveryStatus(id: string, status: string, errorMessage?: string): Promise<NotificationDelivery> {
    const updateData: any = { status };
    if (errorMessage) updateData.errorMessage = errorMessage;
    if (status === 'delivered') updateData.deliveredAt = new Date();

    const result = await db.update(notificationDeliveries)
      .set(updateData)
      .where(eq(notificationDeliveries.id, id))
      .returning();
    
    if (result.length === 0) throw new Error('Notification delivery not found');
    return result[0];
  }

  async updateNotificationDeliveryRetryCount(id: string, retryCount: number): Promise<NotificationDelivery> {
    const result = await db.update(notificationDeliveries)
      .set({ retryCount, status: 'retry' })
      .where(eq(notificationDeliveries.id, id))
      .returning();
    
    if (result.length === 0) throw new Error('Notification delivery not found');
    return result[0];
  }

  async getFailedNotificationDeliveries(): Promise<NotificationDelivery[]> {
    return await db.select().from(notificationDeliveries)
      .where(eq(notificationDeliveries.status, 'failed'))
      .orderBy(desc(notificationDeliveries.sentAt));
  }
}

// Use database storage if DATABASE_URL is available, otherwise fallback to in-memory
const useDatabase = !!process.env.DATABASE_URL;

let storage: IStorage;

if (useDatabase) {
  console.log('🗄️  Initializing database storage...');
  storage = new DatabaseStorage();
} else {
  console.log('💾 Using in-memory storage...');
  storage = new InMemoryStorage();
}

// Initialize the storage
(async () => {
  try {
    await storage.init();
    console.log(`✅ Storage initialized successfully (${useDatabase ? 'Database' : 'In-Memory'})`);
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    // Fallback to in-memory if database fails
    if (useDatabase) {
      console.log('⚠️  Falling back to in-memory storage...');
      storage = new InMemoryStorage();
      await storage.init();
    }
  }
})();

export { storage };
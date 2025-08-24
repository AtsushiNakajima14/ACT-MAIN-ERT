import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("operator"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("available"),
  contactNumber: text("contact_number"),
  specializations: json("specializations"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("active"),
  location: text("location").notNull(),
  assignedTo: varchar("assigned_to"),
  reportedBy: varchar("reported_by"),
  coordinates: json("coordinates"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const userReports = pgTable("user_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  title: text("title"),
  message: text("message").notNull(),
  location: text("location").notNull(),
  contactInfo: text("contact_info"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  coordinates: json("coordinates"),
  shareLocation: boolean("share_location").default(false),
  metadata: json("metadata"), // additional form data
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  priority: text("priority").notNull().default("high"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const systemStatus = pgTable("system_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  component: text("component").notNull(),
  status: text("status").notNull(),
  level: integer("level"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes"),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  endpoint: text("endpoint").notNull().unique(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  deviceType: text("device_type"),
  deviceName: text("device_name"),
  userAgent: text("user_agent"),
  platform: text("platform"),
  isActive: boolean("is_active").default(true),
  failureCount: integer("failure_count").default(0),
  lastSuccessfulNotification: timestamp("last_successful_notification"),
  lastFailureReason: text("last_failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull(),
  alertId: varchar("alert_id"),
  messageType: text("message_type").notNull(),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
});

export const incidentsRelations = relations(incidents, ({ one }) => ({
  assignedToMember: one(teamMembers, {
    fields: [incidents.assignedTo],
    references: [teamMembers.id],
  }),
}));

export const userReportsRelations = relations(userReports, ({ one }) => ({
  reviewedByUser: one(users, {
    fields: [userReports.reviewedBy],
    references: [users.id],
  }),
}));

export const emergencyAlertsRelations = relations(emergencyAlerts, ({ one }) => ({
  creator: one(users, {
    fields: [emergencyAlerts.createdBy],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
  deliveries: many(notificationDeliveries),
}));

export const notificationDeliveriesRelations = relations(notificationDeliveries, ({ one }) => ({
  subscription: one(pushSubscriptions, {
    fields: [notificationDeliveries.subscriptionId],
    references: [pushSubscriptions.id],
  }),
  alert: one(emergencyAlerts, {
    fields: [notificationDeliveries.alertId],
    references: [emergencyAlerts.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserReportSchema = createInsertSchema(userReports).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  reviewedBy: true,
});


export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertSystemStatusSchema = createInsertSchema(systemStatus).omit({
  id: true,
  lastUpdated: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
  updatedAt: true,
  failureCount: true,
  lastSuccessfulNotification: true,
  lastFailureReason: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;

export type InsertUserReport = z.infer<typeof insertUserReportSchema>;
export type UserReport = typeof userReports.$inferSelect;


export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;

export type InsertSystemStatus = z.infer<typeof insertSystemStatusSchema>;
export type SystemStatus = typeof systemStatus.$inferSelect;

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export const insertNotificationDeliverySchema = createInsertSchema(notificationDeliveries).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
});

export type InsertNotificationDelivery = z.infer<typeof insertNotificationDeliverySchema>;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;

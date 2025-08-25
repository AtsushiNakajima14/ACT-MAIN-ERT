// ==============================================
// CREDENTIAL CONFIGURATION
// ==============================================
// You can easily modify these credentials below as needed.
// Simply change the values and restart the application.

export const CONFIG = {
  // Authentication & Session Configuration
  auth: {
    // Session secret for encrypting session data
    sessionSecret: 'emergency-response-offline-key-2024',
    
    // Default admin user credentials (created if doesn't exist)
    adminUsername: 'operator',
    adminPassword: 'ert2025!',
  },

  // Push Notification Configuration (VAPID Keys)
  pushNotifications: {
    // VAPID keys for web push notifications
    // You can generate new keys at: https://vapidkeys.com/
    vapidPublicKey: 'BDhdybofVzDW3l9W1fJhhNQFQiBjc2y7E1l0bAzPDG_TPw0Sw8wTMu_rkdja_pQtLUZJRHT_85m4yIKmJa-w77Y',
    vapidPrivateKey: 's4a3prczQD75tJR-1PLluXaFFKGNErVfv1KR195sbc8',
    vapidEmail: 'mailto:cyyydevv@gmail.com',
  },

  // Database Configuration
  database: {
    // ==== CHOOSE YOUR DATABASE OPTION ====
    // Option 1: Use your external Render PostgreSQL database
    // Note: If there are network issues, the app will automatically fall back to in-memory storage
    url: 'postgresql://emergency_response_db_user:FdHkQyHwvmiJL6PP4v4xPVMTLfALSDzp@dpg-d2li6lje5dus738rrhq0-a/emergency_response_db',
    
    // Option 2: Use local Replit database (comment out the line above and uncomment below)
    // url: process.env.DATABASE_URL,
    
    // Option 3: Use in-memory storage only (set to null)
    // url: null,
  },

  // Application Configuration
  app: {
    // Environment settings
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
  },
};

// Helper function to validate required configuration
export function validateConfig() {
  const missing: string[] = [];

  if (!CONFIG.auth.sessionSecret) missing.push('auth.sessionSecret');
  if (!CONFIG.auth.adminUsername) missing.push('auth.adminUsername');
  if (!CONFIG.auth.adminPassword) missing.push('auth.adminPassword');
  if (!CONFIG.pushNotifications.vapidPublicKey) missing.push('pushNotifications.vapidPublicKey');
  if (!CONFIG.pushNotifications.vapidPrivateKey) missing.push('pushNotifications.vapidPrivateKey');
  if (!CONFIG.pushNotifications.vapidEmail) missing.push('pushNotifications.vapidEmail');

  if (missing.length > 0) {
    console.error('❌ Missing required configuration values:', missing);
    return false;
  }

  console.log('✅ Configuration validation passed');
  return true;
}
import bcrypt from 'bcrypt';
import session from 'express-session';
import MemoryStore from 'memorystore';
import ConnectPgSimple from 'connect-pg-simple';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      role: string;
    };
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  
  let sessionStore;
  
  // Use PostgreSQL session store if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    const PgSession = ConnectPgSimple(session);
    sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions',
      createTableIfMissing: true
    });
    console.log('🗄️  Using PostgreSQL session store');
  } else {
    // Fallback to memory store for development
    const memoryStore = MemoryStore(session);
    sessionStore = new memoryStore({
      checkPeriod: sessionTtl,
      ttl: sessionTtl,
    });
    console.log('💾 Using in-memory session store');
  }

  return session({
    secret: process.env.SESSION_SECRET || 'emergency-response-offline-key-2024',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'emergency.sid',
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const user = req.session.user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  (req as any).user = user;
  next();
};

export const requireOperator: RequestHandler = (req, res, next) => {
  const user = req.session.user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (user.role !== 'operator') {
    return res.status(403).json({ message: 'Operator access required' });
  }
  
  (req as any).user = user;
  next();
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function setupAuthRoutes(app: Express) {
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
      };
      
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Session save failed' });
        }
        
        res.json({
          id: user.id,
          username: user.username,
          role: user.role,
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('emergency.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/user', (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json(user);
  });
}
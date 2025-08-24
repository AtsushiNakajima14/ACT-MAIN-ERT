# Render Deployment Guide

## Quick Deploy
1. Connect your GitHub repository to Render
2. Use the `render.yaml` configuration file for automatic setup
3. Set environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `SESSION_SECRET` (auto-generated secure string)
   - `NODE_ENV=production`

## Manual Deployment Steps

### 1. Build Configuration
- Build Command: `./render-build.sh`
- Start Command: `npm start`

### 2. Environment Variables
Required environment variables:
```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-secure-random-string
```

### 3. Database Setup
- Create a PostgreSQL database in Render
- Run database migrations: `npm run db:push`

## Files Added for Render Support

- `render-build.sh` - Build script that organizes files correctly
- `render.yaml` - Render service configuration
- `start-production.js` - Production startup script
- Updated server configuration for HTTPS and proxy support

## What Was Fixed

1. **Static File Serving**: Fixed path resolution for production builds
2. **Security Settings**: Enabled secure cookies for HTTPS
3. **Environment Detection**: Proper production/development mode switching
4. **Proxy Support**: Added trust proxy for Render's reverse proxy
5. **Build Process**: Organized build output to match server expectations

The application is now fully compatible with Render hosting!
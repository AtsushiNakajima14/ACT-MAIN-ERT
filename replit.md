# Overview

This is an Emergency Response Team (ERT) Management System for the Asian College of Technology. The application provides a comprehensive platform for managing emergency situations with both public-facing emergency assistance and an operator dashboard for emergency response coordination. The system handles incident reporting, team management, real-time notifications, and emergency alerts with offline capabilities and push notifications.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend uses React 18 with TypeScript for type safety and modern development practices. Vite serves as the build tool providing fast development and optimized production builds. Client-side routing is handled by Wouter, a lightweight alternative to React Router.

The UI layer is built with TailwindCSS for utility-first styling and custom ACT branding colors. Shadcn/ui provides accessible component primitives built on Radix UI. The design system includes custom color schemes for emergency states (red), warning states (yellow), and operational states (blue/green).

State management utilizes TanStack Query for server state with intelligent caching, automatic background refetching, and offline support. The application includes comprehensive error boundaries and fallback states for resilient user experience.

## Backend Architecture
The backend is built with Express.js providing RESTful API endpoints with TypeScript for type safety. WebSocket integration enables real-time bidirectional communication for live updates of incidents, team status, and emergency alerts.

Session-based authentication uses express-session with MemoryStore for development and configurable storage for production. The authentication system includes role-based access control distinguishing between operators and public users.

The storage layer features a modular abstraction with in-memory storage as the default implementation, but is prepared for database integration. This allows the system to run without external dependencies while being ready for production scaling.

## Real-time Communication
WebSocket connections provide instant updates for:
- Emergency alert broadcasts to all connected clients
- Incident status changes and assignments
- Team member status updates
- System status notifications

The WebSocket implementation includes automatic reconnection with exponential backoff and graceful degradation when connections fail.

## Progressive Web App Features
The application is designed as a PWA with:
- Service worker for offline functionality and background sync
- Web app manifest for native app-like installation
- Push notification support for critical emergency alerts
- Offline data caching with automatic sync when connectivity returns

## Offline Capabilities
Comprehensive offline support includes:
- Cached app shell for immediate loading
- API response caching with automatic invalidation
- Offline notification queuing with delivery retry
- Visual indicators for offline state and data freshness

## Security Architecture
Security measures include:
- Password hashing with bcrypt
- HTTPS enforcement in production
- Secure session cookies with proper flags
- CSRF protection through SameSite cookie settings
- Input validation and sanitization
- Role-based authorization for sensitive operations

# External Dependencies

## Core Framework Dependencies
- **React 18** - Frontend framework with concurrent features
- **Express.js** - Backend web application framework
- **TypeScript** - Type safety across full stack
- **Vite** - Frontend build tool and development server

## UI and Styling
- **TailwindCSS** - Utility-first CSS framework
- **Shadcn/ui** - React component library built on Radix UI
- **Radix UI** - Low-level accessible UI primitives
- **Lucide React** - Icon library for consistent iconography

## State Management and Data Fetching
- **TanStack Query** - Server state management with caching
- **Wouter** - Lightweight client-side routing

## Authentication and Security
- **bcrypt** - Password hashing library
- **express-session** - Session management middleware
- **memorystore** - Memory-based session store

## Real-time Communication
- **ws** - WebSocket library for real-time updates
- **web-push** - Push notification service for browsers

## Database Integration (Prepared)
- **Drizzle ORM** - Type-safe database toolkit
- **@neondatabase/serverless** - Serverless PostgreSQL driver
- **PostgreSQL** - Production database system

## Development and Build Tools
- **ESBuild** - Fast JavaScript bundler for production
- **TSX** - TypeScript execution for development
- **PostCSS** - CSS processing tool
- **Autoprefixer** - CSS vendor prefix automation

## Deployment and Hosting
- **Render** - Cloud hosting platform (configured via render.yaml)
- **Environment Variables** - Configuration management for different environments
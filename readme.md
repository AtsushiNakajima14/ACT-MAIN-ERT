
# Emergency Response Team (ERT) System

Emergency Response Team (ERT) management system for the Asian College of Technology. The application provides a dual interface: a public-facing emergency assistance portal and an operator dashboard for managing incidents, team members, and emergency responses. The system enables real-time communication between the public and emergency response operators through incident reports, help requests, and live status updates.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with JavaScript enabled

### Installation & Setup
```bash
# Clone the repository (if using git)
git clone <repository-url>
cd ert-management-system

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Default Admin Access
- **Username:** `operator`
- **Password:** `ert2025!`
- **Role:** Admin

## 🏗️ System Architecture

### Frontend Architecture
- **React 18 + TypeScript**: Modern React with full type safety
- **Vite**: Lightning-fast development server and optimized builds
- **Wouter**: Lightweight client-side routing
- **TailwindCSS**: Utility-first CSS framework with custom ACT branding
- **Shadcn/ui**: Accessible UI components built on Radix UI primitives
- **TanStack Query**: Powerful server state management with caching

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **WebSocket Integration**: Real-time bidirectional communication
- **Modular Storage Layer**: Flexible storage abstraction with in-memory fallback
- **Push Notifications**: Service worker-based notifications for critical alerts

### Data Management
- **In-Memory Storage**: Default storage solution with data persistence
- **Database Ready**: Prepared for PostgreSQL with Drizzle ORM integration
- **Real-time Sync**: WebSocket-based live updates across all clients

## 🎯 Key Features

### Public Interface
- **Emergency Reporting**: Quick emergency incident reporting with location services
- **Help Requests**: Non-emergency assistance requests
- **Real-time Alerts**: Live emergency notifications and system status
- **Emergency Contacts**: Direct access to emergency hotlines and chat support
- **Mobile Responsive**: Optimized for mobile devices and touch interfaces

### Operator Dashboard
- **Incident Management**: Create, assign, and track emergency incidents
- **Team Management**: Manage team members, roles, and availability status
- **User Reports**: Review and respond to public emergency reports
- **Emergency Alerts**: Broadcast emergency alerts to all users
- **System Monitoring**: Monitor system status and component health
- **Real-time Updates**: Live incident updates and team status changes

### Advanced Features
- **Push Notifications**: Critical alert delivery via service workers
- **Offline Support**: Service worker caching for offline functionality
- **Location Services**: GPS integration for emergency location tracking
- **Role-based Access**: Secure operator authentication and authorization
- **Real-time Communication**: WebSocket-powered live updates

## 📱 User Interfaces

### Public Emergency Portal (`/`)
- Emergency report submission
- Help request forms
- Live emergency alerts display
- Emergency contact information
- System status indicators

### Operator Dashboard (`/operator`)
- Comprehensive incident management
- Team member administration
- Emergency alert broadcasting
- User report review and response
- System status management

### Authentication (`/login`)
- Secure operator login
- Role-based access control
- Session management

## 🔧 Technical Implementation

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── operator/   # Operator dashboard components
│   │   │   ├── public/     # Public interface components
│   │   │   └── ui/         # Base UI components (Shadcn/ui)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and types
│   │   ├── pages/          # Main application pages
│   │   └── index.css       # Global styles with ACT branding
│   └── public/             # Static assets and service worker
├── server/                 # Backend Express application
│   ├── auth.ts            # Authentication logic
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # Data storage abstraction
│   └── pushNotifications.ts # Push notification service
├── shared/                 # Shared TypeScript schemas
└── scripts/               # Utility scripts
```

### API Endpoints

#### Public Endpoints
- `GET /api/emergency-alerts` - Active emergency alerts
- `GET /api/system-status` - System component status
- `POST /api/user-reports` - Submit emergency/help reports

#### Operator Endpoints (Authentication Required)
- `GET /api/incidents` - Incident management
- `GET /api/team-members` - Team member management
- `GET /api/user-reports` - Review user submissions
- `POST /api/emergency-alerts` - Create emergency alerts
- `POST /api/push-subscriptions` - Manage push notifications

### Real-time Features
- **WebSocket Server**: Live updates for incidents, alerts, and team status
- **Push Notifications**: Critical alert delivery via service workers
- **Auto-refresh**: Automatic data synchronization
- **Connection Management**: Automatic reconnection handling

## 🎨 Design System

### ACT Branding
- **Primary Blue**: `hsl(220, 90%, 50%)` - Main brand color
- **ACT Yellow**: `hsl(43, 95%, 55%)` - Accent color
- **Emergency Red**: `hsl(0, 85%, 55%)` - Critical alerts
- **Status Green**: `hsl(160, 90%, 45%)` - Success states

### UI Components
- **Modern Cards**: Glass-effect styling with hover animations
- **Emergency Buttons**: Prominent styling with pulse animations
- **Status Badges**: Color-coded status indicators
- **Responsive Grid**: Mobile-first responsive layouts

## 🔐 Security Features

### Authentication
- Secure password hashing with bcrypt
- Session-based authentication
- Role-based access control (operator/admin)

### Data Protection
- Input validation with Zod schemas
- XSS protection through React's built-in sanitization
- CORS configuration for API security

## 📊 Monitoring & Analytics

### System Health
- Component status monitoring
- Real-time performance metrics
- Error tracking and logging

### Usage Analytics
- Incident response times
- User report statistics
- Team availability tracking

### Environment Configuration
- `OPERATOR_USERNAME`: Default operator username (default: 'operator')
- `OPERATOR_PASSWORD`: Default operator password (default: 'ert2025!')
- `NODE_ENV`: Environment mode (development/production)

## 🧪 Testing

### Manual Testing
- Emergency report submission flow
- Operator incident management
- Real-time update functionality
- Push notification delivery
- Mobile responsiveness

### Test Scenarios
1. Public user submits emergency report
2. Operator receives and responds to incident
3. Emergency alert broadcast to all users
4. Team member status updates
5. System component monitoring

## 📱 Progressive Web App (PWA)

### Service Worker Features
- Offline caching for critical functionality
- Push notification handling
- Background sync for data updates
- Cache-first strategy for static assets

### Mobile Optimization
- Touch-friendly interface design
- Responsive breakpoints for all devices
- Native app-like experience
- Proper viewport configuration

## 🎯 Emergency Response Workflow

1. **Public Report**: User submits emergency via public interface
2. **Real-time Alert**: Operators receive immediate notification
3. **Incident Creation**: Operator creates formal incident record
4. **Team Assignment**: Incident assigned to available team members
5. **Status Updates**: Real-time progress updates
6. **Resolution**: Incident marked as resolved with timeline

## 🔄 Data Flow

### Real-time Updates
- WebSocket connections for live data sync
- Automatic UI updates on data changes
- Offline queue for critical operations
- Background sync when connection restored

### State Management
- TanStack Query for server state
- React state for UI interactions
- WebSocket state for real-time data
- Local storage for user preferences

## 📞 Emergency Contact Integration

### Built-in Contacts
- **Emergency Hotline**: +961 8 097 532
- **Location**: Leon Kilat St. corner N.B. Bacalso Ave., Cebu City
- **Direct Actions**: One-click calling and emergency chat

## 🎨 Branding Guidelines

### Logo and Identity
- Shield icon representing protection and security
- ACT blue primary color scheme
- Professional yet approachable design
- Consistent with Asian College of Technology branding

### Typography
- Sans-serif fonts for readability
- Clear hierarchy with size and weight
- Accessible contrast ratios
- Mobile-optimized text scaling

## 🔧 Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)

### Asian College of Technology
- **Motto**: "Let's do BETTER let's ACT together"
- **Mission**: Providing quality emergency response services for campus safety
- **Location**: Main Campus, Cebu City, Philippines

---

**Emergency Response Team Management System** - Ensuring campus safety through technology and rapid response coordination.

For technical support, contact the lead developer Cyril Encenso on Facebook

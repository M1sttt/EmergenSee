# Architecture Documentation

## System Overview

EmergenSee is a real-time emergency response coordination system built as a monorepo using Turborepo. The system consists of multiple packages and applications working together to provide a comprehensive emergency management solution.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Web App (React + Vite)                   │  │
│  │  - React Router for navigation                   │  │
│  │  - TanStack Query for server state               │  │
│  │  - Zustand for client state                      │  │
│  │  - Socket.io client for real-time updates        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    API Layer                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │         API Server (NestJS)                      │  │
│  │  - REST API endpoints                            │  │
│  │  - JWT authentication                            │  │
│  │  - WebSocket gateway                             │  │
│  │  - Business logic                                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Mongoose ODM
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Database Layer                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │             MongoDB                              │  │
│  │  - User documents                                │  │
│  │  - Event documents                               │  │
│  │  - Status update documents                       │  │
│  │  - Geospatial indexes                            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Monorepo Structure

### Applications (`apps/`)

#### 1. API (`apps/api`)
NestJS backend application providing REST API and WebSocket functionality.

**Key Modules:**
- **Auth Module**: Handles authentication and JWT token management
- **Users Module**: User CRUD operations and management
- **Events Module**: Emergency event management
- **Status Module**: Responder status tracking
- **WebSocket Module**: Real-time communication gateway

**Technology Stack:**
- NestJS framework
- MongoDB with Mongoose
- Passport.js for authentication
- Socket.io for WebSocket
- JWT for token-based auth

#### 2. Web (`apps/web`)
React frontend application with modern UI/UX.

**Key Features:**
- Dashboard with real-time statistics
- Event management interface
- Interactive map with Leaflet
- User management (admin)
- Status tracking

**Technology Stack:**
- React 18
- Vite (build tool)
- TanStack Query (server state)
- Zustand (client state)
- React Router (routing)
- Tailwind CSS (styling)
- Leaflet (maps)

### Packages (`packages/`)

#### 1. Shared (`packages/shared`)
Contains shared types, schemas, and constants used across applications.

**Contents:**
- TypeScript type definitions
- Zod validation schemas
- Shared constants and enums
- Common interfaces

#### 2. UI (`packages/ui`)
Reusable UI components library.

**Contents:**
- Button component
- Form components
- Layout components

#### 3. ESLint Config (`packages/eslint-config`)
Shared ESLint configuration for consistent code style.

#### 4. TypeScript Config (`packages/tsconfig`)
Shared TypeScript configurations for different app types.

## Data Flow

### 1. User Authentication Flow

```
User Login Request
      │
      ▼
Web App (LoginPage)
      │
      ▼
authService.login()
      │
      ▼
API: POST /auth/login
      │
      ▼
AuthController.login()
      │
      ▼
AuthService.validateUser()
      │
      ▼
UsersService.findByEmail()
      │
      ▼
MongoDB Query
      │
      ▼
Password Verification (bcrypt)
      │
      ▼
Generate JWT Tokens
      │
      ▼
Return AuthResponse
      │
      ▼
Store in Zustand (authStore)
      │
      ▼
Redirect to Dashboard
```

### 2. Real-Time Event Update Flow

```
Event Created/Updated
      │
      ▼
API: EventsService
      │
      ▼
MongoDB Save
      │
      ├─────────────────────┐
      │                     │
      ▼                     ▼
HTTP Response      WebSocketGateway
      │              .emitEventUpdated()
      ▼                     │
Update Client              ▼
via HTTP              Broadcast to all
                      connected clients
                            │
                            ▼
                      Web App receives
                      WebSocket event
                            │
                            ▼
                      useWebSocket hook
                      triggers callback
                            │
                            ▼
                      queryClient.invalidate()
                            │
                            ▼
                      UI auto-refreshes
```

### 3. Event Management Flow

```
User Action (Create/Update Event)
      │
      ▼
EventForm Component
      │
      ▼
react-hook-form validation
      │
      ▼
TanStack Query mutation
      │
      ▼
eventsService.create/update()
      │
      ▼
API: POST/PATCH /events
      │
      ▼
JWT Auth Guard
      │
      ▼
Roles Guard (Admin/Dispatcher)
      │
      ▼
EventsController
      │
      ▼
EventsService
      │
      ▼
Mongoose Model
      │
      ▼
MongoDB Transaction
      │
      ├─────────────────────┐
      │                     │
      ▼                     ▼
Return Event         WebSocket Broadcast
      │                     │
      ▼                     ▼
Update Cache        Notify all clients
      │                     │
      └─────────┬───────────┘
                ▼
          UI Updates
```

## Security Architecture

### Authentication & Authorization

1. **JWT-based Authentication**
   - Access tokens (15 min expiry)
   - Refresh tokens (7 day expiry)
   - Tokens stored in Zustand persist storage

2. **Role-Based Access Control (RBAC)**
   - Admin: Full system access
   - Dispatcher: Manage events, view all data
   - Field Responder: Update status, view assigned events
   - Viewer: Read-only access

3. **Guards & Decorators**
   - `JwtAuthGuard`: Validates JWT tokens
   - `RolesGuard`: Checks user roles
   - `@Roles()` decorator: Specifies required roles

### API Security

1. **CORS**: Configured for specific origins
2. **Input Validation**: All inputs validated with class-validator
3. **Password Hashing**: bcrypt with salt rounds
4. **Rate Limiting**: Recommended for production

## Database Design

### Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: Enum,
  status: Enum,
  phoneNumber: String,
  badgeNumber: String,
  department: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Events Collection
```javascript
{
  _id: ObjectId,
  type: Enum,
  priority: Enum,
  status: Enum,
  title: String,
  description: String,
  location: {
    type: "Point",
    coordinates: [Number, Number] // [longitude, latitude]
  },
  address: String,
  reportedBy: ObjectId (ref: User),
  assignedTo: [ObjectId] (ref: User),
  resolvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
location: "2dsphere" // For geospatial queries
```

#### Status Updates Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  status: Enum,
  location: {
    type: "Point",
    coordinates: [Number, Number]
  },
  eventId: ObjectId (ref: Event),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
userId: 1
location: "2dsphere"
createdAt: -1
```

### Geospatial Features

MongoDB's geospatial indexes enable:
- Finding events near a location
- Tracking responder positions
- Distance-based queries
- Location-based filtering

## Real-Time Communication

### WebSocket Architecture

1. **Connection Management**
   - Client connects on app load
   - Server maintains connection map
   - Automatic reconnection on disconnect

2. **Event Types**
   - `event:created`
   - `event:updated`
   - `event:deleted`
   - `status:updated`
   - `user:joined`
   - `user:left`

3. **Broadcasting Strategy**
   - Server broadcasts to all connected clients
   - Clients filter events based on relevance
   - Optimistic UI updates

## State Management

### Server State (TanStack Query)
- Event data
- User data
- Status updates
- Automatic caching
- Background refetching
- Optimistic updates

### Client State (Zustand)
- Authentication state
- User session
- Token storage
- Persisted to localStorage

### Component State
- Form inputs
- UI state (modals, dropdowns)
- Local user interactions

## Performance Optimizations

1. **Code Splitting**: React lazy loading for routes
2. **Query Caching**: TanStack Query caches API responses
3. **Optimistic Updates**: UI updates before server confirmation
4. **Geospatial Indexes**: Fast location-based queries
5. **WebSocket**: Reduces polling overhead
6. **Build Optimization**: Vite for fast builds and HMR

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Load balancer distribution
- Shared MongoDB instance
- Redis for session storage (future)

### Vertical Scaling
- MongoDB replica sets
- Indexed queries
- Connection pooling
- Caching strategies

### Future Enhancements
- Redis for caching
- Message queue (RabbitMQ/Kafka)
- Microservices architecture
- CDN for static assets
- Multi-region deployment

## Development Workflow

1. **Local Development**
   - Turborepo runs all apps in parallel
   - Hot module replacement (HMR)
   - Shared package changes auto-rebuild

2. **Testing Strategy**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - E2E tests for critical flows

3. **CI/CD Pipeline** (Recommended)
   - Lint and type checking
   - Unit and integration tests
   - Build verification
   - Automated deployment

## Monitoring & Logging

### Recommended Tools
- **Application Monitoring**: New Relic, DataDog
- **Error Tracking**: Sentry
- **Log Aggregation**: ELK Stack, CloudWatch
- **Performance**: Lighthouse, Web Vitals
- **Uptime**: Pingdom, UptimeRobot

## Deployment Architecture

### Production Setup
```
                Internet
                   │
                   ▼
           Load Balancer / CDN
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   Web App (Static)      API Servers
   (Vercel/Netlify)     (AWS/Heroku)
                             │
                             ▼
                        MongoDB Atlas
                     (Cloud Database)
```

## Technology Decisions

### Why NestJS?
- TypeScript-first framework
- Modular architecture
- Built-in dependency injection
- Excellent for enterprise applications
- Great WebSocket support

### Why React + Vite?
- Fast development experience
- Modern build tool
- Excellent HMR
- Smaller bundle sizes
- Better performance

### Why MongoDB?
- Flexible schema
- Geospatial queries
- Horizontal scaling
- JSON-like documents
- Good for event-driven data

### Why Turborepo?
- Fast builds with caching
- Parallel execution
- Shared packages
- Incremental builds
- Better DX for monorepos

## Troubleshooting Guide

### Common Issues

1. **WebSocket Connection Fails**
   - Check CORS configuration
   - Verify WS_URL environment variable
   - Check firewall rules

2. **Authentication Errors**
   - Verify JWT_SECRET matches
   - Check token expiration
   - Ensure refresh token flow works

3. **Geospatial Queries Fail**
   - Verify 2dsphere index exists
   - Check coordinate order (longitude, latitude)
   - Validate location format

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check for conflicting dependencies
   - Verify TypeScript versions match

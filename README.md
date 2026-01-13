# EmergenSee

A real-time emergency response coordination system built with modern web technologies.

## Overview

EmergenSee is a comprehensive emergency response platform that enables real-time coordination between dispatchers and field responders. The system provides live event tracking, geographic visualization, status updates, and role-based access control.

## Architecture

This is a Turborepo monorepo containing:

- **apps/api** - NestJS backend with MongoDB
- **apps/web** - React + Vite frontend with Tailwind CSS
- **packages/shared** - Shared types, schemas, and constants
- **packages/ui** - Reusable UI components
- **packages/eslint-config** - Shared ESLint configuration
- **packages/tsconfig** - Shared TypeScript configuration

## Tech Stack

### Backend (API)
- NestJS - Progressive Node.js framework
- MongoDB with Mongoose - Database and ODM
- JWT - Authentication
- Socket.io - Real-time WebSocket communication
- Passport - Authentication strategies

### Frontend (Web)
- React 18 - UI library
- Vite - Build tool and dev server
- TypeScript - Type safety
- TanStack Query - Server state management
- Zustand - Client state management
- React Router - Routing
- React Hook Form - Form handling
- Tailwind CSS - Styling
- Leaflet - Map visualization
- Socket.io Client - WebSocket client

### Shared Packages
- Zod - Schema validation
- TypeScript - Shared types and interfaces

## Features

### Core Features
- Real-time event management
- Live map visualization
- User management with role-based access
- Status tracking for field responders
- WebSocket updates for real-time coordination

### User Roles
1. **Admin** - Full system access
2. **Dispatcher** - Create/manage events, view status
3. **Field Responder** - Update status, view assigned events
4. **Viewer** - Read-only access

### Event Management
- Create, update, and track emergency events
- Priority levels: Critical, High, Medium, Low
- Event types: Fire, Medical, Accident, Crime, Natural Disaster, Hazmat, Other
- Status tracking: Pending, Dispatched, En Route, On Scene, Resolved, Cancelled
- Geographic location tracking
- Event assignment to responders

### Real-time Features
- Live event updates via WebSocket
- Status update notifications
- Live map markers
- Automatic dashboard refresh

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- MongoDB instance (local or cloud)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd EmergenSee
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

For the API (`apps/api/.env`):
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/emergensee
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

For the Web app (`apps/web/.env`):
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=http://localhost:3001
```

4. Start MongoDB (if running locally):
```bash
docker-compose up -d
```

5. Start the development servers:
```bash
pnpm dev
```

This will start:
- API server at http://localhost:3001
- Web app at http://localhost:5173

## Project Structure

```
EmergenSee/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── users/         # User management
│   │   │   ├── events/        # Event management
│   │   │   ├── status/        # Status updates
│   │   │   ├── websocket/     # WebSocket gateway
│   │   │   └── common/        # Guards, decorators, etc.
│   │   └── package.json
│   │
│   └── web/                    # React Frontend
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── pages/         # Page components
│       │   ├── services/      # API services
│       │   ├── store/         # State management
│       │   └── hooks/         # Custom hooks
│       └── package.json
│
├── packages/
│   ├── shared/                # Shared code
│   │   ├── src/
│   │   │   ├── types/        # TypeScript types
│   │   │   ├── schemas/      # Zod schemas
│   │   │   └── constants/    # Shared constants
│   │   └── package.json
│   │
│   ├── ui/                    # Shared UI components
│   ├── eslint-config/         # ESLint configs
│   └── tsconfig/              # TypeScript configs
│
├── turbo.json                 # Turborepo configuration
├── package.json               # Root package.json
└── pnpm-workspace.yaml        # PNPM workspace config
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user (Admin only)
- `PATCH /api/v1/users/:id` - Update user (Admin only)
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

### Events
- `GET /api/v1/events` - Get all events
- `GET /api/v1/events/:id` - Get event by ID
- `GET /api/v1/events/nearby` - Get nearby events
- `POST /api/v1/events` - Create event (Admin/Dispatcher)
- `PATCH /api/v1/events/:id` - Update event (Admin/Dispatcher)
- `DELETE /api/v1/events/:id` - Delete event (Admin/Dispatcher)

### Status
- `GET /api/v1/status` - Get all status updates
- `GET /api/v1/status/:id` - Get status update by ID
- `GET /api/v1/status/user/:userId` - Get user's status updates
- `GET /api/v1/status/user/:userId/latest` - Get user's latest status
- `POST /api/v1/status` - Create status update
- `PATCH /api/v1/status/:id` - Update status (Admin/Dispatcher)
- `DELETE /api/v1/status/:id` - Delete status (Admin/Dispatcher)

## WebSocket Events

### Client can listen to:
- `event:created` - New event created
- `event:updated` - Event updated
- `event:deleted` - Event deleted
- `status:updated` - Status update created
- `user:joined` - User connected
- `user:left` - User disconnected
- `connected` - Successfully connected
- `error` - Error occurred

## Scripts

### Root Level
- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps
- `pnpm clean` - Clean all build artifacts

### API
- `pnpm dev` - Start API in development mode
- `pnpm build` - Build API
- `pnpm start` - Start production build
- `pnpm lint` - Lint API code
- `pnpm test` - Run tests

### Web
- `pnpm dev` - Start web app in development mode
- `pnpm build` - Build web app for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Lint web app code

## Development

### Adding New Features

1. Define types in `packages/shared/src/types`
2. Add schemas in `packages/shared/src/schemas`
3. Create API endpoints in `apps/api/src`
4. Add services and components in `apps/web/src`
5. Update documentation

### Code Style

This project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

Run `pnpm lint` to check for issues.

## Deployment

### API Deployment

1. Build the API:
```bash
cd apps/api
pnpm build
```

2. Set environment variables for production
3. Deploy to your hosting provider (Heroku, AWS, etc.)

### Web Deployment

1. Build the web app:
```bash
cd apps/web
pnpm build
```

2. Deploy the `dist` folder to a static hosting service (Vercel, Netlify, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

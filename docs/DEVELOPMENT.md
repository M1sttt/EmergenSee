# Development Guide

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (LTS recommended)
- **pnpm** 8+ (package manager)
- **MongoDB** 5+ (local or cloud)
- **Git** (version control)

### Initial Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd EmergenSee
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

Create `.env` files for both apps:

**apps/api/.env**
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/emergensee
JWT_SECRET=your-development-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

**apps/web/.env**
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=http://localhost:3001
```

4. **Start MongoDB**

Using Docker:
```bash
docker-compose up -d
```

Or start your local MongoDB instance:
```bash
mongod --dbpath /path/to/data
```

5. **Start development servers**
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
│   │   │   ├── common/        # Shared utilities
│   │   │   ├── app.module.ts  # Root module
│   │   │   └── main.ts        # Entry point
│   │   ├── test/              # Tests
│   │   ├── .env.example       # Environment template
│   │   └── package.json
│   │
│   └── web/                    # React Frontend
│       ├── src/
│       │   ├── components/    # React components
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── events/
│       │   │   ├── layout/
│       │   │   ├── map/
│       │   │   ├── users/
│       │   │   └── status/
│       │   ├── pages/         # Page components
│       │   ├── services/      # API services
│       │   ├── store/         # State management
│       │   ├── hooks/         # Custom React hooks
│       │   ├── utils/         # Utility functions
│       │   ├── App.tsx        # Root component
│       │   └── main.tsx       # Entry point
│       ├── public/            # Static assets
│       ├── .env.example       # Environment template
│       └── package.json
│
├── packages/
│   ├── shared/                # Shared types & schemas
│   │   ├── src/
│   │   │   ├── types/        # TypeScript types
│   │   │   ├── schemas/      # Zod schemas
│   │   │   ├── constants/    # Constants
│   │   │   └── index.ts      # Exports
│   │   └── package.json
│   │
│   ├── ui/                    # Shared UI components
│   ├── eslint-config/         # ESLint configs
│   └── tsconfig/              # TypeScript configs
│
├── docs/                      # Documentation
├── .gitignore
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # PNPM workspace config
├── turbo.json                 # Turborepo config
└── README.md
```

## Development Workflow

### Running Specific Apps

Run only the API:
```bash
cd apps/api
pnpm dev
```

Run only the Web app:
```bash
cd apps/web
pnpm dev
```

### Working with Shared Packages

When you modify `packages/shared`, the changes are automatically picked up by apps using it thanks to Turborepo's caching and watch mode.

### Creating a New Module (API)

1. Generate module using NestJS CLI:
```bash
cd apps/api
nest g module <module-name>
nest g service <module-name>
nest g controller <module-name>
```

2. Define schema in `<module-name>/schemas/`
3. Create DTOs using types from `@emergensee/shared`
4. Implement service logic
5. Add controller endpoints
6. Update `app.module.ts`

### Creating a New Page (Web)

1. Create page component in `src/pages/`
```tsx
// src/pages/NewPage.tsx
export default function NewPage() {
  return <div>New Page</div>;
}
```

2. Add route in `App.tsx`:
```tsx
<Route path="/new-page" element={<NewPage />} />
```

3. Add navigation link in `Layout.tsx`

### Adding New Shared Types

1. Define types in `packages/shared/src/types/`
```typescript
// packages/shared/src/types/new-entity.types.ts
export interface NewEntity {
  id: string;
  name: string;
}
```

2. Create Zod schema in `packages/shared/src/schemas/`
```typescript
// packages/shared/src/schemas/new-entity.schemas.ts
import { z } from 'zod';

export const createNewEntitySchema = z.object({
  name: z.string().min(1),
});
```

3. Export from respective index files
4. Types are now available in both API and Web apps

## Code Style & Linting

### ESLint

Run linting across all packages:
```bash
pnpm lint
```

Fix auto-fixable issues:
```bash
pnpm lint --fix
```

### Prettier

Prettier is configured and integrated with ESLint. Format on save is recommended in your editor.

### TypeScript

Type checking:
```bash
pnpm type-check
```

## Testing

### API Tests

```bash
cd apps/api
pnpm test           # Run unit tests
pnpm test:watch     # Watch mode
pnpm test:cov       # Coverage
pnpm test:e2e       # E2E tests
```

### Web Tests

```bash
cd apps/web
pnpm test
```

### Writing Tests

#### API Unit Test Example
```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let model: Model<UserDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user by email', async () => {
    const email = 'test@example.com';
    const result = await service.findByEmail(email);
    expect(result).toBeDefined();
  });
});
```

#### Web Component Test Example
```typescript
// EventForm.test.tsx
import { render, screen } from '@testing-library/react';
import EventForm from './EventForm';

describe('EventForm', () => {
  it('renders form fields', () => {
    render(<EventForm onClose={() => {}} />);
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
  });
});
```

## Database Management

### MongoDB Commands

Connect to MongoDB:
```bash
mongosh mongodb://localhost:27017/emergensee
```

Useful queries:
```javascript
// Show all collections
show collections

// Count documents
db.users.countDocuments()
db.events.countDocuments()

// Find all users
db.users.find().pretty()

// Create geospatial index (if not exists)
db.events.createIndex({ location: "2dsphere" })
db.statusupdates.createIndex({ location: "2dsphere" })

// Drop database (development only!)
db.dropDatabase()
```

### Seeding Data

Create a seed script in `apps/api/src/seeds/`:

```typescript
// seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  // Create admin user
  await usersService.create({
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
  });

  console.log('Seeding complete');
  await app.close();
}

bootstrap();
```

Run seed:
```bash
cd apps/api
npx ts-node src/seeds/seed.ts
```

## Debugging

### API Debugging (VS Code)

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/apps/api",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Web Debugging

Use browser DevTools:
- React DevTools extension
- Redux DevTools (for Zustand)
- Network tab for API calls
- Console for logs

### Common Issues

**Issue**: Port already in use
```bash
# Find process using port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Issue**: MongoDB connection failed
- Check if MongoDB is running
- Verify MONGODB_URI in .env
- Check firewall settings

**Issue**: WebSocket connection failed
- Check CORS configuration
- Verify WS_URL in web .env
- Check if API server is running

## Building for Production

### Build all apps
```bash
pnpm build
```

### Build specific app
```bash
cd apps/api
pnpm build

cd apps/web
pnpm build
```

### Preview production build (Web)
```bash
cd apps/web
pnpm preview
```

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages
Follow conventional commits:
```
feat: add user authentication
fix: resolve event creation bug
refactor: improve event service structure
docs: update API documentation
chore: update dependencies
```

### Pull Request Process
1. Create feature branch
2. Make changes
3. Run tests and linting
4. Push to remote
5. Create pull request
6. Code review
7. Merge to main

## Environment Variables

### API Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | API server port | 3001 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/emergensee |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | Access token expiry | 15m |
| JWT_REFRESH_SECRET | Refresh token secret | - |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiry | 7d |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:5173 |

### Web Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | API base URL | http://localhost:3001/api/v1 |
| VITE_WS_URL | WebSocket URL | http://localhost:3001 |

## Performance Tips

1. **Use React.memo** for expensive components
2. **Implement pagination** for large lists
3. **Use TanStack Query caching** effectively
4. **Optimize MongoDB queries** with indexes
5. **Use WebSocket** instead of polling
6. **Code split** routes with React.lazy
7. **Optimize images** and assets
8. **Use production builds** for testing

## Best Practices

### API Development
- Use DTOs for input validation
- Implement proper error handling
- Use guards for authentication/authorization
- Document endpoints with Swagger (future)
- Write unit tests for services
- Use transactions for complex operations

### Web Development
- Use TypeScript strictly
- Implement proper error boundaries
- Handle loading and error states
- Use semantic HTML
- Implement accessibility features
- Optimize for performance
- Write component tests

### General
- Keep functions small and focused
- Use meaningful variable names
- Comment complex logic
- Keep dependencies updated
- Follow DRY principle
- Use early returns
- Handle edge cases

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [Vite Guide](https://vitejs.dev/guide/)

## Getting Help

- Check existing documentation
- Search GitHub issues
- Ask in team chat
- Create new GitHub issue
- Review code examples in codebase

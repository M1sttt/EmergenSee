# Frequently Asked Questions (FAQ)

## General Questions

### What is EmergenSee?

EmergenSee is a real-time emergency response coordination system designed to help dispatchers and field responders manage emergency events efficiently. It provides live updates, geographic visualization, and status tracking for emergency personnel.

### Who can use EmergenSee?

EmergenSee is designed for:
- Emergency dispatch centers
- Fire departments
- Police departments
- EMS services
- Emergency management agencies
- First responder organizations

### What are the main features?

- Real-time event management
- Interactive map visualization
- Status tracking for responders
- Role-based access control
- WebSocket-powered live updates
- User management
- Geographic event search

### Is EmergenSee free to use?

EmergenSee is open-source software released under the MIT license. You can use, modify, and distribute it freely. However, you'll need to provide your own hosting infrastructure.

## Technical Questions

### What technologies does EmergenSee use?

**Backend:**
- NestJS (Node.js framework)
- MongoDB (database)
- Socket.io (real-time communication)
- JWT (authentication)

**Frontend:**
- React (UI library)
- Vite (build tool)
- TanStack Query (state management)
- Leaflet (maps)
- Tailwind CSS (styling)

### What are the system requirements?

**Development:**
- Node.js 18+
- MongoDB 5+
- 4GB RAM minimum
- Modern web browser

**Production:**
- Node.js 18+
- MongoDB 5+ (or MongoDB Atlas)
- 2GB RAM minimum per instance
- SSL certificate for HTTPS

### Can I deploy EmergenSee to the cloud?

Yes! EmergenSee can be deployed to various cloud platforms:
- Heroku
- AWS (Elastic Beanstalk, EC2)
- DigitalOcean App Platform
- Google Cloud Platform
- Azure
- Vercel/Netlify (frontend)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Does EmergenSee support multiple languages?

Currently, EmergenSee only supports English. Internationalization (i18n) support is planned for future releases.

### How do I upgrade to a new version?

1. Pull the latest code
2. Run `pnpm install` to update dependencies
3. Run database migrations (if any)
4. Rebuild and redeploy

Always check CHANGELOG.md for breaking changes.

## Setup & Installation

### How do I install EmergenSee?

See our [DEVELOPMENT.md](./DEVELOPMENT.md) guide for detailed installation instructions. Basic steps:

```bash
git clone <repository>
cd EmergenSee
pnpm install
# Configure .env files
pnpm dev
```

### I'm getting a MongoDB connection error. What should I do?

Common solutions:
1. Ensure MongoDB is running
2. Check MONGODB_URI in .env file
3. Verify MongoDB is accessible from your network
4. Check firewall settings
5. Try using MongoDB Atlas (cloud)

### WebSocket connections are failing. How do I fix this?

1. Check that VITE_WS_URL is correct in web/.env
2. Verify CORS_ORIGIN in api/.env
3. Ensure WebSocket port (usually same as API port) is open
4. Check if you're behind a proxy that blocks WebSockets
5. Try using wss:// instead of ws:// in production

### How do I create the first admin user?

After initial setup, you can create an admin user via MongoDB:

```javascript
db.users.insertOne({
  email: "admin@example.com",
  password: "$2b$10$...", // bcrypt hash of your password
  firstName: "Admin",
  lastName: "User",
  role: "admin",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

Or create a seed script as described in DEVELOPMENT.md.

## Features & Usage

### How do I create an event?

1. Log in as Admin or Dispatcher
2. Go to the Events page
3. Click "Create Event"
4. Fill in the event details
5. Click "Create"

Events are immediately visible to all connected users.

### Can I assign events to specific responders?

Yes! When editing an event, you can select which users are assigned to it. Only Admin and Dispatcher roles can assign events.

### How does real-time updating work?

EmergenSee uses WebSocket connections (Socket.io) to push updates to all connected clients in real-time. When an event is created or updated, all users see the change immediately without refreshing.

### What event types are supported?

- Fire
- Medical
- Accident
- Crime
- Natural Disaster
- Hazmat
- Other

### What priority levels can events have?

- Low
- Medium
- High
- Critical

### What are the different user roles?

1. **Admin**: Full system access, can manage users
2. **Dispatcher**: Create/manage events, view all data
3. **Field Responder**: Update status, view assigned events
4. **Viewer**: Read-only access to events

### How do I track responder status?

Field responders can update their status from the Status page. Status options:
- Available
- Busy
- En Route
- On Scene
- Off Duty

### Can I search for nearby events?

Yes! The Events API includes a `/events/nearby` endpoint that accepts coordinates and returns events within a specified radius.

## Security

### How secure is EmergenSee?

EmergenSee implements several security measures:
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation
- CORS protection
- HTTPS/WSS support

See [SECURITY.md](./SECURITY.md) for more details.

### How do I enable HTTPS?

In production, use a reverse proxy (Nginx, Apache) or a platform service (Heroku, AWS) that provides SSL certificates. For local development, HTTP is sufficient.

### Can I integrate with Active Directory/LDAP?

Not currently. This is a potential future enhancement. Currently, users must be created directly in the system.

### How are passwords stored?

Passwords are hashed using bcrypt with 10 salt rounds before storage. Plain text passwords are never stored in the database.

## Customization

### Can I customize the UI?

Yes! The UI is built with React and Tailwind CSS, making it easy to customize:
- Modify colors in `tailwind.config.js`
- Edit components in `apps/web/src/components`
- Customize layouts in `apps/web/src/components/layout`

### Can I add custom event types?

Yes! To add custom event types:
1. Update `EventType` enum in `packages/shared/src/types/event.types.ts`
2. Update `EVENT_TYPE_LABELS` in `packages/shared/src/constants/index.ts`
3. Rebuild and redeploy

### Can I integrate with external systems?

Yes! You can integrate via:
- REST API endpoints
- WebSocket connections
- Direct MongoDB access (not recommended)
- Custom middleware

### Can I change the map provider?

Yes! EmergenSee uses Leaflet which supports multiple tile providers. Edit the TileLayer URL in `MapPage.tsx` to use a different provider (Mapbox, Google Maps, etc.).

## Performance

### How many concurrent users can EmergenSee handle?

This depends on your infrastructure. A single API instance can typically handle:
- 50-100 concurrent WebSocket connections
- 100+ HTTP requests per second

For more users, implement horizontal scaling with load balancing.

### How do I scale EmergenSee?

1. **Horizontal scaling**: Deploy multiple API instances behind a load balancer
2. **Database scaling**: Use MongoDB replica sets or sharding
3. **Caching**: Implement Redis for session storage and caching
4. **CDN**: Use a CDN for static frontend assets

See [DEPLOYMENT.md](./DEPLOYMENT.md) for scaling strategies.

### The map is slow to load. How can I optimize it?

1. Limit the number of markers displayed
2. Implement marker clustering
3. Use lazy loading for off-screen markers
4. Optimize tile loading
5. Use a CDN for map tiles

## Troubleshooting

### The application won't start. What should I check?

1. Node.js version (18+)
2. MongoDB is running
3. Environment variables are set
4. No port conflicts
5. Dependencies are installed (`pnpm install`)

### I'm getting CORS errors. How do I fix them?

1. Check CORS_ORIGIN in api/.env
2. Ensure it matches your frontend URL
3. Include protocol (http:// or https://)
4. In production, use your actual domain

### Events aren't updating in real-time. Why?

1. Check WebSocket connection in browser DevTools
2. Verify VITE_WS_URL is correct
3. Check API server logs for WebSocket errors
4. Ensure no firewall is blocking WebSocket connections

### How do I view logs?

**Development:**
- API logs: Check terminal running `pnpm dev`
- Web logs: Check browser console

**Production:**
- API logs: Check platform logs (Heroku logs, AWS CloudWatch, etc.)
- Set up log aggregation (ELK, Splunk, etc.)

## Contributing

### How can I contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed contribution guidelines. You can contribute by:
- Reporting bugs
- Suggesting features
- Submitting pull requests
- Improving documentation
- Helping other users

### What should I work on?

Check the GitHub issues for:
- `good-first-issue` labels for beginners
- `help-wanted` labels for priority items
- Feature requests
- Bug reports

### How do I submit a pull request?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Ensure linting passes
6. Create a pull request
7. Wait for review

## Support

### Where can I get help?

- Read the documentation in `/docs`
- Check existing GitHub issues
- Open a new GitHub issue
- Join community discussions (if available)

### I found a bug. How do I report it?

Open a GitHub issue using the bug report template. Include:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots (if applicable)

### Can I get commercial support?

Currently, we don't offer commercial support. The project is community-supported through GitHub issues and discussions.

## Licensing

### What license does EmergenSee use?

EmergenSee is released under the MIT License. This means you can use, modify, and distribute it freely, even for commercial purposes.

### Can I use EmergenSee in a commercial product?

Yes! The MIT License allows commercial use. However, the software is provided "as is" without warranty.

### Do I need to open-source my modifications?

No. The MIT License does not require you to open-source your modifications. However, we encourage contributing improvements back to the community.

## Future Plans

### What features are planned?

Planned features include:
- Mobile app (iOS/Android)
- Two-factor authentication
- Advanced analytics dashboard
- Export functionality
- Notification system
- Offline support
- Multi-language support
- Integration with CAD systems

### How can I request a feature?

Open a GitHub issue using the feature request template. Describe:
- The feature you want
- Why it would be useful
- How it should work
- Any alternatives you've considered

### When will feature X be available?

Check the GitHub project board for feature status and estimated timelines. Development is community-driven, so timelines may vary.

## Additional Resources

- [README.md](../README.md) - Project overview
- [API Documentation](./API.md) - REST API reference
- [Architecture](./ARCHITECTURE.md) - System architecture
- [Development Guide](./DEVELOPMENT.md) - Setup and development
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [WebSocket Docs](./WEBSOCKET.md) - Real-time communication

---

**Can't find your question?**

Open a GitHub issue with the "question" label, and we'll add it to this FAQ!

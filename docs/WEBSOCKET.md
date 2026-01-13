# WebSocket Documentation

## Overview

EmergenSee uses Socket.io for real-time bidirectional communication between the server and clients. This enables instant updates for events, status changes, and system notifications without polling.

## Connection

### Server Configuration

WebSocket server runs on the same port as the HTTP server (default: 3001).

**Server Setup** (`apps/api/src/websocket/websocket.gateway.ts`):
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class WebsocketGateway {
  @WebSocketServer()
  server: Server;
}
```

### Client Connection

**Connection Setup** (`apps/web/src/services/websocketService.ts`):
```typescript
const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  autoConnect: true,
});
```

## Event Types

### System Events

#### CONNECTED
Emitted when client successfully connects to server.

**Direction**: Server → Client

**Payload**:
```typescript
{
  type: 'connected',
  payload: {
    message: 'Connected to EmergenSee'
  },
  timestamp: Date
}
```

#### DISCONNECTED
Emitted when client disconnects from server.

**Direction**: Server → Client

**Payload**:
```typescript
{
  type: 'disconnected',
  payload: {
    reason: string
  },
  timestamp: Date
}
```

#### ERROR
Emitted when an error occurs.

**Direction**: Server → Client

**Payload**:
```typescript
{
  type: 'error',
  payload: {
    message: string,
    code?: string
  },
  timestamp: Date
}
```

### Event Updates

#### EVENT_CREATED
Emitted when a new event is created.

**Direction**: Server → All Clients

**Payload**:
```typescript
{
  type: 'event:created',
  payload: {
    event: {
      id: string,
      type: EventType,
      priority: EventPriority,
      status: EventStatus,
      title: string,
      description: string,
      location: Location,
      address: string,
      createdAt: Date,
      updatedAt: Date
    }
  },
  timestamp: Date
}
```

**Example**:
```typescript
{
  type: 'event:created',
  payload: {
    event: {
      id: '507f1f77bcf86cd799439011',
      type: 'fire',
      priority: 'critical',
      status: 'pending',
      title: 'Building Fire',
      description: 'Large fire at residential building',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128]
      },
      address: '123 Main St, New York, NY 10001',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z'
    }
  },
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

#### EVENT_UPDATED
Emitted when an event is updated.

**Direction**: Server → All Clients

**Payload**:
```typescript
{
  type: 'event:updated',
  payload: {
    event: Event
  },
  timestamp: Date
}
```

**Example**:
```typescript
{
  type: 'event:updated',
  payload: {
    event: {
      id: '507f1f77bcf86cd799439011',
      type: 'fire',
      priority: 'critical',
      status: 'dispatched',  // Status changed
      title: 'Building Fire',
      description: 'Large fire at residential building',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128]
      },
      address: '123 Main St, New York, NY 10001',
      assignedTo: ['507f1f77bcf86cd799439012'],  // Assigned
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:35:00.000Z'
    }
  },
  timestamp: '2024-01-15T10:35:00.000Z'
}
```

#### EVENT_DELETED
Emitted when an event is deleted.

**Direction**: Server → All Clients

**Payload**:
```typescript
{
  type: 'event:deleted',
  payload: {
    eventId: string
  },
  timestamp: Date
}
```

**Example**:
```typescript
{
  type: 'event:deleted',
  payload: {
    eventId: '507f1f77bcf86cd799439011'
  },
  timestamp: '2024-01-15T11:00:00.000Z'
}
```

### Status Updates

#### STATUS_UPDATED
Emitted when a responder's status is updated.

**Direction**: Server → All Clients

**Payload**:
```typescript
{
  type: 'status:updated',
  payload: {
    statusUpdate: StatusUpdate,
    userId: string
  },
  timestamp: Date
}
```

**Example**:
```typescript
{
  type: 'status:updated',
  payload: {
    statusUpdate: {
      id: '507f1f77bcf86cd799439014',
      userId: '507f1f77bcf86cd799439012',
      status: 'en_route',
      location: {
        type: 'Point',
        coordinates: [-74.010, 40.715]
      },
      eventId: '507f1f77bcf86cd799439013',
      notes: 'Heading to scene, ETA 5 minutes',
      createdAt: '2024-01-15T10:35:00.000Z',
      updatedAt: '2024-01-15T10:35:00.000Z'
    },
    userId: '507f1f77bcf86cd799439012'
  },
  timestamp: '2024-01-15T10:35:00.000Z'
}
```

### User Events

#### USER_JOINED
Emitted when a user connects to the system.

**Direction**: Server → All Clients

**Payload**:
```typescript
{
  type: 'user:joined',
  payload: {
    userId: string,
    userName: string
  },
  timestamp: Date
}
```

#### USER_LEFT
Emitted when a user disconnects from the system.

**Direction**: Server → All Clients

**Payload**:
```typescript
{
  type: 'user:left',
  payload: {
    userId: string
  },
  timestamp: Date
}
```

## Client Implementation

### Basic Usage

```typescript
import { websocketService } from './services/websocketService';
import { WebSocketEventType } from '@emergensee/shared';

// Connect
websocketService.connect();

// Listen for events
websocketService.on(WebSocketEventType.EVENT_CREATED, (data) => {
  console.log('New event created:', data.event);
});

websocketService.on(WebSocketEventType.EVENT_UPDATED, (data) => {
  console.log('Event updated:', data.event);
});

// Disconnect
websocketService.disconnect();
```

### React Hook Usage

```typescript
import { useWebSocket } from './hooks/useWebSocket';
import { WebSocketEventType } from '@emergensee/shared';

function EventsPage() {
  const queryClient = useQueryClient();

  // Listen for event updates
  useWebSocket(
    WebSocketEventType.EVENT_CREATED,
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }, [queryClient])
  );

  useWebSocket(
    WebSocketEventType.EVENT_UPDATED,
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }, [queryClient])
  );

  // Component render...
}
```

### Multiple Event Listeners

```typescript
useEffect(() => {
  websocketService.connect();

  const handleEventCreated = (data) => {
    console.log('Event created:', data);
    refetchEvents();
  };

  const handleEventUpdated = (data) => {
    console.log('Event updated:', data);
    refetchEvents();
  };

  const handleStatusUpdated = (data) => {
    console.log('Status updated:', data);
    refetchStatus();
  };

  websocketService.on(WebSocketEventType.EVENT_CREATED, handleEventCreated);
  websocketService.on(WebSocketEventType.EVENT_UPDATED, handleEventUpdated);
  websocketService.on(WebSocketEventType.STATUS_UPDATED, handleStatusUpdated);

  return () => {
    websocketService.off(WebSocketEventType.EVENT_CREATED, handleEventCreated);
    websocketService.off(WebSocketEventType.EVENT_UPDATED, handleEventUpdated);
    websocketService.off(WebSocketEventType.STATUS_UPDATED, handleStatusUpdated);
  };
}, []);
```

## Server Implementation

### Emitting Events

```typescript
// In EventsService
async create(createEventDto: CreateEventDto): Promise<Event> {
  const event = await this.eventModel.create(createEventDto);

  // Emit to all connected clients
  this.websocketGateway.emitEventCreated(event);

  return event;
}
```

### Broadcasting to All Clients

```typescript
// In WebSocketGateway
emitEventCreated(event: any) {
  this.server.emit(WebSocketEventType.EVENT_CREATED, {
    type: WebSocketEventType.EVENT_CREATED,
    payload: { event },
    timestamp: new Date(),
  });
}
```

### Broadcasting to Specific Clients

```typescript
// Emit to specific socket
this.server.to(socketId).emit('event', data);

// Emit to all clients in a room
this.server.to(roomName).emit('event', data);

// Emit to all except sender
socket.broadcast.emit('event', data);
```

## Connection Management

### Client Connection Lifecycle

1. **Connection**
   - Client initiates connection
   - Server accepts and stores socket
   - Server emits `connected` event

2. **Active Connection**
   - Client receives real-time updates
   - Automatic ping/pong for keepalive

3. **Disconnection**
   - Client disconnects (intentional or network issue)
   - Server removes socket from map
   - Server broadcasts `user:left` event

### Reconnection Strategy

Socket.io automatically handles reconnection with exponential backoff:

```typescript
const socket = io(url, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  console.log('Connected');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});
```

## Authentication

### JWT Authentication (Future Enhancement)

```typescript
// Server-side middleware
@WebSocketGateway({
  cors: { origin: '*' },
})
export class WebsocketGateway {
  @SubscribeMessage('authenticate')
  async authenticate(client: Socket, token: string) {
    try {
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      return { success: true };
    } catch (error) {
      client.disconnect();
      return { success: false };
    }
  }
}

// Client-side
socket.on('connect', () => {
  socket.emit('authenticate', accessToken);
});
```

## Testing

### Testing WebSocket Events

```typescript
// Test setup
let socket: SocketIOClient.Socket;

beforeEach(() => {
  socket = io('http://localhost:3001');
});

afterEach(() => {
  socket.disconnect();
});

// Test event emission
it('should receive event:created', (done) => {
  socket.on('event:created', (data) => {
    expect(data.payload.event).toBeDefined();
    done();
  });

  // Trigger event creation
  createEvent();
});
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if API server is running
   - Verify WebSocket URL
   - Check CORS configuration
   - Verify firewall settings

2. **Events Not Received**
   - Check event listener registration
   - Verify event types match
   - Check if socket is connected
   - Review server logs

3. **Performance Issues**
   - Monitor number of connected clients
   - Check message frequency
   - Implement throttling if needed
   - Consider rooms for targeted broadcasting

### Debugging

```typescript
// Enable debug mode
localStorage.debug = 'socket.io-client:socket';

// Log all events
socket.onAny((event, ...args) => {
  console.log('Received event:', event, args);
});

// Monitor connection state
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('error', (error) => console.error('Error:', error));
```

## Best Practices

1. **Event Naming**: Use descriptive, namespaced event names (e.g., `event:created`)
2. **Payload Structure**: Keep payloads consistent and well-typed
3. **Error Handling**: Always handle connection errors
4. **Reconnection**: Implement proper reconnection logic
5. **Memory Management**: Clean up listeners on unmount
6. **Rate Limiting**: Implement rate limiting for client emissions
7. **Authentication**: Secure WebSocket connections (future)
8. **Monitoring**: Log and monitor WebSocket connections

## Performance Considerations

1. **Message Size**: Keep messages small and focused
2. **Broadcasting**: Use rooms for targeted messages
3. **Throttling**: Debounce rapid updates
4. **Compression**: Enable WebSocket compression
5. **Connection Pooling**: Monitor and limit connections
6. **Load Balancing**: Use sticky sessions for WebSocket

## Security

1. **Authentication**: Verify user identity (implement JWT auth)
2. **Authorization**: Check permissions before broadcasting
3. **Input Validation**: Validate all client messages
4. **Rate Limiting**: Prevent spam and DoS attacks
5. **CORS**: Configure properly for production
6. **SSL/TLS**: Use secure WebSocket (wss://) in production

## Future Enhancements

- [ ] JWT authentication for WebSocket
- [ ] Room-based broadcasting for teams
- [ ] Private messaging between users
- [ ] Presence detection (online/offline)
- [ ] Message acknowledgments
- [ ] Binary data support
- [ ] Compression for large payloads
- [ ] Redis adapter for horizontal scaling

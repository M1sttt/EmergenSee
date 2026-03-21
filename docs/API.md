# API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication

All endpoints except `/auth/login` and `/auth/refresh` require authentication via JWT Bearer token.

Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "dispatcher",
    "status": "active",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Users

#### GET /users
Get all users (Admin/Dispatcher only).

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "field_responder",
    "status": "active",
    "phoneNumber": "+1234567890",
    "badgeNumber": "FD-123",
    "department": "Fire Department",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

#### GET /users/:id
Get user by ID (Admin/Dispatcher only).

**Parameters:**
- `id` - User ID

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "field_responder",
  "status": "active",
  "phoneNumber": "+1234567890",
  "badgeNumber": "FD-123",
  "department": "Fire Department",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

#### POST /users
Create new user (Admin only).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "field_responder",
  "phoneNumber": "+1234567890",
  "badgeNumber": "FD-456",
  "department": "Fire Department"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "field_responder",
  "status": "active",
  "phoneNumber": "+1234567890",
  "badgeNumber": "FD-456",
  "department": "Fire Department",
  "createdAt": "2024-01-15T11:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

#### PATCH /users/:id
Update user (Admin only).

**Parameters:**
- `id` - User ID

**Request Body:**
```json
{
  "firstName": "Jane",
  "phoneNumber": "+1987654321",
  "status": "inactive"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "field_responder",
  "status": "inactive",
  "phoneNumber": "+1987654321",
  "badgeNumber": "FD-456",
  "department": "Fire Department",
  "createdAt": "2024-01-15T11:00:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

#### DELETE /users/:id
Delete user (Admin only).

**Parameters:**
- `id` - User ID

**Response:**
```
204 No Content
```

---

### Events

#### GET /events
Get all events.

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439013",
    "type": "fire",
    "priority": "high",
    "status": "dispatched",
    "title": "Building Fire",
    "description": "Fire reported at residential building",
    "location": {
      "type": "Point",
      "coordinates": [-74.006, 40.7128]
    },
    "address": "123 Main St, New York, NY 10001",
    "reportedBy": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "assignedTo": [
      {
        "id": "507f1f77bcf86cd799439012",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
]
```

#### GET /events/:id
Get event by ID.

**Parameters:**
- `id` - Event ID

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439013",
  "type": "fire",
  "priority": "high",
  "status": "dispatched",
  "title": "Building Fire",
  "description": "Fire reported at residential building",
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "address": "123 Main St, New York, NY 10001",
  "reportedBy": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "assignedTo": [
    {
      "id": "507f1f77bcf86cd799439012",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:35:00.000Z"
}
```

#### GET /events/nearby
Get nearby events based on coordinates.

**Query Parameters:**
- `longitude` - Longitude coordinate (required)
- `latitude` - Latitude coordinate (required)
- `maxDistance` - Maximum distance in meters (optional, default: 10000)

**Example:**
```
GET /events/nearby?longitude=-74.006&latitude=40.7128&maxDistance=5000
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439013",
    "type": "fire",
    "priority": "high",
    "status": "dispatched",
    "title": "Building Fire",
    "description": "Fire reported at residential building",
    "location": {
      "type": "Point",
      "coordinates": [-74.006, 40.7128]
    },
    "address": "123 Main St, New York, NY 10001",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
]
```

#### POST /events
Create new event (Admin/Dispatcher only).

**Request Body:**
```json
{
  "type": "fire",
  "priority": "high",
  "title": "Building Fire",
  "description": "Fire reported at residential building",
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "address": "123 Main St, New York, NY 10001",
  "reportedBy": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439013",
  "type": "fire",
  "priority": "high",
  "status": "pending",
  "title": "Building Fire",
  "description": "Fire reported at residential building",
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "address": "123 Main St, New York, NY 10001",
  "reportedBy": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### PATCH /events/:id
Update event (Admin/Dispatcher only).

**Parameters:**
- `id` - Event ID

**Request Body:**
```json
{
  "status": "on_scene",
  "assignedTo": ["507f1f77bcf86cd799439012"]
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439013",
  "type": "fire",
  "priority": "high",
  "status": "on_scene",
  "title": "Building Fire",
  "description": "Fire reported at residential building",
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "address": "123 Main St, New York, NY 10001",
  "assignedTo": ["507f1f77bcf86cd799439012"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:45:00.000Z"
}
```

#### DELETE /events/:id
Delete event (Admin/Dispatcher only).

**Parameters:**
- `id` - Event ID

**Response:**
```
204 No Content
```

---

### Status Updates

#### GET /status
Get all status updates (Admin/Dispatcher only).

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "userId": {
      "id": "507f1f77bcf86cd799439012",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    },
    "status": "on_scene",
    "location": {
      "type": "Point",
      "coordinates": [-74.006, 40.7128]
    },
    "eventId": {
      "id": "507f1f77bcf86cd799439013",
      "title": "Building Fire",
      "type": "fire"
    },
    "notes": "Arrived at scene, assessing situation",
    "createdAt": "2024-01-15T10:40:00.000Z",
    "updatedAt": "2024-01-15T10:40:00.000Z"
  }
]
```

#### GET /status/:id
Get status update by ID.

**Parameters:**
- `id` - Status update ID

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "userId": {
    "id": "507f1f77bcf86cd799439012",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com"
  },
  "status": "on_scene",
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "eventId": {
    "id": "507f1f77bcf86cd799439013",
    "title": "Building Fire",
    "type": "fire"
  },
  "notes": "Arrived at scene, assessing situation",
  "createdAt": "2024-01-15T10:40:00.000Z",
  "updatedAt": "2024-01-15T10:40:00.000Z"
}
```

#### GET /status/user/:userId
Get all status updates for a specific user (Admin/Dispatcher only).

**Parameters:**
- `userId` - User ID

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "userId": "507f1f77bcf86cd799439012",
    "status": "on_scene",
    "location": {
      "type": "Point",
      "coordinates": [-74.006, 40.7128]
    },
    "eventId": {
      "id": "507f1f77bcf86cd799439013",
      "title": "Building Fire",
      "type": "fire"
    },
    "notes": "Arrived at scene, assessing situation",
    "createdAt": "2024-01-15T10:40:00.000Z",
    "updatedAt": "2024-01-15T10:40:00.000Z"
  }
]
```

#### GET /status/user/:userId/latest
Get latest status update for a specific user.

**Parameters:**
- `userId` - User ID

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "userId": "507f1f77bcf86cd799439012",
  "status": "on_scene",
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "eventId": {
    "id": "507f1f77bcf86cd799439013",
    "title": "Building Fire",
    "type": "fire"
  },
  "notes": "Arrived at scene, assessing situation",
  "createdAt": "2024-01-15T10:40:00.000Z",
  "updatedAt": "2024-01-15T10:40:00.000Z"
}
```

#### POST /status
Create status update.

**Request Body:**
```json
{
  "status": "en_route",
  "location": {
    "type": "Point",
    "coordinates": [-74.010, 40.715]
  },
  "eventId": "507f1f77bcf86cd799439013",
  "notes": "Heading to scene"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439015",
  "userId": "507f1f77bcf86cd799439012",
  "status": "en_route",
  "location": {
    "type": "Point",
    "coordinates": [-74.010, 40.715]
  },
  "eventId": "507f1f77bcf86cd799439013",
  "notes": "Heading to scene",
  "createdAt": "2024-01-15T10:35:00.000Z",
  "updatedAt": "2024-01-15T10:35:00.000Z"
}
```

#### PATCH /status/:id
Update status (Admin/Dispatcher only).

**Parameters:**
- `id` - Status update ID

**Request Body:**
```json
{
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439015",
  "userId": "507f1f77bcf86cd799439012",
  "status": "en_route",
  "location": {
    "type": "Point",
    "coordinates": [-74.010, 40.715]
  },
  "eventId": "507f1f77bcf86cd799439013",
  "notes": "Updated notes",
  "createdAt": "2024-01-15T10:35:00.000Z",
  "updatedAt": "2024-01-15T10:36:00.000Z"
}
```

#### DELETE /status/:id
Delete status update (Admin/Dispatcher only).

**Parameters:**
- `id` - Status update ID

**Response:**
```
204 No Content
```

---

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message describing what went wrong",
  "error": "Bad Request"
}
```

Common status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented, but it's recommended for production deployments.

## WebSocket Events

See WebSocket documentation for real-time event specifications.

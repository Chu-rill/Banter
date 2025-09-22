# 🏗️ Banter Backend - NestJS API Server

The backend API server for Banter, built with NestJS, TypeScript, and modern backend technologies. This scalable server provides real-time messaging, video calling, authentication, and file handling capabilities.

## 🚀 Tech Stack

- **Framework**: NestJS 11 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js (JWT + Google OAuth)
- **Real-time**: Socket.IO for WebSocket connections
- **Caching**: Redis for session management
- **File Upload**: Multer with cloud storage support
- **Email**: Nodemailer for notifications
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator and class-transformer
- **Security**: Helmet, CORS, rate limiting

## 📁 Project Structure

```
server/
├── src/
│   ├── auth/                    # Authentication modules
│   │   ├── email-password-auth/ # Email/password authentication
│   │   ├── oauth/              # Google OAuth implementation
│   │   └── guards/             # Authentication guards
│   │
│   ├── user/                   # User management
│   │   ├── user.controller.ts  # User API endpoints
│   │   ├── user.service.ts     # User business logic
│   │   ├── user.repository.ts  # Database operations
│   │   └── dto/               # Data transfer objects
│   │
│   ├── room/                   # Room/chat functionality
│   │   ├── room.controller.ts  # Room API endpoints
│   │   ├── room.service.ts     # Room business logic
│   │   ├── room.gateway.ts     # WebSocket gateway
│   │   └── dto/               # Room DTOs
│   │
│   ├── message/                # Message handling
│   │   ├── message.controller.ts
│   │   ├── message.service.ts
│   │   ├── message.gateway.ts  # Real-time messaging
│   │   └── dto/
│   │
│   ├── call/                   # Video call features
│   │   ├── call.controller.ts  # Call API endpoints
│   │   ├── call.service.ts     # Call management
│   │   ├── call.gateway.ts     # WebRTC signaling
│   │   └── dto/
│   │
│   ├── upload/                 # File upload handling
│   │   ├── upload.controller.ts
│   │   ├── upload.service.ts
│   │   └── dto/
│   │
│   ├── email/                  # Email service
│   │   ├── email.service.ts
│   │   └── templates/         # Email templates
│   │
│   ├── redis/                  # Redis integration
│   │   ├── redis.service.ts
│   │   └── user.redis.ts      # User session management
│   │
│   ├── common/                 # Shared utilities
│   │   ├── decorators/        # Custom decorators
│   │   ├── filters/           # Exception filters
│   │   ├── interceptors/      # Response interceptors
│   │   ├── pipes/             # Validation pipes
│   │   └── utils/             # Helper functions
│   │
│   ├── types/                  # TypeScript types
│   ├── app.module.ts          # Main application module
│   └── main.ts                # Application entry point
│
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
│
├── test/                      # Test files
├── uploads/                   # File upload directory
└── package.json              # Dependencies and scripts
```

## 🛠️ Key Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with refresh tokens
- **Google OAuth 2.0** integration
- **Email verification** system
- **Password reset** functionality
- **Role-based access control** (RBAC)
- **Session management** with Redis

### 💬 Real-time Messaging
- **WebSocket connections** with Socket.IO
- **Room-based messaging** system
- **Private and group chats**
- **Typing indicators** and read receipts
- **Message persistence** with PostgreSQL
- **File sharing** capabilities

### 📹 Video & Voice Calls
- **WebRTC signaling** server
- **Call session management**
- **Screen sharing** support
- **Call history** and statistics
- **Multi-participant** call support

### 📁 File Management
- **Secure file upload** with validation
- **Multiple storage** backends support
- **Image/video processing**
- **File access control**
- **Storage quota** management

### 🏠 Room Management
- **Public/Private rooms**
- **Room permissions** and moderation
- **Participant management**
- **Room settings** customization
- **Invite system**

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- Google OAuth credentials (optional)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/banter_db
   JWT_SECRET=your_jwt_secret
   REDIS_URL=redis://localhost:6379
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Set up database**:
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

4. **Start development server**:
   ```bash
   npm run start:dev
   ```

5. **Access API**: http://localhost:5000
6. **API Documentation**: http://localhost:5000/api-docs

### Available Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server with watch mode
- `npm run start:debug` - Start server with debug mode
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Generate test coverage
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/banter_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
SESSION_SECRET=your-session-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/oauth/google/callback
FRONTEND_REDIRECT_URL=http://localhost:3000/auth/callback

# Redis
REDIS_URL=redis://localhost:6379

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,audio/mpeg
```

### Database Schema

The application uses Prisma ORM with PostgreSQL:

```prisma
model User {
  id          String   @id @default(cuid())
  username    String   @unique
  email       String   @unique
  password    String?
  avatar      String?
  isOnline    Boolean  @default(false)
  isVerified  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  rooms       Room[]
  messages    Message[]
  friends     Friend[]
  uploads     Upload[]
  callSessions CallSession[]
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `GET /api/v1/oauth/google` - Initiate Google OAuth
- `GET /api/v1/oauth/google/callback` - Google OAuth callback

### Users
- `GET /api/v1/users/search` - Search users
- `GET /api/v1/users/profile/:id` - Get user profile
- `PATCH /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/avatar` - Upload user avatar

### Rooms
- `GET /api/v1/rooms` - Get user rooms
- `POST /api/v1/rooms` - Create new room
- `GET /api/v1/rooms/:id` - Get room details
- `PATCH /api/v1/rooms/:id` - Update room
- `DELETE /api/v1/rooms/:id` - Delete room
- `POST /api/v1/rooms/:id/join` - Join room
- `POST /api/v1/rooms/:id/leave` - Leave room

### Messages
- `GET /api/v1/messages/room/:id` - Get room messages
- `POST /api/v1/messages` - Send message
- `PATCH /api/v1/messages/read` - Mark messages as read
- `DELETE /api/v1/messages/:id` - Delete message

### Files
- `POST /api/v1/upload/file` - Upload file
- `POST /api/v1/upload/avatar` - Upload avatar
- `GET /api/v1/upload/my-uploads` - Get user uploads
- `DELETE /api/v1/upload/:id` - Delete upload

### Calls
- `POST /api/v1/call/start` - Start call session
- `POST /api/v1/call/end` - End call session
- `GET /api/v1/call/history` - Get call history
- `GET /api/v1/call/stats` - Get call statistics

## 🔌 WebSocket Events

### Connection Management
- `connection` - Client connects
- `disconnect` - Client disconnects
- `join-room` - Join room for real-time updates
- `leave-room` - Leave room

### Messaging
- `send-message` - Send new message
- `message:new` - Broadcast new message
- `typing:start` - User starts typing
- `typing:stop` - User stops typing
- `message:read` - Message read status update

### Video Calls
- `call:start` - Initiate call
- `call:offer` - WebRTC offer
- `call:answer` - WebRTC answer
- `call:ice-candidate` - ICE candidate exchange
- `call:end` - End call

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

### Test Structure
```
test/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
└── fixtures/         # Test data
```

## 🔒 Security Features

- **Input validation** with class-validator
- **SQL injection protection** via Prisma
- **XSS protection** with helmet
- **CSRF protection** with proper headers
- **Rate limiting** on API endpoints
- **File upload security** with type validation
- **JWT token security** with proper expiration
- **Password hashing** with bcryptjs

## 📊 Monitoring & Logging

- **Request logging** with custom interceptors
- **Error tracking** with exception filters
- **Performance monitoring**
- **Health checks** endpoint
- **Metrics collection**

## 🚢 Deployment

### Build for Production
```bash
npm run build
npm run start:prod
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "run", "start:prod"]
```

### Deploy to Railway/Heroku
1. **Set environment variables** in platform dashboard
2. **Configure database** connection
3. **Run migrations** on deploy
4. **Set up Redis** addon

## 🔧 Development

### Code Structure
- **Modular architecture** with feature modules
- **Dependency injection** with NestJS
- **Repository pattern** for data access
- **DTO validation** with class-validator
- **Clean separation** of concerns

### Best Practices
- **Follow NestJS conventions**
- **Use TypeScript strictly**
- **Write comprehensive tests**
- **Document API endpoints**
- **Handle errors gracefully**

## 📚 Learn More

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Part of the Banter real-time communication platform** 🚀
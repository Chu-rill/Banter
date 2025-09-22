# 🚀 Banter - Modern Chat & Video Calling Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-red?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.13-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black?logo=socket.io)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2D3748?logo=prisma)](https://prisma.io/)

A modern, full-stack real-time communication platform featuring instant messaging, HD video calls, file sharing, and collaborative spaces. Built with cutting-edge web technologies for optimal performance and user experience.

## ✨ Features

### 🗨️ Real-time Messaging

- **Instant messaging** with typing indicators and read receipts
- **Emoji support** with emoji picker
- **File sharing** (images, videos, documents)
- **Message history** with pagination
- **Private and group chats**

### 📹 Video & Voice Calls

- **HD video calling** with WebRTC
- **Screen sharing** capabilities
- **Audio-only calls** option
- **Call history and statistics**
- **Multi-participant support**

### 🔐 Authentication & Security

- **Email/Password authentication**
- **Google OAuth integration**
- **JWT-based security**
- **Protected routes and API endpoints**
- **Email verification system**

### 🏠 Room Management

- **Public and private rooms**
- **Room creation and joining**
- **Participant management**
- **Room-specific settings**
- **Video/chat/hybrid room modes**

### 🎨 User Experience

- **Dark/Light theme support**
- **Responsive design** (mobile-first)
- **Real-time online status**
- **Friend system**
- **User profiles and avatars**
- **Modern glassmorphism UI**

## 🏗️ Architecture

### Frontend (Client)

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **State Management**: React Context + Hooks
- **Real-time**: Socket.IO Client
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios

### Backend (Server)

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js (JWT + Google OAuth)
- **Real-time**: Socket.IO
- **File Upload**: Multer
- **Email**: Nodemailer
- **Caching**: Redis
- **API Documentation**: Swagger

### Infrastructure

- **Database**: PostgreSQL
- **Cache**: Redis
- **File Storage**: Local/Cloud storage
- **WebRTC**: Peer-to-peer connections
- **Email Service**: SMTP (Gmail/SendGrid)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- Google OAuth credentials (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/banter.git
cd banter
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Configure your environment variables
npm run db:migrate
npm run start:dev
```

### 3. Frontend Setup

```bash
cd client
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api

## 📁 Project Structure

```
banter/
├── client/                 # Next.js Frontend Application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── lib/          # Utilities and API client
│   │   └── types/        # TypeScript type definitions
│   ├── public/           # Static assets
│   └── package.json
│
├── server/                # NestJS Backend Application
│   ├── src/
│   │   ├── auth/         # Authentication modules
│   │   ├── user/         # User management
│   │   ├── room/         # Room/chat functionality
│   │   ├── message/      # Message handling
│   │   ├── call/         # Video call features
│   │   ├── upload/       # File upload handling
│   │   └── common/       # Shared utilities
│   ├── prisma/           # Database schema and migrations
│   └── package.json
│
├── docs/                 # Documentation
├── GOOGLE_OAUTH_SETUP.md # OAuth setup guide
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

#### Client (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

#### Server (.env)

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/banter_db

# Authentication
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Redis
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

See `.env.example` files in each directory for complete configuration options.

## 🧪 Testing

### Backend Testing

```bash
cd server
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Coverage report
```

### Frontend Testing

```bash
cd client
npm run test          # Jest tests
npm run test:watch    # Watch mode
```

## 📚 API Documentation

The backend provides comprehensive API documentation through Swagger:

- **Local**: http://localhost:5000/api
- **Production**: https://your-domain.com/api

### Key API Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /oauth/google` - Google OAuth initiation
- `GET /rooms` - Get user rooms
- `POST /rooms` - Create new room
- `GET /messages/room/:id` - Get room messages
- `POST /messages` - Send message

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Google OAuth 2.0** integration
- **Input validation** with Zod schemas
- **SQL injection protection** via Prisma
- **XSS protection** with proper sanitization
- **CORS configuration** for cross-origin requests
- **Rate limiting** on API endpoints
- **File upload restrictions** and validation

## 🚢 Deployment

### Frontend (Vercel/Netlify)

```bash
cd client
npm run build
npm run start
```

### Backend (Railway/Heroku/VPS)

```bash
cd server
npm run build
npm run start:prod
```

### Database Migration

```bash
cd server
npm run db:migrate
npm run db:generate
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow **TypeScript best practices**
- Use **conventional commits**
- Add **tests for new features**
- Update **documentation** as needed
- Follow **ESLint and Prettier** configurations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** team for the amazing React framework
- **NestJS** team for the powerful Node.js framework
- **Tailwind CSS** for the utility-first CSS framework
- **Socket.IO** for real-time communication
- **Prisma** for the excellent database toolkit

## 📞 Support

- 📧 **Email**: support@banter.app
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/banter/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/banter/discussions)

---

**Built with ❤️ for better communication**

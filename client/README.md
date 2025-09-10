# 🎨 Banter Frontend - Next.js Application

The frontend application for Banter, built with Next.js 15, TypeScript, and Tailwind CSS v4. This modern React application provides a seamless real-time messaging and video calling experience.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: Radix UI primitives
- **State Management**: React Context + Hooks
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **Real-time**: Socket.IO Client
- **Authentication**: JWT + Google OAuth
- **Theme**: next-themes for dark/light mode

## 📁 Project Structure

```
client/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth layout group
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Registration page
│   │   ├── auth/              # OAuth callback pages
│   │   ├── chat/              # Main chat application
│   │   ├── globals.css        # Global styles and CSS variables
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # Landing page
│   │
│   ├── components/            # React Components
│   │   ├── auth/             # Authentication components
│   │   ├── chat/             # Chat-related components
│   │   ├── ui/               # Reusable UI components
│   │   └── layout/           # Layout components
│   │
│   ├── contexts/             # React Contexts
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── LoadingContext.tsx # Loading state management
│   │
│   ├── lib/                  # Utilities and configurations
│   │   ├── api.ts           # API client and endpoints
│   │   ├── socket.ts        # Socket.IO client setup
│   │   └── utils.ts         # Helper functions
│   │
│   └── types/               # TypeScript type definitions
│
├── public/                  # Static assets
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.mjs      # PostCSS configuration
├── next.config.js          # Next.js configuration
└── package.json           # Dependencies and scripts
```

## 🛠️ Key Features

### 🎯 Authentication System
- **Email/Password login** with form validation
- **Google OAuth integration** with seamless flow
- **Protected routes** with automatic redirects
- **JWT token management** with automatic refresh
- **User session persistence**

### 💬 Real-time Messaging
- **Instant messaging** with Socket.IO
- **Typing indicators** and read receipts
- **Emoji picker** integration
- **File upload and sharing**
- **Message history** with infinite scroll

### 📹 Video & Voice Calls
- **WebRTC integration** for peer-to-peer calls
- **Screen sharing** capabilities
- **Call controls** (mute, video on/off, hang up)
- **Call history** and statistics

### 🎨 UI/UX Features
- **Responsive design** (mobile-first approach)
- **Dark/Light theme** with system preference detection
- **Modern glassmorphism** design elements
- **Smooth animations** and transitions
- **Accessible components** with Radix UI

### 🏠 Room Management
- **Room creation** and joining
- **Public/Private room** types
- **Participant management**
- **Room settings** and customization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on http://localhost:5000

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**: http://localhost:3000

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables

Create `.env.local` file:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Optional: Analytics, monitoring, etc.
NEXT_PUBLIC_GA_ID=your_analytics_id
```

### Tailwind CSS v4 Setup

The project uses Tailwind CSS v4 with:
- **Custom CSS variables** for theming
- **Dark mode support** via classes
- **Custom animations** and utilities
- **Design system** with consistent spacing and colors

### API Integration

The frontend communicates with the backend through:
- **Axios HTTP client** with interceptors
- **Socket.IO** for real-time features
- **JWT authentication** with automatic token refresh
- **Error handling** with user-friendly messages

## 🎨 Design System

### Colors
- **Primary**: Purple/Blue gradient
- **Secondary**: Muted backgrounds
- **Accent**: Interactive elements
- **Success/Error/Warning**: Status indicators

### Typography
- **Font**: Inter (system fallback)
- **Responsive scales** for different screen sizes
- **Consistent line heights** and spacing

### Components
- **Button variants**: Primary, secondary, outline, ghost
- **Input fields** with validation states
- **Cards and containers** with glass effects
- **Navigation** with active states

## 🔌 Real-time Features

### Socket.IO Integration
```typescript
// Connection management
socketService.connect()
socketService.connectToMessages()
socketService.connectToCall()

// Event handling
socket.on('message:new', handleNewMessage)
socket.on('user:typing', handleUserTyping)
socket.on('call:incoming', handleIncomingCall)
```

### WebRTC Implementation
```typescript
// Peer connection setup
const peerConnection = new RTCPeerConnection(configuration)
peerConnection.addStream(localStream)
peerConnection.onaddstream = handleRemoteStream
```

## 📱 Responsive Design

The application is designed mobile-first with breakpoints:
- **xs**: 475px+ (small phones)
- **sm**: 640px+ (large phones)
- **md**: 768px+ (tablets)
- **lg**: 1024px+ (laptops)
- **xl**: 1280px+ (desktops)

## 🚢 Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** automatically on git push

### Deploy to Other Platforms

The application can be deployed to:
- **Netlify** (static export)
- **Railway** (full-stack)
- **AWS/GCP/Azure** (containerized)

## 🧪 Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🔒 Security

- **Input validation** with Zod schemas
- **XSS protection** with proper sanitization
- **CSRF protection** with HTTP-only cookies
- **Secure token storage** in HTTP-only cookies
- **Environment variable protection**

## 🤝 Contributing

1. **Follow TypeScript** best practices
2. **Use conventional commits**
3. **Add proper types** for all components
4. **Test responsive design** on multiple devices
5. **Follow accessibility guidelines**

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [React Hook Form](https://react-hook-form.com/)

---

**Part of the Banter real-time communication platform** 🚀
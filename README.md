# fluxChat

Real-time Messaging, simplified

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [API](#api)

**fluxChat** is a modern, real-time messaging application built for seamless communication. It features private and global chat capabilities, real-time status indicators, and media sharing, all wrapped in a clean and responsive interface.

You can explore the live app here: [https://flux-chat-wine.vercel.app](https://flux-chat-wine.vercel.app)

## Features
| Feature | Description |
| :--- | :--- |
| **Real-time Messaging** | Instant message delivery and receipt using WebSockets (Socket.io) |
| **Private & Global Chat** | Connect one-on-one or participate in community-wide global discussions |
| **Online Status** | Real-time presence indicators showing which users are currently online |
| **Media Sharing** | Send and receive images preserved in cloud storage via Cloudinary |
| **User Discovery** | Search for other users and start new conversations instantly |
| **Profile Management** | Customize your profile and update your avatar with ease |
| **Authentication** | Secure sign-up/sign-in system with JWT protected routes |
| **Responsive UI** | Optimized for a great experience on both mobile and desktop |

## Tech Stack
### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io-client
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io with Redis Adapter
- **Storage**: Cloudinary
- **Documentation**: Swagger UI
- **Security**: JWT, Helmet, CORS

## Getting Started
### Prerequisites
- Node.js (v18+)
- PostgreSQL (or Docker for local DB)
- npm

### Clone & Install
```bash
git clone https://github.com/binit2-1/fluxChat.git
cd fluxChat

# Install Client dependencies
cd client
npm install

# Install Server dependencies
cd ../server
npm install
```

### Setup Environment
1. Create a `.env` in the `server` folder with your `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY` configs, and `REDIS_URL`.
2. Create a `.env` in the `client` folder with `VITE_API_BASE_URL` and `VITE_SOCKET_URL`.

### Run the App
```bash
# Terminal 1: Start the server
cd server
npx prisma migrate dev
npm run dev

# Terminal 2: Start the frontend
cd client
npm run dev
```

## API
### Authentication
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Create a new user account |
| `/api/auth/login` | `POST` | Authenticate and get a JWT token |
| `/api/auth/me` | `GET` | Get current authenticated user details |

### Conversations
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/conversations` | `POST` | Get or create a private conversation |
| `/api/conversations` | `GET` | Retrieve list of user's conversations |
| `/api/conversations/global` | `GET` | Retrieve the global chat room |

### Messages
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/messages` | `POST` | Send a message to a conversation |
| `/api/messages/:id` | `GET` | Get message history for a conversation |
| `/api/messages/upload` | `POST` | Upload an image to the cloud |

### Users
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/user` | `GET` | Search or list users |
| `/api/user/profile` | `PATCH` | Update user profile details |
| `/api/user/avatar` | `PATCH` | Update user profile picture |

## Notes
- The frontend is deployed on **Vercel**.
- The backend is a separate service handling API and Socket connections.
- API documentation is available at `/api-docs` via Swagger.

Built for seamless real-time communication.

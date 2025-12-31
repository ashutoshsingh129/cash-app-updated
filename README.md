# Cash App Pay Application

A full-stack Cash App Pay application with Stripe Connect integration, featuring JWT authentication, payment processing, and smart device detection for mobile and desktop experiences.

**Current Working Branch:** `feature/keys-encryption`

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables Setup](#environment-variables-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Default Credentials](#default-credentials)
- [Features](#features)
- [Technologies](#technologies)
- [Available Scripts](#available-scripts)
- [Future Improvements](#future-improvements)

## Overview

This application enables Cash App Pay checkout integration with Stripe Connect. It provides:

- **JWT-based Authentication**: Secure user authentication with token-based sessions
- **Payment Processing**: Create and manage Cash App Pay payment intents via Stripe
- **Stripe Connect Integration**: Route payments to platform or connected accounts
- **Smart Device Detection**: Automatically displays QR codes for desktop or payment links for mobile devices
- **Real-time Payment Status**: Polling-based payment status monitoring
- **Responsive UI**: Material-UI based modern interface

## Project Structure

```
cash-app/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # React context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API service functions
│   │   ├── theme/       # Material-UI theme configuration
│   │   └── utils/       # Utility functions
│   └── package.json
├── server/              # Express backend API server
│   ├── config/          # Database and configuration
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API route handlers
│   ├── scripts/         # Database setup scripts
│   └── package.json
├── package.json         # Root package.json for running both
└── README.md
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher) or **yarn**
- **PostgreSQL** (v12 or higher)
- **Stripe Account** with Cash App Pay enabled
- **Stripe Secret Key** (test or live key starting with `sk_`)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cash-app
```

### 2. Install Dependencies

Install all dependencies for root, client, and server:

```bash
npm run install:all
```

Or install individually:

```bash
# Root dependencies
npm install

# Client dependencies
cd client
npm install

# Server dependencies
cd ../server
npm install
```

## Environment Variables Setup

### Server Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cd server
touch .env
```

Add the following environment variables to `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Encryption Configuration (Optional but Recommended)
# ENCRYPTION_KEY: 64-character hex string for encrypting Stripe keys
# Generate with: openssl rand -hex 32
# If not set, a default key is used (not recommended for production)
ENCRYPTION_KEY=your-64-character-hex-encryption-key-here

# PASSWORD_ENCRYPTION_KEY: Optional key for password encryption
# Generate with: openssl rand -hex 32
# PASSWORD_ENCRYPTION_KEY=your-password-encryption-key-here

# PostgreSQL Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=cashapppay
DB_PASSWORD=your_database_password
DB_PORT=5432
```

#### Environment Variables Explanation

- **PORT**: The port number on which the backend server will run (default: 5000)
- **NODE_ENV**: Environment mode - `development` or `production` (affects error messages and SSL settings)
- **FRONTEND_URL**: The URL of your frontend application (used for CORS configuration)
- **JWT_SECRET**: Secret key used to sign and verify JWT tokens (use a strong, random string in production)
- **JWT_EXPIRES_IN**: Token expiration time (e.g., `24h`, `7d`, `30m`)
- **DB_USER**: PostgreSQL database username
- **DB_HOST**: PostgreSQL server hostname (use `localhost` for local development)
- **DB_NAME**: Name of the PostgreSQL database
- **DB_PASSWORD**: PostgreSQL database password
- **DB_PORT**: PostgreSQL server port (default: 5432)
- **ENCRYPTION_KEY**: 64-character hex string used for encrypting Stripe secret keys (optional but recommended for production)
  - Generate with: `openssl rand -hex 32`
  - If not set, a default key is used (not secure for production)
  - Must remain consistent across server restarts to decrypt existing keys
- **PASSWORD_ENCRYPTION_KEY**: Optional encryption key for password encryption (generate with `openssl rand -hex 32`)

### Client Environment Variables (Optional)

Create a `.env` file in the `client/` directory if you need to customize the API base URL:

```bash
cd client
touch .env
```

Add the following to `client/.env`:

```env
# Backend API Base URL (optional - defaults to http://localhost:5000)
REACT_APP_API_BASE_URL=http://localhost:5000
```

#### Client Environment Variables Explanation

- **REACT_APP_API_BASE_URL**: The base URL for the backend API (defaults to `http://localhost:5000` if not set)
  - Note: React requires environment variables to be prefixed with `REACT_APP_` to be accessible in the browser
  - This is useful when deploying to different environments (staging, production)

### Environment Variables Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` files** to version control - add them to `.gitignore`
2. **Use strong, unique values** for `JWT_SECRET` in production
3. **Change default passwords** before deploying to production
4. **Use different credentials** for development, staging, and production environments
5. **Rotate secrets regularly** in production environments

## Database Setup

### 1. Create PostgreSQL Database

Connect to PostgreSQL and create the database:

```bash
# Using psql command line
psql -U postgres

# In PostgreSQL prompt
CREATE DATABASE cashapppay;
\q
```

Or using a single command:

```bash
createdb -U postgres cashapppay
```

### 2. Update Database Credentials

Make sure your `server/.env` file has the correct database credentials matching your PostgreSQL setup.

### 3. Initialize Database Tables

The server will automatically create the necessary tables on first run. However, you can also manually run the setup script:

```bash
cd server
npm run setup-users
```

This script will:
- Create the `users` table if it doesn't exist
- Create the `stripe_keys` table if it doesn't exist
- Create an admin user with default credentials (see [Default Credentials](#default-credentials))

**Database Tables:**
- **users**: Stores user accounts with email, password (hashed), name, and role
- **stripe_keys**: Stores encrypted Stripe API keys (secret and publishable) for each user

## Running the Application

### Development Mode (Recommended)

Run both frontend and backend concurrently:

```bash
npm run dev
```

This will start:
- **Backend server** on `http://localhost:5000`
- **Frontend app** on `http://localhost:3000`

### Individual Commands

You can also run them separately:

```bash
# Start backend only
npm run server

# Start frontend only
npm run client

# Start backend (production mode)
npm run start:server

# Start frontend (production mode)
npm run start:client
```

### Production Build

Build the frontend for production:

```bash
npm run build
```

This creates an optimized production build in `client/build/`.

## Default Credentials

After running the database setup, you can log in with:

- **Email**: `admin@example.com`
- **Password**: `password123`

⚠️ **Change these credentials in production!**

## Features

### Authentication
- JWT-based authentication
- Protected routes
- Token verification
- Secure password hashing with bcrypt

### Stripe Keys Management
- Secure storage of Stripe API keys (encrypted at rest)
- Per-user key management
- Key validation with Stripe API
- In-memory caching for performance
- Automatic key loading on server startup

### Payment Processing
- Create Cash App Pay payment intents
- Support for platform and connected account routing
- QR code generation for desktop users
- Payment links for mobile users
- Real-time payment status polling
- Payment expiration tracking

### User Experience
- Responsive design with Material-UI
- Smart device detection (mobile vs desktop)
- Real-time status updates
- Error handling with user-friendly messages
- Loading states and progress indicators

## Technologies

### Frontend
- **React 18.3.1** - UI framework
- **Material-UI (MUI) 6.5.0** - Component library
- **React Router 7.8.2** - Routing
- **Emotion** - CSS-in-JS styling
- **React Scripts 5.0.1** - Build tooling

### Backend
- **Express.js 4.18.2** - Web framework
- **PostgreSQL** - Database
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **Stripe 14.21.0** - Stripe API SDK for key validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **dotenv** - Environment variable management
- **crypto** - Node.js built-in encryption module

### External Services
- **Stripe API** - Payment processing
- **Cash App Pay** - Payment method

## Available Scripts

### Root Level
- `npm run install:all` - Install dependencies for root, client, and server
- `npm run dev` - Run both frontend and backend in development mode
- `npm run server` - Run backend server only
- `npm run client` - Run frontend app only
- `npm run build` - Build frontend for production
- `npm run start:server` - Start backend in production mode
- `npm run start:client` - Start frontend in production mode

### Client Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Server Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon (auto-reload)
- `npm run setup-users` - Setup database users and tables

## Future Improvements

1. **Email and Password Encryption**: Currently, email and password are visible in the browser network tab when making login requests. In the future, implement end-to-end encryption or use HTTPS with additional encryption layers to protect sensitive credentials during transmission.

2. **Stripe Webhooks Integration**: Replace polling-based payment status updates with Stripe webhooks for real-time, server-driven updates.

3. **Backend API for Stripe Operations**: Move all Stripe API calls from the frontend to the backend server to protect secret keys and improve security.

4. **Multi-currency Support**: Add support for multiple currencies beyond USD.

5. **Payment History**: Implement a payment history/transaction log feature.

6. **Enhanced Error Recovery**: Add retry logic and better error recovery mechanisms.

7. **Unit and Integration Tests**: Add comprehensive test coverage for both frontend and backend.

8. **Analytics and Tracking**: Implement analytics to track payment success rates and user behavior.

9. **Admin Dashboard**: Create an admin dashboard for managing users and viewing payment statistics.

10. **Two-Factor Authentication**: Add 2FA for enhanced security.

11. **Password Reset Functionality**: Implement password reset via email.

12. **Session Management**: Add session timeout and refresh token functionality.

13. **API Rate Limiting**: Implement more granular rate limiting per user/endpoint.

14. **Logging and Monitoring**: Add comprehensive logging and monitoring solutions.

15. **Docker Support**: Add Docker configuration for easy deployment.

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready` or `psql -U postgres`
- Check database credentials in `server/.env`
- Ensure the database exists: `psql -U postgres -l`
- Check PostgreSQL logs for connection errors

### Port Already in Use
- Change the `PORT` in `server/.env` if port 5000 is occupied
- For frontend, React Scripts will automatically use the next available port

### CORS Errors
- Verify `FRONTEND_URL` in `server/.env` matches your frontend URL
- Check that the backend server is running
- Ensure both servers are using the correct ports

### Authentication Issues
- Verify JWT_SECRET is set in `server/.env`
- Check that the database has been initialized
- Ensure the admin user exists (run `npm run setup-users`)

### Stripe API Issues
- Verify your Stripe secret key is correct and starts with `sk_`
- Ensure Cash App Pay is enabled in your Stripe Dashboard
- Check Stripe Dashboard for API errors and logs

### Stripe Keys Management Issues
- If keys fail to decrypt, ensure `ENCRYPTION_KEY` is set consistently
- Re-enter Stripe keys if decryption fails after server restart
- Check that keys are properly validated before saving
- Verify database has `stripe_keys` table created

## Support

For issues, questions, or contributions, please refer to the project repository or contact the development team.

## License

MIT

## Important Note

⚠️ **Mobile Device Testing and Development**: The system needs testing and development for mobile devices. While the application includes mobile device detection and responsive design features, comprehensive testing and further development are required to ensure optimal functionality and user experience across all mobile platforms and devices.

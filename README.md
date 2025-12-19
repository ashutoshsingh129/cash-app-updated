# Cash App Pay

Cash App Pay application with Stripe Connect integration.

## Project Structure

```
CashAppPay/
├── client/          # Frontend React application
├── server/          # Backend Express API server
└── package.json     # Root package.json for running both
```

## Quick Start

### 1. Install Dependencies

Install all dependencies (root, client, and server):

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

### 2. Setup Database

1. Make sure PostgreSQL is running
2. Create the database (default name: `stripedb`)
3. Update `server/.env` with your database credentials
4. Run user setup script:
```bash
cd server
npm run setup-users
```

### 3. Start Development Servers

Run both frontend and backend concurrently:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend app on `http://localhost:3000`

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

## Environment Variables

### Server (`server/.env`)

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
DB_USER=stripe
DB_HOST=localhost
DB_NAME=stripedb
DB_PASSWORD=mypassword
DB_PORT=5432
```

### Client

Set the backend API URL in `client/.env` (optional):

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

## Default Login Credentials

- Email: `admin@example.com`
- Password: `password123`

## Available Scripts

### Root Level
- `npm run install:all` - Install dependencies for root, client, and server
- `npm run dev` - Run both frontend and backend in development mode
- `npm run server` - Run backend server only
- `npm run client` - Run frontend app only

### Client
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Server
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup-users` - Setup database users

## Technologies

### Frontend
- React
- Material-UI (MUI)
- React Router
- Emotion (styled components)

### Backend
- Express.js
- PostgreSQL
- JWT Authentication
- bcryptjs

# Cash App Pay Backend Server

Backend API server for Cash App Pay application with JWT authentication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
DB_USER=postgres
DB_HOST=localhost
DB_NAME=cashapppay
DB_PASSWORD=password
DB_PORT=5432
```

4. Make sure PostgreSQL is running and create the database:
```sql
CREATE DATABASE cashapppay;
```

5. Run the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Database Setup

The server will automatically:
- Create the `users` table on first run
- Create an admin user with credentials: `admin@example.com` / `password123`

To manually setup users:
```bash
npm run setup-users
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token (protected)
- `POST /api/auth/logout` - User logout (protected)

### Health Check
- `GET /api/health` - Server health check

## Default Login Credentials

- Email: `admin@example.com`
- Password: `password123`

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time (default: 24h)
- `DB_USER` - PostgreSQL username
- `DB_HOST` - PostgreSQL host
- `DB_NAME` - Database name
- `DB_PASSWORD` - PostgreSQL password
- `DB_PORT` - PostgreSQL port


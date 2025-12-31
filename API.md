# API Documentation

This document provides detailed information about all API endpoints used in the Cash App Pay application, including both backend (Express) and frontend (Stripe) APIs.

## Table of Contents

- [Backend API (Express Server)](#backend-api-express-server)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Health Check Endpoint](#health-check-endpoint)
  - [Stripe Keys Management Endpoints](#stripe-keys-management-endpoints)
- [Frontend API (Stripe)](#frontend-api-stripe)
- [Authentication](#authentication)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)

## Backend API (Express Server)

Base URL: `http://localhost:5000` (or as configured in `REACT_APP_API_BASE_URL`)

All backend API endpoints are prefixed with `/api`.

### Authentication Endpoints

#### POST `/api/auth/login`

Authenticate a user and receive a JWT token.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

#### GET `/api/auth/verify`

Verify the validity of a JWT token. Requires authentication.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Access token required"
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

#### POST `/api/auth/logout`

Logout the current user. Requires authentication.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Health Check Endpoint

#### GET `/api/health`

Check if the server is running and healthy.

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Stripe Keys Management Endpoints

All Stripe keys management endpoints require authentication. Include the JWT token in the `Authorization` header.

#### POST `/api/stripe/keys`

Save or update Stripe API keys for the authenticated user. Keys are encrypted before storage.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "secret_key": "sk_test_...",
  "publishable_key": "pk_test_..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Stripe keys saved successfully",
  "data": {
    "id": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "cache_updated": true,
    "validation": {
      "account_id": "acct_1234567890",
      "account_type": "standard",
      "country": "US"
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Invalid secret key format",
  "message": "Secret key must start with sk_test_ or sk_live_"
}
```

**Response (Error - 400 - Invalid Keys):**
```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Invalid secret key. Please check your Stripe secret key."
}
```

**Notes:**
- Keys are validated with Stripe API before saving
- Previous active keys for the user are automatically deactivated
- Secret keys are encrypted using AES-256-CBC before storage
- Keys are automatically loaded into in-memory cache after saving

#### GET `/api/stripe/keys/status`

Check if Stripe keys are configured for the authenticated user.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "hasKeys": true,
  "message": "Keys are configured for this user"
}
```

**Response (No Keys - 200):**
```json
{
  "success": true,
  "hasKeys": false,
  "message": "No keys configured for this user"
}
```

#### GET `/api/stripe/keys/secret`

Retrieve the decrypted secret key for the authenticated user. Used by frontend to make Stripe API calls.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "secretKey": "sk_test_..."
  }
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "error": "No Stripe keys found",
  "message": "Please configure your Stripe keys first"
}
```

**Security Note:** This endpoint returns the decrypted secret key. Ensure proper authentication and consider additional security measures in production.

#### POST `/api/stripe/keys/load-cache`

Manually load Stripe keys from database into in-memory cache for the authenticated user.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Cache updated successfully",
  "data": {
    "cache_updated": true
  }
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "error": "No active Stripe keys found for this user",
  "message": "No keys available to load into cache"
}
```

**Response (Error - 500 - Decryption Failed):**
```json
{
  "success": false,
  "error": "Decryption failed",
  "message": "Failed to decrypt stored keys. This may happen if ENCRYPTION_KEY environment variable was not set consistently. Please re-enter your keys."
}
```

#### DELETE `/api/stripe/keys`

Delete all Stripe keys for the authenticated user.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Stripe keys cleared successfully for this user",
  "data": {
    "deleted_count": 1
  }
}
```

**Notes:**
- This permanently deletes all keys for the user from the database
- Also clears the in-memory cache for the user
- User will need to re-enter keys to use Stripe functionality

## Frontend API (Stripe)

Base URL: `https://api.stripe.com/v1`

All Stripe API calls are made directly from the frontend using the Stripe secret key. These endpoints require Bearer token authentication with the Stripe secret key.

⚠️ **Security Note**: In a production application, these API calls should be made from the backend server to protect the secret key.

### Backend Stripe API Validation

The backend server uses the Stripe SDK to validate keys when they are saved. This validation:

- Calls `stripe.accounts.retrieve()` to verify the secret key is valid
- Returns account information including account ID, type, and country
- Handles various Stripe API errors (authentication, permission, API errors)

### Frontend Stripe Account Endpoints

#### GET `/accounts`

List all connected Stripe accounts associated with the platform account.

**Request:**
```http
GET https://api.stripe.com/v1/accounts?limit=100
Authorization: Bearer sk_test_...
```

**Query Parameters:**
- `limit` (optional): Maximum number of accounts to return (default: 10, max: 100)
- `starting_after` (optional): Account ID for pagination cursor

**Response (Success - 200):**
```json
{
  "object": "list",
  "data": [
    {
      "id": "acct_1234567890",
      "object": "account",
      "business_profile": {
        "name": "Example Business"
      },
      "email": "business@example.com",
      "support_email": "support@example.com"
    }
  ],
  "has_more": false,
  "url": "/v1/accounts"
}
```

**Pagination:**
The frontend automatically handles pagination to fetch up to 200 accounts (2 pages of 100 each).

### Payment Intent Endpoints

#### POST `/payment_intents`

Create a new payment intent for Cash App Pay.

**Request:**
```http
POST https://api.stripe.com/v1/payment_intents
Authorization: Bearer sk_test_...
Content-Type: application/x-www-form-urlencoded

amount=1000
&currency=usd
&payment_method_types[]=cashapp
&statement_descriptor=Cash App Payment
&statement_descriptor_suffix=CashAppPay
&on_behalf_of=acct_1234567890
```

**Request Body Parameters:**
- `amount` (required): Payment amount in smallest currency unit (e.g., cents for USD)
- `currency` (required): Currency code (default: "usd")
- `payment_method_types[]` (required): Must be "cashapp"
- `statement_descriptor` (optional): Description shown on customer's statement (max 22 chars)
- `statement_descriptor_suffix` (optional): Suffix for statement descriptor (max 22 chars)
- `on_behalf_of` (optional): Connected account ID when routing to connected account

**Response (Success - 200):**
```json
{
  "id": "pi_3SfKSMGU7Z4IEIXI16MIIqF",
  "object": "payment_intent",
  "amount": 1000,
  "currency": "usd",
  "status": "requires_payment_method",
  "payment_method_types": ["cashapp"],
  "on_behalf_of": "acct_1234567890"
}
```

#### POST `/payment_intents/{id}/confirm`

Confirm a payment intent and generate Cash App payment options (QR code and/or payment link).

**Request:**
```http
POST https://api.stripe.com/v1/payment_intents/pi_3SfKSMGU7Z4IEIXI16MIIqF/confirm
Authorization: Bearer sk_test_...
Content-Type: application/x-www-form-urlencoded

payment_method_data[type]=cashapp
&return_url=http://localhost:3000/cash-app-return
```

**Request Body Parameters:**
- `payment_method_data[type]` (required): Must be "cashapp"
- `return_url` (required): URL to redirect after payment completion

**Response (Success - 200):**
```json
{
  "id": "pi_3SfKSMGU7Z4IEIXI16MIIqF",
  "object": "payment_intent",
  "amount": 1000,
  "currency": "usd",
  "status": "requires_action",
  "next_action": {
    "type": "cashapp_handle_redirect_or_display_qr_code",
    "cashapp_handle_redirect_or_display_qr_code": {
      "qr_code": {
        "image_url_png": "https://qr.stripe.com/...",
        "expires_at": 1704067200
      },
      "hosted_voucher_url": "https://payments.cash.app/..."
    }
  }
}
```

**Response Fields:**
- `next_action.cashapp_handle_redirect_or_display_qr_code.qr_code.image_url_png`: URL of QR code image (for desktop)
- `next_action.cashapp_handle_redirect_or_display_qr_code.qr_code.expires_at`: Unix timestamp when QR code expires
- `next_action.cashapp_handle_redirect_or_display_qr_code.hosted_voucher_url`: Payment link URL (for mobile)

#### GET `/payment_intents/{id}`

Retrieve the current status of a payment intent.

**Request:**
```http
GET https://api.stripe.com/v1/payment_intents/pi_3SfKSMGU7Z4IEIXI16MIIqF
Authorization: Bearer sk_test_...
```

**Response (Success - 200):**
```json
{
  "id": "pi_3SfKSMGU7Z4IEIXI16MIIqF",
  "object": "payment_intent",
  "amount": 1000,
  "currency": "usd",
  "status": "succeeded",
  "charges": {
    "data": [
      {
        "id": "ch_1234567890",
        "status": "succeeded"
      }
    ]
  }
}
```

**Payment Status Values:**
- `requires_payment_method`: Payment intent created but no payment method attached
- `requires_confirmation`: Payment method attached, awaiting confirmation
- `requires_action`: Payment requires additional action (e.g., QR code scan)
- `processing`: Payment is being processed
- `succeeded`: Payment completed successfully
- `canceled`: Payment was canceled
- `requires_capture`: Payment authorized but not yet captured

**Response (Error - Payment Failed):**
```json
{
  "id": "pi_3SfKSMGU7Z4IEIXI16MIIqF",
  "object": "payment_intent",
  "amount": 1000,
  "currency": "usd",
  "status": "requires_payment_method",
  "last_payment_error": {
    "type": "card_error",
    "code": "payment_intent_payment_failed",
    "decline_code": "generic_decline",
    "message": "Your payment was declined."
  }
}
```

## Authentication

### Backend API Authentication

The backend API uses JWT (JSON Web Tokens) for authentication.

1. **Login**: Send email and password to `/api/auth/login` to receive a JWT token
2. **Authenticated Requests**: Include the token in the `Authorization` header:
   ```http
   Authorization: Bearer <token>
   ```
3. **Token Expiration**: Tokens expire based on `JWT_EXPIRES_IN` environment variable (default: 24h)
4. **Token Verification**: Use `/api/auth/verify` to check token validity

### Stripe API Authentication

The Stripe API uses Bearer token authentication with the Stripe secret key.

```http
Authorization: Bearer sk_test_... (or sk_live_...)
```

⚠️ **Security Warning**: The Stripe secret key should never be exposed in frontend code. In production, all Stripe API calls should be made from the backend server.

## Request/Response Examples

### Complete Payment Flow Example

#### 1. Login to Backend

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

#### 2. Save Stripe Keys (Backend)

```bash
curl -X POST http://localhost:5000/api/stripe/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "secret_key": "sk_test_...",
    "publishable_key": "pk_test_..."
  }'
```

#### 3. Get Secret Key (Backend)

```bash
curl http://localhost:5000/api/stripe/keys/secret \
  -H "Authorization: Bearer <token>"
```

#### 4. List Connected Accounts (Frontend)

```bash
curl https://api.stripe.com/v1/accounts?limit=100 \
  -u sk_test_...:
```

#### 5. Create Payment Intent (Frontend)

```bash
curl https://api.stripe.com/v1/payment_intents \
  -u sk_test_...: \
  -d amount=1000 \
  -d currency=usd \
  -d "payment_method_types[]=cashapp" \
  -d "statement_descriptor=Cash App Payment" \
  -d "statement_descriptor_suffix=CashAppPay" \
  -d "on_behalf_of=acct_1234567890"
```

#### 7. Confirm Payment Intent (Frontend)

```bash
curl https://api.stripe.com/v1/payment_intents/pi_xxx/confirm \
  -u sk_test_...: \
  -d "payment_method_data[type]=cashapp" \
  -d "return_url=http://localhost:3000/cash-app-return"
```

#### 8. Check Payment Status (Frontend)

```bash
curl https://api.stripe.com/v1/payment_intents/pi_xxx \
  -u sk_test_...:
```

## Error Handling

### Backend API Errors

**Rate Limiting (429):**
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

**Not Found (404):**
```json
{
  "error": "Route not found"
}
```

**Internal Server Error (500):**
```json
{
  "error": "Something went wrong!",
  "message": "Detailed error message (only in development)"
}
```

### Stripe API Errors

**Invalid Request (400):**
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Invalid payment_method_types: must be one of cashapp",
    "code": "parameter_invalid_empty"
  }
}
```

**Authentication Error (401):**
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "No API key provided. (HINT: set your API key using 'Authorization: Bearer <API-KEY>')"
  }
}
```

**Payment Method Unavailable (400):**
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Payment method cashapp is not available",
    "code": "payment_method_unavailable"
  }
}
```

**Timeout Errors:**
- Payment operations timeout after 60 seconds
- Regular operations timeout after 30 seconds
- Timeout errors include troubleshooting guidance

### Frontend Error Handling

The frontend includes comprehensive error handling:

1. **Network Errors**: Detects fetch failures and connection issues
2. **Timeout Errors**: Provides detailed timeout messages with troubleshooting steps
3. **Stripe API Errors**: Extracts and displays error codes, messages, and parameters
4. **Cash App Pay Specific Errors**: Enhanced error messages for Cash App Pay issues
5. **JSON Parse Errors**: Handles malformed API responses
6. **Payment Errors**: Extracts detailed error information from `last_payment_error`

## Rate Limiting

### Backend API

- **Global Rate Limit**: 100 requests per 15 minutes per IP
- **Exemptions**: OPTIONS requests and `/api/health` endpoint
- **Headers**: Rate limit information included in response headers

### Stripe API

Stripe has its own rate limiting based on your account type and usage. Refer to [Stripe's rate limits documentation](https://stripe.com/docs/rate-limits) for details.

## Polling Strategy

The frontend uses polling to check payment status:

- **Frequency**: Every 4 seconds (4000ms)
- **Endpoint**: `GET /payment_intents/{id}`
- **Stops When**: 
  - Payment status is `succeeded`
  - Payment status is `canceled` or `requires_payment_method`
  - Component unmounts
- **Timeout**: 60 seconds for payment operations

⚠️ **Note**: In production, consider using Stripe Webhooks instead of polling for real-time updates.

## CORS Configuration

The backend server is configured to accept requests from:
- `FRONTEND_URL` environment variable (default: `http://localhost:3000`)
- `http://localhost:3000` (hardcoded fallback)

To add additional origins, update the `corsOptions` in `server/server.js`.

## Security Considerations

1. **JWT Tokens**: Store tokens securely (localStorage in this app, but consider httpOnly cookies for production)
2. **Stripe Secret Keys**: 
   - Stored encrypted in database using AES-256-CBC
   - Never exposed in frontend code
   - Retrieved from backend via authenticated endpoint
   - Cached in-memory for performance (not persisted)
3. **Encryption Keys**: 
   - `ENCRYPTION_KEY` must be set consistently across server restarts
   - Use a strong, randomly generated 64-character hex string
   - Never commit encryption keys to version control
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Implemented on backend to prevent abuse (100 requests per 15 minutes per IP)
6. **Helmet**: Security headers middleware enabled
7. **Input Validation**: Validate all user inputs on both frontend and backend
8. **Password Hashing**: Passwords are hashed using bcryptjs before storage
9. **Key Validation**: Stripe keys are validated with Stripe API before saving
10. **Key Rotation**: Previous keys are automatically deactivated when new keys are saved

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Cash App Pay Guide](https://stripe.com/docs/payments/cash-app-pay)
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [JWT.io](https://jwt.io/) - JWT token decoder and debugger



# Cash App Pay Checkout (Stripe Connect) - Application Documentation

## Overview

This is a **frontend-only React application** that demonstrates Cash App Pay checkout integration with Stripe Connect. The application intelligently detects the user's device type and displays the appropriate payment method:

- **Mobile Devices**: Displays a clickable payment link (deep link) for seamless mobile payment experience
- **Desktop/Web**: Displays a QR code that can be scanned with a mobile device

The application supports routing payments to either your platform account (master account) or connected Stripe accounts via Stripe Connect.

## Purpose

The application enables:
- Listing and selecting Stripe Connect connected accounts
- Creating Cash App Pay payment intents via Stripe API
- **Smart device detection** to show appropriate payment method (link for mobile, QR code for desktop)
- Generating QR codes for desktop users to scan with Cash App
- Providing payment links for mobile users to tap directly
- Monitoring payment status in real-time
- Processing payments where funds are routed to platform or connected accounts

## Technology Stack

- **React 18.3.1** - UI framework
- **React DOM 18.3.1** - React rendering
- **React Scripts 5.0.1** - Build tooling and development server
- **Stripe API** - Payment processing backend

## Key Features

### 1. Smart Device Detection
- Automatically detects mobile devices using multiple methods:
  - User agent string detection (iPhone, iPad, Android, etc.)
  - Screen width detection (≤768px)
  - Touch capability detection
- Updates dynamically on window resize
- Stores device state to prevent render-time detection issues

**Code Reference**: Lines 164-175, 196-207 in `src/App.jsx`

### 2. Payment Routing Options
- **Platform Account**: Routes funds directly to your Stripe platform (master) account
- **Connected Account**: Routes funds to a selected connected account via Stripe Connect
  - Uses `on_behalf_of` parameter to ensure funds settle in connected account's country
  - Supports up to 200 connected accounts with pagination

### 3. Device-Specific Payment Display

#### Mobile Devices
- **Always shows payment link** (if available from Stripe)
- **Never shows QR code** on mobile devices
- Large, tappable button styled in Cash App green (#00D632)
- Clear instructions: "Tap the link above to complete your payment"
- If no link is available, shows error message instead of QR code

#### Desktop/Web
- **Shows QR code** for customers to scan with their mobile device
- **Falls back to payment link** if QR code is not available
- Clear instructions: "Ask the customer to scan this QR code with Cash App"

**Code Reference**: Lines 755-1006 in `src/App.jsx`

### 4. Payment Method Display
- **QR Code** (desktop): Displays Cash App QR code as PNG image
- **Payment Link** (mobile): Clickable deep link for mobile payment
- Real-time expiration countdown timer
- Color-coded expiration warnings:
  - Red: Less than 60 seconds remaining
  - Orange: Less than 5 minutes remaining
  - Green: More than 5 minutes remaining
- Displays PaymentIntent ID for tracking

### 5. Payment Status Monitoring
- Real-time polling of payment status (every 4 seconds)
- Color-coded status messages (info, success, error)
- Automatic cleanup of polling intervals
- Detailed error messages with error codes and parameters

## API Integration

### Base Configuration

- **API Base URL**: `https://api.stripe.com/v1`
- **Authentication**: Bearer token authentication using Stripe secret key
- **Content-Type**: `application/x-www-form-urlencoded` for request bodies
- **Timeout Handling**:
  - Payment operations: 60 seconds
  - Regular operations: 30 seconds

### API Endpoints Used

#### 1. List Connected Accounts
- **Endpoint**: `GET /accounts`
- **Purpose**: Retrieves all connected accounts associated with the platform account
- **Pagination**: Implements pagination to fetch up to 200 accounts (100 per page)
- **Query Parameters**:
  - `limit`: Maximum 100 accounts per request
  - `starting_after`: Account ID for pagination cursor
- **Response Handling**:
  - Extracts account ID, business name, email, or support email
  - Maps accounts to dropdown-friendly format
  - Handles pagination automatically
  - Safety limit: Maximum 10 pages to prevent infinite loops

**Code Reference**: Lines 209-287 in `src/App.jsx`

#### 2. Create Payment Intent
- **Endpoint**: `POST /payment_intents`
- **Purpose**: Creates a new payment intent for Cash App Pay
- **Request Body Parameters**:
  - `amount`: Payment amount in smallest currency unit (e.g., cents for USD)
  - `currency`: Currency code (default: "usd")
  - `payment_method_types[]`: Set to "cashapp"
  - `statement_descriptor`: "Cash App Payment" (appears on customer's statement)
  - `statement_descriptor_suffix`: "CashAppPay" (max 22 chars)
  - `on_behalf_of`: Connected account ID (only when routing to connected account)
- **Response**: Returns PaymentIntent object with ID and status

**Code Reference**: Lines 437-467 in `src/App.jsx`

#### 3. Confirm Payment Intent
- **Endpoint**: `POST /payment_intents/{id}/confirm`
- **Purpose**: Confirms the payment intent and generates Cash App payment options
- **Request Body Parameters**:
  - `payment_method_data[type]`: Set to "cashapp"
  - `return_url`: Redirect URL after payment (format: `${window.location.origin}/cash-app-return`)
- **Response**: Returns confirmed PaymentIntent with `next_action` containing:
  - `type`: `"cashapp_handle_redirect_or_display_qr_code"`
  - `cashapp_handle_redirect_or_display_qr_code`: Object containing:
    - `qr_code`: QR code object (if available)
      - `image_url_png`: URL of QR code image
      - `expires_at`: Unix timestamp when QR code expires
    - `hosted_voucher_url`: Payment link URL (if available)

**Response Structure**:
```json
{
  "id": "pi_xxx",
  "status": "requires_action",
  "next_action": {
    "type": "cashapp_handle_redirect_or_display_qr_code",
    "cashapp_handle_redirect_or_display_qr_code": {
      "qr_code": {
        "image_url_png": "https://...",
        "expires_at": 1234567890
      },
      "hosted_voucher_url": "https://..."
    }
  }
}
```

**Code Reference**: Lines 485-579 in `src/App.jsx`

#### 4. Retrieve Payment Intent Status
- **Endpoint**: `GET /payment_intents/{id}`
- **Purpose**: Polls payment intent status to check if payment has been completed
- **Polling Frequency**: Every 4 seconds (4000ms)
- **Status Checks**:
  - `succeeded`: Payment completed successfully
  - `canceled` or `requires_payment_method`: Payment failed or was canceled
- **Polling Lifecycle**: Continues until payment succeeds, fails, or component unmounts
- **Error Handling**: Extracts detailed error information from `last_payment_error` if available

**Code Reference**: Lines 289-355 in `src/App.jsx`

## Application Flow

### Initialization Flow

1. **Component Mount** (`useEffect` on mount)
   - Detects device type (mobile/desktop) and stores in state
   - Sets up window resize listener for dynamic device detection
   - Validates Stripe secret key format
   - Calls `/accounts` endpoint to load connected accounts
   - Implements pagination to fetch all accounts (up to 200)
   - Populates dropdown with account names/IDs
   - Auto-selects first account if available
   - Handles errors and loading states

**Code Reference**: Lines 196-207, 209-287 in `src/App.jsx`

### Payment Flow

1. **User Input**
   - User selects payment routing (Platform or Connected Account)
   - If Connected Account: User selects a connected account from dropdown
   - User enters payment amount (minimum: 0.01)
   - User selects currency (default: USD)
   - User clicks "Pay using Cash App" button

2. **Payment Intent Creation**
   - Validates Stripe secret key
   - Validates selected account (if routing to connected account)
   - Validates amount (must be a positive number)
   - Converts amount to smallest currency unit (multiply by 100 for USD)
   - Calls `POST /payment_intents` with payment details
   - Conditionally sets `on_behalf_of` parameter based on routing type

3. **Payment Method Generation**
   - Confirms payment intent via `POST /payment_intents/{id}/confirm`
   - Extracts payment options from `next_action.cashapp_handle_redirect_or_display_qr_code`:
     - **QR Code**: Extracted from `qr_code.image_url_png` (for desktop)
     - **Redirect URL**: Extracted from `hosted_voucher_url` (for mobile)
     - Checks alternative field names: `redirect_url`, `url`, `mobile_url`
   - Sets expiration timestamp (shared between both methods)
   - Displays PaymentIntent ID for reference
   - Updates status message based on device type and available payment methods

4. **Device-Specific Rendering**
   - **Mobile Devices**:
     - If `hosted_voucher_url` exists: Shows payment link button
     - If `hosted_voucher_url` missing: Shows error message (NOT QR code)
   - **Desktop Devices**:
     - If QR code exists: Shows QR code image
     - If only link exists: Shows payment link as fallback

5. **Payment Monitoring**
   - Starts polling `GET /payment_intents/{id}` every 4 seconds
   - Updates status message based on payment state:
     - **Success**: "Payment succeeded and funds are on the way to the [platform/connected] account."
     - **Failed/Canceled**: Error message with status code, error code, and decline code (if available)
   - Cleans up polling interval when payment completes or component unmounts

### Error Handling

- **Invalid Secret Key**: Shows error message if key doesn't start with "sk_"
- **No Connected Accounts**: Displays message if no accounts found
- **API Errors**: Catches and displays Stripe API error messages with enhanced Cash App Pay specific guidance
- **Network Errors**: Handles fetch failures gracefully with timeout detection
- **Validation Errors**: Alerts user for invalid input (amount, account selection)
- **Timeout Errors**: Provides detailed timeout messages with troubleshooting steps
- **JSON Parse Errors**: Handles malformed API responses
- **Payment Errors**: Extracts and displays detailed error information from `last_payment_error`

## State Management

The application uses React hooks for state management:

- `amount`: Payment amount as string (default: "10.00")
- `currency`: Currency code (default: "usd")
- `routingType`: Payment routing type - "platform" or "connected" (default: "connected")
- `connectedAccounts`: Array of connected account objects
- `connectedAccountsLoading`: Loading state for accounts
- `connectedAccountsError`: Error message for account loading
- `selectedAccount`: Currently selected connected account ID
- `isPaying`: Boolean indicating payment process in progress
- `status`: Status message string
- `statusType`: Status type ("info", "success", "error")
- `qrImage`: URL of QR code image (for desktop scanning)
- `qrExpiresAt`: Unix timestamp when QR code/redirect link expires
- `timeRemaining`: Object with expiration countdown (minutes, seconds, totalSeconds, expired)
- `redirectUrl`: Payment link URL for mobile users (from `hosted_voucher_url` or alternative fields)
- `paymentIntentId`: Current PaymentIntent ID
- `isMobile`: Boolean indicating if device is detected as mobile

## Helper Functions

### `callStripe(path, options)`
Generic function for making Stripe API calls with comprehensive error handling.

**Features**:
- Handles authentication headers
- Formats request body as URL-encoded form data
- Parses JSON responses
- Implements timeout handling (60s for payments, 30s for others)
- Enhanced error messages for Cash App Pay specific errors
- Detailed logging for debugging
- Abort controller for timeout cancellation

**Code Reference**: Lines 10-134 in `src/App.jsx`

### `formatExpiresAt(timestamp)`
Converts Unix timestamp to formatted date string using localized formatting.

**Code Reference**: Lines 136-142 in `src/App.jsx`

### `getTimeRemaining(timestamp)`
Calculates time remaining until expiration from Unix timestamp.

**Returns**:
- `expired`: Boolean indicating if timestamp has passed
- `minutes`: Minutes remaining
- `seconds`: Seconds remaining
- `totalSeconds`: Total seconds remaining

**Code Reference**: Lines 144-162 in `src/App.jsx`

### `isMobileDevice()`
Detects if the current device is a mobile device using multiple methods:
- User agent string matching (Android, iPhone, iPad, etc.)
- Screen width (≤768px)
- Touch capability detection

**Returns**: Boolean indicating mobile device

**Code Reference**: Lines 164-175 in `src/App.jsx`

### `selectedAccountLabel` (useMemo)
Computed value for displaying selected account name.
- Updates when selected account or account list changes
- Returns empty string if account not found

**Code Reference**: Lines 378-380 in `src/App.jsx`

## Security Considerations

⚠️ **CRITICAL SECURITY WARNING**: 

This application contains a **Stripe secret key in the frontend code**, which is a **major security vulnerability**. The code includes a warning comment on line 3:

```javascript
// WARNING: For demo only. Never ship a real app with your Stripe secret key in the frontend.
```

### Security Issues:
1. **Secret Key Exposure**: The Stripe secret key is hardcoded in the client-side code, making it visible to anyone who inspects the source code
2. **API Key Leakage**: Anyone can extract the secret key and use it to make unauthorized API calls
3. **No Server-Side Validation**: All API calls are made directly from the browser

### Recommended Security Practices:
- Move all Stripe API calls to a backend server
- Store secret keys in environment variables on the server
- Use Stripe Publishable Keys in the frontend
- Implement server-side authentication and authorization
- Use Stripe Webhooks for payment status updates instead of polling
- Never expose secret keys in client-side code

## UI Components

### Form Elements
- **Payment Routing Radio Buttons**: Select between Platform or Connected Account routing
- **Connected Account Dropdown**: Select connected Stripe account (only shown for Connected Account routing)
- **Amount Input**: Number input with decimal precision (step: 0.01)
- **Currency Select**: Currency selection (USD)
- **Payment Method Tag**: Displays "Cash App Pay (QR code)"
- **Pay Button**: Triggers payment flow (disabled during payment processing)

### Status Display
- **Status Message**: Dynamic status updates with color coding
  - Blue (info): Payment in progress
  - Green (success): Payment succeeded
  - Red (error): Payment failed or error occurred

### Payment Method Display

#### Mobile Devices
- **Payment Link Section**: 
  - Large, tappable button styled in Cash App green (#00D632)
  - Font size: 16px, padding: 12px 24px
  - Minimum width: 200px
  - Border radius: 8px
  - Instructions: "Tap the link above to complete your payment"
  - Expiration countdown timer
  - PaymentIntent ID display
- **Error Message** (if no link available):
  - Red warning message
  - Explains missing `hosted_voucher_url` field
  - Provides troubleshooting guidance

#### Desktop Devices
- **QR Code Section**: 
  - QR code image container
  - Scanning instructions
  - Expiration countdown timer
  - PaymentIntent ID display
- **Payment Link Section** (fallback if no QR code):
  - Clickable payment link styled as Cash App button
  - Instructions: "For customers on desktop without mobile app access"
  - Expiration countdown timer
  - PaymentIntent ID display

## Dependencies

As defined in `package.json`:
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `react-scripts`: 5.0.1

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## File Structure

```
src/
  ├── App.jsx          # Main application component with all logic
  ├── main.jsx         # React DOM root and app mounting
  ├── index.js         # Entry point (imports main.jsx)
  └── index.css        # Styling for the application
```

## API Request Examples

### List Connected Accounts
```http
GET https://api.stripe.com/v1/accounts?limit=100
Authorization: Bearer sk_test_...
```

### Create Payment Intent (Platform Account)
```http
POST https://api.stripe.com/v1/payment_intents
Authorization: Bearer sk_test_...
Content-Type: application/x-www-form-urlencoded

amount=1000&currency=usd&payment_method_types[]=cashapp&statement_descriptor=Cash App Payment&statement_descriptor_suffix=CashAppPay
```

### Create Payment Intent (Connected Account)
```http
POST https://api.stripe.com/v1/payment_intents
Authorization: Bearer sk_test_...
Content-Type: application/x-www-form-urlencoded

amount=1000&currency=usd&payment_method_types[]=cashapp&statement_descriptor=Cash App Payment&statement_descriptor_suffix=CashAppPay&on_behalf_of=acct_xxx
```

### Confirm Payment Intent
```http
POST https://api.stripe.com/v1/payment_intents/pi_xxx/confirm
Authorization: Bearer sk_test_...
Content-Type: application/x-www-form-urlencoded

payment_method_data[type]=cashapp&return_url=http://localhost:3000/cash-app-return
```

### Check Payment Status
```http
GET https://api.stripe.com/v1/payment_intents/pi_xxx
Authorization: Bearer sk_test_...
```

## API Response Examples

### Payment Intent Confirmation Response
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

### Payment Intent Status (Succeeded)
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
        "id": "ch_xxx",
        "status": "succeeded"
      }
    ]
  }
}
```

### Payment Intent Status (Failed)
```json
{
  "id": "pi_3SfKSMGU7Z4IEIXI16MIIqF",
  "object": "payment_intent",
  "amount": 1000,
  "currency": "usd",
  "status": "requires_payment_method",
  "last_payment_error": {
    "type": "card_error",
    "code": "card_declined",
    "decline_code": "generic_decline",
    "message": "Your card was declined."
  }
}
```

## Device-Specific Behavior

### Mobile Devices (iOS/Android Simulators and Physical Devices)

**Detection Method**:
- User agent contains: "iPhone", "iPad", "iPod", "Android", "webOS", "BlackBerry", "IEMobile", "Opera Mini", "mobile", "tablet"
- OR screen width ≤ 768px AND touch capability detected

**Payment Display**:
1. **Primary**: Payment link (`hosted_voucher_url`) - Large, tappable button
2. **Fallback**: Error message if no link available (QR code is NEVER shown)

**User Experience**:
- User taps the green "Click here to pay with Cash App" button
- Opens Cash App or redirects to Cash App payment page
- Payment completes in Cash App
- Returns to application (via `return_url`)
- Application polls and detects payment completion

**Code Reference**: Lines 766-868 in `src/App.jsx`

### Desktop/Web Browsers

**Detection Method**:
- Not matching mobile user agent patterns
- Screen width > 768px OR no touch capability

**Payment Display**:
1. **Primary**: QR code image (if available)
2. **Fallback**: Payment link if QR code not available

**User Experience**:
- User sees QR code on screen
- User opens Cash App on their mobile device
- User scans QR code with Cash App
- Payment completes in Cash App
- Application polls and detects payment completion

**Code Reference**: Lines 871-952 in `src/App.jsx`

## Testing & Simulation in Stripe Sandbox/Test Mode

Since you're using Stripe's sandbox/test environment, here's how to simulate and test Cash App Pay payments:

### Prerequisites

1. **Ensure Test Mode is Active**:
   - Your Stripe secret key should start with `sk_test_` (not `sk_live_`)
   - Verify you're in test mode in the Stripe Dashboard (toggle in top-left corner)

2. **Connected Accounts in Test Mode**:
   - Make sure you have test connected accounts set up in your Stripe platform
   - Test connected accounts will have IDs starting with `acct_` (same format as live accounts, but they're separate test entities)

3. **Cash App Pay Enabled**:
   - Ensure Cash App Pay is enabled in your Stripe Dashboard
   - Go to Settings → Payment methods → Enable Cash App Pay

### Method 1: Using Cash App Sandbox App (Recommended for Full Testing)

This is the most realistic way to test Cash App Pay functionality:

1. **Obtain Cash App Sandbox App**:
   - Contact Stripe Partner Engineering team or your Cash App point of contact
   - They will provide access to the Cash App Sandbox App (a special testing version of Cash App)
   - Install the Sandbox App on your mobile device (iOS or Android)

2. **Test Payment Flow (Desktop)**:
   - Run your application on desktop browser
   - Generate a payment intent (click "Pay using Cash App")
   - The QR code will appear on your screen
   - Open the Cash App Sandbox App on your mobile device
   - Use the in-app scanner to scan the QR code from your application
   - Approve the payment in the Sandbox App to simulate a successful payment
   - Decline the payment to test error scenarios

3. **Test Payment Flow (Mobile)**:
   - Run your application on mobile device or simulator
   - Generate a payment intent (click "Pay using Cash App")
   - The payment link button will appear (NOT QR code)
   - Tap the "Click here to pay with Cash App" button
   - Opens Cash App Sandbox App or redirects to payment page
   - Complete payment in Sandbox App
   - Application detects payment completion

4. **Monitor Results**:
   - Your application will automatically poll the PaymentIntent status
   - The status will update to "succeeded" when payment is approved
   - Check the Stripe Dashboard → Payments section to see the test transaction

### Method 2: Using Stripe Dashboard Testing (Limited)

While Cash App Pay requires the Sandbox App for full testing, you can:

1. **Verify Payment Intent Creation**:
   - Create a payment intent using your application
   - Check Stripe Dashboard → Payments to see the PaymentIntent was created
   - Verify the PaymentIntent status and metadata

2. **Manual Status Updates** (For Development):
   - You can manually update PaymentIntent status in Stripe Dashboard for testing status polling logic
   - However, this won't test the actual QR code scanning or link clicking flow

### Testing Scenarios

#### Successful Payment Test (Desktop)
1. Generate payment intent → QR code appears
2. Scan QR code with Cash App Sandbox App
3. Approve payment in Sandbox App
4. Application polls and detects `status: "succeeded"`
5. Status message updates to green success message

#### Successful Payment Test (Mobile)
1. Generate payment intent → Payment link button appears
2. Tap "Click here to pay with Cash App" button
3. Opens Cash App Sandbox App
4. Approve payment in Sandbox App
5. Application polls and detects `status: "succeeded"`
6. Status message updates to green success message

#### Failed Payment Test
1. Generate payment intent → QR code or link appears
2. Scan QR code or tap link with Cash App Sandbox App
3. Decline payment in Sandbox App
4. Application polls and detects `status: "canceled"` or `"requires_payment_method"`
5. Status message updates to red error message with error details

#### QR Code Expiration Test
1. Generate payment intent → QR code and/or payment link appears
2. Wait for expiration (check expiration timestamp)
3. Try to use expired QR code or link (should fail)
4. Generate a new payment intent for fresh payment methods

#### Mobile Device Detection Test
1. Open application in mobile browser or simulator
2. Verify mobile device is detected (check console logs)
3. Generate payment intent
4. Verify payment link appears (NOT QR code)
5. If link not available, verify error message appears (NOT QR code)

#### Desktop Device Detection Test
1. Open application in desktop browser
2. Verify desktop device is detected (check console logs)
3. Generate payment intent
4. Verify QR code appears (or link as fallback)

### Important Testing Notes

- **Test Mode Separation**: Test mode data is completely separate from live mode data
- **No Real Money**: All transactions in test mode are simulated - no real funds are transferred
- **Sandbox App Required**: Full QR code and link functionality testing requires the Cash App Sandbox App
- **Connected Account Testing**: Test with multiple connected accounts to verify `on_behalf_of` parameter works correctly
- **Polling Verification**: The 4-second polling interval will update status when payment completes
- **Return URL**: The `return_url` parameter is used by Cash App but may redirect to a different page (configured as `${window.location.origin}/cash-app-return`)
- **Device Detection**: Test on both mobile and desktop to verify correct payment method is displayed

### Troubleshooting Test Mode

**Issue: "No connected accounts found"**
- Ensure you're using a test mode platform secret key (`sk_test_...`)
- Create test connected accounts in Stripe Dashboard
- Check that connected accounts are linked to your platform account

**Issue: "Unable to load connected accounts"**
- Verify your secret key is valid and has the correct permissions
- Check network connectivity
- Ensure API key hasn't been revoked

**Issue: QR code or redirect link not appearing**
- Verify Cash App Pay is enabled for your account
- Check that `payment_method_types[]` includes "cashapp"
- Ensure `return_url` is properly formatted
- Stripe may provide QR code, redirect URL, or both depending on context
- Check the browser console for any API errors
- Verify that `next_action.cashapp_handle_redirect_or_display_qr_code` exists in the response

**Issue: Payment link not appearing on mobile**
- Check browser console for "Device detection" logs
- Verify `isMobile` is `true` in console logs
- Check "Full cashAppAction" log to see if `hosted_voucher_url` exists
- If `hosted_voucher_url` is missing, check Stripe Dashboard settings
- Verify Cash App Pay is enabled for your account

**Issue: QR code appearing on mobile instead of link**
- This should not happen with current implementation
- Check browser console for device detection logs
- Verify mobile detection is working correctly
- Check that `redirectUrl` state is being set

**Issue: Payment status not updating**
- Check browser console for polling errors
- Verify PaymentIntent ID is correct
- Ensure polling interval is running (check network tab)
- Check for timeout errors

### Checking Test Transactions

After completing a test payment:

1. Go to Stripe Dashboard → Payments
2. Filter by test mode (ensure test mode toggle is on)
3. Find your PaymentIntent by ID (displayed in the app)
4. View payment details, status, and connected account information

## Limitations

1. **Frontend-Only Implementation**: No backend server for secure key storage
2. **Single Currency**: Currently only supports USD
3. **Account Limit**: Fetches maximum 200 connected accounts
4. **Polling Instead of Webhooks**: Uses polling instead of Stripe webhooks for status updates
5. **Hardcoded Return URL**: Return URL is constructed from window.location.origin
6. **No Error Recovery**: Limited error recovery mechanisms
7. **Secret Key in Code**: Major security vulnerability (demo only)
8. **Mobile Detection**: Relies on client-side detection which may not be 100% accurate in all scenarios

## Future Improvements

1. Move API calls to backend server
2. Implement Stripe Webhooks for payment status
3. Add support for multiple currencies
4. Improve error handling and recovery
5. Add payment history/transaction log
6. Implement proper authentication
7. Add loading states for better UX
8. Support for more payment methods
9. Add unit and integration tests
10. Implement proper logging
11. Add support for payment method selection
12. Implement retry logic for failed API calls
13. Add analytics and tracking
14. Improve mobile detection accuracy
15. Add support for deep linking configuration

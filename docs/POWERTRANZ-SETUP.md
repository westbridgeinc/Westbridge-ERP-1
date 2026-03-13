# PowerTranz Payment Gateway Setup for Westbridge

Westbridge uses **PowerTranz** for all subscription payments. PowerTranz is a Caribbean-focused payment processor supporting USD, GYD, TTD, JMD, XCD, and BMD currencies.

## 1. Get your merchant credentials

1. Apply for a PowerTranz merchant account at [powertranz.com](https://powertranz.com) (you will need a bank account in a supported Caribbean territory).
2. Once approved, you will receive:
   - **PowerTranz ID** — your merchant identifier
   - **PowerTranz Password** — your API authentication password
3. You will also get access to the **staging environment** for testing:
   - Staging: `https://staging.ptranz.com`
   - Production: `https://ptranz.com`

Add credentials to the backend `.env`:

```env
POWERTRANZ_ID="your-powertranz-id"
POWERTRANZ_PASSWORD="your-powertranz-password"
POWERTRANZ_TEST_MODE="true"   # Set to "false" for production
```

## 2. How the payment flow works

1. Customer selects a plan and signs up on the frontend.
2. The backend creates an account (status: `pending`) and calls the PowerTranz SPI Auth API to create a payment session.
3. The backend returns a redirect URL for the PowerTranz **Hosted Payment Page (HPP)**.
4. The customer is redirected to PowerTranz's secure payment page to enter card details.
5. After payment, PowerTranz POSTs the result to the backend webhook: `POST /api/webhooks/powertranz`.
6. The backend verifies the callback and activates the account (status: `active`).

## 3. Configure the webhook URL

PowerTranz delivers payment results to your **MerchantResponseUrl** (set automatically by the backend when creating a payment session). No manual webhook configuration is needed — the return URL is baked into each SPI Auth request.

- **Production:** `https://<your-domain>/api/webhooks/powertranz`
- **Local testing:** use a tunnel (e.g. ngrok) and set `FRONTEND_URL` to the tunnel URL.

## 4. Supported currencies

PowerTranz natively supports Caribbean currencies:

| Code | Currency                 |
| ---- | ------------------------ |
| USD  | US Dollar                |
| GYD  | Guyanese Dollar          |
| TTD  | Trinidad & Tobago Dollar |
| JMD  | Jamaican Dollar          |
| XCD  | East Caribbean Dollar    |
| BMD  | Bermudian Dollar         |

The default currency is set per account in the database (`currency` field, default: `GYD`).

## 5. Testing

Use the staging environment (`POWERTRANZ_TEST_MODE="true"`) with PowerTranz's test card numbers:

- **Approved:** `4111 1111 1111 1111` (any future expiry, any CVV)
- **Declined:** `4000 0000 0000 0002`

## 6. Going live

1. Complete PowerTranz's go-live checklist.
2. Set `POWERTRANZ_TEST_MODE="false"` in production environment.
3. Update `POWERTRANZ_ID` and `POWERTRANZ_PASSWORD` with production credentials.
4. Verify the webhook endpoint is reachable from PowerTranz's production IP ranges.

## 7. Database

Signup creates an **Account** in PostgreSQL. After payment confirmation, the webhook activates the account and stores:

- `payment_transaction_id` — PowerTranz transaction identifier
- `payment_rrn` — Retrieval Reference Number (for reconciliation)

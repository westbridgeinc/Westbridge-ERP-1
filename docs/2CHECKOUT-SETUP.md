# 2Checkout (Verifone) setup for Westbridge

Westbridge uses **2Checkout (Verifone)** for all subscription payments. Pricing is in **USD**. You must configure 2Checkout to accept payments and activate accounts after checkout.

## 1. Get your credentials

1. Log in to [2Checkout Merchant Control Panel](https://secure.2checkout.com/cpanel/logon.php).
2. Go to **Integrations → Webhooks and API**.
3. Copy:
   - **Merchant code**
   - **Secret word** (for IPN signature verification)

Add them to `.env.local`:

```env
TWOCO_MERCHANT_CODE="your_merchant_code"
TWOCO_SECRET_WORD="your_secret_word"
```

## 2. Create one product per plan

1. In 2Checkout go to **Products** and create three products (or subscriptions):
   - **Starter** — $99/month (or your price)
   - **Growth** — $249/month
   - **Business** — $499/month
2. For each product, go to **Setup → Generate links** and create a **Checkout link** (or InLine / payment link).
3. Copy each checkout URL and add to `.env.local`:

```env
TWOCO_LINK_STARTER="https://secure.2checkout.com/checkout/..."
TWOCO_LINK_GROWTH="https://secure.2checkout.com/checkout/..."
TWOCO_LINK_BUSINESS="https://secure.2checkout.com/checkout/..."
```

The app will append `return_url` and `merchant_order_id` (account id) to these links so customers return to your site and the IPN webhook can activate the right account.

## 3. Set the IPN URL

1. In 2Checkout go to **Integrations → Webhooks and API → IPN (Instant Payment Notification)**.
2. Set the IPN URL to:

   **Production:** `https://<your-domain>/api/webhooks/2checkout`  
   **Local testing:** use a tunnel (e.g. ngrok) and set that URL in 2Checkout.

3. When a customer pays, 2Checkout will POST to this URL. We verify the signature and set the account to `active`.

## 4. Return URL (redirect) whitelist

In **Setup → Ordering options → Redirect domains**, add your domain(s), e.g.:

- Your production domain (e.g. `app.yourcompany.com`)
- `localhost` (for dev)

## 5. Database

Signup creates an **Account** in your database (PostgreSQL). Set `DATABASE_URL` in `.env.local`. After the first payment, the IPN webhook updates that account to `status: active`.

## Optional: LCN (subscription renewals)

For recurring billing (e.g. monthly renewal), configure **LCN (License Change Notification)** in 2Checkout to `https://<your-domain>/api/webhooks/2checkout/lcn`, and handle renewal/cancel events to keep `Account.status` in sync.

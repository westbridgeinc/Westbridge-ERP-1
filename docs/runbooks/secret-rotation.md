# Secret Rotation Runbook

## Overview

All secrets are stored as environment variables — never in code. Rotate secrets:
- On suspected compromise (immediately)
- Every 90 days for API keys (scheduled)
- Quarterly for signing secrets

## SESSION_SECRET / CSRF_SECRET

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# 2. Deploy with NEW_SECRET alongside OLD_SECRET (rolling rotation)
# All new sessions use NEW_SECRET; existing sessions validated against OLD_SECRET
# Update env: SESSION_SECRET=$NEW_SECRET (previous value auto-expires)

# 3. After 24h (all sessions have expired), remove OLD_SECRET
```

## ENCRYPTION_KEY (AES-256 for ERPNext SID)

The encryption key supports rotation via `ENCRYPTION_KEY_PREVIOUS`:

```bash
# 1. Generate new key
NEW_KEY=$(openssl rand -hex 32)

# 2. Set ENCRYPTION_KEY_PREVIOUS=<current_key> and ENCRYPTION_KEY=<new_key>
# New records are encrypted with the new key
# Existing records are decrypted with either key (see lib/encryption.ts)

# 3. Run re-encryption script:
npx tsx scripts/rotate-encryption-key.ts

# 4. After migration, remove ENCRYPTION_KEY_PREVIOUS
```

## ERPNEXT_API_KEY / ERPNEXT_API_SECRET

```bash
# 1. Generate new API key in ERPNext: Admin → API Access → Regenerate
# 2. Update ERPNEXT_API_KEY and ERPNEXT_API_SECRET in deployment secrets
# 3. Restart app (zero-downtime deploy)
# 4. Revoke old key in ERPNext
```

## RESEND_API_KEY

```bash
# 1. Generate new key at https://resend.com/api-keys
# 2. Update RESEND_API_KEY in deployment secrets
# 3. Deploy
# 4. Revoke old key in Resend dashboard
```

## Verification

After rotation, verify:
```bash
curl https://app.westbridge.app/api/health | jq .data.checks.database
# Should be: { "status": "healthy" }

# Send test email
curl -X POST https://app.westbridge.app/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@westbridge.app"}'
```

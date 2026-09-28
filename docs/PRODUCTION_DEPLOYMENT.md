# Production Deployment Guide

This guide turns PesaWeave into a hosted service for real tenants.

## 1. Provision infrastructure

- Create a Supabase project or managed PostgreSQL instance.
- Apply `supabase/migrations/001_initial_schema.sql`.
- Enable Supabase Auth with email verification and password reset.
- Create private storage buckets for receipts, invoices and attachments.
- Configure a server runtime for payment callbacks, PDF exports, imports and background jobs.

## 2. Configure environment variables

Use `.env.example` as the template. Keep these values server-side only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_PASSKEY`
- Email, SMS, push and AI provider keys

The frontend may use only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- non-secret display configuration

## 3. Enforce tenant isolation

Before onboarding paying users, verify that:

- Row Level Security is enabled on all tenant tables.
- Every tenant table has `tenant_id`.
- Every API query filters by authorized tenant and Money Space.
- No route trusts frontend IDs without server-side membership verification.
- Audit logs are written for financial mutations.

## 4. Payment integrations

M-Pesa/Daraja should run through secure server endpoints.

Required controls:

- Provider credentials stored in a secret manager or encrypted environment variables.
- Callback signature validation where supported.
- Idempotency keys for payment requests and confirmations.
- Redacted webhook logging.
- Tenant-specific provider settings.
- No secrets in frontend bundles.

## 5. Financial data controls

- Transfers must create paired ledger movements.
- Transfers must not inflate income or expenses.
- Reversals must create counter-transactions.
- Important financial records should be voided, archived or reversed instead of hard-deleted.
- Imports must pass through mapping, review, duplicate detection and approval before posting.

## 6. Launch readiness checklist

- Authentication and email verification tested.
- Password reset tested.
- Optional 2FA enabled for administrators.
- RLS tested with at least two separate tenants.
- Backup and restore tested.
- Rate limiting enabled on write-heavy routes.
- Error monitoring configured.
- Audit log retention policy defined.
- Receipts and attachments stored in private buckets.
- Terms, privacy policy and data export/delete processes ready.
- M-Pesa credentials configured only in the backend runtime.
- Subscription plans configured from the admin panel.

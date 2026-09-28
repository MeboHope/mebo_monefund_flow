# PesaWeave Architecture

PesaWeave is designed as a Kenya-first, multi-tenant money flow management SaaS. The core model is: **one user, multiple independent Money Spaces, consolidated visibility from a master dashboard**.

## Design system decision

The production visual language uses Manrope for the primary interface font. The color system is deep navy, cobalt blue and emerald green. This combination gives the platform a premium fintech feel, keeps financial data readable, and avoids overusing national colors or decorative imagery.

## Product layers

1. **Marketing / acquisition**
   - Premium SaaS landing page.
   - Kenya-focused positioning without visual stereotypes.
   - Pricing tiers: Free, Personal Pro, Business, Chama, Enterprise.

2. **Tenant workspace**
   - A tenant represents an isolated individual, family, chama, business or organization environment.
   - A user can belong to multiple tenants and multiple Money Spaces inside a tenant.
   - Money Spaces isolate transactions, accounts, categories, budgets, reports, goals, members and permissions.

3. **Financial modules**
   - Master dashboard and consolidated reporting.
   - Money Spaces.
   - Accounts and internal transfers.
   - Smart transaction management.
   - Budgets, bills and goals.
   - Invoices and business mode.
   - Chama mode.
   - Debts, loans and receivables.
   - Reports, analytics and reconciliation.
   - Notifications.
   - Audit logs.

4. **Platform administration**
   - Tenant management.
   - Plan management and feature flags.
   - Usage, MRR, churn and transaction volume.
   - Payment integration settings.
   - Tax, currency and category configuration.

## Recommended production stack

- **Frontend:** React + TypeScript or Next.js + TypeScript.
- **Backend API:** Node.js + TypeScript, API-first module boundaries.
- **Database:** PostgreSQL with strict tenant scoping.
- **Authentication:** Supabase Auth or an equivalent secure identity provider.
- **Storage:** Supabase Storage or equivalent private object storage for receipts and attachments.
- **Payments:** Adapter architecture for M-Pesa/Daraja, Airtel Money, banks and payment gateways.
- **Hosting:** Vercel, AWS, or equivalent cloud infrastructure.

## Tenant isolation model

Every sensitive business table includes `tenant_id`. Most tables also include `money_space_id` where relevant.

Authorization is enforced in three layers:

1. **Database RLS** for tenant membership and space access.
2. **Server-side API authorization** for roles and permissions.
3. **Frontend UI hiding** only as a convenience, never as the security boundary.

Frontend IDs are never trusted. API routes must load the record by ID and tenant membership together, for example:

```sql
select *
from app.transactions
where id = $1
  and tenant_id = $2
  and app.is_tenant_member(tenant_id);
```

## Financial consistency rules

The system must preserve the rule:

```text
Opening Balance + Credits − Debits = Closing Balance
```

Implementation rules:

- Opening balances are represented as opening-balance transactions or immutable account initialization events.
- Transfers create paired ledger movements and **must not** be counted as income or expense.
- Reversals create counter-transactions instead of silently changing historical records.
- Important financial records are voided, archived or reversed instead of permanently deleted.
- Account balances should be calculated from transactions or periodically snapshotted with reconciliation metadata.

## Payment integration architecture

Payment providers must be tenant-configurable and server-side only.

Suggested adapter contract:

```ts
interface PaymentProviderAdapter {
  provider: 'mpesa_daraja' | 'airtel_money' | 'bank_gateway' | 'card_gateway';
  initiatePaymentRequest(input: PaymentRequest): Promise<PaymentRequestResult>;
  verifyTransaction(reference: string): Promise<PaymentVerificationResult>;
  parseStatement(file: File): Promise<ImportedTransaction[]>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
}
```

Security requirements:

- No M-Pesa consumer keys, secrets, passkeys or bank credentials in frontend code.
- Store secret references in a vault or encrypted environment store.
- Webhooks must validate signatures and tenant/provider configuration.
- Idempotency keys are required for payment confirmations.
- Webhook payloads are logged with redaction and linked to audit records.

## M-Pesa module roadmap

Initial implementation can start with manual records and statement imports. The schema supports later automated functionality:

- Import M-Pesa statements.
- Parse transaction references, phone numbers and paybill/till details.
- Categorize transactions into Money Spaces.
- Reconcile imported M-Pesa transactions against system records.
- Initiate STK push/payment requests where the tenant has enabled Daraja.
- Receive payment confirmations and status callbacks.

## Kenya tax readiness

PesaWeave tracks financial data and can produce tax summaries. It must not claim official KRA filing unless an authorized integration has processed the filing successfully.

Tax design principles:

- Tax rates and categories are configurable per tenant.
- Support tax-inclusive and tax-exclusive pricing.
- Store customer/supplier tax PIN fields when applicable.
- Keep transaction tax metadata separate from filing/compliance state.
- Reserve integration tables for future official KRA/e-invoicing services.

## API modules

Recommended backend modules:

- `auth`: session, email verification, password reset, optional 2FA.
- `tenants`: tenant lifecycle, memberships, plan limits.
- `money-spaces`: spaces, privacy, categories, member access.
- `accounts`: financial accounts and transfers.
- `transactions`: CRUD-with-audit, approvals, categorization, attachments.
- `imports`: CSV/Excel/bank/M-Pesa mapping and review.
- `reconciliation`: statement comparison, matches and unmatched items.
- `budgets`: budgets, utilization and alerts.
- `goals`: savings targets and contribution projections.
- `bills`: recurring schedules and reminders.
- `business`: customers, suppliers, invoices and receipts.
- `chama`: members, contributions, loans, welfare, fines and statements.
- `reports`: filtered reports and export jobs.
- `notifications`: in-app, email, SMS and push preferences.
- `subscriptions`: plans, billing, trials and feature flags.
- `admin`: platform metrics and support tools.
- `ai`: tenant-safe question answering and insight generation.

## AI assistant guardrails

PesaWeave AI should only access data that the logged-in user is authorized to access.

Recommended pattern:

1. Convert a user question into a scoped intent.
2. Resolve tenant and Money Space access from server-side session.
3. Run parameterized queries with tenant and role filters.
4. Redact sensitive fields when the user lacks permission.
5. Return short explanations with links to source transactions/reports.
6. Log the prompt, query plan and response metadata for auditability without storing secrets.

## Performance and scalability

- Use database indexes on tenant, Money Space, account, date, status and references.
- Paginate transaction tables.
- Use server-side filtering for reports and search.
- Use background jobs for imports, OCR, PDF generation and exports.
- Cache dashboards by tenant/space/date range where safe.
- Use reconciliation snapshots for high-volume accounts.

## Files in this implementation

- `src/` contains the React/TypeScript SaaS application shell, Supabase-ready repository layer, empty-first persistent workspace store and Kenya-ready configuration templates.
- `supabase/migrations/001_initial_schema.sql` contains a tenant-isolated PostgreSQL schema with RLS policies, indexes and audit triggers.
- `.env.example` lists the environment variables expected by a production integration.

# API Contract Sketch

The app is designed for an API-first backend. All endpoints must derive `tenantId` and authorized Money Spaces from the authenticated server session, not from frontend trust alone.

## Core endpoints

| Module | Endpoint examples |
| --- | --- |
| Auth | `GET /api/auth/session`, `POST /api/auth/password-reset`, `POST /api/auth/2fa` |
| Tenants | `GET /api/tenants`, `POST /api/tenants`, `GET /api/tenants/:tenantId/memberships` |
| Money Spaces | `GET /api/tenants/:tenantId/money-spaces`, `POST /api/money-spaces`, `PATCH /api/money-spaces/:id` |
| Accounts | `GET /api/accounts`, `POST /api/accounts`, `POST /api/transfers` |
| Transactions | `GET /api/transactions`, `POST /api/transactions`, `POST /api/transactions/:id/approve`, `POST /api/transactions/:id/void` |
| Imports | `POST /api/imports`, `POST /api/imports/:batchId/map`, `POST /api/imports/:batchId/commit` |
| Payments | `POST /api/payments/mpesa/stk-push`, `POST /api/payments/mpesa/callback`, `GET /api/payments/:provider/status` |
| Invoices | `GET /api/invoices`, `POST /api/invoices`, `GET /api/invoices/:id/pdf` |
| Reports | `GET /api/reports/cash-flow`, `GET /api/reports/profit-loss`, `POST /api/reports/export` |
| Notifications | `GET /api/notifications`, `PATCH /api/notification-preferences` |
| Subscriptions | `GET /api/plans`, `POST /api/subscriptions`, `POST /api/billing/webhooks` |
| Admin | `GET /api/admin/usage`, `GET /api/admin/tenants`, `PATCH /api/admin/feature-flags` |

## Security invariants

- Every query includes tenant membership checks.
- Mutations include role/permission checks.
- Sensitive providers use server-side secrets only.
- Financial mutations write audit logs.
- Transfer endpoints create balanced paired transactions.
- Destructive actions void/reverse records unless the record is safely non-financial draft data.

## Example transaction creation payload

```json
{
  "tenantId": "tenant_123",
  "moneySpaceId": "space_business",
  "accountId": "account_mpesa_till",
  "amount": 4850,
  "currency": "KES",
  "type": "expense",
  "paymentMethod": "mpesa",
  "description": "Naivas 4,850",
  "reference": "TJI9P0N5AF",
  "tags": ["groceries"]
}
```

The server re-checks the user's tenant and Money Space access before inserting the transaction.

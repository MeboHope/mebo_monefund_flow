import type { Currency, PaymentMethod, TransactionType } from '../types';

export interface ApiEnvelope<T> {
  data: T;
  meta?: {
    tenantId: string;
    requestId: string;
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

export interface TenantScopedRequest {
  tenantId: string;
  moneySpaceId?: string;
}

export interface TransactionCreateRequest extends TenantScopedRequest {
  accountId: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  categoryId?: string;
  description: string;
  reference?: string;
  party?: string;
  tags?: string[];
  attachmentIds?: string[];
}

export interface TransferCreateRequest extends TenantScopedRequest {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  currency: Currency;
  reference?: string;
  note?: string;
}

export interface PaymentRequest {
  tenantId: string;
  moneySpaceId: string;
  accountId: string;
  provider: 'mpesa_daraja' | 'airtel_money' | 'bank_gateway' | 'card_gateway';
  amount: number;
  currency: Currency;
  phoneOrAccountRef: string;
  description: string;
  idempotencyKey: string;
}

export interface PaymentRequestResult {
  providerReference: string;
  status: 'queued' | 'sent' | 'confirmed' | 'failed';
  customerMessage?: string;
}

export interface PaymentVerificationResult {
  providerReference: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'confirmed' | 'failed' | 'reversed';
  rawProviderPayloadRef: string;
}

export interface ImportedTransaction {
  transactionDate: string;
  description: string;
  amount: number;
  direction: 'in' | 'out';
  reference?: string;
  phone?: string;
  suggestedMoneySpaceId?: string;
  suggestedCategoryId?: string;
}

export interface WebhookResult {
  accepted: boolean;
  duplicate: boolean;
  transactionId?: string;
}

export interface PaymentProviderAdapter {
  provider: PaymentRequest['provider'];
  initiatePaymentRequest(input: PaymentRequest): Promise<PaymentRequestResult>;
  verifyTransaction(reference: string): Promise<PaymentVerificationResult>;
  parseStatement(file: File): Promise<ImportedTransaction[]>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
}

export const apiModules = {
  auth: ['/api/auth/session', '/api/auth/password-reset', '/api/auth/2fa'],
  tenants: ['/api/tenants', '/api/tenants/:tenantId/memberships'],
  moneySpaces: ['/api/tenants/:tenantId/money-spaces', '/api/money-spaces/:spaceId/members'],
  accounts: ['/api/accounts', '/api/accounts/:accountId/reconcile', '/api/transfers'],
  transactions: ['/api/transactions', '/api/transactions/:id/approve', '/api/transactions/:id/void', '/api/transactions/categorize'],
  imports: ['/api/imports', '/api/imports/:batchId/map', '/api/imports/:batchId/commit'],
  payments: ['/api/payments/mpesa/stk-push', '/api/payments/mpesa/callback', '/api/payments/:provider/status'],
  invoices: ['/api/invoices', '/api/invoices/:id/pdf', '/api/invoices/:id/payments'],
  reports: ['/api/reports/cash-flow', '/api/reports/profit-loss', '/api/reports/budget', '/api/reports/export'],
  notifications: ['/api/notifications', '/api/notification-preferences'],
  subscriptions: ['/api/subscriptions', '/api/plans', '/api/billing/webhooks'],
  admin: ['/api/admin/tenants', '/api/admin/usage', '/api/admin/feature-flags']
} as const;

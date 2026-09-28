export type Currency = 'KES' | 'USD' | 'EUR' | 'GBP' | 'UGX' | 'TZS';
export type MoneySpaceKind = 'personal' | 'business' | 'family' | 'chama' | 'farm' | 'rental' | 'project' | 'organization';
export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund' | 'adjustment' | 'opening_balance';
export type PaymentMethod = 'mpesa' | 'bank' | 'cash' | 'card' | 'cheque' | 'airtel_money' | 'wallet';
export type ReconciliationStatus = 'matched' | 'unmatched' | 'needs_review' | 'reconciled';
export type Role = 'owner' | 'administrator' | 'accountant' | 'manager' | 'staff' | 'viewer' | 'auditor';
export type SubscriptionTier = 'free' | 'personal_pro' | 'business' | 'chama' | 'enterprise';
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface Tenant {
  id: string;
  name: string;
  segment: 'individual' | 'family' | 'business' | 'chama' | 'organization' | 'enterprise';
  plan: SubscriptionTier;
  currency: Currency;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  spaces: string[];
  lastActive: string;
  twoFactorEnabled: boolean;
}

export interface MoneySpace {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  kind: MoneySpaceKind;
  currency: Currency;
  openingBalance: number;
  incomeCategories: string[];
  expenseCategories: string[];
  members: string[];
  period: string;
  status: 'healthy' | 'watch' | 'attention';
  privacy: 'standard' | 'locked' | 'restricted';
  color: string;
  targetMonthlySavings?: number;
}

export interface Account {
  id: string;
  spaceId: string;
  name: string;
  type: 'mpesa' | 'bank' | 'cash' | 'petty_cash' | 'savings' | 'wallet';
  institution: string;
  accountRef: string;
  openingBalance: number;
  currentBalance: number;
  currency: Currency;
  status: 'active' | 'paused' | 'archived';
  notes: string;
}

export interface Transaction {
  id: string;
  date: string;
  time: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  category: string;
  subcategory?: string;
  spaceId: string;
  accountId: string;
  paymentMethod: PaymentMethod;
  description: string;
  reference: string;
  party: string;
  project?: string;
  tags: string[];
  attachment?: string;
  createdBy: string;
  approvedBy?: string;
  approvalStatus: ApprovalStatus;
  reconciliationStatus: ReconciliationStatus;
}

export interface Budget {
  id: string;
  spaceId: string;
  name: string;
  type: 'monthly' | 'weekly' | 'annual' | 'project' | 'department' | 'category';
  category: string;
  limit: number;
  spent: number;
  warningAt: number[];
  period: string;
}

export interface Goal {
  id: string;
  spaceId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export interface Bill {
  id: string;
  spaceId: string;
  name: string;
  payee: string;
  amount: number;
  dueDate: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'custom';
  status: 'upcoming' | 'due' | 'overdue' | 'paid';
  category: string;
}

export interface DebtRecord {
  id: string;
  spaceId: string;
  direction: 'owed_to_me' | 'i_owe';
  person: string;
  amount: number;
  paid: number;
  dueDate: string;
  purpose: string;
  status: 'current' | 'due' | 'overdue' | 'settled';
}

export interface Invoice {
  id: string;
  spaceId: string;
  number: string;
  customer: string;
  amount: number;
  tax: number;
  issuedDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
}

export interface ChamaMember {
  id: string;
  spaceId: string;
  name: string;
  phone: string;
  contributions: number;
  loans: number;
  fines: number;
  attendance: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'sms' | 'push';
  severity: 'info' | 'success' | 'warning' | 'critical';
  spaceId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  ip: string;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  priceMonthly: number | 'custom';
  audience: string;
  limits: string[];
  features: string[];
}

export interface CategorizationSuggestion {
  confidence: number;
  type: TransactionType;
  category: string;
  spaceId: string;
  accountHint?: PaymentMethod;
  tags: string[];
  reason: string;
}

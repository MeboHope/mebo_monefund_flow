import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Account,
  AuditLog,
  Bill,
  Budget,
  ChamaMember,
  DebtRecord,
  Goal,
  Invoice,
  Member,
  MoneySpace,
  MoneySpaceKind,
  NotificationItem,
  PaymentMethod,
  SubscriptionPlan,
  Tenant,
  Transaction,
  TransactionType
} from '../types';
import { subscriptionPlans as seedSubscriptionPlans } from '../data/subscriptionPlans';

const STORAGE_KEY = 'pesaweave_workspace_v1';

const emptyMonthlyCashFlow: Array<{ month: string; income: number; expenses: number }> = [];
const emptyCategoryDistribution: Array<{ label: string; value: number; color: string }> = [];
const emptyAdminMetrics = {
  totalUsers: 1,
  activeUsers: 1,
  newRegistrations: 1,
  monthlyRecurringRevenue: 0,
  failedPayments: 0,
  trialUsers: 1,
  churnRate: 0,
  activeMoneySpaces: 0,
  transactionVolume: 0,
  storageUsageGb: 0,
  apiUsage: 0
};

export interface WorkspaceData {
  tenant: Tenant;
  members: Member[];
  moneySpaces: MoneySpace[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  bills: Bill[];
  debts: DebtRecord[];
  invoices: Invoice[];
  chamaMembers: ChamaMember[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  subscriptionPlans: SubscriptionPlan[];
  monthlyCashFlow: typeof emptyMonthlyCashFlow;
  categoryDistribution: typeof emptyCategoryDistribution;
  adminMetrics: typeof emptyAdminMetrics;
}

interface TransactionDraft {
  type: Extract<TransactionType, 'income' | 'expense' | 'refund' | 'adjustment'>;
  amount: number;
  spaceId: string;
  accountId: string;
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  party?: string;
  reference?: string;
  tags?: string[];
}

interface MoneySpaceDraft {
  name: string;
  description: string;
  kind: MoneySpaceKind;
  currency?: MoneySpace['currency'];
  openingBalance?: number;
}

interface AccountDraft {
  spaceId: string;
  name: string;
  type: Account['type'];
  institution: string;
  accountRef: string;
  openingBalance: number;
  notes?: string;
}

interface TransferDraft {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description: string;
  reference?: string;
}

interface WorkspaceActions {
  addTransaction: (draft: TransactionDraft) => Transaction;
  addMoneySpace: (draft: MoneySpaceDraft) => MoneySpace;
  addAccount: (draft: AccountDraft) => Account;
  createTransfer: (draft: TransferDraft) => Transaction[];
  markBillPaid: (billId: string) => void;
  resetWorkspace: () => void;
}

const initialWorkspace: WorkspaceData = {
  tenant: {
    id: 'tenant_current_workspace',
    name: 'My Money Workspace',
    segment: 'individual',
    plan: 'free',
    currency: 'KES',
    createdAt: new Date().toISOString().slice(0, 10)
  },
  members: [
    {
      id: 'current_user',
      name: 'Account Owner',
      email: 'owner@example.com',
      role: 'owner',
      avatar: 'AO',
      spaces: [],
      lastActive: 'Now',
      twoFactorEnabled: false
    }
  ],
  moneySpaces: [],
  accounts: [],
  transactions: [],
  budgets: [],
  goals: [],
  bills: [],
  debts: [],
  invoices: [],
  chamaMembers: [],
  notifications: [],
  auditLogs: [],
  subscriptionPlans: seedSubscriptionPlans,
  monthlyCashFlow: emptyMonthlyCashFlow,
  categoryDistribution: emptyCategoryDistribution,
  adminMetrics: emptyAdminMetrics
};

const WorkspaceContext = createContext<(WorkspaceData & WorkspaceActions) | null>(null);

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function addAuditLog(data: WorkspaceData, action: string, entity: string, entityId: string, newValue: string): AuditLog[] {
  return [
    {
      id: makeId('audit'),
      actor: data.members[0]?.name ?? 'System user',
      action,
      entity,
      entityId,
      previousValue: 'none',
      newValue,
      timestamp: `${today()} ${currentTime()}`,
      ip: 'captured server-side'
    },
    ...data.auditLogs
  ];
}

function loadInitialWorkspace(): WorkspaceData {
  if (typeof window === 'undefined') return initialWorkspace;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialWorkspace;
  try {
    const parsed = JSON.parse(stored) as Partial<WorkspaceData>;
    return {
      ...initialWorkspace,
      ...parsed,
      monthlyCashFlow: emptyMonthlyCashFlow,
      categoryDistribution: emptyCategoryDistribution,
      adminMetrics: emptyAdminMetrics,
      subscriptionPlans: parsed.subscriptionPlans ?? initialWorkspace.subscriptionPlans
    };
  } catch {
    return initialWorkspace;
  }
}

function accountDelta(type: TransactionType, amount: number) {
  if (type === 'income' || type === 'refund' || type === 'opening_balance') return amount;
  if (type === 'expense') return -amount;
  return 0;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(() => loadInitialWorkspace());

  useEffect(() => {
    const persistent: WorkspaceData = {
      ...data,
      monthlyCashFlow: emptyMonthlyCashFlow,
      categoryDistribution: emptyCategoryDistribution,
      adminMetrics: emptyAdminMetrics
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistent));
  }, [data]);

  const actions = useMemo<WorkspaceActions>(() => ({
    addTransaction: (draft) => {
      let created!: Transaction;
      setData((current) => {
        const account = current.accounts.find((item) => item.id === draft.accountId);
        const space = current.moneySpaces.find((item) => item.id === draft.spaceId);
        if (!account || !space) throw new Error('Select a valid Money Space and account.');
        const amount = Math.round(draft.amount * 100) / 100;
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than zero.');
        created = {
          id: makeId('txn'),
          date: today(),
          time: currentTime(),
          amount,
          currency: space.currency,
          type: draft.type,
          category: draft.category,
          spaceId: draft.spaceId,
          accountId: draft.accountId,
          paymentMethod: draft.paymentMethod,
          description: draft.description.trim(),
          reference: draft.reference?.trim() || makeId('ref').toUpperCase(),
          party: draft.party?.trim() || 'Not specified',
          tags: draft.tags ?? [],
          createdBy: current.members[0]?.id ?? 'system',
          approvedBy: draft.type === 'expense' && amount >= 50000 ? undefined : current.members[0]?.id,
          approvalStatus: draft.type === 'expense' && amount >= 50000 ? 'pending' : 'approved',
          reconciliationStatus: 'unmatched'
        };
        const accounts = current.accounts.map((item) => item.id === draft.accountId ? { ...item, currentBalance: item.currentBalance + accountDelta(draft.type, amount) } : item);
        const notifications = draft.type === 'expense' && amount >= 50000 ? [
          {
            id: makeId('n'),
            title: 'Expense awaiting approval',
            message: `${created.description} for ${amount.toLocaleString('en-KE')} requires approval before finalization.`,
            channel: 'in_app' as const,
            severity: 'warning' as const,
            spaceId: draft.spaceId,
            createdAt: 'Just now'
          },
          ...current.notifications
        ] : current.notifications;
        return {
          ...current,
          accounts,
          transactions: [created, ...current.transactions],
          notifications,
          auditLogs: addAuditLog(current, 'created transaction', 'transaction', created.id, `${created.type} ${created.amount}`)
        };
      });
      return created;
    },
    addMoneySpace: (draft) => {
      let created!: MoneySpace;
      setData((current) => {
        const colors = ['#0f3d5e', '#059669', '#7c3aed', '#ca8a04', '#db2777', '#0f766e', '#2563eb'];
        created = {
          id: makeId('space'),
          tenantId: current.tenant.id,
          name: draft.name.trim(),
          description: draft.description.trim(),
          kind: draft.kind,
          currency: draft.currency ?? 'KES',
          openingBalance: draft.openingBalance ?? 0,
          incomeCategories: ['Income', 'Sales', 'Contributions', 'Refunds'],
          expenseCategories: ['Expenses', 'Supplies', 'Transport', 'Utilities'],
          members: [current.members[0]?.id ?? 'system'],
          period: new Date().getFullYear().toString(),
          status: 'healthy',
          privacy: 'standard',
          color: colors[current.moneySpaces.length % colors.length]
        };
        return {
          ...current,
          members: current.members.map((member, index) => index === 0 ? { ...member, spaces: Array.from(new Set([...member.spaces, created.id])) } : member),
          moneySpaces: [created, ...current.moneySpaces],
          adminMetrics: { ...current.adminMetrics, activeMoneySpaces: current.moneySpaces.length + 1 },
          auditLogs: addAuditLog(current, 'created money space', 'money_space', created.id, created.name)
        };
      });
      return created;
    },
    addAccount: (draft) => {
      let created!: Account;
      setData((current) => {
        const space = current.moneySpaces.find((item) => item.id === draft.spaceId);
        if (!space) throw new Error('Select a valid Money Space.');
        const openingBalance = Math.round(draft.openingBalance * 100) / 100;
        created = {
          id: makeId('acc'),
          spaceId: draft.spaceId,
          name: draft.name.trim(),
          type: draft.type,
          institution: draft.institution.trim(),
          accountRef: draft.accountRef.trim(),
          openingBalance,
          currentBalance: openingBalance,
          currency: space.currency,
          status: 'active',
          notes: draft.notes?.trim() ?? ''
        };
        const openingTransaction: Transaction | null = openingBalance > 0 ? {
          id: makeId('txn'),
          date: today(),
          time: currentTime(),
          amount: openingBalance,
          currency: space.currency,
          type: 'opening_balance',
          category: 'Opening Balance',
          spaceId: draft.spaceId,
          accountId: created.id,
          paymentMethod: draft.type === 'mpesa' ? 'mpesa' : draft.type === 'bank' ? 'bank' : 'cash',
          description: `Opening balance for ${created.name}`,
          reference: makeId('open').toUpperCase(),
          party: 'Opening balance',
          tags: ['opening-balance'],
          createdBy: current.members[0]?.id ?? 'system',
          approvedBy: current.members[0]?.id,
          approvalStatus: 'approved',
          reconciliationStatus: 'reconciled'
        } : null;
        return {
          ...current,
          accounts: [created, ...current.accounts],
          transactions: openingTransaction ? [openingTransaction, ...current.transactions] : current.transactions,
          auditLogs: addAuditLog(current, 'created account', 'account', created.id, created.name)
        };
      });
      return created;
    },
    createTransfer: (draft) => {
      let created: Transaction[] = [];
      setData((current) => {
        const source = current.accounts.find((item) => item.id === draft.sourceAccountId);
        const destination = current.accounts.find((item) => item.id === draft.destinationAccountId);
        if (!source || !destination) throw new Error('Select valid source and destination accounts.');
        if (source.id === destination.id) throw new Error('Source and destination accounts must be different.');
        const amount = Math.round(draft.amount * 100) / 100;
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than zero.');
        const reference = draft.reference?.trim() || makeId('trf').toUpperCase();
        const sourceSpace = current.moneySpaces.find((item) => item.id === source.spaceId);
        const destinationSpace = current.moneySpaces.find((item) => item.id === destination.spaceId);
        const base = {
          date: today(),
          time: currentTime(),
          amount,
          currency: source.currency,
          type: 'transfer' as const,
          category: 'Transfer',
          paymentMethod: source.type === 'mpesa' ? 'mpesa' as const : source.type === 'bank' ? 'bank' as const : 'cash' as const,
          reference,
          tags: ['internal-transfer'],
          createdBy: current.members[0]?.id ?? 'system',
          approvedBy: current.members[0]?.id,
          approvalStatus: 'approved' as const,
          reconciliationStatus: 'unmatched' as const
        };
        const outTxn: Transaction = {
          ...base,
          id: makeId('txn'),
          spaceId: source.spaceId,
          accountId: source.id,
          description: draft.description.trim() || `Transfer to ${destination.name}`,
          party: destinationSpace?.name ?? destination.name
        };
        const inTxn: Transaction = {
          ...base,
          id: makeId('txn'),
          spaceId: destination.spaceId,
          accountId: destination.id,
          description: draft.description.trim() || `Transfer from ${source.name}`,
          party: sourceSpace?.name ?? source.name
        };
        created = [outTxn, inTxn];
        const updatedAccounts = current.accounts.map((item) => {
          if (item.id === source.id) return { ...item, currentBalance: item.currentBalance - amount };
          if (item.id === destination.id) return { ...item, currentBalance: item.currentBalance + amount };
          return item;
        });
        return {
          ...current,
          accounts: updatedAccounts,
          transactions: [outTxn, inTxn, ...current.transactions],
          auditLogs: addAuditLog(current, 'created transfer', 'transfer', reference, `${source.name} to ${destination.name} ${amount}`)
        };
      });
      return created;
    },
    markBillPaid: (billId) => {
      setData((current) => ({
        ...current,
        bills: current.bills.map((bill) => bill.id === billId ? { ...bill, status: 'paid' } : bill),
        auditLogs: addAuditLog(current, 'marked bill paid', 'bill', billId, 'paid')
      }));
    },
    resetWorkspace: () => setData(initialWorkspace)
  }), []);

  const value = useMemo(() => ({ ...data, ...actions }), [data, actions]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return context;
}

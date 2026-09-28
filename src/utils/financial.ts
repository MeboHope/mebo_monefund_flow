import type { Account, Budget, CategorizationSuggestion, MoneySpace, Transaction } from '../types';

export const currencyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0
});

export function formatKES(value: number, mode: 'symbol' | 'code' = 'symbol') {
  const formatted = currencyFormatter.format(value).replace('Ksh', '').trim();
  return mode === 'code' ? `KES ${formatted}` : `Ksh ${formatted}`;
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function getSpaceTransactions(transactions: Transaction[], spaceId?: string) {
  return spaceId && spaceId !== 'all' ? transactions.filter((transaction) => transaction.spaceId === spaceId) : transactions;
}

export function totalsForTransactions(transactions: Transaction[]) {
  const income = sum(transactions.filter((t) => t.type === 'income' || t.type === 'refund').map((t) => t.amount));
  const expenses = sum(transactions.filter((t) => t.type === 'expense').map((t) => t.amount));
  const transfers = sum(transactions.filter((t) => t.type === 'transfer').map((t) => t.amount));
  const pending = sum(transactions.filter((t) => t.approvalStatus === 'pending').map((t) => t.amount));
  return {
    income,
    expenses,
    transfers,
    netCashFlow: income - expenses,
    pendingApprovals: pending
  };
}

export function accountBalance(accounts: Account[], spaceId?: string) {
  const scoped = spaceId && spaceId !== 'all' ? accounts.filter((account) => account.spaceId === spaceId) : accounts;
  return sum(scoped.map((account) => account.currentBalance));
}

export function budgetUtilization(budget: Budget) {
  if (budget.limit <= 0) return 0;
  return Math.min(999, Math.round((budget.spent / budget.limit) * 100));
}

export function budgetStatus(budget: Budget): 'ok' | 'watch' | 'danger' | 'exceeded' {
  const utilization = budgetUtilization(budget);
  if (utilization >= 100) return 'exceeded';
  if (utilization >= 90) return 'danger';
  if (utilization >= 70) return 'watch';
  return 'ok';
}

export function getSpacePerformance(spaces: MoneySpace[], transactions: Transaction[], accounts: Account[]) {
  return spaces.map((space) => {
    const scoped = getSpaceTransactions(transactions, space.id);
    const totals = totalsForTransactions(scoped);
    return {
      ...space,
      income: totals.income,
      expenses: totals.expenses,
      net: totals.netCashFlow,
      balance: accountBalance(accounts, space.id),
      transactionCount: scoped.length
    };
  });
}

export function getMonthlyContribution(targetAmount: number, currentAmount: number, targetDate: string) {
  const now = new Date('2026-09-28T00:00:00Z');
  const target = new Date(`${targetDate}T00:00:00Z`);
  const months = Math.max(1, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  return Math.max(0, Math.ceil((targetAmount - currentAmount) / months));
}

const rules: Array<{ keywords: string[]; suggestion: Omit<CategorizationSuggestion, 'confidence' | 'reason'>; reason: string }> = [
  {
    keywords: ['naivas', 'quickmart', 'carrefour', 'supermarket', 'grocer'],
    suggestion: { type: 'expense', category: 'Food', spaceId: 'personal', accountHint: 'mpesa', tags: ['groceries'] },
    reason: 'Matched common Kenyan supermarket merchant names.'
  },
  {
    keywords: ['rent january', 'rent received', 'tenant', 'unit'],
    suggestion: { type: 'income', category: 'Rent Received', spaceId: 'rental', accountHint: 'bank', tags: ['rent'] },
    reason: 'Detected rent-related wording and tenant context.'
  },
  {
    keywords: ['safaricom', 'mpesa', 'till', 'paybill'],
    suggestion: { type: 'expense', category: 'Utilities', spaceId: 'personal', accountHint: 'mpesa', tags: ['mpesa'] },
    reason: 'Detected mobile money/provider reference.'
  },
  {
    keywords: ['fertilizer', 'seeds', 'agrovet', 'farm'],
    suggestion: { type: 'expense', category: 'Fertilizer', spaceId: 'farm', accountHint: 'cash', tags: ['farm-inputs'] },
    reason: 'Detected agricultural input words.'
  },
  {
    keywords: ['salary', 'payroll'],
    suggestion: { type: 'income', category: 'Salary', spaceId: 'personal', accountHint: 'bank', tags: ['salary'] },
    reason: 'Detected payroll/salary wording.'
  },
  {
    keywords: ['invoice', 'client', 'milestone', 'deposit'],
    suggestion: { type: 'income', category: 'Client Deposits', spaceId: 'project_a', accountHint: 'bank', tags: ['client'] },
    reason: 'Detected project/client payment wording.'
  },
  {
    keywords: ['contribution', 'chama', 'welfare'],
    suggestion: { type: 'income', category: 'Member Contributions', spaceId: 'chama', accountHint: 'mpesa', tags: ['chama'] },
    reason: 'Detected chama contribution wording.'
  }
];

export function suggestCategorization(input: string): CategorizationSuggestion {
  const normalized = input.toLowerCase();
  const matchedRule = rules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));
  if (matchedRule) {
    return {
      ...matchedRule.suggestion,
      confidence: normalized.length > 18 ? 93 : 84,
      reason: matchedRule.reason
    };
  }

  const amountMatch = normalized.match(/(?:ksh|kes)?\s?([\d,]+)/i);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 0;
  return {
    confidence: amount > 50000 ? 62 : 55,
    type: amount > 50000 ? 'expense' : 'expense',
    category: amount > 50000 ? 'Supplier Payments' : 'General',
    spaceId: amount > 50000 ? 'boutique' : 'personal',
    accountHint: 'mpesa',
    tags: ['needs-review'],
    reason: 'No exact rule matched, so the item is routed to review with a conservative default.'
  };
}

export function closingBalance(openingBalance: number, transactions: Transaction[]) {
  const credits = sum(transactions.filter((t) => ['income', 'refund', 'opening_balance'].includes(t.type)).map((t) => t.amount));
  const debits = sum(transactions.filter((t) => t.type === 'expense').map((t) => t.amount));
  return openingBalance + credits - debits;
}

export function daysUntil(date: string) {
  const now = new Date('2026-09-28T00:00:00Z');
  const target = new Date(`${date}T00:00:00Z`);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

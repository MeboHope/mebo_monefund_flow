import { supabase } from '../lib/supabaseClient';
import type { Account, Currency, MoneySpace, MoneySpaceKind, PaymentMethod, Transaction, TransactionType } from '../types';

export interface WorkspaceRepository {
  createPersonalTenant(workspaceName: string): Promise<string>;
  createMoneySpace(input: {
    tenantId: string;
    name: string;
    description: string;
    kind: MoneySpaceKind;
    currency: Currency;
    openingBalance?: number;
  }): Promise<string>;
  createAccount(input: {
    tenantId: string;
    moneySpaceId: string;
    name: string;
    accountType: Account['type'];
    institution?: string;
    accountReference?: string;
    openingBalance?: number;
    currency: Currency;
    notes?: string;
  }): Promise<string>;
  createTransaction(input: {
    tenantId: string;
    moneySpaceId: string;
    accountId: string;
    amount: number;
    transactionType: TransactionType;
    paymentMethod: PaymentMethod;
    description: string;
    reference?: string;
    partyName?: string;
    tags?: string[];
  }): Promise<string>;
  createTransfer(input: {
    tenantId: string;
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    description?: string;
    reference?: string;
  }): Promise<string>;
  listMoneySpaces(tenantId: string): Promise<MoneySpace[]>;
  listAccounts(tenantId: string, moneySpaceId?: string): Promise<Account[]>;
  listTransactions(tenantId: string, moneySpaceId?: string): Promise<Transaction[]>;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect the hosted backend.');
  }
  return supabase;
}

async function rpcId(functionName: string, payload: Record<string, unknown>) {
  const client = requireSupabase();
  const { data, error } = await client.rpc(functionName, payload);
  if (error) throw error;
  if (!data || typeof data !== 'string') throw new Error(`${functionName} did not return an id.`);
  return data;
}

export const supabaseWorkspaceRepository: WorkspaceRepository = {
  createPersonalTenant(workspaceName) {
    return rpcId('create_personal_tenant', { workspace_name: workspaceName });
  },

  createMoneySpace(input) {
    return rpcId('create_money_space', {
      p_tenant_id: input.tenantId,
      p_name: input.name,
      p_description: input.description,
      p_kind: input.kind,
      p_currency: input.currency,
      p_opening_balance: input.openingBalance ?? 0,
      p_privacy: 'standard'
    });
  },

  createAccount(input) {
    return rpcId('create_account_with_opening_balance', {
      p_tenant_id: input.tenantId,
      p_money_space_id: input.moneySpaceId,
      p_name: input.name,
      p_account_type: input.accountType,
      p_institution: input.institution ?? null,
      p_account_reference: input.accountReference ?? null,
      p_opening_balance: input.openingBalance ?? 0,
      p_currency: input.currency,
      p_notes: input.notes ?? null
    });
  },

  createTransaction(input) {
    return rpcId('create_financial_transaction', {
      p_tenant_id: input.tenantId,
      p_money_space_id: input.moneySpaceId,
      p_account_id: input.accountId,
      p_amount: input.amount,
      p_transaction_type: input.transactionType,
      p_payment_method: input.paymentMethod,
      p_description: input.description,
      p_reference: input.reference ?? null,
      p_party_name: input.partyName ?? null,
      p_tags: input.tags ?? []
    });
  },

  createTransfer(input) {
    return rpcId('create_account_transfer', {
      p_tenant_id: input.tenantId,
      p_source_account_id: input.sourceAccountId,
      p_destination_account_id: input.destinationAccountId,
      p_amount: input.amount,
      p_description: input.description ?? 'Internal transfer',
      p_reference: input.reference ?? null
    });
  },

  async listMoneySpaces(tenantId) {
    const client = requireSupabase();
    const { data, error } = await client
      .schema('app')
      .from('money_spaces')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description ?? '',
      kind: row.kind,
      currency: row.currency,
      openingBalance: Number(row.opening_balance ?? 0),
      incomeCategories: [],
      expenseCategories: [],
      members: [],
      period: row.financial_period_start && row.financial_period_end ? `${row.financial_period_start} to ${row.financial_period_end}` : 'Current period',
      status: 'healthy',
      privacy: row.privacy,
      color: row.settings?.color ?? '#155eef'
    })) as MoneySpace[];
  },

  async listAccounts(tenantId, moneySpaceId) {
    const client = requireSupabase();
    let query = client
      .schema('app')
      .from('accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (moneySpaceId) query = query.eq('money_space_id', moneySpaceId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      spaceId: row.money_space_id,
      name: row.name,
      type: row.account_type,
      institution: row.institution ?? '',
      accountRef: row.account_reference ?? '',
      openingBalance: Number(row.opening_balance ?? 0),
      currentBalance: Number(row.current_balance ?? 0),
      currency: row.currency,
      status: row.status,
      notes: row.notes ?? ''
    })) as Account[];
  },

  async listTransactions(tenantId, moneySpaceId) {
    const client = requireSupabase();
    let query = client
      .schema('app')
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('transaction_date', { ascending: false });
    if (moneySpaceId) query = query.eq('money_space_id', moneySpaceId);
    const { data, error } = await query.limit(100);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      date: row.transaction_date,
      time: row.transaction_time ?? '',
      amount: Number(row.amount ?? 0),
      currency: row.currency,
      type: row.transaction_type,
      category: 'Uncategorized',
      spaceId: row.money_space_id,
      accountId: row.account_id,
      paymentMethod: row.payment_method,
      description: row.description,
      reference: row.reference ?? '',
      party: row.party_name ?? '',
      project: row.project_name ?? '',
      tags: row.tags ?? [],
      createdBy: row.created_by ?? '',
      approvedBy: row.approved_by ?? undefined,
      approvalStatus: row.approval_status,
      reconciliationStatus: row.reconciliation_status
    })) as Transaction[];
  }
};

-- Mebo Money Flow: PostgreSQL/Supabase tenant-isolated financial schema
-- The schema is intentionally API-first and RLS-first. Financial records are scoped by tenant_id and important records are voided/reversed instead of hard-deleted.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create schema if not exists app;

create type app.tenant_segment as enum ('individual', 'family', 'business', 'chama', 'organization', 'enterprise');
create type app.subscription_tier as enum ('free', 'personal_pro', 'business', 'chama', 'enterprise');
create type app.money_space_kind as enum ('personal', 'business', 'family', 'chama', 'farm', 'rental', 'project', 'organization');
create type app.member_role as enum ('owner', 'administrator', 'accountant', 'manager', 'staff', 'viewer', 'auditor');
create type app.transaction_type as enum ('income', 'expense', 'transfer', 'refund', 'adjustment', 'opening_balance', 'reversal');
create type app.approval_status as enum ('draft', 'pending', 'approved', 'rejected', 'changes_requested', 'voided');
create type app.reconciliation_status as enum ('unmatched', 'matched', 'needs_review', 'reconciled');
create type app.payment_method as enum ('mpesa', 'bank', 'cash', 'card', 'cheque', 'airtel_money', 'wallet', 'other');
create type app.bill_schedule as enum ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'custom');
create type app.invoice_status as enum ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled');
create type app.debt_direction as enum ('owed_to_me', 'i_owe');
create type app.notification_channel as enum ('in_app', 'email', 'sms', 'push');

create table app.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  default_currency char(3) not null default 'KES',
  preferred_currency_format text not null default 'Ksh 25,000',
  two_factor_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  segment app.tenant_segment not null,
  default_currency char(3) not null default 'KES' check (default_currency in ('KES','USD','EUR','GBP','UGX','TZS')),
  plan app.subscription_tier not null default 'free',
  status text not null default 'active' check (status in ('trial','active','past_due','suspended','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  user_id uuid not null references app.profiles(id) on delete cascade,
  role app.member_role not null default 'viewer',
  permissions jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('invited','active','disabled')),
  joined_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table app.money_spaces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  name text not null,
  description text,
  kind app.money_space_kind not null,
  currency char(3) not null default 'KES' check (currency in ('KES','USD','EUR','GBP','UGX','TZS')),
  opening_balance numeric(18,2) not null default 0,
  financial_period_start date,
  financial_period_end date,
  privacy text not null default 'standard' check (privacy in ('standard','locked','restricted')),
  settings jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.space_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid not null references app.money_spaces(id) on delete cascade,
  user_id uuid not null references app.profiles(id) on delete cascade,
  role app.member_role not null default 'viewer',
  can_view_balances boolean not null default true,
  can_view_sensitive_transactions boolean not null default true,
  permissions jsonb not null default '{}'::jsonb,
  unique (money_space_id, user_id)
);

create table app.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid references app.money_spaces(id) on delete cascade,
  name text not null,
  parent_id uuid references app.categories(id),
  transaction_type app.transaction_type not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, money_space_id, name, transaction_type)
);

create table app.accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid not null references app.money_spaces(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('mpesa','bank','cash','petty_cash','savings','wallet','card','other')),
  institution text,
  account_reference text,
  opening_balance numeric(18,2) not null default 0,
  current_balance numeric(18,2) not null default 0,
  currency char(3) not null default 'KES' check (currency in ('KES','USD','EUR','GBP','UGX','TZS')),
  notes text,
  status text not null default 'active' check (status in ('active','paused','archived')),
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid not null references app.money_spaces(id),
  account_id uuid not null references app.accounts(id),
  category_id uuid references app.categories(id),
  transaction_date date not null,
  transaction_time time,
  amount numeric(18,2) not null check (amount >= 0),
  currency char(3) not null default 'KES' check (currency in ('KES','USD','EUR','GBP','UGX','TZS')),
  transaction_type app.transaction_type not null,
  payment_method app.payment_method not null,
  description text not null,
  reference text,
  party_name text,
  project_name text,
  tags text[] not null default '{}',
  approval_status app.approval_status not null default 'draft',
  reconciliation_status app.reconciliation_status not null default 'unmatched',
  created_by uuid references app.profiles(id),
  approved_by uuid references app.profiles(id),
  approved_at timestamptz,
  voided_by uuid references app.profiles(id),
  voided_at timestamptz,
  reversal_of uuid references app.transactions(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approved_requires_approver check (approval_status <> 'approved' or approved_by is not null or created_by is null)
);

create table app.transfer_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  source_transaction_id uuid not null references app.transactions(id),
  destination_transaction_id uuid not null references app.transactions(id),
  source_account_id uuid not null references app.accounts(id),
  destination_account_id uuid not null references app.accounts(id),
  amount numeric(18,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (source_transaction_id, destination_transaction_id)
);

create table app.attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid references app.money_spaces(id) on delete cascade,
  transaction_id uuid references app.transactions(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  ocr_payload jsonb not null default '{}'::jsonb,
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now()
);

create table app.budgets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid not null references app.money_spaces(id) on delete cascade,
  category_id uuid references app.categories(id),
  name text not null,
  budget_type text not null check (budget_type in ('monthly','weekly','annual','project','department','category')),
  limit_amount numeric(18,2) not null check (limit_amount >= 0),
  period_start date not null,
  period_end date not null,
  warning_thresholds int[] not null default '{70,90,100}',
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now()
);

create table app.goals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid not null references app.money_spaces(id) on delete cascade,
  name text not null,
  target_amount numeric(18,2) not null check (target_amount >= 0),
  current_amount numeric(18,2) not null default 0 check (current_amount >= 0),
  target_date date,
  status text not null default 'active' check (status in ('active','completed','paused','archived')),
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now()
);

create table app.bills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid not null references app.money_spaces(id) on delete cascade,
  category_id uuid references app.categories(id),
  name text not null,
  payee text not null,
  amount numeric(18,2) not null check (amount >= 0),
  due_date date not null,
  schedule app.bill_schedule not null,
  reminder_days int[] not null default '{7,3,1}',
  status text not null default 'upcoming' check (status in ('upcoming','due','overdue','paid','cancelled')),
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now()
);

create table app.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid references app.money_spaces(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  tax_pin text,
  billing_address text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table app.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid references app.money_spaces(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  tax_pin text,
  payment_terms text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table app.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid not null references app.money_spaces(id),
  customer_id uuid references app.customers(id),
  invoice_number text not null,
  issue_date date not null,
  due_date date not null,
  subtotal numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) generated always as (subtotal + tax_amount - discount_amount) stored,
  currency char(3) not null default 'KES',
  status app.invoice_status not null default 'draft',
  payment_instructions text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, invoice_number)
);

create table app.invoice_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  invoice_id uuid not null references app.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(18,2) not null default 1,
  unit_price numeric(18,2) not null default 0,
  tax_rate numeric(8,4) not null default 0,
  line_total numeric(18,2) generated always as ((quantity * unit_price) + ((quantity * unit_price) * tax_rate / 100)) stored
);

create table app.debts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid not null references app.money_spaces(id) on delete cascade,
  direction app.debt_direction not null,
  person_name text not null,
  principal_amount numeric(18,2) not null check (principal_amount >= 0),
  paid_amount numeric(18,2) not null default 0 check (paid_amount >= 0),
  purpose text,
  due_date date,
  status text not null default 'current' check (status in ('current','due','overdue','settled','written_off')),
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now()
);

create table app.chama_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid not null references app.money_spaces(id) on delete cascade,
  profile_id uuid references app.profiles(id),
  full_name text not null,
  phone text,
  national_id_hash text,
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  joined_at date not null default current_date,
  unique (money_space_id, phone)
);

create table app.chama_contributions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid not null references app.money_spaces(id) on delete cascade,
  chama_member_id uuid not null references app.chama_members(id) on delete cascade,
  transaction_id uuid references app.transactions(id),
  contribution_month date not null,
  amount numeric(18,2) not null check (amount >= 0),
  contribution_type text not null default 'standard' check (contribution_type in ('standard','welfare','fine','loan_repayment','dividend')),
  created_at timestamptz not null default now()
);

create table app.approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  requested_by uuid references app.profiles(id),
  approver_id uuid references app.profiles(id),
  status app.approval_status not null default 'pending',
  note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table app.payment_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  provider text not null check (provider in ('mpesa_daraja','airtel_money','bank_gateway','card_gateway')),
  display_name text not null,
  enabled boolean not null default false,
  credentials_secret_ref text,
  callback_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

create table app.import_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  money_space_id uuid references app.money_spaces(id),
  source_type text not null check (source_type in ('csv','excel','bank_statement','mpesa_statement')),
  status text not null default 'uploaded' check (status in ('uploaded','mapped','reviewed','committed','failed')),
  mapping jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now()
);

create table app.reconciliations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  account_id uuid not null references app.accounts(id) on delete cascade,
  statement_date date not null,
  system_balance numeric(18,2) not null,
  actual_balance numeric(18,2) not null,
  difference numeric(18,2) generated always as (actual_balance - system_balance) stored,
  status text not null default 'open' check (status in ('open','needs_review','closed')),
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now()
);

create table app.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  user_id uuid references app.profiles(id) on delete cascade,
  money_space_id uuid references app.money_spaces(id) on delete cascade,
  channel app.notification_channel not null,
  title text not null,
  message text not null,
  severity text not null default 'info' check (severity in ('info','success','warning','critical')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table app.subscription_plans (
  id app.subscription_tier primary key,
  name text not null,
  price_monthly numeric(18,2),
  limits jsonb not null default '{}'::jsonb,
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table app.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references app.tenants(id) on delete cascade,
  plan_id app.subscription_tier not null references app.subscription_plans(id),
  status text not null default 'trialing' check (status in ('trialing','active','past_due','cancelled','paused')),
  current_period_start date,
  current_period_end date,
  payment_provider text,
  provider_subscription_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references app.tenants(id) on delete cascade,
  actor_id uuid references app.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Indexes for fast tenant-scoped filtering, reporting, reconciliation and search.
create index idx_memberships_user on app.memberships (user_id, tenant_id);
create index idx_space_memberships_user on app.space_memberships (user_id, money_space_id);
create index idx_money_spaces_tenant on app.money_spaces (tenant_id, kind, archived_at);
create index idx_accounts_tenant_space on app.accounts (tenant_id, money_space_id, status);
create index idx_transactions_tenant_date on app.transactions (tenant_id, transaction_date desc);
create index idx_transactions_space_date on app.transactions (money_space_id, transaction_date desc);
create index idx_transactions_account_date on app.transactions (account_id, transaction_date desc);
create index idx_transactions_reference on app.transactions (tenant_id, reference);
create index idx_transactions_tags on app.transactions using gin (tags);
create index idx_budgets_space_period on app.budgets (money_space_id, period_start, period_end);
create index idx_invoices_tenant_status on app.invoices (tenant_id, status, due_date);
create index idx_notifications_user on app.notifications (user_id, read_at, created_at desc);
create index idx_audit_logs_tenant_entity on app.audit_logs (tenant_id, entity_type, entity_id, created_at desc);

-- Helper functions for Row Level Security. These are stable and only depend on auth.uid().
create or replace function app.is_tenant_member(check_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1 from app.memberships m
    where m.tenant_id = check_tenant_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function app.has_tenant_role(check_tenant_id uuid, roles app.member_role[])
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1 from app.memberships m
    where m.tenant_id = check_tenant_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any(roles)
  );
$$;

create or replace function app.can_access_space(check_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1 from app.space_memberships sm
    join app.money_spaces ms on ms.id = sm.money_space_id
    where sm.money_space_id = check_space_id
      and sm.user_id = auth.uid()
      and app.is_tenant_member(ms.tenant_id)
  );
$$;

-- Enable Row Level Security.
alter table app.profiles enable row level security;
alter table app.tenants enable row level security;
alter table app.memberships enable row level security;
alter table app.money_spaces enable row level security;
alter table app.space_memberships enable row level security;
alter table app.categories enable row level security;
alter table app.accounts enable row level security;
alter table app.transactions enable row level security;
alter table app.transfer_links enable row level security;
alter table app.attachments enable row level security;
alter table app.budgets enable row level security;
alter table app.goals enable row level security;
alter table app.bills enable row level security;
alter table app.customers enable row level security;
alter table app.suppliers enable row level security;
alter table app.invoices enable row level security;
alter table app.invoice_items enable row level security;
alter table app.debts enable row level security;
alter table app.chama_members enable row level security;
alter table app.chama_contributions enable row level security;
alter table app.approvals enable row level security;
alter table app.payment_integrations enable row level security;
alter table app.import_batches enable row level security;
alter table app.reconciliations enable row level security;
alter table app.notifications enable row level security;
alter table app.subscriptions enable row level security;
alter table app.audit_logs enable row level security;

-- Common tenant policies.
create policy "profiles own row" on app.profiles for select using (id = auth.uid());
create policy "profiles update own row" on app.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "tenant members can view tenants" on app.tenants for select using (app.is_tenant_member(id));
create policy "owners manage tenants" on app.tenants for update using (app.has_tenant_role(id, array['owner','administrator']::app.member_role[]));

create policy "members can see tenant memberships" on app.memberships for select using (app.is_tenant_member(tenant_id));
create policy "owners manage memberships" on app.memberships for all using (app.has_tenant_role(tenant_id, array['owner','administrator']::app.member_role[])) with check (app.has_tenant_role(tenant_id, array['owner','administrator']::app.member_role[]));

create policy "members can view spaces" on app.money_spaces for select using (app.is_tenant_member(tenant_id) and app.can_access_space(id));
create policy "admins manage spaces" on app.money_spaces for all using (app.has_tenant_role(tenant_id, array['owner','administrator']::app.member_role[])) with check (app.has_tenant_role(tenant_id, array['owner','administrator']::app.member_role[]));

create policy "space members visible" on app.space_memberships for select using (app.is_tenant_member(tenant_id));
create policy "admins manage space members" on app.space_memberships for all using (app.has_tenant_role(tenant_id, array['owner','administrator']::app.member_role[])) with check (app.has_tenant_role(tenant_id, array['owner','administrator']::app.member_role[]));

-- Generate policies for tenant-scoped tables where all tenant members can read and authorized roles can write.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'categories','accounts','transactions','transfer_links','attachments','budgets','goals','bills','customers','suppliers','invoices','invoice_items','debts','chama_members','chama_contributions','approvals','payment_integrations','import_batches','reconciliations','notifications','subscriptions','audit_logs'
  ] loop
    execute format('create policy %I on app.%I for select using (app.is_tenant_member(tenant_id));', tbl || '_tenant_read', tbl);
    execute format('create policy %I on app.%I for insert with check (app.has_tenant_role(tenant_id, array[''owner'',''administrator'',''accountant'',''manager'',''staff'']::app.member_role[]));', tbl || '_tenant_insert', tbl);
    execute format('create policy %I on app.%I for update using (app.has_tenant_role(tenant_id, array[''owner'',''administrator'',''accountant'',''manager'']::app.member_role[])) with check (app.has_tenant_role(tenant_id, array[''owner'',''administrator'',''accountant'',''manager'']::app.member_role[]));', tbl || '_tenant_update', tbl);
  end loop;
end $$;

-- Subscription plans are public to authenticated users but platform-admin writes should be controlled by a service role/API.
alter table app.subscription_plans enable row level security;
create policy "authenticated can view plans" on app.subscription_plans for select to authenticated using (active = true);

-- Audit trigger function. Attach to important financial tables.
create or replace function app.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = app, public
as $$
declare
  row_tenant uuid;
begin
  row_tenant := coalesce(new.tenant_id, old.tenant_id);
  insert into app.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, previous_value, new_value)
  values (
    row_tenant,
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_transactions after insert or update on app.transactions for each row execute function app.audit_row_change();
create trigger audit_accounts after insert or update on app.accounts for each row execute function app.audit_row_change();
create trigger audit_invoices after insert or update on app.invoices for each row execute function app.audit_row_change();
create trigger audit_budgets after insert or update on app.budgets for each row execute function app.audit_row_change();
create trigger audit_payment_integrations after insert or update on app.payment_integrations for each row execute function app.audit_row_change();

-- Plan seeds. Pricing remains configurable in the SaaS admin panel.
insert into app.subscription_plans (id, name, price_monthly, limits, features) values
('free', 'Free', 0, '{"money_spaces":2,"history_days":90}', '["Basic transactions","Basic reports","Manual M-Pesa records"]'),
('personal_pro', 'Personal Pro', 950, '{"money_spaces":"unlimited"}', '["Advanced reports","Budgets","Goals","Recurring transactions","Exports","MFlow AI"]'),
('business', 'Business', 2900, '{"users":10}', '["Customers","Suppliers","Invoices","Approvals","Business analytics","Audit logs"]'),
('chama', 'Chama', 1900, '{"members":100}', '["Contributions","Loans","Welfare","Fines","Member statements","Reports"]'),
('enterprise', 'Enterprise', null, '{"users":"unlimited","api_access":true}', '["Branches","Advanced permissions","Advanced audit","API access","Dedicated support"]')
on conflict (id) do update set name = excluded.name, price_monthly = excluded.price_monthly, limits = excluded.limits, features = excluded.features, updated_at = now();

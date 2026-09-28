-- PesaWeave production onboarding and secure financial write functions.
-- Apply after 001_initial_schema.sql.

-- Allow an authenticated user to create and update their own profile when Supabase Auth creates a user.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'app'
      and tablename = 'profiles'
      and policyname = 'profiles insert own row'
  ) then
    create policy "profiles insert own row" on app.profiles
    for insert to authenticated
    with check (id = auth.uid());
  end if;
end $$;

-- Supabase Auth trigger: create profile automatically.
create or replace function app.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = app, public
as $$
begin
  insert into app.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'Account Owner'), '@', 1)),
    new.phone
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(nullif(excluded.full_name, ''), app.profiles.full_name),
      phone = coalesce(excluded.phone, app.profiles.phone),
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app.handle_new_auth_user();

-- Create a tenant for a new user. This is security definer so onboarding does not require exposing elevated keys to the browser.
create or replace function app.create_personal_tenant(workspace_name text default 'My Money Workspace')
returns uuid
language plpgsql
security definer
set search_path = app, public
as $$
declare
  new_tenant_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into app.profiles (id, email, full_name)
  select current_user_id, coalesce(u.email, ''), coalesce(u.raw_user_meta_data ->> 'full_name', split_part(coalesce(u.email, 'Account Owner'), '@', 1))
  from auth.users u
  where u.id = current_user_id
  on conflict (id) do nothing;

  insert into app.tenants (name, segment, default_currency, plan, created_by)
  values (coalesce(nullif(workspace_name, ''), 'My Money Workspace'), 'individual', 'KES', 'free', current_user_id)
  returning id into new_tenant_id;

  insert into app.memberships (tenant_id, user_id, role, status)
  values (new_tenant_id, current_user_id, 'owner', 'active');

  insert into app.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, new_value)
  values (new_tenant_id, current_user_id, 'created tenant', 'tenant', new_tenant_id, jsonb_build_object('name', workspace_name));

  return new_tenant_id;
end;
$$;

create or replace function app.create_money_space(
  p_tenant_id uuid,
  p_name text,
  p_description text,
  p_kind app.money_space_kind default 'personal',
  p_currency char(3) default 'KES',
  p_opening_balance numeric default 0,
  p_privacy text default 'standard'
)
returns uuid
language plpgsql
security definer
set search_path = app, public
as $$
declare
  new_space_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not app.has_tenant_role(p_tenant_id, array['owner','administrator']::app.member_role[]) then
    raise exception 'Not allowed to create Money Spaces for this tenant';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Money Space name is required';
  end if;

  insert into app.money_spaces (tenant_id, name, description, kind, currency, opening_balance, privacy, created_by)
  values (p_tenant_id, trim(p_name), p_description, p_kind, p_currency, coalesce(p_opening_balance, 0), p_privacy, current_user_id)
  returning id into new_space_id;

  insert into app.space_memberships (tenant_id, money_space_id, user_id, role)
  values (p_tenant_id, new_space_id, current_user_id, 'owner')
  on conflict (money_space_id, user_id) do nothing;

  insert into app.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, new_value)
  values (p_tenant_id, current_user_id, 'created money space', 'money_space', new_space_id, jsonb_build_object('name', p_name, 'kind', p_kind));

  return new_space_id;
end;
$$;

create or replace function app.create_account_with_opening_balance(
  p_tenant_id uuid,
  p_money_space_id uuid,
  p_name text,
  p_account_type text,
  p_institution text default null,
  p_account_reference text default null,
  p_opening_balance numeric default 0,
  p_currency char(3) default 'KES',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = app, public
as $$
declare
  new_account_id uuid;
  opening_transaction_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not app.can_access_space(p_money_space_id) then
    raise exception 'No access to this Money Space';
  end if;
  if not app.has_tenant_role(p_tenant_id, array['owner','administrator','accountant']::app.member_role[]) then
    raise exception 'Not allowed to create accounts for this tenant';
  end if;

  insert into app.accounts (tenant_id, money_space_id, name, account_type, institution, account_reference, opening_balance, current_balance, currency, notes, created_by)
  values (p_tenant_id, p_money_space_id, trim(p_name), p_account_type, p_institution, p_account_reference, coalesce(p_opening_balance, 0), coalesce(p_opening_balance, 0), p_currency, p_notes, current_user_id)
  returning id into new_account_id;

  if coalesce(p_opening_balance, 0) > 0 then
    insert into app.transactions (tenant_id, money_space_id, account_id, transaction_date, transaction_time, amount, currency, transaction_type, payment_method, description, reference, party_name, tags, approval_status, reconciliation_status, created_by, approved_by, approved_at)
    values (p_tenant_id, p_money_space_id, new_account_id, current_date, localtime(0), p_opening_balance, p_currency, 'opening_balance', 'other', 'Opening balance', 'OPEN-' || substring(new_account_id::text, 1, 8), 'Opening balance', array['opening-balance'], 'approved', 'reconciled', current_user_id, current_user_id, now())
    returning id into opening_transaction_id;
  end if;

  insert into app.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, new_value)
  values (p_tenant_id, current_user_id, 'created account', 'account', new_account_id, jsonb_build_object('name', p_name, 'opening_balance', p_opening_balance));

  return new_account_id;
end;
$$;

create or replace function app.create_financial_transaction(
  p_tenant_id uuid,
  p_money_space_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_transaction_type app.transaction_type,
  p_payment_method app.payment_method,
  p_description text,
  p_category_id uuid default null,
  p_reference text default null,
  p_party_name text default null,
  p_tags text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = app, public
as $$
declare
  new_transaction_id uuid;
  current_user_id uuid := auth.uid();
  delta numeric := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;
  if not app.can_access_space(p_money_space_id) then
    raise exception 'No access to this Money Space';
  end if;
  if not app.has_tenant_role(p_tenant_id, array['owner','administrator','accountant','manager','staff']::app.member_role[]) then
    raise exception 'Not allowed to create transactions for this tenant';
  end if;

  if p_transaction_type in ('income','refund','opening_balance') then
    delta := p_amount;
  elsif p_transaction_type = 'expense' then
    delta := -p_amount;
  else
    delta := 0;
  end if;

  insert into app.transactions (tenant_id, money_space_id, account_id, category_id, transaction_date, transaction_time, amount, currency, transaction_type, payment_method, description, reference, party_name, tags, approval_status, reconciliation_status, created_by, approved_by, approved_at)
  select p_tenant_id, p_money_space_id, p_account_id, p_category_id, current_date, localtime(0), p_amount, a.currency, p_transaction_type, p_payment_method, trim(p_description), p_reference, p_party_name, coalesce(p_tags, '{}'),
    case when p_transaction_type = 'expense' and p_amount >= 50000 then 'pending'::app.approval_status else 'approved'::app.approval_status end,
    'unmatched'::app.reconciliation_status,
    current_user_id,
    case when p_transaction_type = 'expense' and p_amount >= 50000 then null else current_user_id end,
    case when p_transaction_type = 'expense' and p_amount >= 50000 then null else now() end
  from app.accounts a
  where a.id = p_account_id and a.tenant_id = p_tenant_id and a.money_space_id = p_money_space_id
  returning id into new_transaction_id;

  if new_transaction_id is null then
    raise exception 'Account not found in this tenant and Money Space';
  end if;

  update app.accounts set current_balance = current_balance + delta, updated_at = now()
  where id = p_account_id and tenant_id = p_tenant_id;

  insert into app.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, new_value)
  values (p_tenant_id, current_user_id, 'created transaction', 'transaction', new_transaction_id, jsonb_build_object('amount', p_amount, 'type', p_transaction_type));

  return new_transaction_id;
end;
$$;

create or replace function app.create_account_transfer(
  p_tenant_id uuid,
  p_source_account_id uuid,
  p_destination_account_id uuid,
  p_amount numeric,
  p_description text default 'Internal transfer',
  p_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = app, public
as $$
declare
  current_user_id uuid := auth.uid();
  source_space uuid;
  destination_space uuid;
  source_txn uuid;
  destination_txn uuid;
  transfer_id uuid := gen_random_uuid();
  transfer_reference text := coalesce(nullif(p_reference, ''), 'TRF-' || substring(transfer_id::text, 1, 8));
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;
  if p_source_account_id = p_destination_account_id then
    raise exception 'Source and destination accounts must differ';
  end if;
  if not app.has_tenant_role(p_tenant_id, array['owner','administrator','accountant','manager']::app.member_role[]) then
    raise exception 'Not allowed to create transfers for this tenant';
  end if;

  select money_space_id into source_space from app.accounts where id = p_source_account_id and tenant_id = p_tenant_id;
  select money_space_id into destination_space from app.accounts where id = p_destination_account_id and tenant_id = p_tenant_id;

  if source_space is null or destination_space is null then
    raise exception 'Invalid account for tenant';
  end if;
  if not app.can_access_space(source_space) or not app.can_access_space(destination_space) then
    raise exception 'No access to one or both Money Spaces';
  end if;

  insert into app.transactions (tenant_id, money_space_id, account_id, transaction_date, transaction_time, amount, currency, transaction_type, payment_method, description, reference, party_name, tags, approval_status, reconciliation_status, created_by, approved_by, approved_at)
  select p_tenant_id, source_space, id, current_date, localtime(0), p_amount, currency, 'transfer', 'other', p_description, transfer_reference, 'Transfer out', array['internal-transfer'], 'approved', 'unmatched', current_user_id, current_user_id, now()
  from app.accounts where id = p_source_account_id
  returning id into source_txn;

  insert into app.transactions (tenant_id, money_space_id, account_id, transaction_date, transaction_time, amount, currency, transaction_type, payment_method, description, reference, party_name, tags, approval_status, reconciliation_status, created_by, approved_by, approved_at)
  select p_tenant_id, destination_space, id, current_date, localtime(0), p_amount, currency, 'transfer', 'other', p_description, transfer_reference, 'Transfer in', array['internal-transfer'], 'approved', 'unmatched', current_user_id, current_user_id, now()
  from app.accounts where id = p_destination_account_id
  returning id into destination_txn;

  update app.accounts set current_balance = current_balance - p_amount, updated_at = now() where id = p_source_account_id;
  update app.accounts set current_balance = current_balance + p_amount, updated_at = now() where id = p_destination_account_id;

  insert into app.transfer_links (id, tenant_id, source_transaction_id, destination_transaction_id, source_account_id, destination_account_id, amount)
  values (transfer_id, p_tenant_id, source_txn, destination_txn, p_source_account_id, p_destination_account_id, p_amount);

  insert into app.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, new_value)
  values (p_tenant_id, current_user_id, 'created transfer', 'transfer', transfer_id, jsonb_build_object('amount', p_amount, 'reference', transfer_reference));

  return transfer_id;
end;
$$;

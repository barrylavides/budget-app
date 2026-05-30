-- Seed: May 2026 test data
-- This seed runs after migrations and inserts a household, month, sources, expenses, and payments.

-- ─── DEV AUTH (local only) ────────────────────────────────────────────
-- Every table is RLS-gated through user_household_ids() = the households the
-- current auth.uid() belongs to. Real auth (Google OAuth) lands in issue #11;
-- until then, tickets #3–#10 need an authenticated session locally or RLS
-- returns nothing. We seed a confirmed dev user + identity + membership so the
-- app (via src/lib/devAuth.ts, DEV-only) can sign in and actually see data.
-- NOTE: the empty-string token columns are required — GoTrue fails sign-in
-- ("Database error querying schema") if they are NULL. Remove this block when
-- issue #11 replaces it with real OAuth.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'dev@familybudget.local',
  crypt('devpass123456', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}', false, false,
  '', '', '', '', '', '', '', ''
)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(),
  'a0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub','a0000000-0000-0000-0000-000000000001','email','dev@familybudget.local','email_verified',true),
  'email', 'a0000000-0000-0000-0000-000000000001', now(), now(), now()
)
on conflict do nothing;

-- Create a test household
insert into households (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Barry & Wife')
on conflict (id) do nothing;

-- Link the dev user to the household so user_household_ids() resolves
insert into household_members (household_id, user_id, display_name, role)
values ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Dev User', 'owner')
on conflict (household_id, user_id) do nothing;

-- Create May 2026 month
insert into months (id, household_id, year, month_num, half1_salary_date, half2_salary_date, label)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  2026, 5, '2026-05-25', '2026-05-30',
  'May 2026'
)
on conflict (household_id, year, month_num) do nothing;

-- 5 sources
insert into sources (id, month_id, name, type, account_label, half, balance) values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'Wife Payroll',    'salary',              'BDO',   'half1', 40000),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'Barry Payroll',   'salary',              'BPI',   'half1', 35000),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000010', 'Wife 2nd Salary', 'salary',              'BDO',   'half2', 40000),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000010', 'Barry 2nd',       'salary',              'BPI',   'half2', 35000),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000010', 'Savings Fund',    'savings_withdrawal',  'CIMB',  'both',  10000)
on conflict (id) do nothing;

-- 12 expenses
insert into expenses (id, month_id, name, category, half, amount, source_id, tag) values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', 'Electric Bill',    'Utilities', 'half1', 3500,  '00000000-0000-0000-0000-000000000020', 'needs'),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000010', 'Internet',         'Utilities', 'half1', 1500,  '00000000-0000-0000-0000-000000000020', 'needs'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000010', 'Groceries',        'Food',      'half1', 8000,  '00000000-0000-0000-0000-000000000021', 'needs'),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000010', 'School Fees',      'Education', 'half1', 12000, '00000000-0000-0000-0000-000000000020', 'needs'),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000010', 'Water Bill',       'Utilities', 'half1', 800,   '00000000-0000-0000-0000-000000000021', 'needs'),
  ('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000010', 'Netflix',          'Bills',     'half1', 599,   '00000000-0000-0000-0000-000000000020', 'wants'),
  ('00000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000010', 'Rent',             'Home',      'half2', 20000, '00000000-0000-0000-0000-000000000022', 'needs'),
  ('00000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000010', 'Dining Out',       'Food',      'half2', 3000,  '00000000-0000-0000-0000-000000000023', 'wants'),
  ('00000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000010', 'Emergency Fund',   'Bills',     'half2', 5000,  '00000000-0000-0000-0000-000000000024', 'savings'),
  ('00000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000010', 'Gym Membership',   'Health',    'half2', 1500,  '00000000-0000-0000-0000-000000000023', 'wants'),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000010', 'Vitamins',         'Health',    'half2', 1200,  '00000000-0000-0000-0000-000000000022', 'needs'),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000010', 'Travel Fund',      'Travel',    'half2', 4000,  '00000000-0000-0000-0000-000000000024', 'savings')
on conflict (id) do nothing;

-- Recurring expense templates
insert into recurring_expense_templates (id, household_id, name, category, half, default_amount, default_source_name, tag, cadence, active, start_year_month) values
  -- Monthly active template (generates every month from Jan 2026)
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000001', 'Internet Bill', 'Utilities', 'half1', 1500, 'Wife Payroll', 'needs', 'monthly', true, 202601),
  -- Quarterly active template (generates on months 1, 4, 7, 10)
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000001', 'Quarterly Tax', 'Bills', 'half2', 2000, null, 'needs', 'quarterly', true, 202601),
  -- Yearly active template (generates on January each year)
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000001', 'Annual Insurance', 'Bills', 'half1', 5000, 'Barry Payroll', 'needs', 'yearly', true, 202601),
  -- Inactive template (should be skipped during generation)
  ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000001', 'Inactive Service', 'Bills', 'half1', 500, null, 'needs', 'monthly', false, 202601),
  -- Future start_year_month (should not generate for months before 202801)
  ('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000001', 'Future Service', 'Bills', 'half1', 750, null, 'needs', 'monthly', true, 202801)
on conflict (id) do nothing;

-- Payments for some expenses
insert into payments (id, expense_id, paid_on, amount, source_id, note) values
  -- Electric Bill: partial payment
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000030', '2026-05-02', 2000, '00000000-0000-0000-0000-000000000020', 'First payment'),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000030', '2026-05-10', 1500, '00000000-0000-0000-0000-000000000020', 'Final payment'),
  -- Internet: fully paid
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000031', '2026-05-05', 1500, '00000000-0000-0000-0000-000000000020', null),
  -- Groceries: partial
  ('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000032', '2026-05-08', 5000, '00000000-0000-0000-0000-000000000021', 'Week 1 & 2'),
  -- Rent: fully paid
  ('00000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000036', '2026-05-30', 20000, '00000000-0000-0000-0000-000000000022', null)
on conflict (id) do nothing;

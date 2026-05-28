-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ─── households ───────────────────────────────────────────────────────
create table if not exists households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now()
);

-- ─── household_members ────────────────────────────────────────────────
create table if not exists household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role         text not null default 'member',
  created_at   timestamptz not null default now(),
  created_by   uuid,
  updated_at   timestamptz not null default now(),
  unique (household_id, user_id)
);

-- ─── Helper: returns all household IDs the current user belongs to ───
-- Created after household_members so the function body can reference it
create or replace function user_household_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select household_id
  from household_members
  where user_id = auth.uid()
$$;

-- ─── months ───────────────────────────────────────────────────────────
create table if not exists months (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references households(id) on delete cascade,
  year              int  not null,
  month_num         int  not null check (month_num between 1 and 12),
  half1_salary_date text,
  half2_salary_date text,
  label             text,
  created_at        timestamptz not null default now(),
  created_by        uuid,
  updated_at        timestamptz not null default now(),
  unique (household_id, year, month_num)
);

-- ─── sources ──────────────────────────────────────────────────────────
create table if not exists sources (
  id            uuid primary key default gen_random_uuid(),
  month_id      uuid not null references months(id) on delete cascade,
  name          text not null,
  type          text not null check (type in ('salary', 'debt_collected', 'savings_withdrawal')),
  account_label text,
  half          text not null check (half in ('half1', 'half2', 'both')),
  balance       numeric(14, 2) not null default 0,
  created_at    timestamptz not null default now(),
  created_by    uuid,
  updated_at    timestamptz not null default now()
);

-- ─── expenses ─────────────────────────────────────────────────────────
create table if not exists expenses (
  id         uuid primary key default gen_random_uuid(),
  month_id   uuid not null references months(id) on delete cascade,
  name       text not null,
  category   text not null check (
    category in ('Bills','Food','Utilities','Home','Travel','Health','Education','Other')
  ),
  half       text not null check (half in ('half1', 'half2')),
  amount     numeric(14, 2) not null default 0,
  source_id  uuid references sources(id) on delete set null,
  tag        text check (tag in ('needs','wants','savings','investment','business')),
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now()
);

-- ─── payments ─────────────────────────────────────────────────────────
create table if not exists payments (
  id         uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  paid_on    date not null,
  amount     numeric(14, 2) not null default 0,
  source_id  uuid references sources(id) on delete set null,
  note       text,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now()
);

-- ─── recurring_expense_templates ──────────────────────────────────────
create table if not exists recurring_expense_templates (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references households(id) on delete cascade,
  name                text not null,
  category            text not null check (
    category in ('Bills','Food','Utilities','Home','Travel','Health','Education','Other')
  ),
  half                text not null check (half in ('half1', 'half2')),
  default_amount      numeric(14, 2) not null default 0,
  default_source_name text,
  tag                 text check (tag in ('needs','wants','savings','investment','business')),
  cadence             text not null check (cadence in ('monthly', 'quarterly', 'yearly')) default 'monthly',
  active              boolean not null default true,
  start_year_month    int not null default 202601,
  created_at          timestamptz not null default now(),
  created_by          uuid,
  updated_at          timestamptz not null default now()
);

-- ─── Enable RLS on all tables ─────────────────────────────────────────
alter table households                enable row level security;
alter table household_members         enable row level security;
alter table months                    enable row level security;
alter table sources                   enable row level security;
alter table expenses                  enable row level security;
alter table payments                  enable row level security;
alter table recurring_expense_templates enable row level security;

-- ─── RLS Policies: households ─────────────────────────────────────────
create policy "Household members can view their household"
  on households for select
  using (id in (select user_household_ids()));

create policy "Household members can update their household"
  on households for update
  using (id in (select user_household_ids()));

create policy "Users can create households"
  on households for insert
  with check (true);

-- ─── RLS Policies: household_members ─────────────────────────────────
create policy "Users can view members of their household"
  on household_members for select
  using (household_id in (select user_household_ids()));

create policy "Users can join a household"
  on household_members for insert
  with check (user_id = auth.uid());

-- ─── RLS Policies: months ─────────────────────────────────────────────
create policy "Household members can manage months"
  on months for all
  using (household_id in (select user_household_ids()))
  with check (household_id in (select user_household_ids()));

-- ─── RLS Policies: sources ────────────────────────────────────────────
create policy "Household members can manage sources"
  on sources for all
  using (
    month_id in (
      select id from months where household_id in (select user_household_ids())
    )
  )
  with check (
    month_id in (
      select id from months where household_id in (select user_household_ids())
    )
  );

-- ─── RLS Policies: expenses ───────────────────────────────────────────
create policy "Household members can manage expenses"
  on expenses for all
  using (
    month_id in (
      select id from months where household_id in (select user_household_ids())
    )
  )
  with check (
    month_id in (
      select id from months where household_id in (select user_household_ids())
    )
  );

-- ─── RLS Policies: payments ───────────────────────────────────────────
create policy "Household members can manage payments"
  on payments for all
  using (
    expense_id in (
      select e.id from expenses e
      join months m on m.id = e.month_id
      where m.household_id in (select user_household_ids())
    )
  )
  with check (
    expense_id in (
      select e.id from expenses e
      join months m on m.id = e.month_id
      where m.household_id in (select user_household_ids())
    )
  );

-- ─── RLS Policies: recurring_expense_templates ────────────────────────
create policy "Household members can manage recurring templates"
  on recurring_expense_templates for all
  using (household_id in (select user_household_ids()))
  with check (household_id in (select user_household_ids()));

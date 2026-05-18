-- ============================================================
-- AtomQuest Goal Setting & Tracking Portal — Supabase Schema
-- Run this in your Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- ----------------------------------------------------------------
-- 1. PROFILES  (extends auth.users with role + display name)
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null check (role in ('employee','manager','admin')),
  manager_id  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Everyone can read all profiles (needed for manager selection, employee lists)
create policy "profiles_select_all" on public.profiles
  for select using (true);

-- Each user can update only their own profile
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Service role (signup trigger) can insert
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- ----------------------------------------------------------------
-- 2. GOALS
-- ----------------------------------------------------------------
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references public.profiles(id) on delete cascade,
  employee_name  text not null,
  manager_id     uuid references public.profiles(id),
  title          text not null,
  description    text,
  targets        text,
  thrust_area    text not null default 'Unassigned',
  uom_type       text not null default 'numeric' check (uom_type in ('numeric','percent','timeline','zero')),
  target_value   numeric not null default 0,
  weightage      numeric not null default 10,
  is_locked      boolean not null default false,
  review_status  text not null default 'pending' check (review_status in ('pending','approved','rework')),
  metric_type    text not null default 'min' check (metric_type in ('min','max','timeline','zero')),
  status         text not null default 'not_started' check (status in ('not_started','on_track','completed')),
  quarter        text not null default 'Q1' check (quarter in ('Q1','Q2','Q3','Q4','Annual')),
  shared_from_id uuid references public.goals(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.goals enable row level security;

-- Employees see their own goals
create policy "goals_select_employee" on public.goals
  for select using (auth.uid() = employee_id);

-- Managers see goals belonging to their team
create policy "goals_select_manager" on public.goals
  for select using (auth.uid() = manager_id);

-- Admins see all goals
create policy "goals_select_admin" on public.goals
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Employees can insert their own (unlocked) goals
create policy "goals_insert_employee" on public.goals
  for insert with check (auth.uid() = employee_id and is_locked = false);

-- Employees can update their own unlocked goals
create policy "goals_update_employee" on public.goals
  for update using (auth.uid() = employee_id and is_locked = false);

-- Managers can update goals in their team
create policy "goals_update_manager" on public.goals
  for update using (auth.uid() = manager_id);

-- Admins can update any goal
create policy "goals_update_admin" on public.goals
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Employees can delete their own unlocked goals
create policy "goals_delete_employee" on public.goals
  for delete using (auth.uid() = employee_id and is_locked = false);

-- ----------------------------------------------------------------
-- 3. GOAL CHECK-INS
-- ----------------------------------------------------------------
create table if not exists public.goal_checkins (
  id                  uuid primary key default gen_random_uuid(),
  goal_id             uuid not null references public.goals(id) on delete cascade,
  employee_id         uuid not null references public.profiles(id),
  employee_name       text not null,
  goal_title          text not null,
  planned_target      numeric not null default 0,
  actual_achievement  numeric not null default 0,
  metric_type         text not null default 'min' check (metric_type in ('min','max','timeline','zero')),
  timeline_status     text not null default 'on_time' check (timeline_status in ('on_time','delayed','missed')),
  manager_comment     text not null default '',
  quarter             text not null default 'Q1' check (quarter in ('Q1','Q2','Q3','Q4','Annual')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.goal_checkins enable row level security;

-- Employees see their own check-ins
create policy "checkins_select_employee" on public.goal_checkins
  for select using (auth.uid() = employee_id);

-- Managers see check-ins for their team
create policy "checkins_select_manager" on public.goal_checkins
  for select using (
    exists (
      select 1 from public.goals g
      where g.id = goal_id and g.manager_id = auth.uid()
    )
  );

-- Admins see all check-ins
create policy "checkins_select_admin" on public.goal_checkins
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Employees can insert/update their own check-ins
create policy "checkins_insert_employee" on public.goal_checkins
  for insert with check (auth.uid() = employee_id);

create policy "checkins_update_employee" on public.goal_checkins
  for update using (auth.uid() = employee_id);

-- Managers can update check-ins (to add comments)
create policy "checkins_update_manager" on public.goal_checkins
  for update using (
    exists (
      select 1 from public.goals g
      where g.id = goal_id and g.manager_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- 4. AUDIT LOGS
-- ----------------------------------------------------------------
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  table_name   text not null,
  record_id    text not null,
  action       text not null,
  old_values   jsonb,
  new_values   jsonb,
  changed_by   text,
  changed_by_id uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- Only admins can read audit logs
create policy "audit_logs_select_admin" on public.audit_logs
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Any authenticated user can insert audit log entries
create policy "audit_logs_insert" on public.audit_logs
  for insert with check (auth.uid() is not null);

-- ----------------------------------------------------------------
-- 5. AUTO-UPDATE updated_at triggers
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists goals_updated_at on public.goals;
create trigger goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

drop trigger if exists checkins_updated_at on public.goal_checkins;
create trigger checkins_updated_at
  before update on public.goal_checkins
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- 6. AUTO-CREATE PROFILE on signup (trigger on auth.users)
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_manager_id uuid := null;
  v_role text := 'employee';
begin
  -- Safely parse manager_id
  if new.raw_user_meta_data->>'manager_id' is not null 
     and new.raw_user_meta_data->>'manager_id' != '' 
     and new.raw_user_meta_data->>'manager_id' != 'null' then
    v_manager_id := (new.raw_user_meta_data->>'manager_id')::uuid;
  end if;

  -- Safely parse role
  if new.raw_user_meta_data->>'role' is not null and new.raw_user_meta_data->>'role' != '' then
    v_role := new.raw_user_meta_data->>'role';
  end if;

  insert into public.profiles (id, name, email, role, manager_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    v_role,
    v_manager_id
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------
-- 7. DEMO SEED DATA
-- Run AFTER creating the 3 users via Supabase Auth UI or API.
-- Replace the UUIDs below with the actual auth.users IDs.
--
-- Demo accounts (create in Supabase Auth > Users):
--   admin@atomquest.com      / Admin@123      (role: admin)
--   manager@atomquest.com    / Manager@123    (role: manager)
--   employee@atomquest.com   / Employee@123   (role: employee)
--
-- After creating them, the trigger above auto-creates profiles.
-- Then set the correct role via:
--
--   UPDATE public.profiles SET role = 'admin'
--   WHERE email = 'admin@atomquest.com';
--
--   UPDATE public.profiles SET role = 'manager'
--   WHERE email = 'manager@atomquest.com';
--
--   UPDATE public.profiles
--   SET role = 'employee',
--       manager_id = (SELECT id FROM public.profiles WHERE email = 'manager@atomquest.com')
--   WHERE email = 'employee@atomquest.com';
-- ----------------------------------------------------------------

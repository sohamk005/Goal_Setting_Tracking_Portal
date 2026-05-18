-- Disable Row-Level Security on all tables so anyone can read/write without Auth
alter table public.goals disable row level security;
alter table public.goal_checkins disable row level security;
alter table public.audit_logs disable row level security;
alter table public.profiles disable row level security;

-- Drop the foreign key constraint that requires a matching row in auth.users
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- Insert fixed mock profiles to satisfy foreign keys
insert into public.profiles (id, name, email, role, manager_id)
values 
  ('11111111-1111-1111-1111-111111111111', 'Admin', 'admin@atomquest.com', 'admin', null),
  ('22222222-2222-2222-2222-222222222222', 'Manager', 'manager@atomquest.com', 'manager', null),
  ('33333333-3333-3333-3333-333333333333', 'Employee', 'employee@atomquest.com', 'employee', '22222222-2222-2222-2222-222222222222')
on conflict (id) do update set
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  manager_id = EXCLUDED.manager_id;

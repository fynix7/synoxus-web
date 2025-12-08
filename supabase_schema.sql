-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- CRM Columns
create table crm_columns (
  id uuid default uuid_generate_v4() primary key,
  title text not null unique,
  position integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CRM Tasks
create table crm_tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text references crm_columns(title) on delete cascade,
  priority text,
  due_date timestamp with time zone,
  metadata jsonb default '{}'::jsonb,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CRM Users
create table crm_users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat Configuration (New)
create table chat_config (
  id uuid default uuid_generate_v4() primary key,
  key text not null unique, -- 'personas', 'universal_knowledge', 'qualifier_method'
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Default Columns
insert into crm_columns (title, position) values
  ('To Do', 0),
  ('In Progress', 1),
  ('Done', 2)
on conflict (title) do nothing;

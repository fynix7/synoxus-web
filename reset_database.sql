-- DANGER: This script drops existing tables and data to reset the schema.
-- Run this only if you are sure you want to clear the database.

-- Drop tables if they exist (cascade deletes dependent objects like policies)
drop table if exists public.os_blueprints cascade;
drop table if exists public.os_outliers cascade;
drop table if exists public.os_channels cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create os_channels table
create table public.os_channels (
    id uuid default uuid_generate_v4() primary key,
    url text unique not null,
    name text,
    last_scouted timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Create os_outliers table
create table public.os_outliers (
    video_id text primary key,
    title text,
    views bigint,
    outlier_score numeric,
    thumbnail text,
    channel_id uuid references public.os_channels(id),
    published_at timestamp with time zone,
    scouted_at timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Create os_blueprints table (Updated to support grouped patterns)
create table public.os_blueprints (
    id uuid default uuid_generate_v4() primary key,
    pattern text,
    archetype text,
    generated_example text,
    count integer default 1,
    median_score numeric,
    median_views bigint,
    examples jsonb,
    created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.os_channels enable row level security;
alter table public.os_outliers enable row level security;
alter table public.os_blueprints enable row level security;

-- Create Policies (Allow public access for this tool)
create policy "Allow public read os_channels" on public.os_channels for select using (true);
create policy "Allow public insert os_channels" on public.os_channels for insert with check (true);
create policy "Allow public update os_channels" on public.os_channels for update using (true);

create policy "Allow public read os_outliers" on public.os_outliers for select using (true);
create policy "Allow public insert os_outliers" on public.os_outliers for insert with check (true);
create policy "Allow public update os_outliers" on public.os_outliers for update using (true);
create policy "Allow public delete os_outliers" on public.os_outliers for delete using (true);

create policy "Allow public read os_blueprints" on public.os_blueprints for select using (true);
create policy "Allow public insert os_blueprints" on public.os_blueprints for insert with check (true);
create policy "Allow public update os_blueprints" on public.os_blueprints for update using (true);

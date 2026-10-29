-- Shared site content for the public DE CONNECTORS pages.
-- Reads of published rows are public. Writes go through signed-in roles.

create table if not exists profiles (
  user_id text primary key,
  email text not null default '',
  name text not null default '',
  role text not null default 'author' check (role in ('admin', 'editor', 'author')),
  created_at timestamptz not null default now()
);

create table if not exists page_settings (
  id integer primary key check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id serial primary key,
  title text not null,
  img text not null default '',
  media text not null default '',
  kind text not null default 'image' check (kind in ('image', 'video')),
  body text not null default '',
  sort_order integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists clients (
  id serial primary key,
  href text not null default '',
  img text not null default '',
  alt text not null default '',
  sort_order integer not null default 0,
  published boolean not null default true
);

create table if not exists posts (
  id serial primary key,
  slug text not null unique,
  title text not null,
  month text not null default '',
  day text not null default '',
  year text not null default '',
  excerpt text not null default '',
  image text not null default '',
  html text not null default '',
  published boolean not null default true,
  author_id text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists media_files (
  id serial primary key,
  filename text not null default '',
  mime text not null,
  data text not null,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists cms_flags (
  key text primary key,
  value text not null
);

create index if not exists posts_author_idx on posts (author_id);
create index if not exists projects_sort_idx on projects (sort_order, id);

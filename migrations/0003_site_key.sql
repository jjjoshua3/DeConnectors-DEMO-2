-- Unique site isolation for multiple demos on the same Supabase project.
-- Set SITE_KEY env var (demo1 / demo2) so each deployment only sees its own rows.

alter table if exists posts add column if not exists site text not null default 'demo1';
alter table if exists projects add column if not exists site text not null default 'demo1';
alter table if exists clients add column if not exists site text not null default 'demo1';
alter table if exists page_settings add column if not exists site text not null default 'demo1';

create index if not exists posts_site_idx on posts (site);
create index if not exists projects_site_idx on projects (site);
create index if not exists clients_site_idx on clients (site);

-- Drop the single-row check on page_settings so each site can have its own row.
alter table page_settings drop constraint if exists page_settings_id_check;
alter table page_settings drop constraint if exists page_settings_pkey;
alter table page_settings add primary key (id, site);

-- Make slug unique per site instead of globally.
alter table posts drop constraint if exists posts_slug_key;
create unique index if not exists posts_site_slug_idx on posts (site, slug);

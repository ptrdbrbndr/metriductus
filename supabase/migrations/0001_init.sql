create table if not exists domains (
  zone_name        text primary key,
  cf_zone_id       text,
  label            text not null,
  is_business      boolean not null default true,
  conversion_paths text[] not null default '{}',
  created_at       timestamptz not null default now()
);
create table if not exists daily_traffic (
  zone_name  text not null references domains(zone_name),
  day        date not null,
  requests   bigint not null default 0,
  page_views bigint not null default 0,
  uniques    bigint not null default 0,
  bytes      bigint not null default 0,
  threats    bigint not null default 0,
  primary key (zone_name, day)
);
create table if not exists daily_country (
  zone_name text not null references domains(zone_name),
  day       date not null,
  country   text not null,
  requests  bigint not null default 0,
  primary key (zone_name, day, country)
);
create table if not exists daily_path (
  zone_name     text not null references domains(zone_name),
  day           date not null,
  path          text not null,
  page_views    bigint not null default 0,
  is_conversion boolean not null default false,
  primary key (zone_name, day, path)
);

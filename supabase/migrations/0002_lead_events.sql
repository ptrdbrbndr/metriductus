create table if not exists lead_events (
  id            bigserial primary key,
  zone_name     text not null,
  ts            timestamptz not null default now(),
  day           date not null default ((now() at time zone 'utc')::date),
  path          text not null,
  event_type    text not null check (event_type in ('pageview', 'lead')),
  referrer_host text
);
create index if not exists lead_events_zone_day on lead_events (zone_name, day);
create index if not exists lead_events_type on lead_events (zone_name, event_type, day);

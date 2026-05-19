create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  hour int not null,
  day_of_week int not null default 0,
  temperature numeric not null,
  rain int not null default 0,
  holiday int not null default 0,
  junction int not null default 1,
  vehicles int not null,
  nearby_events int not null default 0,
  prediction text not null,
  confidence numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.predictions enable row level security;

create policy "public read predictions" on public.predictions for select using (true);
create policy "public insert predictions" on public.predictions for insert with check (true);

create index predictions_created_at_idx on public.predictions (created_at desc);
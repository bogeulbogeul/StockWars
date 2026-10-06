create table if not exists public.stockwars_player_state (
  id text primary key,
  payload jsonb not null
);
alter table public.stockwars_player_state enable row level security;
revoke all on public.stockwars_player_state from anon, authenticated;
grant select, insert, update on public.stockwars_player_state to service_role;
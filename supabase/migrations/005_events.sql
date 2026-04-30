-- ============================================================
-- 005_events.sql : 캘린더(방송 일정 / 기념일) 테이블
-- Supabase SQL Editor에서 실행해주세요.
-- ============================================================

create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('broadcast', 'anniversary')),
  title text not null,
  description text,
  -- 시작 시각: timestamptz (anniversary는 시각 무시, 날짜만 사용)
  starts_at timestamptz not null,
  -- 종료 시각: broadcast에서만 의미. nullable
  ends_at timestamptz,
  -- 종일 일정 여부 (anniversary는 항상 true)
  all_day boolean not null default false,
  -- 매년 반복 (생일/주년용). true면 starts_at의 월/일만 의미.
  recurring_yearly boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_starts_at_idx on events (starts_at);
create index if not exists events_type_idx on events (type);

-- updated_at 자동 갱신
create or replace function set_events_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists events_set_updated_at on events;
create trigger events_set_updated_at
  before update on events
  for each row execute function set_events_updated_at();

alter table events enable row level security;

-- 조회: 누구나
drop policy if exists "events_select_all" on events;
create policy "events_select_all" on events
  for select using (true);

-- 작성: 스트리머/관리자만
drop policy if exists "events_insert_streamer" on events;
create policy "events_insert_streamer" on events
  for insert with check (
    auth.uid() = created_by
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('streamer', 'admin')
    )
  );

-- 수정: 스트리머/관리자만
drop policy if exists "events_update_streamer" on events;
create policy "events_update_streamer" on events
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('streamer', 'admin')
    )
  );

-- 삭제: 스트리머/관리자만
drop policy if exists "events_delete_streamer" on events;
create policy "events_delete_streamer" on events
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('streamer', 'admin')
    )
  );

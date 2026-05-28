-- ============================================================
-- 009_roulette_live_url.sql : 고정 OBS URL ("선택한 룰렛 = 그 URL")
--
-- - profiles.channel_slug : 스트리머별 안정적인 URL 슬러그 (unique)
--     /overlay/live/{channel_slug} 가 항상 동일하게 사용됨.
-- - profiles.active_roulette_wheel_id : 그 URL이 지금 보여줄 룰렛.
--     관리 페이지에서 "OBS에 표시"로 지정.
--
-- 기존 /overlay/{wheel-slug} 는 그대로 유지 (호환).
--
-- Supabase SQL Editor에서 실행해주세요.
-- ============================================================

alter table profiles
  add column if not exists channel_slug text;

-- 슬러그 포맷: 룰렛 slug와 동일 규칙
alter table profiles
  drop constraint if exists profiles_channel_slug_format;
alter table profiles
  add constraint profiles_channel_slug_format
  check (
    channel_slug is null
    or (
      char_length(channel_slug) between 1 and 40
      and channel_slug ~ '^[a-z0-9_-]+$'
    )
  );

-- nullable + unique: 빈 값은 여러 행에서 허용, 값이 있을 때만 충돌 검사
create unique index if not exists profiles_channel_slug_key
  on profiles(channel_slug)
  where channel_slug is not null;

alter table profiles
  add column if not exists active_roulette_wheel_id uuid
  references roulette_wheels(id) on delete set null;

-- /overlay/live 페이지가 active 변경을 Realtime으로 감지해야 함.
-- profiles는 select_all RLS여서 publish 안전.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table profiles;
  end if;
end$$;

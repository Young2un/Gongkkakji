-- ============================================================
-- 003_points.sql : 출석체크 & 포인트 시스템
-- 002_rls.sql 실행 후 이 파일을 SQL Editor에 복붙 → Run
-- ============================================================

-- ===========================
-- user_points (유저별 현재 포인트)
-- ===========================
create table if not exists user_points (
  user_id uuid references profiles(id) on delete cascade primary key,
  points int not null default 0,
  updated_at timestamptz not null default now()
);

-- ===========================
-- attendance (일자별 출석 기록)
-- ===========================
create table if not exists attendance (
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

create index if not exists attendance_date_idx on attendance(date desc);

-- ===========================
-- point_logs (포인트 획득/차감 로그)
-- ===========================
create table if not exists point_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists point_logs_user_idx on point_logs(user_id, created_at desc);

-- ============================================================
-- RLS 활성화
-- ============================================================
alter table user_points enable row level security;
alter table attendance enable row level security;
alter table point_logs enable row level security;

-- 본인만 read. INSERT/UPDATE/DELETE는 admin만 (일반 유저는 RPC/트리거 경유)
drop policy if exists "user_points_select_own" on user_points;
create policy "user_points_select_own" on user_points
  for select using (auth.uid() = user_id);

drop policy if exists "user_points_admin_write" on user_points;
create policy "user_points_admin_write" on user_points
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "attendance_select_own" on attendance;
create policy "attendance_select_own" on attendance
  for select using (auth.uid() = user_id);

drop policy if exists "attendance_admin_write" on attendance;
create policy "attendance_admin_write" on attendance
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "point_logs_select_own" on point_logs;
create policy "point_logs_select_own" on point_logs
  for select using (auth.uid() = user_id);

drop policy if exists "point_logs_admin_write" on point_logs;
create policy "point_logs_admin_write" on point_logs
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- 포인트 지급 헬퍼 (SECURITY DEFINER 로 RLS 우회)
-- ============================================================
create or replace function award_points(
  p_user_id uuid,
  p_delta int,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into point_logs (user_id, delta, reason)
  values (p_user_id, p_delta, p_reason);

  insert into user_points (user_id, points, updated_at)
  values (p_user_id, p_delta, now())
  on conflict (user_id)
  do update set
    points = user_points.points + excluded.points,
    updated_at = now();
end;
$$;

-- 익명 유저에게는 실행 권한 없음 (트리거/RPC를 통해서만 호출)
revoke all on function award_points(uuid, int, text) from public;
revoke all on function award_points(uuid, int, text) from anon, authenticated;

-- ============================================================
-- 출석 체크 RPC (하루 한 번만 +10P)
-- ============================================================
create or replace function claim_attendance()
returns table (
  already_attended boolean,
  points_earned int,
  total_points int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_existed boolean;
  v_total int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- 오늘 이미 출석했는지 확인 후 insert
  insert into attendance (user_id, date)
  values (v_uid, v_today)
  on conflict (user_id, date) do nothing;

  get diagnostics v_existed = row_count;

  if v_existed::int = 0 then
    -- 이미 출석
    select points into v_total from user_points where user_id = v_uid;
    return query select true, 0, coalesce(v_total, 0);
  else
    perform award_points(v_uid, 10, '출석 체크');
    select points into v_total from user_points where user_id = v_uid;
    return query select false, 10, coalesce(v_total, 0);
  end if;
end;
$$;

grant execute on function claim_attendance() to authenticated;

-- ============================================================
-- 게시글/댓글 작성 시 자동 포인트 트리거
-- ============================================================
create or replace function award_on_post_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform award_points(new.author_id, 5, '게시글 작성');
  return new;
end;
$$;

drop trigger if exists posts_award_points on posts;
create trigger posts_award_points
  after insert on posts
  for each row execute function award_on_post_insert();

create or replace function award_on_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform award_points(new.author_id, 1, '댓글 작성');
  return new;
end;
$$;

drop trigger if exists comments_award_points on comments;
create trigger comments_award_points
  after insert on comments
  for each row execute function award_on_comment_insert();

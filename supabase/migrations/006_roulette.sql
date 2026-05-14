-- ============================================================
-- 006_roulette.sql : 방송 연동 룰렛 (시참룰렛, 토킹룰렛 등)
--
-- - roulette_wheels : 룰렛 본체 (스트리머가 여러 개 만들 수 있음)
-- - roulette_items  : 각 룰렛의 슬라이스 항목
-- - roulette_spins  : "돌리기" 이벤트. overlay 페이지가 Realtime으로 구독
--
-- Supabase SQL Editor에서 전체 복붙 → Run.
-- ============================================================

-- ===========================
-- roulette_wheels
-- ===========================
create table if not exists roulette_wheels (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  -- URL/오버레이 URL에 박힐 짧은 이름. owner 안에서만 unique.
  slug text not null,
  title text not null,
  -- v2 자동 트리거용. 후원 금액이 이 값 이상이면 자동 spin.
  donation_threshold int,
  -- 회전 애니메이션 길이 (ms)
  spin_duration_ms int not null default 5000,
  -- 결과 표시 후 자동 숨김까지 대기 (ms). null이면 수동 닫기.
  show_result_ms int not null default 4000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug),
  check (char_length(slug) between 1 and 40),
  check (slug ~ '^[a-z0-9_-]+$')
);

create index if not exists roulette_wheels_owner_idx on roulette_wheels(owner_id);

-- ===========================
-- roulette_items
-- ===========================
create table if not exists roulette_items (
  id uuid default gen_random_uuid() primary key,
  wheel_id uuid references roulette_wheels(id) on delete cascade not null,
  label text not null,
  color text,                       -- "#RRGGBB" (null이면 클라이언트에서 팔레트 순환)
  position int not null default 0,  -- 표시 순서
  created_at timestamptz not null default now(),
  check (char_length(label) between 1 and 60)
);

create index if not exists roulette_items_wheel_idx
  on roulette_items(wheel_id, position);

-- ===========================
-- roulette_spins
-- "돌리기" 이벤트. 클라(컨트롤 페이지)가 insert 하면
-- overlay 페이지가 Realtime으로 받아 애니메이션 재생.
-- ===========================
create table if not exists roulette_spins (
  id uuid default gen_random_uuid() primary key,
  wheel_id uuid references roulette_wheels(id) on delete cascade not null,
  -- 결과 항목. 컨트롤 페이지에서 가중치 없이 균등 랜덤으로 결정한 뒤 insert.
  result_item_id uuid references roulette_items(id) on delete set null,
  triggered_by text not null default 'manual'
    check (triggered_by in ('manual', 'donation')),
  donor_name text,
  donor_amount int,
  status text not null default 'spinning'
    check (status in ('spinning', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists roulette_spins_wheel_idx
  on roulette_spins(wheel_id, created_at desc);

-- ===========================
-- Trigger: updated_at 자동 갱신
-- ===========================
create or replace function set_roulette_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists roulette_wheels_set_updated_at on roulette_wheels;
create trigger roulette_wheels_set_updated_at
  before update on roulette_wheels
  for each row execute function set_roulette_updated_at();

-- ============================================================
-- Realtime publication
-- overlay 페이지가 spins 변화를 구독해야 함.
-- ============================================================
alter publication supabase_realtime add table roulette_spins;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table roulette_wheels enable row level security;
alter table roulette_items enable row level security;
alter table roulette_spins enable row level security;

-- ---------- roulette_wheels ----------
-- 조회: 누구나 (overlay 페이지가 비로그인으로 접근하므로)
drop policy if exists "roulette_wheels_select_all" on roulette_wheels;
create policy "roulette_wheels_select_all" on roulette_wheels
  for select using (true);

-- 생성: 본인 owner 한정, 스트리머/관리자만
drop policy if exists "roulette_wheels_insert_own" on roulette_wheels;
create policy "roulette_wheels_insert_own" on roulette_wheels
  for insert with check (
    auth.uid() = owner_id
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('streamer', 'admin')
    )
  );

drop policy if exists "roulette_wheels_update_own" on roulette_wheels;
create policy "roulette_wheels_update_own" on roulette_wheels
  for update using (auth.uid() = owner_id);

drop policy if exists "roulette_wheels_delete_own" on roulette_wheels;
create policy "roulette_wheels_delete_own" on roulette_wheels
  for delete using (auth.uid() = owner_id);

-- ---------- roulette_items ----------
-- 조회: 누구나
drop policy if exists "roulette_items_select_all" on roulette_items;
create policy "roulette_items_select_all" on roulette_items
  for select using (true);

-- 생성/수정/삭제: 해당 wheel owner만
drop policy if exists "roulette_items_write_own" on roulette_items;
create policy "roulette_items_write_own" on roulette_items
  for all using (
    exists (
      select 1 from roulette_wheels w
      where w.id = roulette_items.wheel_id
        and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from roulette_wheels w
      where w.id = roulette_items.wheel_id
        and w.owner_id = auth.uid()
    )
  );

-- ---------- roulette_spins ----------
-- 조회: 누구나 (overlay가 Realtime 구독해야 함)
drop policy if exists "roulette_spins_select_all" on roulette_spins;
create policy "roulette_spins_select_all" on roulette_spins
  for select using (true);

-- insert/update: 해당 wheel owner만 (컨트롤 페이지에서 본인이 돌림)
drop policy if exists "roulette_spins_insert_own" on roulette_spins;
create policy "roulette_spins_insert_own" on roulette_spins
  for insert with check (
    exists (
      select 1 from roulette_wheels w
      where w.id = roulette_spins.wheel_id
        and w.owner_id = auth.uid()
    )
  );

drop policy if exists "roulette_spins_update_own" on roulette_spins;
create policy "roulette_spins_update_own" on roulette_spins
  for update using (
    exists (
      select 1 from roulette_wheels w
      where w.id = roulette_spins.wheel_id
        and w.owner_id = auth.uid()
    )
  );

drop policy if exists "roulette_spins_delete_own" on roulette_spins;
create policy "roulette_spins_delete_own" on roulette_spins
  for delete using (
    exists (
      select 1 from roulette_wheels w
      where w.id = roulette_spins.wheel_id
        and w.owner_id = auth.uid()
    )
  );

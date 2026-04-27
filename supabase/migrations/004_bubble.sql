-- ============================================================
-- 004_bubble.sql : 버블(프라이빗 메신저) 기능 테이블
-- Supabase SQL Editor에서 실행해주세요.
-- ============================================================

create table if not exists bubble_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  user_name text not null,
  user_avatar text,
  user_role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table bubble_messages enable row level security;

-- 1. 누구나 자신의 메시지를 볼 수 있음
create policy "Users can view their own messages"
  on bubble_messages for select
  using (auth.uid() = user_id);

-- 2. 누구나 스트리머/관리자의 메시지를 볼 수 있음
create policy "Users can view streamer messages"
  on bubble_messages for select
  using (user_role in ('streamer', 'admin'));

-- 3. 스트리머/관리자는 모든 팬들의 메시지를 볼 수 있음
create policy "Streamers can view all messages"
  on bubble_messages for select
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role in ('streamer', 'admin')
    )
  );

-- 4. 로그인한 사용자는 메시지를 작성할 수 있음
create policy "Users can insert their own messages"
  on bubble_messages for insert
  with check (auth.uid() = user_id);

-- Realtime 활성화 (새 메시지가 올 때 화면 새로고침 없이 바로 뜨도록)
alter publication supabase_realtime add table bubble_messages;

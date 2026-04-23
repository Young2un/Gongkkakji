-- ============================================================
-- 002_rls.sql : Row Level Security 정책
-- 001_init.sql 실행 후 이 파일을 SQL Editor에 복붙 → Run
-- ============================================================

-- RLS 활성화
alter table profiles enable row level security;
alter table chzzk_tokens enable row level security;
alter table categories enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table stories enable row level security;
alter table story_views enable row level security;
alter table highlights enable row level security;

-- ===========================
-- profiles
-- ===========================
drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all" on profiles
  for select using (true);

drop policy if exists "profiles_update_self" on profiles;
create policy "profiles_update_self" on profiles
  for update using (auth.uid() = id);

-- ===========================
-- chzzk_tokens (본인만)
-- ===========================
drop policy if exists "chzzk_tokens_own" on chzzk_tokens;
create policy "chzzk_tokens_own" on chzzk_tokens
  for all using (auth.uid() = user_id);

-- ===========================
-- categories (읽기 공개)
-- ===========================
drop policy if exists "categories_select_all" on categories;
create policy "categories_select_all" on categories
  for select using (true);

-- ===========================
-- posts
-- ===========================
drop policy if exists "posts_select_all" on posts;
create policy "posts_select_all" on posts
  for select using (true);

-- 글쓰기: 로그인 유저만, streamer_only 카테고리는 스트리머만
drop policy if exists "posts_insert" on posts;
create policy "posts_insert" on posts
  for insert with check (
    auth.uid() = author_id
    and (
      -- 일반 게시판
      not exists (
        select 1 from categories c
        where c.id = posts.category_id and c.streamer_only = true
      )
      or
      -- 스트리머 전용 게시판: role = 'streamer' 확인
      exists (
        select 1 from profiles p
        where p.id = auth.uid() and p.role in ('streamer', 'admin')
      )
    )
  );

drop policy if exists "posts_update_own" on posts;
create policy "posts_update_own" on posts
  for update using (auth.uid() = author_id);

drop policy if exists "posts_delete_own" on posts;
create policy "posts_delete_own" on posts
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ===========================
-- comments
-- ===========================
drop policy if exists "comments_select_all" on comments;
create policy "comments_select_all" on comments
  for select using (true);

drop policy if exists "comments_insert" on comments;
create policy "comments_insert" on comments
  for insert with check (auth.uid() = author_id);

drop policy if exists "comments_update_own" on comments;
create policy "comments_update_own" on comments
  for update using (auth.uid() = author_id);

drop policy if exists "comments_delete_own" on comments;
create policy "comments_delete_own" on comments
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ===========================
-- likes
-- ===========================
drop policy if exists "likes_select_all" on likes;
create policy "likes_select_all" on likes
  for select using (true);

drop policy if exists "likes_own" on likes;
create policy "likes_own" on likes
  for all using (auth.uid() = user_id);

-- ===========================
-- stories
-- ===========================
-- 조회: 만료 전 OR 아카이브된 것 OR 본인 스토리
drop policy if exists "stories_select" on stories;
create policy "stories_select" on stories
  for select using (
    (expires_at > now() and is_archived = false)
    or is_archived = true
    or auth.uid() = author_id
  );

drop policy if exists "stories_insert" on stories;
create policy "stories_insert" on stories
  for insert with check (auth.uid() = author_id);

drop policy if exists "stories_update_own" on stories;
create policy "stories_update_own" on stories
  for update using (auth.uid() = author_id);

drop policy if exists "stories_delete_own" on stories;
create policy "stories_delete_own" on stories
  for delete using (auth.uid() = author_id);

-- ===========================
-- story_views
-- ===========================
drop policy if exists "story_views_insert_self" on story_views;
create policy "story_views_insert_self" on story_views
  for insert with check (auth.uid() = viewer_id);

-- 조회: 본인이 본 기록 + 스토리 주인은 자기 스토리 조회자 볼 수 있음
drop policy if exists "story_views_select" on story_views;
create policy "story_views_select" on story_views
  for select using (
    auth.uid() = viewer_id
    or exists (
      select 1 from stories s
      where s.id = story_views.story_id and s.author_id = auth.uid()
    )
  );

-- ===========================
-- highlights (스트리머만 만들 수 있음)
-- ===========================
drop policy if exists "highlights_select_all" on highlights;
create policy "highlights_select_all" on highlights
  for select using (true);

drop policy if exists "highlights_own" on highlights;
create policy "highlights_own" on highlights
  for all using (auth.uid() = owner_id);

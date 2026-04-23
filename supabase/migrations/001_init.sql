-- ============================================================
-- 001_init.sql : 테이블 생성
-- Supabase SQL Editor에서 전체 복붙 후 Run
-- ============================================================

-- ===========================
-- profiles (유저 프로필)
-- ===========================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null,
  display_name text,
  avatar_url text,
  bio text,
  role text not null default 'fan' check (role in ('streamer', 'fan', 'admin')),
  chzzk_channel_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on profiles(role);
create index if not exists profiles_chzzk_idx on profiles(chzzk_channel_id);

-- ===========================
-- chzzk_tokens (치지직 OAuth 토큰 저장)
-- ===========================
create table if not exists chzzk_tokens (
  user_id uuid references profiles(id) on delete cascade primary key,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- ===========================
-- categories (게시판)
-- ===========================
create table if not exists categories (
  id serial primary key,
  slug text unique not null,
  name text not null,
  description text,
  streamer_only boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 기본 카테고리 3종 시드
insert into categories (slug, name, description, streamer_only, sort_order) values
  ('notice', '공지', '스트리머 공지사항', true, 1),
  ('free', '자유', '팬 자유게시판', false, 2),
  ('clips', '클립', '오버워치 플레이 클립 공유', false, 3)
on conflict (slug) do nothing;

-- ===========================
-- posts (게시글)
-- ===========================
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  category_id int references categories(id) not null,
  author_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  media_urls text[] not null default '{}',
  view_count int not null default 0,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_category_idx on posts(category_id, created_at desc);
create index if not exists posts_author_idx on posts(author_id, created_at desc);

-- ===========================
-- comments (댓글, 대댓글)
-- ===========================
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on comments(post_id, created_at);

-- ===========================
-- likes (좋아요, post/comment 통합)
-- ===========================
create table if not exists likes (
  user_id uuid references profiles(id) on delete cascade not null,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create index if not exists likes_target_idx on likes(target_type, target_id);

-- ===========================
-- highlights (스트리머 스토리 보관함)
-- ===========================
create table if not exists highlights (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  cover_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists highlights_owner_idx on highlights(owner_id);

-- ===========================
-- stories (스토리)
-- ===========================
create table if not exists stories (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles(id) on delete cascade not null,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  caption text,
  expires_at timestamptz not null,
  is_archived boolean not null default false,
  highlight_id uuid references highlights(id) on delete set null,
  view_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists stories_author_idx on stories(author_id, created_at desc);
create index if not exists stories_active_idx on stories(expires_at) where is_archived = false;

-- ===========================
-- story_views (스토리 조회 기록)
-- ===========================
create table if not exists story_views (
  story_id uuid references stories(id) on delete cascade not null,
  viewer_id uuid references profiles(id) on delete cascade not null,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

-- ===========================
-- View: active_stories (피드에 보이는 스토리만)
-- ===========================
create or replace view active_stories as
select * from stories
where expires_at > now() and is_archived = false;

-- ===========================
-- Trigger: updated_at 자동 갱신
-- ===========================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated on profiles;
create trigger profiles_updated before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists posts_updated on posts;
create trigger posts_updated before update on posts
  for each row execute function set_updated_at();

drop trigger if exists chzzk_tokens_updated on chzzk_tokens;
create trigger chzzk_tokens_updated before update on chzzk_tokens
  for each row execute function set_updated_at();

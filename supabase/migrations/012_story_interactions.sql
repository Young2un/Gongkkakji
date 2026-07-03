-- ============================================================
-- 012_story_interactions.sql
--
-- 스토리 답장(DM형) + 이모지 반응 추가.
--
-- - story_replies: 뷰어가 스토리에 남기는 텍스트 답장. 작성자만 열람.
-- - story_reactions: 스토리당 유저 1개 이모지 반응(업서트). 작성자만 열람.
-- ============================================================

-- ===========================
-- story_replies
-- ===========================
create table if not exists story_replies (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references stories(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists story_replies_story_idx
  on story_replies(story_id, created_at desc);

-- ===========================
-- story_reactions (스토리당 유저 1개)
-- ===========================
create table if not exists story_reactions (
  story_id uuid references stories(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  primary key (story_id, sender_id)
);

create index if not exists story_reactions_story_idx
  on story_reactions(story_id);

-- ===========================
-- RLS
-- ===========================
alter table story_replies enable row level security;
alter table story_reactions enable row level security;

-- 답장: 보낸 사람만 작성, 열람은 보낸 사람 + 스토리 작성자
drop policy if exists "story_replies_insert_self" on story_replies;
create policy "story_replies_insert_self" on story_replies
  for insert with check (auth.uid() = sender_id);

drop policy if exists "story_replies_select" on story_replies;
create policy "story_replies_select" on story_replies
  for select using (
    auth.uid() = sender_id
    or exists (
      select 1 from stories s
      where s.id = story_replies.story_id and s.author_id = auth.uid()
    )
  );

-- 반응: 보낸 사람만 작성/수정, 열람은 보낸 사람 + 스토리 작성자
drop policy if exists "story_reactions_insert_self" on story_reactions;
create policy "story_reactions_insert_self" on story_reactions
  for insert with check (auth.uid() = sender_id);

drop policy if exists "story_reactions_update_self" on story_reactions;
create policy "story_reactions_update_self" on story_reactions
  for update using (auth.uid() = sender_id);

drop policy if exists "story_reactions_delete_self" on story_reactions;
create policy "story_reactions_delete_self" on story_reactions
  for delete using (auth.uid() = sender_id);

drop policy if exists "story_reactions_select" on story_reactions;
create policy "story_reactions_select" on story_reactions
  for select using (
    auth.uid() = sender_id
    or exists (
      select 1 from stories s
      where s.id = story_reactions.story_id and s.author_id = auth.uid()
    )
  );

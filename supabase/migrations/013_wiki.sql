-- ============================================================
-- 013_wiki.sql : 공은위키 (문서 + 편집 이력)
-- Supabase SQL Editor에 복붙 → Run
-- ============================================================

-- ===========================
-- wiki_documents (위키 문서)
-- ===========================
create table if not exists wiki_documents (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,               -- URL 식별자 (제목에서 생성, 고정)
  title text not null,                     -- 표시용 제목 (수정 가능)
  content text not null default '',        -- 마크다운 본문
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wiki_documents_updated_idx
  on wiki_documents(updated_at desc);

-- ===========================
-- wiki_revisions (편집 이력 / 리비전)
-- 저장할 때마다 새 버전 1개 기록 → 되돌리기 가능
-- ===========================
create table if not exists wiki_revisions (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references wiki_documents(id) on delete cascade not null,
  title text not null,
  content text not null,
  editor_id uuid references profiles(id) on delete set null,
  summary text,                            -- 편집 요약 (선택)
  created_at timestamptz not null default now()
);

create index if not exists wiki_revisions_doc_idx
  on wiki_revisions(document_id, created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table wiki_documents enable row level security;
alter table wiki_revisions enable row level security;

-- 문서: 읽기 공개
drop policy if exists "wiki_documents_select_all" on wiki_documents;
create policy "wiki_documents_select_all" on wiki_documents
  for select using (true);

-- 문서 생성: 로그인 유저 (본인이 created_by)
drop policy if exists "wiki_documents_insert" on wiki_documents;
create policy "wiki_documents_insert" on wiki_documents
  for insert with check (auth.uid() = created_by);

-- 문서 수정: 로그인한 누구나 (나무위키식) — updated_by는 본인으로
drop policy if exists "wiki_documents_update" on wiki_documents;
create policy "wiki_documents_update" on wiki_documents
  for update using (auth.uid() is not null)
  with check (auth.uid() = updated_by);

-- 문서 삭제: 어드민만
drop policy if exists "wiki_documents_delete_admin" on wiki_documents;
create policy "wiki_documents_delete_admin" on wiki_documents
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 리비전: 읽기 공개
drop policy if exists "wiki_revisions_select_all" on wiki_revisions;
create policy "wiki_revisions_select_all" on wiki_revisions
  for select using (true);

-- 리비전 생성: 로그인 유저 (본인이 editor)
drop policy if exists "wiki_revisions_insert" on wiki_revisions;
create policy "wiki_revisions_insert" on wiki_revisions
  for insert with check (auth.uid() = editor_id);

-- 리비전 삭제: 어드민만 (수정은 불가)
drop policy if exists "wiki_revisions_delete_admin" on wiki_revisions;
create policy "wiki_revisions_delete_admin" on wiki_revisions
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

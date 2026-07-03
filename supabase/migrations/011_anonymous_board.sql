-- ============================================================
-- 011_anonymous_board.sql
--
-- 익명게시판 추가 + 클립게시판 제거.
--
-- - categories에 is_anonymous 플래그 추가. true인 카테고리의 글/댓글은
--   화면에서 작성자를 익명 처리 (DB엔 author_id 그대로 저장 — 어뷰징 대응용).
-- - 'anon' 카테고리 시드.
-- - 'clips' 카테고리 제거 (글이 있으면 cascade로 같이 삭제).
-- ============================================================

alter table categories
  add column if not exists is_anonymous boolean not null default false;

insert into categories (slug, name, description, streamer_only, sort_order, is_anonymous) values
  ('anon', '익명', '익명으로 자유롭게 이야기하는 공간', false, 4, true)
on conflict (slug) do update
  set is_anonymous = excluded.is_anonymous;

delete from categories where slug = 'clips';

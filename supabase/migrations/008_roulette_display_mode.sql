-- ============================================================
-- 008_roulette_display_mode.sql : 룰렛 표시 모드 추가
--
-- display_mode:
--   'wheel'   — 기존 회전 돌림판 (기본값)
--   'jackpot' — 1열 슬롯머신 스타일
--
-- Supabase SQL Editor에서 실행해주세요.
-- ============================================================

alter table roulette_wheels
  add column if not exists display_mode text not null default 'wheel';

alter table roulette_wheels
  drop constraint if exists roulette_wheels_display_mode_check;
alter table roulette_wheels
  add constraint roulette_wheels_display_mode_check
  check (display_mode in ('wheel', 'jackpot'));

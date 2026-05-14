-- ============================================================
-- 007_roulette_weight.sql : 룰렛 항목별 가중치(확률) 추가
--
-- weight: 양의 정수. 다른 항목 weight 합 대비 비율이 곧 확률.
-- 예) [3, 1, 1] → 60% / 20% / 20%
-- 기본값 1 (모두 같으면 균등).
--
-- Supabase SQL Editor에서 실행해주세요.
-- ============================================================

alter table roulette_items
  add column if not exists weight int not null default 1;

-- 0 또는 음수 방지
alter table roulette_items
  drop constraint if exists roulette_items_weight_positive;
alter table roulette_items
  add constraint roulette_items_weight_positive check (weight >= 1);

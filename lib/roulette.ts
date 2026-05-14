export interface RouletteWheelRow {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  donation_threshold: number | null;
  spin_duration_ms: number;
  show_result_ms: number;
  created_at: string;
  updated_at: string;
}

export interface RouletteItemRow {
  id: string;
  wheel_id: string;
  label: string;
  color: string | null;
  position: number;
  weight: number;
  created_at: string;
}

export interface RouletteSpinRow {
  id: string;
  wheel_id: string;
  result_item_id: string | null;
  triggered_by: 'manual' | 'donation';
  donor_name: string | null;
  donor_amount: number | null;
  status: 'spinning' | 'done';
  created_at: string;
}

/** 기본 팔레트 — 항목별 color 미지정 시 순환. */
export const DEFAULT_PALETTE = [
  '#00C896', // 액센트 그린
  '#5BCEFA',
  '#F5A8C8',
  '#86E6A1',
  '#FFD66B',
  '#C792EA',
  '#FF8A65',
  '#80DEEA',
];

export function colorForIndex(index: number, override?: string | null) {
  if (override) return override;
  return DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
}

/** slug 검증: 영문 소문자/숫자/하이픈/언더스코어 1~40자. */
export const SLUG_PATTERN = /^[a-z0-9_-]+$/;

export function isValidSlug(s: string) {
  if (!s || s.length > 40) return false;
  return SLUG_PATTERN.test(s);
}

/** 가중치 합 (0 이면 호출 측에서 에러 처리). */
export function totalWeight(items: { weight: number }[]): number {
  return items.reduce((sum, it) => sum + Math.max(0, it.weight), 0);
}

/** 가중치 기반 랜덤 인덱스. items가 비어있거나 합이 0이면 -1 반환. */
export function pickWeightedIndex(items: { weight: number }[]): number {
  const total = totalWeight(items);
  if (total <= 0) return -1;
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, items[i].weight);
    if (r < 0) return i;
  }
  return items.length - 1;
}

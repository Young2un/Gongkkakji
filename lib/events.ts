export type EventType = 'broadcast' | 'anniversary';

export interface EventRow {
  id: string;
  type: EventType;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  recurring_yearly: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventOccurrence {
  id: string;
  type: EventType;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  recurringYearly: boolean;
  // 원본 starts_at 기준 N주년 (recurring_yearly === true 일 때만)
  yearsSince: number | null;
}

const KST_OFFSET_MIN = 9 * 60;

function toKstDate(d: Date): Date {
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  return new Date(utc + KST_OFFSET_MIN * 60_000);
}

/**
 * recurring_yearly 이벤트의 "다음 발생일"을 계산.
 * 시간대는 KST 기준으로 월/일 비교.
 */
export function nextYearlyOccurrence(originalIso: string, from: Date = new Date()): Date {
  const orig = toKstDate(new Date(originalIso));
  const now = toKstDate(from);

  const month = orig.getUTCMonth();
  const day = orig.getUTCDate();
  const hour = orig.getUTCHours();
  const minute = orig.getUTCMinutes();

  let year = now.getUTCFullYear();
  // 올해 이미 지났으면 내년
  const candidate = Date.UTC(year, month, day, hour, minute);
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (candidate < todayStart) year += 1;

  // KST UTC 시각 → 실제 UTC ISO로 환산 (KST = UTC+9)
  const kstMs = Date.UTC(year, month, day, hour, minute);
  return new Date(kstMs - KST_OFFSET_MIN * 60_000);
}

/**
 * DB row → 다가오는 이벤트 N개로 평탄화.
 */
export function upcomingOccurrences(
  rows: EventRow[],
  options: { now?: Date; limit?: number; horizonDays?: number } = {}
): EventOccurrence[] {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 5;
  const horizon = options.horizonDays
    ? new Date(now.getTime() + options.horizonDays * 86_400_000)
    : null;

  const list: EventOccurrence[] = [];

  for (const row of rows) {
    if (row.recurring_yearly) {
      const next = nextYearlyOccurrence(row.starts_at, now);
      if (horizon && next > horizon) continue;
      const origYear = toKstDate(new Date(row.starts_at)).getUTCFullYear();
      const nextYear = toKstDate(next).getUTCFullYear();
      list.push({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        startsAt: next,
        endsAt: null,
        allDay: row.all_day,
        recurringYearly: true,
        yearsSince: nextYear - origYear,
      });
    } else {
      const startsAt = new Date(row.starts_at);
      const endsAt = row.ends_at ? new Date(row.ends_at) : null;
      // 종료 시각이 있으면 종료 전까지 "진행 중"으로 간주, 없으면 시작 시각 기준
      const cutoff = endsAt ?? startsAt;
      if (cutoff < now) continue;
      if (horizon && startsAt > horizon) continue;
      list.push({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        startsAt,
        endsAt,
        allDay: row.all_day,
        recurringYearly: false,
        yearsSince: null,
      });
    }
  }

  list.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return list.slice(0, limit);
}

/**
 * 특정 월(KST 기준)에 표시할 이벤트들을 평탄화.
 * recurring은 해당 월에 발생하면 한 건 추가.
 */
export function occurrencesInMonth(
  rows: EventRow[],
  year: number,
  month: number // 0-based (KST)
): EventOccurrence[] {
  const monthStartKstUtc = Date.UTC(year, month, 1);
  const monthEndKstUtc = Date.UTC(year, month + 1, 1);
  const monthStart = new Date(monthStartKstUtc - KST_OFFSET_MIN * 60_000);
  const monthEnd = new Date(monthEndKstUtc - KST_OFFSET_MIN * 60_000);

  const out: EventOccurrence[] = [];

  for (const row of rows) {
    if (row.recurring_yearly) {
      const orig = toKstDate(new Date(row.starts_at));
      const m = orig.getUTCMonth();
      const d = orig.getUTCDate();
      const h = orig.getUTCHours();
      const mi = orig.getUTCMinutes();
      if (m !== month) continue;
      const occKstUtc = Date.UTC(year, m, d, h, mi);
      const occ = new Date(occKstUtc - KST_OFFSET_MIN * 60_000);
      const origYear = orig.getUTCFullYear();
      out.push({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        startsAt: occ,
        endsAt: null,
        allDay: row.all_day,
        recurringYearly: true,
        yearsSince: year - origYear,
      });
    } else {
      const startsAt = new Date(row.starts_at);
      const endsAt = row.ends_at ? new Date(row.ends_at) : null;
      const cutoff = endsAt ?? startsAt;
      // 이 달 범위와 겹치는지
      if (cutoff < monthStart || startsAt >= monthEnd) continue;
      out.push({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        startsAt,
        endsAt,
        allDay: row.all_day,
        recurringYearly: false,
        yearsSince: null,
      });
    }
  }

  out.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return out;
}

const KST_FMT = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});
const KST_TIME_FMT = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const KST_FULL_FMT = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});

export function formatDateKst(d: Date) {
  return KST_FMT.format(d);
}

export function formatFullDateKst(d: Date) {
  return KST_FULL_FMT.format(d);
}

export function formatTimeKst(d: Date) {
  return KST_TIME_FMT.format(d);
}

/** 'YYYY-MM-DD' (KST) — 캘린더 날짜키 비교용 */
export function kstDateKey(d: Date): string {
  const k = toKstDate(d);
  const y = k.getUTCFullYear();
  const m = String(k.getUTCMonth() + 1).padStart(2, '0');
  const day = String(k.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dDayLabel(target: Date, now: Date = new Date()): string {
  const targetKey = kstDateKey(target);
  const nowKey = kstDateKey(now);
  if (targetKey === nowKey) return 'D-DAY';
  const targetMid = new Date(targetKey + 'T00:00:00+09:00').getTime();
  const nowMid = new Date(nowKey + 'T00:00:00+09:00').getTime();
  const days = Math.round((targetMid - nowMid) / 86_400_000);
  if (days > 0) return `D-${days}`;
  return `D+${-days}`;
}

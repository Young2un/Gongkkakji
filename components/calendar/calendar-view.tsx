'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Radio, Cake, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventForm } from '@/components/calendar/event-form';
import {
  type EventRow,
  occurrencesInMonth,
  formatTimeKst,
  kstDateKey,
  dDayLabel,
} from '@/lib/events';
import { cn } from '@/lib/utils';

interface Props {
  events: EventRow[];
  canEdit: boolean;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function nowKstParts() {
  const now = new Date();
  const k = new Date(now.getTime() + 9 * 60 * 60_000);
  return { year: k.getUTCFullYear(), month: k.getUTCMonth(), day: k.getUTCDate() };
}

export function CalendarView({ events, canEdit }: Props) {
  const today = useMemo(nowKstParts, []);
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [selectedKey, setSelectedKey] = useState<string>(
    `${today.year}-${String(today.month + 1).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);

  const monthOccurrences = useMemo(
    () => occurrencesInMonth(events, year, month),
    [events, year, month]
  );

  // 날짜키별 그룹
  const byDate = useMemo(() => {
    const map = new Map<string, typeof monthOccurrences>();
    for (const occ of monthOccurrences) {
      const key = kstDateKey(occ.startsAt);
      const arr = map.get(key) ?? [];
      arr.push(occ);
      map.set(key, arr);
    }
    return map;
  }, [monthOccurrences]);

  // 그리드 셀 (앞뒤 빈칸 포함)
  const cells = useMemo(() => {
    const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const lastDate = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const arr: { day: number | null; key: string | null }[] = [];
    for (let i = 0; i < firstDay; i++) arr.push({ day: null, key: null });
    for (let d = 1; d <= lastDate; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      arr.push({ day: d, key });
    }
    while (arr.length % 7 !== 0) arr.push({ day: null, key: null });
    return arr;
  }, [year, month]);

  const selectedEvents = byDate.get(selectedKey) ?? [];
  const todayKey = `${today.year}-${String(today.month + 1).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`;

  const goPrev = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(month + 1);
  };
  const goToday = () => {
    setYear(today.year);
    setMonth(today.month);
    setSelectedKey(todayKey);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (id: string) => {
    const row = events.find((e) => e.id === id);
    if (!row) return;
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
          <button
            onClick={goPrev}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground hover:bg-white/10 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="이전 달"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="px-2 sm:px-3 text-base sm:text-xl font-bold text-white whitespace-nowrap">
            {year}년 {month + 1}월
          </h1>
          <button
            onClick={goNext}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground hover:bg-white/10 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="다음 달"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Button variant="ghost" size="sm" onClick={goToday} className="ml-1 sm:ml-2 shrink-0">
            오늘
          </Button>
        </div>

        {canEdit && (
          <Button variant="accent" size="sm" onClick={openCreate} className="shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">일정 추가</span>
          </Button>
        )}
      </div>

      {/* 월간 그리드 */}
      <div className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md p-2 sm:p-4">
        <div className="mb-1 sm:mb-2 grid grid-cols-7 text-center text-[10px] sm:text-xs font-bold text-muted-foreground">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                'py-1.5 sm:py-2',
                i === 0 && 'text-red-400',
                i === 6 && 'text-blue-400'
              )}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {cells.map((cell, idx) => {
            if (!cell.day || !cell.key) {
              return <div key={`empty-${idx}`} className="aspect-[3/4] sm:aspect-square" />;
            }
            const dayEvents = byDate.get(cell.key) ?? [];
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedKey;
            const dayOfWeek = idx % 7;
            const hasBroadcast = dayEvents.some((e) => e.type === 'broadcast');
            const hasAnniversary = dayEvents.some((e) => e.type === 'anniversary');
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedKey(cell.key!)}
                className={cn(
                  'relative flex aspect-[3/4] sm:aspect-square flex-col items-stretch rounded-md sm:rounded-lg border p-1 sm:p-1.5 text-left transition',
                  isSelected
                    ? 'border-primary/60 bg-primary/15'
                    : isToday
                    ? 'border-accent/40 bg-accent/5'
                    : 'border-white/5 bg-white/5 hover:bg-white/10 active:bg-white/15'
                )}
              >
                <span
                  className={cn(
                    'text-xs sm:text-sm font-bold',
                    isToday && 'text-accent',
                    !isToday && dayOfWeek === 0 && 'text-red-400',
                    !isToday && dayOfWeek === 6 && 'text-blue-400',
                    !isToday && dayOfWeek !== 0 && dayOfWeek !== 6 && 'text-white/80'
                  )}
                >
                  {cell.day}
                </span>

                {/* 모바일: 점 인디케이터 */}
                <div className="mt-auto flex sm:hidden items-center justify-center gap-1 pb-0.5">
                  {hasBroadcast && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="방송" />
                  )}
                  {hasAnniversary && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="기념일" />
                  )}
                </div>

                {/* 데스크톱: 칩 */}
                <div className="mt-auto hidden sm:flex flex-col gap-0.5">
                  {dayEvents.slice(0, 2).map((occ) => (
                    <div
                      key={occ.id}
                      className={cn(
                        'truncate rounded px-1 py-0.5 text-[10px] font-medium',
                        occ.type === 'broadcast'
                          ? 'bg-primary/30 text-primary-foreground/90'
                          : 'bg-accent/30 text-accent'
                      )}
                    >
                      {occ.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택 날짜 상세 */}
      <div className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md p-5">
        <h2 className="mb-3 text-sm font-bold text-white">
          {selectedKey.replaceAll('-', '. ').replace('.', '년 ').replace('.', '월 ')}일
        </h2>
        {selectedEvents.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            등록된 일정이 없어요.
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((occ) => (
              <li
                key={occ.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3',
                  occ.type === 'broadcast'
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-accent/20 bg-accent/5'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    occ.type === 'broadcast'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-accent/20 text-accent'
                  )}
                >
                  {occ.type === 'broadcast' ? (
                    <Radio className="h-4 w-4" />
                  ) : (
                    <Cake className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">{occ.title}</p>
                    {occ.recurringYearly && occ.yearsSince !== null && occ.yearsSince > 0 && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/80">
                        {occ.yearsSince}주년
                      </span>
                    )}
                    <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/80">
                      {dDayLabel(occ.startsAt)}
                    </span>
                  </div>
                  {!occ.allDay && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTimeKst(occ.startsAt)}
                      {occ.endsAt && ` ~ ${formatTimeKst(occ.endsAt)}`}
                    </p>
                  )}
                  {occ.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                      {occ.description}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => openEdit(occ.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white"
                    aria-label="일정 수정"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {canEdit && (
        <EventForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          initial={editing}
        />
      )}
    </div>
  );
}

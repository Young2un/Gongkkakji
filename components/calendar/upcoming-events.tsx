import Link from 'next/link';
import { ArrowRight, Calendar, Radio, Cake } from 'lucide-react';
import {
  type EventRow,
  upcomingOccurrences,
  formatDateKst,
  formatTimeKst,
  dDayLabel,
} from '@/lib/events';
import { cn } from '@/lib/utils';

interface Props {
  events: EventRow[];
  limit?: number;
}

export function UpcomingEvents({ events, limit = 4 }: Props) {
  const upcoming = upcomingOccurrences(events, { limit, horizonDays: 90 });

  return (
    <div className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-primary font-bold">
          <Calendar className="h-5 w-5" />
          <h2>다가오는 일정</h2>
        </div>
        <Link
          href="/calendar"
          className="text-xs text-muted-foreground hover:text-white flex items-center gap-1"
        >
          전체 보기 <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex-1 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 p-6 text-sm text-muted-foreground">
          예정된 일정이 없어요.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {upcoming.map((occ) => (
            <li
              key={`${occ.id}-${occ.startsAt.getTime()}`}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3',
                occ.type === 'broadcast'
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-accent/20 bg-accent/5'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
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
                  <p className="truncate font-bold text-white text-sm">{occ.title}</p>
                  {occ.recurringYearly &&
                    occ.yearsSince !== null &&
                    occ.yearsSince > 0 && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/80 shrink-0">
                        {occ.yearsSince}주년
                      </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateKst(occ.startsAt)}
                  {!occ.allDay && ` · ${formatTimeKst(occ.startsAt)}`}
                </p>
              </div>
              <span className="rounded bg-white/10 px-2 py-1 text-[11px] font-bold text-white/80 shrink-0">
                {dDayLabel(occ.startsAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

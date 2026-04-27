import { Coins, Gift } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface PointLog {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
}

interface Props {
  totalPoints: number;
  attendedToday: boolean;
  logs: PointLog[];
}

export function PointsPanel({ totalPoints, attendedToday, logs }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Coins className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">내 포인트</p>
          <p className="text-2xl font-bold tracking-tight">
            {totalPoints.toLocaleString()}P
          </p>
        </div>
        <div
          className={
            attendedToday
              ? 'inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground'
              : 'inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1.5 text-xs text-accent'
          }
        >
          <Gift className={attendedToday ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 fill-current'} />
          {attendedToday ? '오늘 출석 완료' : '헤더에서 출석하고 +10P'}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          최근 획득 로그
        </h2>
        {logs.length > 0 ? (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="text-sm">
                  <p className="font-medium">{log.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(log.created_at)}
                  </p>
                </div>
                <span
                  className={
                    log.delta >= 0
                      ? 'font-medium text-accent'
                      : 'font-medium text-live'
                  }
                >
                  {log.delta >= 0 ? '+' : ''}
                  {log.delta}P
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            아직 획득한 포인트가 없어요
          </div>
        )}
      </div>
    </section>
  );
}

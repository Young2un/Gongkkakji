'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { claimAttendance } from '@/app/actions/attendance';
import { cn } from '@/lib/utils';

interface Props {
  initialAttended: boolean;
}

export function AttendanceButton({ initialAttended }: Props) {
  const router = useRouter();
  const [attended, setAttended] = useState(initialAttended);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (attended) return;
    startTransition(async () => {
      const res = await claimAttendance();
      if ('error' in res && res.error) {
        setToast(res.error);
      } else if (res.data) {
        setAttended(true);
        if (res.data.alreadyAttended) {
          setToast('이미 오늘 출석했어요');
        } else {
          setToast(`+${res.data.pointsEarned}P 획득!`);
        }
        router.refresh();
      }
      window.setTimeout(() => setToast(null), 2000);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={attended || isPending}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
          attended
            ? 'cursor-default border-border bg-muted text-muted-foreground'
            : 'border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-white'
        )}
        aria-label={attended ? '오늘 출석 완료' : '출석 체크 (+10P)'}
        title={attended ? '오늘 출석 완료' : '출석 체크 +10P'}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CalendarCheck className={cn('h-4 w-4', attended && 'text-muted-foreground')} />
        )}
      </button>
      {toast && (
        <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-md border border-border bg-background px-2 py-1 text-xs shadow-md">
          {toast}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 라이브 상태를 새로고침 없이 주기적으로 갱신.
 * 서버 컴포넌트(라이브 배너 · 홈 ON AIR 배지/버튼)를 router.refresh()로 다시 렌더한다.
 * 실제 데이터는 getLiveStatus의 revalidate(30초) 캐시가 게이트하므로 API를 과하게 때리지 않는다.
 */
export function LiveRefresher({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      // 백그라운드 탭에서는 요청하지 않음
      if (document.visibilityState === 'visible') router.refresh();
    };

    const id = setInterval(refresh, intervalMs);
    // 탭으로 돌아오면 즉시 한 번 갱신
    document.addEventListener('visibilitychange', refresh);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [router, intervalMs]);

  return null;
}

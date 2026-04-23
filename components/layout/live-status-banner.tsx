import Link from 'next/link';
import { getStreamerLive } from '@/lib/chzzk';
import { formatCount } from '@/lib/utils';

/**
 * 서버 컴포넌트 - 1분 캐시로 스트리머 라이브 상태 표시
 * 환경변수 STREAMER_CHANNEL_ID 필요
 */
export async function LiveStatusBanner() {
  const live = await getStreamerLive();

  if (!live) return null;

  const channelId = process.env.STREAMER_CHANNEL_ID;
  return (
    <Link
      href={`https://chzzk.naver.com/live/${channelId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-gradient-to-r from-live to-accent px-4 py-2 text-center text-sm font-medium text-white transition-opacity hover:opacity-95"
    >
      <span className="inline-flex items-center gap-2">
        <span className="flex h-2 w-2">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <span>🔴 지금 방송 중 · {live.liveTitle}</span>
        <span className="opacity-80">
          👀 {formatCount(live.concurrentUserCount)}
        </span>
      </span>
    </Link>
  );
}

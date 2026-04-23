import type { ChzzkResponse, ChzzkLive } from './types';

const OPEN_API = 'https://openapi.chzzk.naver.com';

/**
 * Client 인증 헤더 (서버 전용)
 */
function clientHeaders() {
  return {
    'Client-Id': process.env.CHZZK_CLIENT_ID!,
    'Client-Secret': process.env.CHZZK_CLIENT_SECRET!,
    'Content-Type': 'application/json',
  };
}

/**
 * 특정 채널의 라이브 상태 조회
 * - Client 인증만 필요 (유저 토큰 불필요)
 * - Next.js 캐시 활용 (1분)
 * - 방송 중이 아니면 null 반환
 */
export async function getLiveStatus(
  channelId: string
): Promise<ChzzkLive | null> {
  try {
    const res = await fetch(
      `${OPEN_API}/open/v1/lives?channelIds=${channelId}`,
      {
        headers: clientHeaders(),
        next: { revalidate: 60, tags: [`live:${channelId}`] },
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as ChzzkResponse<{
      data: ChzzkLive[];
    }>;

    const live = data.content?.data?.[0];
    if (!live || live.liveStatus !== 'OPEN') return null;

    return live;
  } catch (error) {
    console.error('[chzzk] getLiveStatus error:', error);
    return null;
  }
}

/**
 * 스트리머 본인(환경변수에 설정된) 라이브 상태
 */
export async function getStreamerLive(): Promise<ChzzkLive | null> {
  const channelId = process.env.STREAMER_CHANNEL_ID;
  if (!channelId) return null;
  return getLiveStatus(channelId);
}

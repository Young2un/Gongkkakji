import type { ChzzkResponse, ChzzkChannel } from './types';

const OPEN_API = 'https://openapi.chzzk.naver.com';

function clientHeaders() {
  return {
    'Client-Id': process.env.CHZZK_CLIENT_ID!,
    'Client-Secret': process.env.CHZZK_CLIENT_SECRET!,
    'Content-Type': 'application/json',
  };
}

/**
 * 단일 채널 정보 조회
 * - Client 인증만 필요 (유저 토큰 불필요)
 * - Next.js 캐시 5분
 * - 채널을 찾을 수 없거나 오류 시 null 반환
 */
export async function getChannelInfo(
  channelId: string
): Promise<ChzzkChannel | null> {
  if (!channelId) return null;
  try {
    const res = await fetch(
      `${OPEN_API}/open/v1/channels?channelIds=${channelId}`,
      {
        headers: clientHeaders(),
        next: { revalidate: 300, tags: [`channel:${channelId}`] },
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as ChzzkResponse<{ data: ChzzkChannel[] }>;
    return data.content?.data?.[0] ?? null;
  } catch (error) {
    console.error('[chzzk] getChannelInfo error:', error);
    return null;
  }
}

/**
 * 여러 채널 정보 일괄 조회 (최대 20개)
 */
export async function getChannelInfos(
  channelIds: string[]
): Promise<ChzzkChannel[]> {
  if (channelIds.length === 0) return [];
  try {
    const ids = channelIds.slice(0, 20).join(',');
    const res = await fetch(`${OPEN_API}/open/v1/channels?channelIds=${ids}`, {
      headers: clientHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as ChzzkResponse<{ data: ChzzkChannel[] }>;
    return data.content?.data ?? [];
  } catch (error) {
    console.error('[chzzk] getChannelInfos error:', error);
    return [];
  }
}

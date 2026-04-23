import type { ChzzkResponse, ChzzkToken, ChzzkUser } from './types';

const OPEN_API = 'https://openapi.chzzk.naver.com';
const OAUTH_URL = 'https://chzzk.naver.com/account-interlock';

/**
 * 치지직 로그인 URL 생성
 * @param state CSRF 방지용 랜덤 문자열
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    clientId: process.env.CHZZK_CLIENT_ID!,
    redirectUri: process.env.CHZZK_REDIRECT_URI!,
    state,
  });
  return `${OAUTH_URL}?${params}`;
}

/**
 * 인증 코드 → Access Token 교환
 */
export async function exchangeCodeForToken(
  code: string,
  state: string
): Promise<ChzzkToken> {
  const res = await fetch(`${OPEN_API}/auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grantType: 'authorization_code',
      clientId: process.env.CHZZK_CLIENT_ID,
      clientSecret: process.env.CHZZK_CLIENT_SECRET,
      code,
      state,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status}`);
  }

  const data = (await res.json()) as ChzzkResponse<ChzzkToken>;
  if (data.code !== 200) {
    throw new Error(`Token exchange error: ${data.message}`);
  }
  return data.content;
}

/**
 * Refresh Token으로 Access Token 재발급
 * ⚠️ Refresh Token은 일회용이므로 받은 새 토큰으로 DB 덮어쓰기 필수
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<ChzzkToken> {
  const res = await fetch(`${OPEN_API}/auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grantType: 'refresh_token',
      refreshToken,
      clientId: process.env.CHZZK_CLIENT_ID,
      clientSecret: process.env.CHZZK_CLIENT_SECRET,
    }),
    cache: 'no-store',
  });

  const data = (await res.json()) as ChzzkResponse<ChzzkToken>;
  if (data.code !== 200) {
    throw new Error(`Token refresh error: ${data.message}`);
  }
  return data.content;
}

/**
 * 토큰 revoke (로그아웃)
 */
export async function revokeToken(
  token: string,
  type: 'access_token' | 'refresh_token' = 'access_token'
): Promise<void> {
  await fetch(`${OPEN_API}/auth/v1/token/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.CHZZK_CLIENT_ID,
      clientSecret: process.env.CHZZK_CLIENT_SECRET,
      token,
      tokenTypeHint: type,
    }),
    cache: 'no-store',
  });
}

/**
 * 로그인한 유저 정보 조회 (Access Token 인증)
 */
export async function getChzzkUser(accessToken: string): Promise<ChzzkUser> {
  const res = await fetch(`${OPEN_API}/open/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data = (await res.json()) as ChzzkResponse<ChzzkUser>;
  if (data.code !== 200) {
    throw new Error(`User info error: ${data.message}`);
  }
  return data.content;
}

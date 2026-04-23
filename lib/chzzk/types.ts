// 치지직 API 공통 응답
export interface ChzzkResponse<T> {
  code: number;
  message: string | null;
  content: T;
}

// OAuth 토큰
export interface ChzzkToken {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  scope?: string;
}

// 유저 정보 (API Scope: 유저 정보 조회)
export interface ChzzkUser {
  channelId: string;
  channelName: string;
  profileImageUrl: string | null;
}

// 채널 정보
export interface ChzzkChannel {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  verifiedMark: boolean;
}

// 라이브 방송 정보
export interface ChzzkLive {
  liveId: number;
  liveTitle: string;
  liveStatus: 'OPEN' | 'CLOSE';
  liveThumbnailImageUrl: string | null;
  concurrentUserCount: number;
  openDate: string;
  closeDate: string | null;
  adult: boolean;
  tags: string[];
  categoryType: string | null;
  liveCategory: string | null;
  liveCategoryValue: string | null;
  channelId: string;
  livePlaybackJson: string;
}

# 🎮 오버워치 팬 커뮤니티 스타터

치지직 스트리머를 위한 팬 커뮤니티 웹앱 스타터 킷.
Next.js 14 (App Router) + TypeScript + Tailwind + Supabase + 치지직 OAuth.

## 🚀 빠른 시작 (30분이면 로컬에서 돌아감)

### 0. 사전 준비

- Node.js 20+ 설치됨?
- Cursor 설치됨?
- 이 폴더 통째로 빈 디렉토리에 복사

### 1. 의존성 설치

```bash
cd fancafe-starter
npm install
```

### 2. Supabase 프로젝트 생성

1. https://supabase.com 로그인 → New Project
2. 이름: `fancafe` (아무거나), 리전: `Northeast Asia (Seoul)` 추천
3. 생성 완료 후 **Settings → API** 에서 아래 값 복사:
   - `Project URL`
   - `anon public` key
   - `service_role` key (⚠️ 서버 전용, 절대 클라에 노출 X)

### 3. 치지직 앱 등록

1. https://developers.chzzk.naver.com 접속 → 네이버 로그인
2. "애플리케이션 등록"
3. 이름: `오버워치팬커뮤니티` (치지직/naver 단어 금지)
4. 로그인 리디렉션 URL: `http://localhost:3000/api/auth/chzzk/callback`
5. Scope 선택:
   - ✅ 유저 정보 조회
   - ✅ 방송 정보 조회
   - (나머지는 나중에 필요해지면 추가)
6. 생성 후 `Client ID`, `Client Secret` 복사

### 4. 환경변수 설정

`.env.local.example` 을 `.env.local` 로 복사하고 값 채우기:

```bash
cp .env.local.example .env.local
```

그 다음 `.env.local` 열어서 위에서 복사한 값들 붙여넣기.

`STREAMER_CHANNEL_ID` 는 본인 치지직 채널 ID인데, 치지직 채널 URL의 마지막 해시값이에요.
예: `https://chzzk.naver.com/abc123def456` → `abc123def456`

### 5. DB 마이그레이션 실행

Supabase 대시보드 → SQL Editor → `supabase/migrations/001_init.sql` 내용 복붙해서 실행.

그 다음 `supabase/migrations/002_rls.sql` 도 같은 방식으로 실행.

### 6. 본인 계정을 스트리머로 지정

한 번 로그인한 뒤, SQL Editor에서:

```sql
update profiles set role = 'streamer' where id = '본인_auth_user_id';
```

본인 user id는 Authentication → Users 에서 확인 가능.

### 7. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 접속!

## 📁 폴더 구조

```
app/
  (auth)/login/              로그인 페이지
  (main)/                    메인 레이아웃 (헤더 + 스토리바)
    page.tsx                 홈 피드
    c/[slug]/                게시판
    story/                   스토리 뷰어
    profile/                 프로필
  api/auth/chzzk/            치지직 OAuth 엔드포인트
components/
  ui/                        공통 UI (버튼, 카드)
  layout/                    헤더, 푸터, 스토리바
  post/                      게시글 관련
  story/                     스토리 관련
lib/
  supabase/                  Supabase 클라이언트
  chzzk/                     치지직 API 래퍼
supabase/
  migrations/                DB 스키마
```

## 🎯 다음 단계

기본 세팅이 돌아가면:

1. **게시판 CRUD 구현** — `app/(main)/c/[slug]/` 에 글쓰기/상세/댓글
2. **스토리 기능** — 24시간 자동 숨김 + 하이라이트 보관
3. **치지직 라이브 배너** — `LiveStatusBanner` 컴포넌트 활용
4. **PWA 전환** — manifest.json + 서비스워커

각 기능은 Cursor에 `## 🤖 Cursor 프롬프트 모음` 의 프롬프트 던지면서 만들어요.

## 🔐 보안 체크리스트

- [ ] `.env.local` 은 절대 커밋하지 않기 (`.gitignore` 확인)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 는 서버 코드에서만 사용
- [ ] `CHZZK_CLIENT_SECRET` 는 서버 코드에서만 사용
- [ ] RLS 정책 활성화됐는지 Supabase 대시보드에서 확인

## 📚 참고 링크

- 치지직 API 문서: https://chzzk.gitbook.io/chzzk
- Supabase 문서: https://supabase.com/docs
- Next.js 문서: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com

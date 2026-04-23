# 🛠️ 상세 세팅 가이드

README.md를 따라가다가 막히는 부분이 생기면 여기서 자세히 확인하세요.

## 📦 Supabase Storage 버킷 생성

대시보드 → Storage → New bucket

두 개 생성:

| 버킷 이름 | Public | 용도 |
|---|---|---|
| `posts` | ✅ | 게시글 이미지/영상 |
| `stories` | ✅ | 스토리 미디어 |

각 버킷의 Policies 탭에서:

```sql
-- 업로드: 본인만 자기 폴더에
create policy "authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id in ('posts', 'stories')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 삭제: 본인만
create policy "users can delete own files"
  on storage.objects for delete
  using (auth.uid()::text = (storage.foldername(name))[1]);

-- 조회: 누구나 (public 버킷이라 기본 허용이지만 명시)
create policy "public read"
  on storage.objects for select
  using (bucket_id in ('posts', 'stories'));
```

파일 경로 규칙: `{user_id}/{파일명}` 으로 업로드해서 RLS와 맞추기.

## 🔑 Supabase Auth 설정

Authentication → Providers → Email 비활성화 추천 (치지직 로그인만 쓸 거라면).

또는 Email 켜두되 회원가입은 코드에서 막기.

Authentication → URL Configuration:
- Site URL: `http://localhost:3000` (개발) / `https://내도메인.com` (운영)
- Redirect URLs: 필요 없음 (치지직 OAuth는 우리 콜백으로 돌아오니까)

## 🎨 디자인 커스터마이즈

### 포인트 컬러 변경

`tailwind.config.ts` 에서:

```ts
accent: {
  DEFAULT: '#F99E1A',   // 본인 브랜드 컬러로 변경
  foreground: '#ffffff',
  hover: '#E68A00',
}
```

### 폰트 변경

`app/globals.css` 의 Pretendard import URL을 다른 폰트로 바꾸거나,
`tailwind.config.ts` 의 `fontFamily.sans` 배열 조정.

## 🚀 Vercel 배포

1. GitHub에 레포 푸시
2. https://vercel.com → New Project → 레포 선택
3. Environment Variables 섹션에 `.env.local` 내용 그대로 넣기
   - `CHZZK_REDIRECT_URI` 는 `https://{프로젝트명}.vercel.app/api/auth/chzzk/callback` 으로 변경
   - `NEXT_PUBLIC_APP_URL` 도 운영 URL로
4. Deploy
5. 배포 완료 후 치지직 개발자센터에서 운영 URL을 **Redirect URI에 추가 등록**
6. Supabase 대시보드 → Authentication → URL Configuration → Site URL 도 운영 URL로 변경

## 🐛 흔한 에러

### "Invalid login credentials"

- Supabase Auth에 유저가 생성되지 않았을 수도. `auth.users` 테이블 확인.
- `SUPABASE_SERVICE_ROLE_KEY` 가 제대로 설정됐는지.

### "Token exchange failed: 401"

- `CHZZK_CLIENT_ID` / `CHZZK_CLIENT_SECRET` 오타 체크.
- 인증 코드는 **일회용**이고 **바로 만료**되니까 콜백을 빠르게 처리해야 함.
- `redirectUri` 가 치지직 앱 등록 시 입력한 것과 **정확히 일치**해야 함.

### "new row violates row-level security policy"

- RLS 정책이 너무 엄격한 경우. 002_rls.sql 다시 실행.
- 서버에서 admin 작업을 하려면 `createAdminClient()` 사용.

### "Can't resolve '@supabase/ssr'"

- `npm install` 안 했을 가능성. 의존성 설치 필수.

### 치지직 배너가 안 보여요

- `STREAMER_CHANNEL_ID` 환경변수 설정 확인.
- 방송 중이 아니면 `null` 반환되어 안 뜨는 게 정상.
- 테스트하려면 본인이 방송 켠 상태에서 확인.

### "Too Many Requests" (429)

- Live API 폴링이 너무 잦음. `next: { revalidate: 60 }` 값 늘리기.
- 혹은 여러 사용자가 동시에 요청 중이면 캐시 태그로 묶기.

## 📚 추가 리소스

- **Supabase 학습 순서**: Auth → Database → RLS → Storage → Edge Functions
- **Next.js App Router 이해**: [공식 문서](https://nextjs.org/docs/app)
- **치지직 API 업데이트**: https://chzzk.gitbook.io/chzzk/introduction/updates 주기적 확인
- **shadcn/ui 컴포넌트**: https://ui.shadcn.com 에서 필요한 컴포넌트 하나씩 추가

## 🗺️ 확장 로드맵

기본이 돌아가기 시작하면 이 순서로 확장 추천:

1. **게시판 CRUD 완성** (CURSOR_PROMPTS.md #1)
2. **스토리 기능** (#2) — 프로젝트의 차별 포인트
3. **프로필 + 치지직 채널 정보 연동** (#3)
4. **PWA 전환** (#4) — 모바일 홈화면 설치 가능
5. **토큰 매니저** (#5) — Session API 붙이기 전 필수
6. **출석/포인트** (#6) — 리텐션 기능
7. **Session API로 실시간 채팅 미러링** — 방송과 커뮤니티 연결
8. **푸시 알림** (web-push) — 새 글/스토리 알림

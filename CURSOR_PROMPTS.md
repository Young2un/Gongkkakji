# 🤖 Cursor 프롬프트 모음

Cursor Composer(Cmd+I)에 순서대로 던지면 기능이 하나씩 완성됩니다.
이 스타터에는 **기본 세팅 + 치지직 OAuth + 홈 피드 + 헤더**까지만 들어있어요.
나머지 기능은 아래 프롬프트로 덧붙여가세요.

---

## 1️⃣ 게시판 기능 (글쓰기 → 목록 → 상세 → 댓글)

```
우리 프로젝트에 게시판 기능을 붙여줘.

요구사항:
- app/(main)/c/[slug]/page.tsx : 카테고리별 게시글 목록 (pagination)
- app/(main)/c/[slug]/new/page.tsx : 글쓰기 (로그인 필수, streamer_only 카테고리 권한 체크)
- app/(main)/c/[slug]/[postId]/page.tsx : 게시글 상세 + 댓글 섹션
- 댓글은 Server Action으로 작성, Optimistic UI
- 좋아요 버튼 (likes 테이블 사용)
- 이미지 업로드는 Supabase Storage의 "posts" 버킷 사용 (public read)

디자인:
- 기존 미니멀 톤 유지
- 프로필 스타일은 components/layout/site-header.tsx 참고
- lucide-react 아이콘 사용

보안:
- RLS가 이미 설정돼 있으니 중복 체크 금지
- supabase.auth.getUser()로 로그인 확인, 없으면 /login 리다이렉트

완성되면 app/(main)/page.tsx 의 "최근 글" 목록이 게시판 링크와 정확히 맞게 연결됐는지 확인해줘.
```

---

## 2️⃣ 스토리 기능

```
인스타그램 스타일 스토리 기능을 붙여줘.

요구사항:
- 메인 레이아웃 최상단에 가로 스크롤 스토리 바 (스트리머 먼저, 이후 최근 24시간 내 스토리 올린 팬들)
- 스토리 업로드 모달 (이미지 or 비디오, 캡션)
- 풀스크린 스토리 뷰어 (탭으로 이전/다음, 자동 진행바, 5초 기본)
- 스트리머는 스토리를 "하이라이트"로 저장 가능 (highlights 테이블 활용)
- 본인 스토리는 조회자 목록 확인 가능

파일:
- components/story/story-bar.tsx : 스토리 바
- components/story/story-viewer.tsx : 뷰어 (react-insta-stories 라이브러리 사용, 설치 필요)
- components/story/story-uploader.tsx : 업로드
- app/(main)/story/[id]/page.tsx : 스토리 뷰 URL

DB: stories 테이블과 active_stories 뷰 이미 존재, story_views로 조회 기록 관리
스토리지: Supabase Storage "stories" 버킷 사용 (public read)

라이브러리: `npm install react-insta-stories`
```

---

## 3️⃣ 프로필 페이지 + 스트리머 하이라이트

```
프로필 페이지 만들어줘.

- app/(main)/profile/page.tsx : 본인 프로필 (수정 가능)
- app/(main)/@[username]/page.tsx : 다른 유저 프로필 (공개 정보만)
  - 아바타, 닉네임, bio
  - 스트리머면 "STREAMER" 뱃지 + 치지직 채널 링크 + 팔로워 수 (치지직 Channel API로 조회)
  - 하이라이트 리스트 (스트리머만)
  - 최근 작성 글

lib/chzzk/channel.ts 파일 새로 만들어서 Channel API 래퍼 추가해줘.
엔드포인트: GET https://openapi.chzzk.naver.com/open/v1/channels?channelIds={id}
Client-Id/Client-Secret 헤더 사용.
```

---

## 4️⃣ PWA 전환

```
우리 Next.js 앱을 PWA로 만들어줘.

- public/manifest.json 작성 (앱 이름, 아이콘, 테마 컬러 #F99E1A)
- public/icon-192.png, icon-512.png 자리에 플레이스홀더 생성 (실제 아이콘은 나중에 교체)
- 서비스워커로 기본 오프라인 지원 (next-pwa 사용)
- app/layout.tsx 에 manifest 링크 추가
- iOS Safari용 apple-touch-icon 메타태그

설치 안내 배너는 추가하지 말고 자연스럽게만.
```

---

## 5️⃣ 토큰 자동 갱신 유틸 (나중에 Session API 쓸 때 필요)

```
치지직 Access Token을 자동 갱신하는 유틸 만들어줘.

lib/chzzk/token-manager.ts:
- getValidAccessToken(userId): 만료 10분 전이면 refresh, 그대로면 반환
- refresh 성공 시 chzzk_tokens 테이블에 새 토큰 upsert
- 실패 시 null 반환, 호출 측이 재로그인 유도

기존 lib/chzzk/auth.ts 의 refreshAccessToken 함수 활용.
service role 클라이언트 사용 (RLS 우회).
```

---

## 6️⃣ 출석체크 + 포인트 시스템

```
출석체크와 포인트 시스템 추가.

DB 마이그레이션 003_points.sql 생성:
- user_points (user_id, points int, updated_at)
- attendance (user_id, date, created_at, primary key (user_id, date))
- point_logs (id, user_id, delta int, reason text, created_at)

기능:
- 하루 한 번 출석 체크 시 +10 포인트
- 게시글 작성 +5, 댓글 +1 (트리거로 자동)
- 헤더 우측에 오늘 출석 여부 표시
- /profile 에 내 포인트 + 최근 획득 로그 표시

RLS: 본인 것만 read, admin만 write (트리거는 security definer)
```

---

## 🎯 프롬프트 사용 팁

1. **한 번에 하나씩만.** 여러 개 합쳐서 던지지 말기.
2. **완성 후 로컬에서 직접 확인.** `npm run dev` → 브라우저 → 진짜 동작하는지 체크.
3. **에러나면 에러 메시지 그대로 복붙해서 Cursor에 피드백.** "에러나" 말고.
4. **중간에 git commit 자주.** 기능 하나 완성 → commit → 다음 기능.
5. **Supabase 대시보드에서 DB 상태 직접 확인하기.** RLS 때문에 데이터 안 보일 수 있으니 Table Editor에서 확인.

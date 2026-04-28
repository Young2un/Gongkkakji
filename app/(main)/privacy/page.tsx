import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 - 공깍지',
};

const SERVICE_NAME = '공깍지';
const CONTACT_EMAIL = 'axtech@goldenplanet.co.kr';
const EFFECTIVE_DATE = '2026년 4월 28일';

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 text-sm leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">개인정보처리방침</h1>
        <p className="text-muted-foreground">시행일: {EFFECTIVE_DATE}</p>
      </header>

      <Section title="1. 총칙">
        <p>
          {SERVICE_NAME}(이하 &ldquo;서비스&rdquo;)는 「개인정보 보호법」 등 관련
          법령을 준수하며, 이용자의 개인정보를 보호하기 위해 본 처리방침을
          수립·공개합니다.
        </p>
      </Section>

      <Section title="2. 수집하는 개인정보 항목 및 수집 방법">
        <p>서비스는 다음의 정보를 수집합니다.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">치지직 OAuth 로그인 시</strong>:
            치지직 채널 ID, 채널명, 프로필 이미지 URL, 액세스 토큰, 리프레시 토큰
          </li>
          <li>
            <strong className="text-foreground">서비스 이용 과정에서</strong>:
            게시물·댓글·메시지 내용, 출석 기록, 포인트 내역, 프로필 정보(닉네임,
            소개글, 아바타 이미지)
          </li>
          <li>
            <strong className="text-foreground">자동 수집 정보</strong>: 접속 일시,
            서비스 이용 기록, 쿠키(세션 인증용)
          </li>
        </ul>
        <p className="mt-2">
          개인정보는 치지직 OAuth 인증 및 이용자가 직접 서비스에 입력·게시하는
          방식으로 수집됩니다. 서비스는 치지직으로부터 이메일, 실명, 연락처 등
          민감정보를 수집하지 않습니다.
        </p>
      </Section>

      <Section title="3. 개인정보의 수집 및 이용 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원 식별 및 로그인 처리</li>
          <li>
            팬 커뮤니티 기능(게시판, 스토리, 메시지, 출석, 포인트) 제공 및 운영
          </li>
          <li>이용자 본인 확인 및 부정이용 방지</li>
          <li>서비스 운영·개선을 위한 통계 분석</li>
          <li>서비스 관련 공지사항 전달</li>
        </ul>
      </Section>

      <Section title="4. 개인정보의 보유 및 이용기간">
        <p>
          서비스는 이용자의 회원 탈퇴 또는 서비스 종료 시까지 개인정보를 보유하며,
          탈퇴·종료 후에는 지체 없이 파기합니다. 단, 관련 법령에 따라 보존이
          필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
        </p>
      </Section>

      <Section title="5. 개인정보의 제3자 제공">
        <p>
          서비스는 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 다음의
          경우에는 예외로 합니다.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 따르거나 수사기관의 적법한 요청이 있는 경우</li>
        </ul>
      </Section>

      <Section title="6. 개인정보 처리의 위탁">
        <p>
          서비스는 안정적인 운영을 위해 다음의 외부 업체에 개인정보 처리를
          위탁하고 있습니다.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Supabase, Inc.</strong> — 인증,
            데이터베이스, 파일 스토리지 호스팅
          </li>
          <li>
            <strong className="text-foreground">NAVER Corp. (치지직)</strong> —
            OAuth 인증 및 채널 정보 조회
          </li>
        </ul>
      </Section>

      <Section title="7. 이용자의 권리와 행사 방법">
        <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리 정지 요구</li>
        </ul>
        <p className="mt-2">
          위 권리 행사는 서비스 내 프로필 페이지에서 직접 수정·삭제하거나, 아래
          연락처를 통해 요청할 수 있습니다.
        </p>
      </Section>

      <Section title="8. 개인정보의 안전성 확보 조치">
        <ul className="list-disc space-y-1 pl-5">
          <li>비밀번호 등 인증정보의 암호화 저장</li>
          <li>전송 구간 SSL/TLS 암호화</li>
          <li>접근 권한 최소화 및 접근 통제</li>
          <li>개인정보 처리 시스템에 대한 접근 기록 보관</li>
        </ul>
      </Section>

      <Section title="9. 쿠키의 사용">
        <p>
          서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다. 이용자는 브라우저
          설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부 서비스 이용이
          제한될 수 있습니다.
        </p>
      </Section>

      <Section title="10. 개인정보 보호책임자">
        <p>
          서비스는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 관련 문의·불만
          처리·피해 구제를 위해 아래와 같이 보호책임자를 지정하고 있습니다.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>이메일:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
              {CONTACT_EMAIL}
            </a>
          </li>
        </ul>
      </Section>

      <Section title="11. 처리방침의 변경">
        <p>
          본 처리방침이 변경되는 경우 서비스는 변경사항을 적용일 7일 전부터
          서비스 화면에 공지합니다.
        </p>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </section>
  );
}

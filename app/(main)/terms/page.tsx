import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 - 공깍지',
};

const SERVICE_NAME = '공깍지';
const STREAMER_NAME = '공으니';
const CONTACT_EMAIL = 'axtech@goldenplanet.co.kr';
const EFFECTIVE_DATE = '2026년 4월 28일';

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 text-sm leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">이용약관</h1>
        <p className="text-muted-foreground">시행일: {EFFECTIVE_DATE}</p>
      </header>

      <Section title="제1조 (목적)">
        <p>
          본 약관은 {SERVICE_NAME}(이하 &ldquo;서비스&rdquo;)가 제공하는 {STREAMER_NAME}{' '}
          스트리머의 팬 커뮤니티 서비스 이용과 관련하여 서비스와 이용자 간의 권리,
          의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </Section>

      <Section title="제2조 (정의)">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            &ldquo;서비스&rdquo;란 {SERVICE_NAME}가 제공하는 모든 기능
            (커뮤니티 게시판, 스토리, 메시지, 출석, 포인트 등)을 말합니다.
          </li>
          <li>
            &ldquo;이용자&rdquo;란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.
          </li>
          <li>
            &ldquo;치지직 계정&rdquo;이란 NAVER Corp.가 운영하는 치지직(CHZZK)에서
            발급받은 계정을 의미합니다.
          </li>
        </ol>
      </Section>

      <Section title="제3조 (약관의 게시와 개정)">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            서비스는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 화면에
            게시합니다.
          </li>
          <li>
            서비스는 관련 법령을 위반하지 않는 범위에서 본 약관을 개정할 수 있으며,
            개정 시 적용일자와 개정사유를 명시하여 적용일자 7일 전부터 공지합니다.
          </li>
        </ol>
      </Section>

      <Section title="제4조 (회원가입 및 계정)">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            서비스는 치지직 계정을 통한 OAuth 로그인 방식으로만 가입을 허용합니다.
          </li>
          <li>
            이용자는 치지직 로그인 시 서비스에 본인의 채널 ID, 채널명, 프로필
            이미지 정보를 제공하는 데 동의한 것으로 간주됩니다.
          </li>
          <li>
            이용자는 자신의 계정을 타인에게 양도하거나 대여할 수 없습니다.
          </li>
        </ol>
      </Section>

      <Section title="제5조 (서비스 이용)">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            이용자는 서비스가 제공하는 기능을 본 약관 및 관련 법령이 정한 범위
            안에서 자유롭게 이용할 수 있습니다.
          </li>
          <li>
            이용자는 다음 행위를 해서는 안 됩니다.
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>타인의 명예를 훼손하거나 모욕하는 행위</li>
              <li>음란물·폭력적 콘텐츠 등 미풍양속에 반하는 정보의 게시</li>
              <li>스팸·광고·도배·자동화된 수단을 이용한 게시</li>
              <li>저작권 등 타인의 권리를 침해하는 행위</li>
              <li>서비스 운영을 방해하거나 시스템에 부정 접근하는 행위</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section title="제6조 (게시물의 권리와 책임)">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            이용자가 서비스에 게시한 게시물의 저작권은 해당 이용자에게 귀속됩니다.
          </li>
          <li>
            이용자는 본인이 게시한 게시물에 대해 모든 책임을 지며, 서비스는 관련
            법령 또는 본 약관을 위반하는 게시물을 사전 통지 없이 삭제하거나
            노출을 제한할 수 있습니다.
          </li>
        </ol>
      </Section>

      <Section title="제7조 (서비스의 중단 및 종료)">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            서비스는 시스템 점검, 보수, 교체, 운영상의 사유로 서비스 제공을 일시
            중단할 수 있습니다.
          </li>
          <li>
            서비스는 사전 공지 후 서비스 전부 또는 일부를 종료할 수 있으며,
            종료 시 보유한 이용자 데이터는 관련 법령에 따라 처리합니다.
          </li>
        </ol>
      </Section>

      <Section title="제8조 (면책조항)">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            서비스는 천재지변, 전쟁, 통신망 장애 등 불가항력으로 인한 서비스
            중단에 대해 책임을 지지 않습니다.
          </li>
          <li>
            서비스는 이용자가 게시한 정보·자료의 신뢰도, 정확성에 대해 책임을
            지지 않습니다.
          </li>
          <li>
            서비스는 치지직 등 제3자 플랫폼의 정책 변경 또는 장애로 인한 서비스
            영향에 대해 책임을 지지 않습니다.
          </li>
        </ol>
      </Section>

      <Section title="제9조 (분쟁 해결)">
        <p>
          본 약관과 관련하여 분쟁이 발생한 경우, 서비스와 이용자는 신의에 따라
          성실히 협의하여 해결합니다. 협의가 이루어지지 않을 경우 관련 법령 및
          상관례에 따릅니다.
        </p>
      </Section>

      <Section title="문의">
        <p>
          본 약관에 관한 문의는 아래 이메일로 연락해 주시기 바랍니다.
          <br />
          이메일:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
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

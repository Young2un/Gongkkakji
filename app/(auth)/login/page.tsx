import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-sm text-muted-foreground">
            치지직 계정으로 간편하게 시작하세요
          </p>
        </div>

        {searchParams.error && (
          <div className="rounded-lg border border-live/50 bg-live/10 p-3 text-sm text-live">
            로그인 중 오류가 발생했어요. 다시 시도해주세요.
          </div>
        )}

        <a href="/api/auth/chzzk/login" className="block">
          <Button variant="accent" size="lg" className="w-full">
            치지직으로 로그인
          </Button>
        </a>

        <p className="text-center text-xs text-muted-foreground">
          로그인 시{' '}
          <Link href="/terms" className="underline">
            이용약관
          </Link>
          과{' '}
          <Link href="/privacy" className="underline">
            개인정보처리방침
          </Link>
          에 동의합니다.
        </p>
      </div>
    </main>
  );
}

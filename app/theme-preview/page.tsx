import Link from 'next/link';
import { Calendar, Radio, Cake, Play, MessageSquare, ArrowRight, Megaphone } from 'lucide-react';

interface Palette {
  id: string;
  name: string;
  vibe: string;
  desc: string;
  mode: 'dark' | 'light';
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  accent: string;
}

const PALETTES: Palette[] = [
  {
    id: 'A',
    name: 'A — 자연스러운 콩깍지',
    vibe: '친근 / 따뜻',
    desc: '부드러운 라임 + 따뜻한 오렌지 (다크).',
    mode: 'dark',
    bg: '#0a0a0c',
    surface: 'rgba(255,255,255,0.03)',
    surfaceAlt: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.6)',
    primary: '#8BC34A',
    accent: '#F99E1A',
  },
  {
    id: 'B',
    name: 'B — 게이밍 콩깍지',
    vibe: '강렬 / 비비드',
    desc: '네온 그린 + 비비드 오렌지 (다크).',
    mode: 'dark',
    bg: '#06060a',
    surface: 'rgba(255,255,255,0.03)',
    surfaceAlt: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.6)',
    primary: '#7CFC00',
    accent: '#FF8500',
  },
  {
    id: 'C',
    name: 'C — 코지 베이지',
    vibe: '아늑 / 일러스트북',
    desc: '크림 베이지 + 따뜻한 브라운 + 세이지 (라이트).',
    mode: 'light',
    bg: '#FAF6E8',
    surface: '#FFFFFF',
    surfaceAlt: '#F4EED8',
    border: '#E5DCC0',
    text: '#2A2118',
    textMuted: '#6B5D4A',
    primary: '#6B4423',
    accent: '#9CAF88',
  },
  {
    id: 'D',
    name: 'D — 핑크 포워드 (다크닝)',
    vibe: '뉴진스 / 트와이스 무드',
    desc: '깊은 다크 베이스 + 도드라지는 코랄 핑크 + 세이지.',
    mode: 'dark',
    bg: '#0c0810',
    surface: 'rgba(255,255,255,0.035)',
    surfaceAlt: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.6)',
    primary: '#FF6B9D',
    accent: '#9CAF88',
  },
  {
    id: 'E',
    name: 'E — 모노톤 + 그린',
    vibe: '미니멀 / SaaS',
    desc: '거의 흑백 베이스 + 비비드 그린 강조 (다크).',
    mode: 'dark',
    bg: '#0c0c0c',
    surface: 'rgba(255,255,255,0.04)',
    surfaceAlt: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.1)',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.6)',
    primary: '#00C853',
    accent: '#ffffff',
  },
  {
    id: 'W-A',
    name: 'W-A — 화이트 (그린/오렌지)',
    vibe: '깨끗 / 카페',
    desc: 'A안의 라이트 모드 버전. 화이트 배경 + 진한 그린.',
    mode: 'light',
    bg: '#FFFFFF',
    surface: '#FAFAF7',
    surfaceAlt: '#F0F4EC',
    border: '#E5E7E0',
    text: '#1a1a1a',
    textMuted: '#666666',
    primary: '#689F38',
    accent: '#F57C00',
  },
  {
    id: 'W-D',
    name: 'W-D — 화이트 (핑크)',
    vibe: '여성 팬덤 / 라이트',
    desc: 'D안의 라이트 버전. 화이트 베이스 + 진한 코랄.',
    mode: 'light',
    bg: '#FFFAFB',
    surface: '#FFFFFF',
    surfaceAlt: '#FCEEF2',
    border: '#F0DDE3',
    text: '#1a1a1a',
    textMuted: '#7a6d72',
    primary: '#E91E63',
    accent: '#689F38',
  },
  {
    id: 'W-E',
    name: 'W-E — 화이트 모노 + 틸',
    vibe: '미니멀 / 라이트',
    desc: '화이트 + 그레이 + 틸그린 단일 강조.',
    mode: 'light',
    bg: '#FFFFFF',
    surface: '#F8F8F8',
    surfaceAlt: '#F0F0F0',
    border: '#E0E0E0',
    text: '#0a0a0a',
    textMuted: '#666666',
    primary: '#00897B',
    accent: '#0a0a0a',
  },
];

function withAlpha(hex: string, alpha: number): string {
  // hex = #RRGGBB or rgba(...)
  if (hex.startsWith('rgba')) return hex;
  if (hex.startsWith('#')) {
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${hex}${a}`;
  }
  return hex;
}

function Sample({ p }: { p: Palette }) {
  const isLight = p.mode === 'light';
  const liveBg = withAlpha('#FF3B30', 0.12);
  const liveBorder = withAlpha('#FF3B30', 0.3);

  return (
    <div
      className="rounded-3xl border p-5 shadow-2xl"
      style={{ background: p.bg, borderColor: p.border, color: p.text }}
    >
      {/* 팔레트 헤더 */}
      <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b" style={{ borderColor: p.border }}>
        <div>
          <h2 className="text-lg font-black leading-tight" style={{ color: p.text }}>
            {p.name}
          </h2>
          <p className="text-xs" style={{ color: p.textMuted }}>
            {p.desc}
          </p>
          <span
            className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold border"
            style={{
              borderColor: p.border,
              background: p.surfaceAlt,
              color: p.textMuted,
            }}
          >
            {p.vibe} · {isLight ? '라이트' : '다크'}
          </span>
        </div>
        <div className="flex gap-1 shrink-0">
          <span className="h-7 w-7 rounded-full border" style={{ background: p.primary, borderColor: p.border }} title={p.primary} />
          <span className="h-7 w-7 rounded-full border" style={{ background: p.accent, borderColor: p.border }} title={p.accent} />
        </div>
      </div>

      {/* 모의 헤더/네비 */}
      <div
        className="flex items-center justify-between rounded-xl border px-3 py-2 mb-3"
        style={{ borderColor: p.border, background: p.surface }}
      >
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon-180.png" alt="" className="h-7 w-7 object-contain" />
          <span className="text-sm font-black" style={{ color: p.text }}>공깍지</span>
        </div>
        <nav className="flex items-center gap-1 text-xs">
          <span
            className="rounded-md px-2.5 py-1.5 font-bold"
            style={{ color: p.primary, background: withAlpha(p.primary, 0.12) }}
          >
            공은talk
          </span>
          <span className="rounded-md px-2.5 py-1.5 font-medium" style={{ color: p.textMuted }}>공지</span>
          <span className="rounded-md px-2.5 py-1.5 font-medium" style={{ color: p.textMuted }}>자유</span>
          <span className="rounded-md px-2.5 py-1.5 font-medium" style={{ color: p.textMuted }}>일정</span>
        </nav>
      </div>

      {/* 히어로 미니 */}
      <div
        className="relative overflow-hidden rounded-2xl border p-4 mb-3"
        style={{ borderColor: p.border, background: p.surface }}
      >
        <div
          className="absolute -top-8 -right-8 h-40 w-40 rounded-full blur-3xl opacity-40"
          style={{ background: p.primary }}
        />
        {/* 캐릭터 일러스트 (favicon-180) */}
        <div className="absolute -right-2 -bottom-3 h-28 w-28 sm:h-32 sm:w-32 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon-180.png"
            alt=""
            className="h-full w-full object-contain drop-shadow-2xl"
          />
        </div>
        <div className="relative space-y-2 pr-20 sm:pr-24">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold"
            style={{ color: '#FF3B30', borderColor: liveBorder, background: liveBg }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
            ON AIR
          </div>
          <h3 className="text-2xl font-black tracking-tighter" style={{ color: p.text }}>
            김공은
            <br />
            <span style={{ color: p.primary }}>공식 팬카페</span>
          </h3>
          <div className="flex gap-2 pt-1">
            <button
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
              style={{ background: p.primary, color: isLight ? '#fff' : (p.id === 'B' ? '#000' : '#fff') }}
            >
              <Play className="h-3 w-3 fill-current" />
              방송 보러가기
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
              style={{ borderColor: p.border, background: p.surfaceAlt, color: p.text }}
            >
              <MessageSquare className="h-3 w-3" />
              자유게시판
            </button>
          </div>
        </div>
      </div>

      {/* 일정 위젯 */}
      <div
        className="rounded-2xl border p-4 mb-3"
        style={{ borderColor: p.border, background: p.surface }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: p.primary }}>
            <Calendar className="h-4 w-4" />
            다가오는 일정
          </div>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: p.textMuted }}>
            전체 보기 <ArrowRight className="h-2.5 w-2.5" />
          </span>
        </div>

        <div className="space-y-2">
          <div
            className="flex items-center gap-2 rounded-xl border p-2.5"
            style={{
              borderColor: withAlpha(p.primary, 0.25),
              background: withAlpha(p.primary, 0.06),
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: withAlpha(p.primary, 0.2), color: p.primary }}
            >
              <Radio className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-bold" style={{ color: p.text }}>오늘 9시 OW 랭크</p>
              <p className="text-[10px]" style={{ color: p.textMuted }}>5월 1일 (금) · 21:00</p>
            </div>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: p.surfaceAlt, color: p.textMuted }}
            >
              D-1
            </span>
          </div>

          <div
            className="flex items-center gap-2 rounded-xl border p-2.5"
            style={{
              borderColor: withAlpha(p.accent, 0.25),
              background: withAlpha(p.accent, 0.06),
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: withAlpha(p.accent, 0.2), color: p.accent }}
            >
              <Cake className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold" style={{ color: p.text }}>김공은 생일</p>
                <span
                  className="rounded px-1 py-0.5 text-[9px] font-bold"
                  style={{ background: p.surfaceAlt, color: p.textMuted }}
                >
                  3주년
                </span>
              </div>
              <p className="text-[10px]" style={{ color: p.textMuted }}>5월 14일 (목)</p>
            </div>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: p.surfaceAlt, color: p.textMuted }}
            >
              D-14
            </span>
          </div>
        </div>
      </div>

      {/* 버튼 종류 */}
      <div
        className="rounded-2xl border p-4 mb-3 space-y-3"
        style={{ borderColor: p.border, background: p.surface }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: p.textMuted }}>
          버튼 / 강조
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-lg px-3 py-1.5 text-xs font-bold"
            style={{ background: p.primary, color: p.id === 'B' ? '#000' : (p.id === 'E' ? '#000' : '#fff') }}
          >
            Primary
          </button>
          <button
            className="rounded-lg px-3 py-1.5 text-xs font-bold"
            style={{ background: p.accent, color: p.id === 'E' ? p.bg : (isLight ? '#fff' : '#fff') }}
          >
            Accent
          </button>
          <button
            className="rounded-lg border px-3 py-1.5 text-xs font-bold"
            style={{ borderColor: withAlpha(p.primary, 0.5), color: p.primary, background: 'transparent' }}
          >
            Outline
          </button>
          <span
            className="rounded-md px-2 py-1 text-[10px] font-bold"
            style={{ background: withAlpha(p.primary, 0.12), color: p.primary }}
          >
            태그/뱃지
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span style={{ color: p.primary }}>→ Primary 텍스트</span>
          <span style={{ color: p.accent }}>→ Accent 텍스트</span>
        </div>
      </div>

      {/* 공지 카드 */}
      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: p.border, background: p.surface }}
      >
        <div className="mb-3 flex items-center gap-1.5 text-sm font-bold" style={{ color: p.primary }}>
          <Megaphone className="h-4 w-4" />
          최신 공지사항
        </div>
        <div
          className="rounded-xl border p-3"
          style={{ borderColor: withAlpha(p.primary, 0.15), background: withAlpha(p.primary, 0.05) }}
        >
          <p className="text-sm font-bold" style={{ color: p.text }}>5월 정기 방송 일정 안내</p>
          <p className="mt-1 text-[11px]" style={{ color: p.textMuted }}>3시간 전</p>
        </div>
      </div>
    </div>
  );
}

export default function ThemePreview() {
  const dark = PALETTES.filter((p) => p.mode === 'dark');
  const light = PALETTES.filter((p) => p.mode === 'light');

  return (
    <div className="min-h-screen bg-[#06060a] p-4 sm:p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-2">
          <Link href="/" className="text-xs text-white/50 hover:text-white">
            ← 돌아가기
          </Link>
          <h1 className="text-3xl font-black tracking-tighter text-white">테마 프리뷰</h1>
          <p className="text-sm text-white/60">
            8개 팔레트. 다크 5종 / 라이트 3종. 마음에 드는 ID 알려주시면 (예: <code className="rounded bg-white/10 px-1">C</code>, <code className="rounded bg-white/10 px-1">W-D</code>) 실제 테마로 적용할게요.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80 border-l-4 border-white/30 pl-3">
            🌙 다크 모드 ({dark.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {dark.map((p) => <Sample key={p.id} p={p} />)}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80 border-l-4 border-white/30 pl-3">
            ☀️ 라이트 모드 ({light.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {light.map((p) => <Sample key={p.id} p={p} />)}
          </div>
        </section>

        <footer className="pt-4 text-center text-xs text-white/40">
          ⚠️ 비교용 프리뷰입니다. 실제 사이트는 아직 안 바뀌었어요.
        </footer>
      </div>
    </div>
  );
}

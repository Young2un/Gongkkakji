'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  colorForIndex,
  type RouletteItemRow,
} from '@/lib/roulette';

interface Props {
  items: RouletteItemRow[];
  /** "이 항목에서 멈춰라" 신호. id 바뀔 때마다 새 회전 시작. */
  spinKey?: string | null;
  resultItemId?: string | null;
  spinDurationMs?: number;
  /** 회전 끝났을 때 호출 */
  onSpinEnd?: () => void;
  /** 가로 크기 (px). */
  size?: number;
  /** OBS 오버레이 모드일 때 외곽 그림자 강조 */
  overlay?: boolean;
}

const CONFETTI_COLORS = [
  '#1FE89E',
  '#FFD66B',
  '#FF6B9D',
  '#5BCEFA',
  '#C792EA',
  '#FF8A65',
];

/**
 * 1열 카지노 잭팟 슬롯머신 — 풀 화려 버전.
 * - 라벨이 위→아래로 흘러가다가 결과 라벨이 가운데 칸에 멈춤.
 * - 무지개 그라데이션 보더 + 마퀴 체이스 라이트 + 모서리 스파클 + 안착 시 컨페티 폭발.
 */
export function JackpotReel({
  items,
  spinKey,
  resultItemId,
  spinDurationMs = 5000,
  onSpinEnd,
  size = 360,
  overlay = false,
}: Props) {
  const rowH = Math.max(64, Math.round(size * 0.24));
  const viewportH = rowH * 3;
  const width = size;
  const fontSize = Math.max(18, Math.min(38, rowH * 0.46));

  // 결과까지 도달할 만큼 충분히 긴 strip.
  const strip = useMemo(() => {
    if (items.length === 0) return [] as RouletteItemRow[];
    const repeats = 14;
    const list: RouletteItemRow[] = [];
    for (let r = 0; r < repeats; r++) {
      for (const it of items) list.push(it);
    }
    const resultIdx = resultItemId
      ? items.findIndex((it) => it.id === resultItemId)
      : -1;
    if (resultIdx >= 0) list.push(items[resultIdx]);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, spinKey]);

  const resultStripIndex = useMemo(() => {
    if (!resultItemId || strip.length === 0) return -1;
    return strip.length - 1;
  }, [strip, resultItemId]);

  const [offset, setOffset] = useState(0);
  const [progress, setProgress] = useState(1);
  const [landed, setLanded] = useState(false);
  const onEndRef = useRef(onSpinEnd);
  onEndRef.current = onSpinEnd;

  useEffect(() => {
    if (!spinKey || resultStripIndex < 0) return;

    const target = rowH * (1 - resultStripIndex);
    const from = 0;
    setOffset(from);
    setProgress(0);
    setLanded(false);

    const startTime = performance.now();
    let rafId = 0;
    let finished = false;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / spinDurationMs);
      setOffset(from + (target - from) * ease(t));
      setProgress(t);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        finished = true;
        setLanded(true);
        onEndRef.current?.();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (!finished) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey, resultStripIndex, rowH, spinDurationMs]);

  useEffect(() => {
    if (!landed) return;
    const t = setTimeout(() => setLanded(false), 1400);
    return () => clearTimeout(t);
  }, [landed]);

  if (items.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-3xl border border-dashed border-white/20 text-sm text-muted-foreground"
        style={{ width: width + 32, height: viewportH + 32 }}
      >
        항목이 없어요
      </div>
    );
  }

  // 다음 회전이 시작되기 전까지 마지막 결과 위치를 유지.
  // (spinKey가 null이어도 offset을 그대로 사용해서 가운데 칸에 결과가 박혀있게 함)
  const finalOffset = offset;
  const blur = Math.max(0, Math.pow(1 - progress, 1.7)) * 5;

  // 마퀴 체이스 라이트 점 위치 (외곽 둘레)
  const marqueeDots: { side: 'top' | 'bottom' | 'left' | 'right'; pos: number; idx: number }[] = [];
  const TOP_COUNT = 14;
  const SIDE_COUNT = 6;
  let dotIdx = 0;
  for (let i = 0; i < TOP_COUNT; i++) marqueeDots.push({ side: 'top', pos: i / (TOP_COUNT - 1), idx: dotIdx++ });
  for (let i = 0; i < SIDE_COUNT; i++) marqueeDots.push({ side: 'right', pos: i / (SIDE_COUNT - 1), idx: dotIdx++ });
  for (let i = TOP_COUNT - 1; i >= 0; i--) marqueeDots.push({ side: 'bottom', pos: i / (TOP_COUNT - 1), idx: dotIdx++ });
  for (let i = SIDE_COUNT - 1; i >= 0; i--) marqueeDots.push({ side: 'left', pos: i / (SIDE_COUNT - 1), idx: dotIdx++ });
  const totalDots = marqueeDots.length;

  // 스파클 (모서리/주변 장식)
  const sparkles = [
    { top: -8, left: -8, size: 18, delay: 0 },
    { top: -10, right: -6, size: 22, delay: 0.3 },
    { bottom: -8, left: -10, size: 20, delay: 0.6 },
    { bottom: -6, right: -8, size: 16, delay: 0.9 },
    { top: '38%', left: -14, size: 14, delay: 0.45 },
    { top: '38%', right: -14, size: 14, delay: 0.15 },
  ];

  // 컨페티 — 안착 시 12개가 사방으로 터짐
  const confetti = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i / 14) * 360 + (i % 2 ? 0 : 12);
    const dist = 120 + (i % 3) * 30;
    return {
      angle,
      dist,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: (i % 4) * 0.04,
    };
  });

  return (
    <div
      className="relative inline-block"
      style={{ padding: 18 }}
    >
      {/* 모서리/주변 스파클 */}
      {sparkles.map((s, i) => (
        <div
          key={`sp-${i}`}
          className="pointer-events-none absolute"
          style={{
            ...s,
            width: s.size,
            height: s.size,
            animation: `jackpot-sparkle 2.2s ease-in-out ${s.delay}s infinite`,
          }}
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path
              d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"
              fill="#FFE36B"
              stroke="#fff"
              strokeWidth={0.5}
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,227,107,0.8))' }}
            />
          </svg>
        </div>
      ))}

      {/* 외곽: 무지개 회전 그라데이션 보더 */}
      <div
        className="relative rounded-3xl"
        style={{
          padding: 5,
          background:
            'conic-gradient(from 0deg, #FF6B9D, #FFD66B, #1FE89E, #5BCEFA, #C792EA, #FF8A65, #FF6B9D)',
          animation: 'jackpot-frame-rotate 6s linear infinite',
          boxShadow: overlay
            ? '0 30px 80px rgba(0,0,0,0.6), 0 0 80px rgba(31,232,158,0.25), 0 0 120px rgba(255,107,157,0.18)'
            : '0 0 40px rgba(31,232,158,0.25), 0 0 80px rgba(255,107,157,0.15)',
        }}
      >
        {/* 검은 이너 베젤 (회전 그라데이션은 위 div에만 적용) */}
        <div
          className="rounded-[22px]"
          style={{
            padding: 3,
            background:
              'linear-gradient(180deg, #1a1a24 0%, #0a0a10 50%, #1a1a24 100%)',
            position: 'relative',
          }}
        >
          {/* 마퀴 체이스 라이트 (베젤 위 점들) */}
          {marqueeDots.map((d, i) => {
            const offset = 4;
            const style: React.CSSProperties = {
              position: 'absolute',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fff 0%, #FFE36B 40%, #FF8A65 100%)',
              boxShadow: '0 0 6px rgba(255,227,107,0.9), 0 0 12px rgba(255,138,101,0.5)',
              animation: `jackpot-chase ${(totalDots * 0.055).toFixed(2)}s linear ${(i * -0.055).toFixed(3)}s infinite`,
            };
            if (d.side === 'top') {
              style.top = offset;
              style.left = `calc(${(d.pos * 100).toFixed(2)}% - 2.5px)`;
            } else if (d.side === 'bottom') {
              style.bottom = offset;
              style.left = `calc(${(d.pos * 100).toFixed(2)}% - 2.5px)`;
            } else if (d.side === 'left') {
              style.left = offset;
              style.top = `calc(${(d.pos * 100).toFixed(2)}% - 2.5px)`;
            } else {
              style.right = offset;
              style.top = `calc(${(d.pos * 100).toFixed(2)}% - 2.5px)`;
            }
            return <div key={`m-${i}`} style={style} />;
          })}

          {/* 릴 본체 */}
          <div
            className="relative overflow-hidden rounded-[20px]"
            style={{
              width,
              height: viewportH,
              background:
                'radial-gradient(ellipse at center, #1a0f24 0%, #0a0612 50%, #050309 100%)',
            }}
          >
            {/* 배경 텍스처: 방사형 빛 (회전) */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'conic-gradient(from 0deg, rgba(31,232,158,0.08), rgba(255,107,157,0.06), rgba(91,206,250,0.08), rgba(255,214,107,0.06), rgba(31,232,158,0.08))',
                animation: 'jackpot-bg-spin 14s linear infinite',
                mixBlendMode: 'screen',
              }}
            />

            {/* 라벨 스트립 */}
            <div
              style={{
                transform: `translateY(${finalOffset}px)`,
                filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                willChange: 'transform, filter',
              }}
            >
              {strip.map((it, i) => {
                const palette = items.findIndex((x) => x.id === it.id);
                const bg = colorForIndex(palette < 0 ? i : palette, it.color);
                return (
                  <div
                    key={`${it.id}-${i}`}
                    className="relative flex items-center justify-center overflow-hidden px-4"
                    style={{
                      height: rowH,
                      background: bg,
                      color: '#0a0a0a',
                      fontWeight: 900,
                      fontSize,
                      letterSpacing: '-0.02em',
                      textShadow:
                        '0 1px 0 rgba(255,255,255,0.55), 0 0 2px rgba(0,0,0,0.3)',
                      borderBottom: '1px solid rgba(0,0,0,0.25)',
                    }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 42%, rgba(0,0,0,0.25) 100%)',
                      }}
                    />
                    {/* 좌우 작은 별 액센트 */}
                    <span
                      className="pointer-events-none absolute"
                      style={{ left: 10, opacity: 0.35 }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24">
                        <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="#fff" />
                      </svg>
                    </span>
                    <span
                      className="pointer-events-none absolute"
                      style={{ right: 10, opacity: 0.35 }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24">
                        <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="#fff" />
                      </svg>
                    </span>
                    <span
                      className="relative z-10"
                      style={{
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {it.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 위/아래 페이드 */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{
                height: rowH,
                background:
                  'linear-gradient(to bottom, rgba(5,3,9,0.97) 0%, rgba(5,3,9,0.6) 60%, rgba(5,3,9,0) 100%)',
              }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{
                height: rowH,
                background:
                  'linear-gradient(to top, rgba(5,3,9,0.97) 0%, rgba(5,3,9,0.6) 60%, rgba(5,3,9,0) 100%)',
              }}
            />

            {/* 가운데 당첨 밴드 — 무지개 색 사이클 보더 + 글로우 */}
            <div
              className="pointer-events-none absolute inset-x-0"
              style={{
                top: rowH,
                height: rowH,
                borderTop: '2px solid #fff',
                borderBottom: '2px solid #fff',
                animation: 'jackpot-line-pulse 1.5s ease-in-out infinite, jackpot-line-hue 4s linear infinite',
              }}
            />

            {/* 안착 시: 컨페티 폭발 */}
            {landed && (
              <>
                <div
                  className="pointer-events-none absolute"
                  style={{
                    top: rowH + rowH / 2,
                    left: '50%',
                    width: 0,
                    height: 0,
                  }}
                >
                  {confetti.map((c, i) => (
                    <span
                      key={i}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 9,
                        height: 9,
                        marginLeft: -4,
                        marginTop: -4,
                        borderRadius: '50%',
                        background: c.color,
                        boxShadow: `0 0 12px ${c.color}`,
                        animation: `jackpot-confetti-${i} 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${c.delay}s forwards`,
                      }}
                    />
                  ))}
                </div>

                {/* 안착 플래시 (radial) */}
                <div
                  className="pointer-events-none absolute inset-x-0"
                  style={{
                    top: rowH,
                    height: rowH,
                    background:
                      'radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(255,227,107,0.6) 25%, rgba(31,232,158,0.4) 50%, rgba(0,0,0,0) 80%)',
                    animation: 'jackpot-win-flash 900ms ease-out forwards',
                    mixBlendMode: 'screen',
                  }}
                />

                {/* 확장 펄스 링 ×2 */}
                <div
                  className="pointer-events-none absolute"
                  style={{
                    top: rowH + rowH / 2,
                    left: '50%',
                    width: 40,
                    height: 40,
                    marginLeft: -20,
                    marginTop: -20,
                    borderRadius: '50%',
                    border: '3px solid rgba(255,227,107,0.9)',
                    animation: 'jackpot-ring 1.1s ease-out forwards',
                  }}
                />
                <div
                  className="pointer-events-none absolute"
                  style={{
                    top: rowH + rowH / 2,
                    left: '50%',
                    width: 40,
                    height: 40,
                    marginLeft: -20,
                    marginTop: -20,
                    borderRadius: '50%',
                    border: '3px solid rgba(31,232,158,0.9)',
                    animation: 'jackpot-ring 1.3s ease-out 0.2s forwards',
                  }}
                />
              </>
            )}

            {/* 위쪽 글래스 반사 */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{
                height: '42%',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
                mixBlendMode: 'screen',
              }}
            />

            {/* 안쪽 베벨 라인 */}
            <div
              className="pointer-events-none absolute rounded-[20px]"
              style={{
                inset: 0,
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.45)',
              }}
            />

            {/* 좌우 화살표 — 더 두툼하게 + 무지개 글로우 */}
            <div
              className="pointer-events-none absolute"
              style={{
                left: 6,
                top: rowH + rowH / 2 - 16,
                animation: 'jackpot-arrow-glow 1.4s ease-in-out infinite',
              }}
            >
              <svg width={28} height={32} viewBox="0 0 28 32">
                <defs>
                  <linearGradient id="jackpot-arrow-l-flashy" x1="0" y1="0" x2="1" y2="0.5">
                    <stop offset="0%" stopColor="#FFE36B" />
                    <stop offset="50%" stopColor="#FF6B9D" />
                    <stop offset="100%" stopColor="#1FE89E" />
                  </linearGradient>
                </defs>
                <path
                  d="M28 16 L2 0 L2 32 Z"
                  fill="url(#jackpot-arrow-l-flashy)"
                  stroke="#fff"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div
              className="pointer-events-none absolute"
              style={{
                right: 6,
                top: rowH + rowH / 2 - 16,
                animation: 'jackpot-arrow-glow 1.4s ease-in-out infinite',
              }}
            >
              <svg width={28} height={32} viewBox="0 0 28 32">
                <defs>
                  <linearGradient id="jackpot-arrow-r-flashy" x1="0" y1="0" x2="1" y2="0.5">
                    <stop offset="0%" stopColor="#1FE89E" />
                    <stop offset="50%" stopColor="#FF6B9D" />
                    <stop offset="100%" stopColor="#FFE36B" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 16 L26 0 L26 32 Z"
                  fill="url(#jackpot-arrow-r-flashy)"
                  stroke="#fff"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes jackpot-frame-rotate {
          0%   { filter: hue-rotate(0deg) saturate(1.2); }
          100% { filter: hue-rotate(360deg) saturate(1.2); }
        }
        @keyframes jackpot-bg-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes jackpot-line-pulse {
          0%, 100% {
            box-shadow:
              0 0 24px rgba(31,232,158,0.5),
              inset 0 0 24px rgba(31,232,158,0.25);
          }
          50% {
            box-shadow:
              0 0 48px rgba(255,227,107,0.85),
              inset 0 0 48px rgba(255,107,157,0.35);
          }
        }
        @keyframes jackpot-line-hue {
          0%   { border-color: #1FE89E; }
          25%  { border-color: #FFE36B; }
          50%  { border-color: #FF6B9D; }
          75%  { border-color: #5BCEFA; }
          100% { border-color: #1FE89E; }
        }
        @keyframes jackpot-win-flash {
          0%   { opacity: 1; transform: scale(0.75); }
          40%  { opacity: 0.9; transform: scale(1.1); }
          100% { opacity: 0;  transform: scale(1.25); }
        }
        @keyframes jackpot-arrow-glow {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(255,227,107,0.7)) drop-shadow(0 0 12px rgba(255,107,157,0.4));
            transform: translateX(0) scale(1);
          }
          50% {
            filter: drop-shadow(0 0 14px rgba(255,227,107,1)) drop-shadow(0 0 24px rgba(31,232,158,0.8));
            transform: translateX(3px) scale(1.08);
          }
        }
        @keyframes jackpot-sparkle {
          0%, 100% { opacity: 0.25; transform: scale(0.6) rotate(0deg); }
          50%      { opacity: 1;    transform: scale(1.1) rotate(180deg); }
        }
        @keyframes jackpot-chase {
          0%, 100% { opacity: 0.25; transform: scale(0.7); }
          10%      { opacity: 1;    transform: scale(1.3); }
          25%      { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes jackpot-ring {
          0%   { opacity: 1; transform: scale(0.3); }
          100% { opacity: 0; transform: scale(8); }
        }
        ${confetti
          .map(
            (c, i) => `
        @keyframes jackpot-confetti-${i} {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          100% {
            transform: translate(${(Math.cos((c.angle * Math.PI) / 180) * c.dist).toFixed(1)}px, ${(Math.sin((c.angle * Math.PI) / 180) * c.dist).toFixed(1)}px) scale(0.4);
            opacity: 0;
          }
        }`
          )
          .join('\n')}
      `}</style>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  colorForIndex,
  totalWeight,
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
  /** 사이즈 (px). 정사각형. */
  size?: number;
  /** OBS 오버레이 모드일 때 외곽 그림자/포인터 색 강조 */
  overlay?: boolean;
}

/**
 * SVG 룰렛 + CSS rotate 애니메이션.
 * - 슬라이스 균등 분할 (가중치 없음 — v1 결정사항)
 * - resultItemId가 들어오면 그 슬라이스 중앙에서 멈추도록 각도 계산
 */
export function RouletteWheel({
  items,
  spinKey,
  resultItemId,
  spinDurationMs = 5000,
  onSpinEnd,
  size = 360,
  overlay = false,
}: Props) {
  const slices = items.length;
  const radius = size / 2;
  const cx = radius;
  const cy = radius;

  // 가중치 합 (0이면 균등으로 대체)
  const sumW = totalWeight(items);
  const effectiveTotal = sumW > 0 ? sumW : slices;

  // 슬라이스 시작각 누적 배열 + 각 슬라이스 각도
  const segments = useMemo(() => {
    let cursor = 0;
    return items.map((it, i) => {
      const w = sumW > 0 ? Math.max(0, it.weight) : 1;
      const sliceDeg = (w / effectiveTotal) * 360;
      const startAngle = cursor;
      const endAngle = cursor + sliceDeg;
      cursor = endAngle;
      const path = arcPath(cx, cy, radius - 4, startAngle, endAngle);
      const labelAngle = startAngle + sliceDeg / 2;
      const labelPos = polar(cx, cy, radius * 0.62, labelAngle);
      return {
        id: it.id,
        label: it.label,
        color: colorForIndex(i, it.color),
        path,
        labelPos,
        labelAngle,
        startAngle,
        sliceDeg,
      };
    });
  }, [items, sumW, effectiveTotal, cx, cy, radius]);

  // 현재 회전 각도. 누적되도록 ref 보관.
  const [rotation, setRotation] = useState(0);
  const baseRotationRef = useRef(0);
  const onEndRef = useRef(onSpinEnd);
  onEndRef.current = onSpinEnd;

  useEffect(() => {
    if (!spinKey || !resultItemId || slices === 0) return;

    const idx = items.findIndex((it) => it.id === resultItemId);
    if (idx < 0) return;
    const seg = segments[idx];
    if (!seg) return;

    // 결과 슬라이스 중앙각 (휠 로컬 프레임, 0이 12시, 시계방향).
    const sliceCenter = seg.startAngle + seg.sliceDeg / 2;
    // 화면각 = (sliceCenter + 회전) mod 360. 슬라이스 중앙을 12시(0도)에
    // 보내려면 최종 회전이 (-sliceCenter) mod 360 이어야 함.
    // 현재 from에서 추가로 돌아야 할 각도 = (-sliceCenter - from) mod 360,
    // 거기에 풀스핀 N바퀴 + 슬라이스 내부 jitter 추가.
    const fullSpins = 6 * 360;
    const jitter = (Math.random() - 0.5) * (seg.sliceDeg * 0.6);
    const from = baseRotationRef.current;
    const mod = (n: number, m: number) => ((n % m) + m) % m;
    const correction = mod(-sliceCenter - from, 360);
    const target = fullSpins + correction + jitter;

    // 누적 회전: 이전 회전값에 더해서 항상 앞으로 돌게.
    const to = from + target;
    baseRotationRef.current = to;

    // 매 프레임 setState로 직접 회전 구동.
    // CSS transition / Web Animations API 둘 다 브라우저/캐시 이슈에
    // 영향받는 케이스가 있어서 가장 단순하고 확실한 rAF 루프 사용.
    const startTime = performance.now();
    let rafId = 0;
    let finished = false;

    // ease-out cubic (시각적으로 cubic-bezier(0.17,0.67,0.3,1)과 비슷)
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / spinDurationMs);
      setRotation(from + (to - from) * ease(t));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        finished = true;
        onEndRef.current?.();
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (!finished) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey]);

  if (slices === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-dashed border-white/20 text-sm text-muted-foreground"
        style={{ width: size, height: size }}
      >
        항목이 없어요
      </div>
    );
  }

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* 외곽 링 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04), rgba(255,255,255,0.18))',
          filter: overlay ? 'drop-shadow(0 8px 30px rgba(0,0,0,0.5))' : undefined,
        }}
      />
      <div className="absolute inset-[6px] rounded-full bg-background">
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '50% 50%',
            willChange: 'transform',
          }}
        >
        <svg
          width={size - 12}
          height={size - 12}
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: 'block' }}
        >
          {segments.map((seg) => (
            <g key={seg.id}>
              <path d={seg.path} fill={seg.color} />
              <g
                transform={`translate(${seg.labelPos.x} ${seg.labelPos.y}) rotate(${
                  seg.labelAngle + 90
                })`}
              >
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#111"
                  fontSize={Math.max(11, Math.min(18, size / 22))}
                  fontWeight={700}
                  style={{ paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.5)', strokeWidth: 2 }}
                >
                  {truncate(seg.label, 10)}
                </text>
              </g>
            </g>
          ))}
          {/* 중앙 캡 */}
          <circle cx={cx} cy={cy} r={radius * 0.13} fill="#0c0c10" />
          <circle
            cx={cx}
            cy={cy}
            r={radius * 0.13}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={2}
          />
        </svg>
        </div>
      </div>

      {/* 12시 포인터 */}
      <div
        className="absolute left-1/2 -top-1 -translate-x-1/2"
        style={{ filter: overlay ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' : undefined }}
      >
        <svg width={32} height={36} viewBox="0 0 32 36">
          <path d="M16 36 L4 6 Q16 0 28 6 Z" fill="#1FE89E" stroke="#fff" strokeWidth={2} />
        </svg>
      </div>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  // 0deg = 12시, 시계방향 증가
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

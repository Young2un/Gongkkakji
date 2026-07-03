'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Check,
  Eraser,
  Loader2,
  Pencil,
  Smile,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 출력 해상도 (9:16)
const OUT_W = 1080;
const OUT_H = 1920;

const COLORS = [
  '#ffffff',
  '#000000',
  '#ff3b30',
  '#ff9500',
  '#ffd60a',
  '#34c759',
  '#0a84ff',
  '#5e5ce6',
  '#ff2d55',
];

const FONTS = [
  {
    key: 'sans',
    label: '기본',
    css: 'system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif',
    weight: 800,
  },
  {
    key: 'serif',
    label: '명조',
    css: 'Georgia, "Nanum Myeongjo", serif',
    weight: 700,
  },
  {
    key: 'mono',
    label: '모노',
    css: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    weight: 700,
  },
  {
    key: 'round',
    label: '라운드',
    css: '"Apple SD Gothic Neo", "Segoe UI", Verdana, sans-serif',
    weight: 900,
  },
] as const;

type FontKey = (typeof FONTS)[number]['key'];

const STICKERS = [
  '❤️', '😂', '😮', '😍', '🔥', '👏', '🎉', '💯',
  '😭', '🥹', '✨', '👍', '🙏', '😎', '🥳', '💜',
];

interface TextLayer {
  id: string;
  kind: 'text';
  text: string;
  x: number; // 0..1 (중심)
  y: number;
  size: number; // 스테이지 높이 대비 폰트 비율
  color: string;
  bg: boolean;
  font: FontKey;
}

interface StickerLayer {
  id: string;
  kind: 'sticker';
  emoji: string;
  x: number;
  y: number;
  size: number; // 스테이지 높이 대비 비율
}

type Layer = TextLayer | StickerLayer;

interface Stroke {
  color: string;
  width: number; // 스테이지 높이 대비 비율
  points: { x: number; y: number }[]; // 0..1
}

interface Props {
  file: File;
  onCancel: () => void;
  onExport: (blob: Blob) => void;
  exporting?: boolean;
}

function hexIsLight(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // 상대 휘도
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6;
}

function contrastOn(hex: string): string {
  return hexIsLight(hex) ? '#000000' : '#ffffff';
}

function fontFor(key: FontKey) {
  return FONTS.find((f) => f.key === key) ?? FONTS[0];
}

// 캔버스 텍스트 줄바꿈 (명시적 \n + 폭 초과 시 어절/글자 단위)
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const out: string[] = [];
  for (const rawLine of text.split('\n')) {
    if (rawLine === '') {
      out.push('');
      continue;
    }
    const words = rawLine.split(' ');
    let line = '';
    const pushChars = (chunk: string) => {
      // 공백 없는 긴 토큰(한글 등) 글자 단위 분해
      let cur = line;
      for (const ch of chunk) {
        const test = cur + ch;
        if (ctx.measureText(test).width > maxWidth && cur !== '') {
          out.push(cur);
          cur = ch;
        } else {
          cur = test;
        }
      }
      line = cur;
    };
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const sep = line === '' ? '' : ' ';
      const test = line + sep + word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else if (ctx.measureText(word).width > maxWidth) {
        // 단어 자체가 폭 초과
        if (line !== '') {
          out.push(line);
          line = '';
        }
        pushChars(word);
      } else {
        if (line !== '') out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

export function StoryEditor({ file, onCancel, onExport, exporting }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [stageH, setStageH] = useState(0);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [penColor, setPenColor] = useState('#ff2d55');
  const [stickerTray, setStickerTray] = useState(false);

  const drawing = useRef<Stroke | null>(null);
  const [liveStroke, setLiveStroke] = useState<Stroke | null>(null);
  const idSeq = useRef(0);
  const nextId = () => `l${idSeq.current++}`;

  const textInputRef = useRef<HTMLInputElement>(null);

  // object URL 로딩
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 스테이지 실제 높이 추적 (폰트 px 계산용)
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStageH(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imgUrl]);

  const selected = layers.find((l) => l.id === selectedId) ?? null;
  const selectedText =
    selected && selected.kind === 'text' ? selected : null;

  const updateLayer = useCallback(
    (id: string, patch: Partial<TextLayer> & Partial<StickerLayer>) => {
      setLayers((prev) =>
        prev.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l))
      );
    },
    []
  );

  const addText = () => {
    setDrawMode(false);
    setStickerTray(false);
    const id = nextId();
    const layer: TextLayer = {
      id,
      kind: 'text',
      text: '',
      x: 0.5,
      y: 0.5,
      size: 0.07,
      color: '#ffffff',
      bg: false,
      font: 'sans',
    };
    setLayers((prev) => [...prev, layer]);
    setSelectedId(id);
    requestAnimationFrame(() => textInputRef.current?.focus());
  };

  const addSticker = (emoji: string) => {
    const id = nextId();
    const layer: StickerLayer = {
      id,
      kind: 'sticker',
      emoji,
      x: 0.5,
      y: 0.45,
      size: 0.14,
    };
    setLayers((prev) => [...prev, layer]);
    setSelectedId(id);
    setStickerTray(false);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setLayers((prev) => prev.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  };

  // ── 레이어 드래그 ──
  const dragState = useRef<{ id: string; moved: boolean } | null>(null);

  const onLayerPointerDown = (e: React.PointerEvent, id: string) => {
    if (drawMode) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { id, moved: false };
    setSelectedId(id);
  };

  const onLayerPointerMove = (e: React.PointerEvent) => {
    const ds = dragState.current;
    const stage = stageRef.current;
    if (!ds || !stage) return;
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    ds.moved = true;
    updateLayer(ds.id, {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    });
  };

  const onLayerPointerUp = (e: React.PointerEvent) => {
    dragState.current = null;
  };

  // ── 그리기 ──
  const stagePoint = (e: React.PointerEvent) => {
    const stage = stageRef.current!;
    const rect = stage.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const onStagePointerDown = (e: React.PointerEvent) => {
    if (drawMode) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const stroke: Stroke = {
        color: penColor,
        width: 0.012,
        points: [stagePoint(e)],
      };
      drawing.current = stroke;
      setLiveStroke({ ...stroke });
      return;
    }
    // 빈 곳 탭 → 선택 해제
    setSelectedId(null);
  };

  const onStagePointerMove = (e: React.PointerEvent) => {
    if (!drawMode || !drawing.current) return;
    drawing.current.points.push(stagePoint(e));
    setLiveStroke({ ...drawing.current, points: [...drawing.current.points] });
  };

  const onStagePointerUp = () => {
    if (drawing.current && drawing.current.points.length > 1) {
      setStrokes((prev) => [...prev, drawing.current!]);
    }
    drawing.current = null;
    setLiveStroke(null);
  };

  const undoStroke = () => setStrokes((prev) => prev.slice(0, -1));

  // ── 합성 & 내보내기 ──
  const handleDone = async () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경 이미지 cover
    const scale = Math.max(OUT_W / img.width, OUT_H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (OUT_W - dw) / 2, (OUT_H - dh) / 2, dw, dh);

    // 그리기
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokes) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width * OUT_H;
      ctx.beginPath();
      s.points.forEach((p, i) => {
        const px = p.x * OUT_W;
        const py = p.y * OUT_H;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // 레이어
    for (const l of layers) {
      if (l.kind === 'sticker') {
        const fs = l.size * OUT_H;
        ctx.font = `${fs}px system-ui, "Apple Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(l.emoji, l.x * OUT_W, l.y * OUT_H);
        continue;
      }
      // text
      const text = l.text.trim();
      if (!text) continue;
      const f = fontFor(l.font);
      const fs = l.size * OUT_H;
      ctx.font = `${f.weight} ${fs}px ${f.css}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const maxW = OUT_W * 0.86;
      const lines = wrapText(ctx, text, maxW);
      const lineH = fs * 1.2;
      const padH = fs * 0.32;
      const padV = fs * 0.14;
      const radius = fs * 0.24;
      const cx = l.x * OUT_W;
      const startY = l.y * OUT_H - ((lines.length - 1) * lineH) / 2;

      lines.forEach((line, i) => {
        const y = startY + i * lineH;
        if (l.bg && line !== '') {
          const w = ctx.measureText(line).width + padH * 2;
          const h = lineH + padV * 2 - (lineH - fs);
          const bx = cx - w / 2;
          const by = y - h / 2;
          ctx.fillStyle = l.color;
          roundRect(ctx, bx, by, w, h, radius);
          ctx.fill();
        }
      });
      lines.forEach((line, i) => {
        const y = startY + i * lineH;
        if (l.bg) {
          ctx.fillStyle = contrastOn(l.color);
        } else {
          ctx.fillStyle = l.color;
          ctx.shadowColor = 'rgba(0,0,0,0.45)';
          ctx.shadowBlur = fs * 0.08;
        }
        ctx.fillText(line, cx, y);
        ctx.shadowBlur = 0;
      });
    }

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), 'image/jpeg', 0.9)
    );
    if (blob) onExport(blob);
  };

  // 스테이지 px 기준 폰트 크기
  const pxSize = (frac: number) => (stageH > 0 ? frac * stageH : frac * 400);

  return (
    <div className="flex h-full w-full flex-col">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={exporting}
          className="rounded-md px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
        >
          취소
        </button>
        <div className="flex items-center gap-1">
          <ToolBtn
            active={!drawMode && stickerTray === false}
            onClick={addText}
            label="텍스트"
          >
            <Type className="h-5 w-5" />
          </ToolBtn>
          <ToolBtn
            active={stickerTray}
            onClick={() => {
              setDrawMode(false);
              setStickerTray((v) => !v);
            }}
            label="스티커"
          >
            <Smile className="h-5 w-5" />
          </ToolBtn>
          <ToolBtn
            active={drawMode}
            onClick={() => {
              setStickerTray(false);
              setSelectedId(null);
              setDrawMode((v) => !v);
            }}
            label="그리기"
          >
            <Pencil className="h-5 w-5" />
          </ToolBtn>
          {strokes.length > 0 && (
            <ToolBtn onClick={undoStroke} label="되돌리기">
              <Undo2 className="h-5 w-5" />
            </ToolBtn>
          )}
        </div>
        <button
          type="button"
          onClick={handleDone}
          disabled={exporting}
          className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          공유
        </button>
      </div>

      {/* 스테이지 */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div
          ref={stageRef}
          className={cn(
            'relative aspect-[9/16] max-h-full w-auto max-w-full select-none overflow-hidden rounded-lg bg-black',
            drawMode ? 'cursor-crosshair' : 'cursor-default'
          )}
          style={{ touchAction: 'none' }}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
        >
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgUrl}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* 그리기 오버레이 */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {[...strokes, ...(liveStroke ? [liveStroke] : [])].map((s, i) => (
              <polyline
                key={i}
                points={s.points
                  .map((p) => `${p.x * 100},${p.y * 100}`)
                  .join(' ')}
                fill="none"
                stroke={s.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ strokeWidth: pxSize(s.width) }}
              />
            ))}
          </svg>

          {/* 레이어 */}
          {layers.map((l) => {
            const common =
              'absolute -translate-x-1/2 -translate-y-1/2 touch-none';
            const isSel = l.id === selectedId;
            if (l.kind === 'sticker') {
              return (
                <div
                  key={l.id}
                  className={cn(
                    common,
                    'leading-none',
                    isSel && !drawMode && 'ring-2 ring-white/70 rounded'
                  )}
                  style={{
                    left: `${l.x * 100}%`,
                    top: `${l.y * 100}%`,
                    fontSize: pxSize(l.size),
                    pointerEvents: drawMode ? 'none' : 'auto',
                  }}
                  onPointerDown={(e) => onLayerPointerDown(e, l.id)}
                  onPointerMove={onLayerPointerMove}
                  onPointerUp={onLayerPointerUp}
                >
                  {l.emoji}
                </div>
              );
            }
            const f = fontFor(l.font);
            return (
              <div
                key={l.id}
                className={cn(
                  common,
                  'max-w-[86%] whitespace-pre-wrap break-words px-[0.32em] py-[0.14em] text-center',
                  isSel && !drawMode && 'outline outline-2 outline-white/60'
                )}
                style={{
                  left: `${l.x * 100}%`,
                  top: `${l.y * 100}%`,
                  fontSize: pxSize(l.size),
                  fontFamily: f.css,
                  fontWeight: f.weight,
                  lineHeight: 1.2,
                  borderRadius: '0.24em',
                  color: l.bg ? contrastOn(l.color) : l.color,
                  background: l.bg ? l.color : 'transparent',
                  textShadow: l.bg ? 'none' : '0 1px 3px rgba(0,0,0,0.45)',
                  pointerEvents: drawMode ? 'none' : 'auto',
                }}
                onPointerDown={(e) => onLayerPointerDown(e, l.id)}
                onPointerMove={onLayerPointerMove}
                onPointerUp={onLayerPointerUp}
              >
                {l.text || '텍스트'}
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div className="space-y-3 px-1 pt-3">
        {/* 스티커 트레이 */}
        {stickerTray && (
          <div className="grid grid-cols-8 gap-1 rounded-lg bg-white/5 p-2">
            {STICKERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSticker(s)}
                className="rounded-md p-1 text-2xl hover:bg-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* 그리기 색 팔레트 */}
        {drawMode && (
          <div className="flex items-center gap-2 overflow-x-auto">
            {COLORS.map((c) => (
              <Swatch
                key={c}
                color={c}
                active={penColor === c}
                onClick={() => setPenColor(c)}
              />
            ))}
            <button
              type="button"
              onClick={() => setStrokes([])}
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10"
            >
              <Eraser className="h-3.5 w-3.5" />
              전체 지우기
            </button>
          </div>
        )}

        {/* 선택된 텍스트 편집 */}
        {selectedText && !drawMode && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                ref={textInputRef}
                value={selectedText.text}
                onChange={(e) =>
                  updateLayer(selectedText.id, { text: e.target.value })
                }
                placeholder="텍스트 입력"
                className="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  updateLayer(selectedText.id, { bg: !selectedText.bg })
                }
                className={cn(
                  'rounded-md px-2.5 py-2 text-sm font-semibold',
                  selectedText.bg
                    ? 'bg-white text-black'
                    : 'border border-white/30 text-white'
                )}
                title="배경"
              >
                A
              </button>
              <button
                type="button"
                onClick={removeSelected}
                className="rounded-md p-2 text-white/70 hover:bg-white/10"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* 색상 */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {COLORS.map((c) => (
                <Swatch
                  key={c}
                  color={c}
                  active={selectedText.color === c}
                  onClick={() => updateLayer(selectedText.id, { color: c })}
                />
              ))}
            </div>

            {/* 글꼴 + 크기 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {FONTS.map((ft) => (
                  <button
                    key={ft.key}
                    type="button"
                    onClick={() => updateLayer(selectedText.id, { font: ft.key })}
                    style={{ fontFamily: ft.css, fontWeight: ft.weight }}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-sm',
                      selectedText.font === ft.key
                        ? 'bg-white text-black'
                        : 'border border-white/20 text-white'
                    )}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={0.04}
                max={0.16}
                step={0.005}
                value={selectedText.size}
                onChange={(e) =>
                  updateLayer(selectedText.id, {
                    size: parseFloat(e.target.value),
                  })
                }
                className="ml-auto flex-1 accent-white"
              />
            </div>
          </div>
        )}

        {/* 선택된 스티커 크기/삭제 */}
        {selected?.kind === 'sticker' && !drawMode && (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.06}
              max={0.35}
              step={0.01}
              value={selected.size}
              onChange={(e) =>
                updateLayer(selected.id, { size: parseFloat(e.target.value) })
              }
              className="flex-1 accent-white"
            />
            <button
              type="button"
              onClick={removeSelected}
              className="rounded-md p-2 text-white/70 hover:bg-white/10"
              title="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'rounded-full p-2 text-white transition-colors',
        active ? 'bg-white/25' : 'hover:bg-white/10'
      )}
    >
      {children}
    </button>
  );
}

function Swatch({
  color,
  active,
  onClick,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 w-7 shrink-0 rounded-full border transition-transform',
        active ? 'scale-110 border-white ring-2 ring-white/60' : 'border-white/40'
      )}
      style={{ backgroundColor: color }}
      aria-label={`색상 ${color}`}
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

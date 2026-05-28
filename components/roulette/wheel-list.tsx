'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Pencil,
  Plus,
  ExternalLink,
  Settings2,
  Radio,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WheelForm } from '@/components/roulette/wheel-form';
import { setActiveWheel, setChannelSlug } from '@/app/actions/roulette';
import { isValidSlug, type RouletteWheelRow } from '@/lib/roulette';

interface WheelWithCount extends RouletteWheelRow {
  item_count: number;
}

interface Props {
  wheels: WheelWithCount[];
  appOrigin: string;
  channelSlug: string | null;
  activeWheelId: string | null;
}

export function WheelList({ wheels, appOrigin, channelSlug, activeWheelId }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RouletteWheelRow | null>(null);

  const overlayUrl = (slug: string) => `${appOrigin}/overlay/${slug}`;
  const liveUrl = channelSlug ? `${appOrigin}/overlay/live/${channelSlug}` : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">방송 룰렛</h1>
          <p className="text-xs text-muted-foreground mt-1">
            룰렛마다 OBS 브라우저 소스 URL이 달라요. 항목은 룰렛별로 따로 관리해요.
          </p>
        </div>
        <Button
          variant="accent"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        className='px-4 '
        >
          <Plus className="h-4 w-4 " />

        </Button>
      </div>

      <LivePanel
        appOrigin={appOrigin}
        channelSlug={channelSlug}
        liveUrl={liveUrl}
        activeWheelId={activeWheelId}
        activeWheelTitle={
          wheels.find((w) => w.id === activeWheelId)?.title ?? null
        }
        onChanged={() => router.refresh()}
      />

      {wheels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            아직 만들어둔 룰렛이 없어요. "새 룰렛" 으로 첫 룰렛을 만들어보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {wheels.map((w) => {
            const isActive = w.id === activeWheelId;
            return (
            <li
              key={w.id}
              className={`rounded-2xl border bg-card p-4 sm:p-5 ${
                isActive ? 'border-accent/60 ring-1 ring-accent/40' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-white truncate">
                      {w.title}
                    </h2>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground font-mono">
                      /{w.slug}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent">
                        <Radio className="h-3 w-3" /> OBS 표시 중
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    항목 {w.item_count}개 · 회전 {Math.round(w.spin_duration_ms / 1000)}초
                    {w.display_mode === 'jackpot' ? ' · 잭팟' : ' · 돌림판'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(w);
                    setFormOpen(true);
                  }}
                  className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="룰렛 설정"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <ActiveToggle
                  wheelId={w.id}
                  isActive={isActive}
                  hasChannelSlug={!!channelSlug}
                  onChanged={() => router.refresh()}
                />
                <CopyButton
                  label="개별 URL 복사"
                  value={overlayUrl(w.slug)}
                />
                <Link
                  href={`/control/${w.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 h-10 text-sm text-white hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" /> 컨트롤
                </Link>
                <Link
                  href={`/admin/roulette/${w.slug}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover px-3 h-10 text-sm font-medium"
                >
                  <Pencil className="h-4 w-4" /> 항목 편집
                </Link>
              </div>
            </li>
            );
          })}
        </ul>
      )}

      {formOpen && (
        <WheelForm
          onClose={() => setFormOpen(false)}
          initial={editing}
        />
      )}
    </div>
  );
}

function LivePanel({
  appOrigin: _appOrigin,
  channelSlug,
  liveUrl,
  activeWheelId,
  activeWheelTitle,
  onChanged,
}: {
  appOrigin: string;
  channelSlug: string | null;
  liveUrl: string | null;
  activeWheelId: string | null;
  activeWheelTitle: string | null;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(!channelSlug);
  const [draft, setDraft] = useState(channelSlug ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    const slug = draft.trim().toLowerCase();
    if (!isValidSlug(slug)) {
      setError('영문 소문자/숫자/하이픈 1~40자만 가능해요');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await setChannelSlug({ slug });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setEditing(false);
      onChanged();
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-bold text-white">OBS 고정 URL</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        한 번 박아두면 끝. 아래 목록에서 "이 룰렛 표시"를 누른 룰렛이 이 URL에 나옵니다.
      </p>

      {editing ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground shrink-0">
              /overlay/live/
            </span>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value.toLowerCase())}
              placeholder="예: maru"
              maxLength={40}
              pattern="[a-z0-9_-]+"
              className="flex-1 rounded-lg border border-white/10 bg-background/60 px-3 py-2 text-sm text-white placeholder:text-muted-foreground/60 focus:border-accent/50 focus:outline-none font-mono"
            />
            <Button
              variant="accent"
              onClick={save}
              disabled={isPending || !draft.trim()}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              저장
            </Button>
            {channelSlug && (
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(channelSlug);
                  setEditing(false);
                  setError(null);
                }}
                disabled={isPending}
              >
                취소
              </Button>
            )}
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-lg border border-white/10 bg-background/60 px-3 py-2 text-xs text-white font-mono">
            {liveUrl}
          </code>
          <div className="flex gap-2">
            <CopyButton label="URL 복사" value={liveUrl ?? ''} />
            <Button
              variant="outline"
              onClick={() => setEditing(true)}
              className="h-10"
            >
              슬러그 변경
            </Button>
          </div>
        </div>
      )}

      <p className="mt-2 text-[11px] text-muted-foreground">
        {activeWheelId
          ? `현재 표시 중: ${activeWheelTitle ?? '(삭제된 룰렛)'}`
          : '아직 표시할 룰렛이 선택되지 않았어요.'}
      </p>
    </div>
  );
}

function ActiveToggle({
  wheelId,
  isActive,
  hasChannelSlug,
  onChanged,
}: {
  wheelId: string;
  isActive: boolean;
  hasChannelSlug: boolean;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!hasChannelSlug) {
      alert('먼저 OBS 고정 URL의 슬러그를 설정해주세요.');
      return;
    }
    startTransition(async () => {
      const res = await setActiveWheel({
        wheelId: isActive ? null : wheelId,
      });
      if ('error' in res && res.error) {
        alert(res.error);
        return;
      }
      onChanged();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 h-10 text-sm transition disabled:opacity-60 ${
        isActive
          ? 'border-accent/60 bg-accent/15 text-accent hover:bg-accent/25'
          : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
      }`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isActive ? (
        <Check className="h-4 w-4" />
      ) : (
        <Radio className="h-4 w-4" />
      )}
      {isActive ? '표시 해제' : '이 룰렛 표시'}
    </button>
  );
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={!value}
      onClick={async () => {
        if (!value) return;
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          window.prompt('URL을 복사하세요', value);
        }
      }}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 h-10 text-sm text-white hover:bg-white/10 disabled:opacity-50"
    >
      {copied ? '복사됨!' : label}
    </button>
  );
}

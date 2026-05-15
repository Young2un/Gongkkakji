'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, ExternalLink, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WheelForm } from '@/components/roulette/wheel-form';
import type { RouletteWheelRow } from '@/lib/roulette';

interface WheelWithCount extends RouletteWheelRow {
  item_count: number;
}

interface Props {
  wheels: WheelWithCount[];
  appOrigin: string;
}

export function WheelList({ wheels, appOrigin }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RouletteWheelRow | null>(null);

  const overlayUrl = (slug: string) => `${appOrigin}/overlay/${slug}`;

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

      {wheels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            아직 만들어둔 룰렛이 없어요. "새 룰렛" 으로 첫 룰렛을 만들어보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {wheels.map((w) => (
            <li
              key={w.id}
              className="rounded-2xl border border-white/10 bg-card p-4 sm:p-5"
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
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    항목 {w.item_count}개 · 회전 {Math.round(w.spin_duration_ms / 1000)}초
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

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <CopyButton
                  label="OBS URL 복사"
                  value={overlayUrl(w.slug)}
                />
                <Link
                  href={`/control/${w.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 h-10 text-sm text-white hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" /> 컨트롤 페이지
                </Link>
                <Link
                  href={`/admin/roulette/${w.slug}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover px-3 h-10 text-sm font-medium"
                >
                  <Pencil className="h-4 w-4" /> 항목 편집
                </Link>
              </div>
            </li>
          ))}
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

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          window.prompt('URL을 복사하세요', value);
        }
      }}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 h-10 text-sm text-white hover:bg-white/10"
    >
      {copied ? '복사됨!' : label}
    </button>
  );
}

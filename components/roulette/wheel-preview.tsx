'use client';

import { RouletteWheel } from '@/components/roulette/roulette-wheel';
import { JackpotReel } from '@/components/roulette/jackpot-reel';
import type { RouletteDisplayMode, RouletteItemRow } from '@/lib/roulette';

interface Props {
  items: RouletteItemRow[];
  displayMode?: RouletteDisplayMode;
}

export function WheelPreview({ items, displayMode = 'wheel' }: Props) {
  return (
    <div className="space-y-2">
      {displayMode === 'jackpot' ? (
        <JackpotReel items={items} size={260} />
      ) : (
        <RouletteWheel items={items} size={260} />
      )}
      <p className="text-center text-[11px] text-muted-foreground">
        편집한 항목 미리보기
      </p>
    </div>
  );
}

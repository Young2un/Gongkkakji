'use client';

import { RouletteWheel } from '@/components/roulette/roulette-wheel';
import type { RouletteItemRow } from '@/lib/roulette';

interface Props {
  items: RouletteItemRow[];
}

export function WheelPreview({ items }: Props) {
  return (
    <div className="space-y-2">
      <RouletteWheel items={items} size={260} />
      <p className="text-center text-[11px] text-muted-foreground">
        편집한 항목 미리보기
      </p>
    </div>
  );
}

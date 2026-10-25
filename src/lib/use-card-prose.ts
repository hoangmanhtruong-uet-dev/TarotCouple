'use client';

import { useEffect, useState } from 'react';
import type { TarotCard } from '@/data/tarot-cards';
import type { TarotCardProse } from '@/data/tarot-card-prose';

const cache = new Map<number, TarotCardProse | undefined>();

/**
 * H8: lazily resolve the heavy Vietnamese prose for a card *only* when a
 * component that needs it mounts. The prose map is code-split via dynamic
 * import so it never enters the initial client bundle of list/draw flows.
 */
export function useCardProse(card: TarotCard | null | undefined): TarotCardProse | undefined {
  const [prose, setProse] = useState<TarotCardProse | undefined>(
    cache.get(card?.id ?? -1)
  );

  useEffect(() => {
    if (!card) return;
    const cached = cache.get(card.id);
    if (cached) {
      setProse(cached);
      return;
    }
    let cancelled = false;
    import('@/data/tarot-card-prose')
      .then((m) => {
        const p = m.getCardProse(card.id);
        cache.set(card.id, p);
        if (!cancelled) setProse(p);
      })
      .catch(() => {
        if (!cancelled) setProse(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [card]);

  return prose;
}

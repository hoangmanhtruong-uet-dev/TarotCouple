'use client';

import { useState, useEffect, useCallback } from 'react';
import type { QuotaStatusPayload } from './api-types';

const DEFAULT_QUOTA: QuotaStatusPayload = {
  usedToday: 0,
  dailyLimit: 3,
  bonusDraws: 0,
  remainingToday: 3,
  starsBalance: 15,
  streakDays: 1,
  dailyPullCompletedToday: false,
  dailySpendVnd: 0,
  dailySpendCapVnd: 50000,
  canUseFullDeck: true,
  isFirstTurnFullDeckFree: true,
  fullDeckUnlockCostStars: 5,
  fullDeckUnlockedDraws: 0,
};

// Global cache and listeners for real-time sync across components without multiple fetch calls
let globalQuotaCache: QuotaStatusPayload = { ...DEFAULT_QUOTA };
let hasFetchedInitial = false;
let isFetchingGlobal = false;
const quotaListeners = new Set<(q: QuotaStatusPayload) => void>();

function notifyQuotaListeners(newQuota: QuotaStatusPayload) {
  globalQuotaCache = { ...newQuota };
  quotaListeners.forEach((fn) => {
    try {
      fn(globalQuotaCache);
    } catch {
      // ignore
    }
  });
}

/**
 * useQuotaSync hook:
 * Provides synchronized quota & stars balance across all pages, modals, and header chips.
 */
export function useQuotaSync(initialQuota?: QuotaStatusPayload) {
  const [quota, setQuota] = useState<QuotaStatusPayload>(() => {
    if (initialQuota) {
      globalQuotaCache = { ...initialQuota };
      return initialQuota;
    }
    return globalQuotaCache;
  });

  const [isLoading, setIsLoading] = useState<boolean>(!hasFetchedInitial);

  const fetchQuota = useCallback(async () => {
    if (isFetchingGlobal) return;
    isFetchingGlobal = true;
    try {
      const res = await fetch('/api/reading', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.quota) {
          hasFetchedInitial = true;
          notifyQuotaListeners(data.quota);
        }
      }
    } catch {
      // fallback to current cache on offline
    } finally {
      isFetchingGlobal = false;
      setIsLoading(false);
    }
  }, []);

  const updateQuota = useCallback((newQuota: Partial<QuotaStatusPayload> | QuotaStatusPayload) => {
    const merged: QuotaStatusPayload = {
      ...globalQuotaCache,
      ...newQuota,
    };
    notifyQuotaListeners(merged);
  }, []);

  useEffect(() => {
    // Register listener for real-time updates from other components
    const handleUpdate = (updated: QuotaStatusPayload) => {
      setQuota(updated);
    };

    quotaListeners.add(handleUpdate);

    // Initial fetch if not already done
    if (!hasFetchedInitial) {
      fetchQuota();
    } else {
      setQuota(globalQuotaCache);
      setIsLoading(false);
    }

    return () => {
      quotaListeners.delete(handleUpdate);
    };
  }, [fetchQuota]);

  return {
    quota,
    starsBalance: quota.starsBalance ?? 15,
    remainingToday: quota.remainingToday ?? 3,
    streakDays: quota.streakDays ?? 1,
    canUseFullDeck: quota.canUseFullDeck ?? true,
    isLoading,
    refreshQuota: fetchQuota,
    updateQuota,
  };
}

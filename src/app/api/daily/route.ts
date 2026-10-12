import { NextResponse } from 'next/server';
import { MAJOR_ARCANA, TAROT_CARDS_BY_ID } from '@/data/tarot-cards';
import { generateDailyCardReading } from '@/lib/ai-provider';
import type { DailyPullPayload } from '@/lib/api-types';
import {
  DAILY_PULL_STAR_REWARD,
  DAILY_STREAK_DAY7_REWARD,
  getQuotaStatus,
  getTodayDailyPull,
  getTodayKey,
  recordDailyPullCompletion,
  resolveClientKey,
} from '@/lib/quota-store';
import { type ReaderId, ReaderIdSchema } from '@/lib/schemas';
import { drawSingleRandomCardServerSide } from '@/lib/shuffler';

/**
 * GET /api/daily
 * Returns today's Daily 1-Card Pull if already drawn by this client today,
 * along with current `streakDays`, `starsBalance`, and `quota`.
 */
export async function GET(request: Request) {
  const clientKey = resolveClientKey(request);
  const today = getTodayKey();
  const existingDaily = getTodayDailyPull(clientKey, today);
  const quota = getQuotaStatus(clientKey);

  return NextResponse.json(
    {
      status: 'ok',
      date: today,
      alreadyPulledToday: Boolean(existingDaily),
      daily: existingDaily ?? null,
      streakDays: quota.streakDays ?? 0,
      starsBalance: quota.starsBalance ?? 0,
      quota,
    },
    { status: 200 }
  );
}

/**
 * POST /api/daily
 * Draws 1 random card from the 78-card RWS deck via CSPRNG (`drawSingleRandomCardServerSide([], 0.3, 78)`),
 * generates the Daily Cosmic Message via `generateDailyCardReading`,
 * increments `streakDays` and awards `+2` Stars (if first pull today),
 * and returns `{ status: 'ok', daily: DailyPullPayload, quota: QuotaStatusPayload }`.
 */
export async function POST(request: Request) {
  const clientKey = resolveClientKey(request);
  let rawBody: Record<string, unknown> = {};
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    // Allow empty body on POST /api/daily
  }

  const parsedReader = ReaderIdSchema.safeParse(
    rawBody.readerId || rawBody.reader_id || 'ba_co_mo_hon'
  );
  const readerId: ReaderId = parsedReader.success
    ? parsedReader.data
    : 'ba_co_mo_hon';

  const today = getTodayKey();
  const existingDaily = getTodayDailyPull(clientKey, today);
  if (existingDaily) {
    const quota = getQuotaStatus(clientKey);
    return NextResponse.json(
      {
        status: 'ok',
        alreadyPulledToday: true,
        daily: {
          ...existingDaily,
          streakDays: quota.streakDays ?? existingDaily.streakDays,
          totalStarsBalance:
            quota.starsBalance ?? existingDaily.totalStarsBalance,
        },
        quota,
      },
      { status: 200 }
    );
  }

  // Draw 1 card from the 78-card RWS deck via CSPRNG
  const singleDraw = drawSingleRandomCardServerSide([], 0.3, 78);
  const fullCard =
    TAROT_CARDS_BY_ID[singleDraw.card_id] ?? MAJOR_ARCANA[0]!;

  const preQuota = getQuotaStatus(clientKey);
  const previewStreak = (preQuota.streakDays ?? 0) + 1;
  const previewReward =
    previewStreak % 7 === 0
      ? DAILY_STREAK_DAY7_REWARD
      : DAILY_PULL_STAR_REWARD;
  const previewStars =
    (preQuota.starsBalance ?? 10) + previewReward;

  const dailyGenerated = await generateDailyCardReading({
    card: {
      ...fullCard,
      reversed: singleDraw.reversed,
    },
    reversed: singleDraw.reversed,
    readerId,
    date: today,
    streakDays: previewStreak,
    starsRewarded: previewReward,
    totalStarsBalance: previewStars,
  });

  const committed = recordDailyPullCompletion(
    clientKey,
    ({ date, streakDays, starsRewarded, totalStarsBalance }) => {
      const payload: DailyPullPayload = {
        date,
        card: fullCard,
        reversed: singleDraw.reversed,
        readerId,
        headline: dailyGenerated.headline,
        message: dailyGenerated.message,
        savageQuote: dailyGenerated.savageQuote,
        luckyNumber: dailyGenerated.luckyNumber,
        luckyColor: dailyGenerated.luckyColor,
        luckyItem: dailyGenerated.luckyItem,
        streakDays,
        starsRewarded,
        totalStarsBalance,
      };
      return payload;
    }
  );

  return NextResponse.json(
    {
      status: 'ok',
      alreadyPulledToday: committed.alreadyPulledToday,
      daily: committed.daily,
      quota: committed.quota,
    },
    { status: 200 }
  );
}

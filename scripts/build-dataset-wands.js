import fs from 'fs';
import path from 'path';

// Dataset generator for 56 Minor Arcana Cards (IDs 22 to 77)
// Wands: 22..35 (22 Ace, 23 Two, 24 Three, 25 Four, 26 Five, 27 Six, 28 Seven, 29 Eight, 30 Nine, 31 Ten, 32 Page, 33 Knight, 34 Queen, 35 King)
// Cups: 36..49 (36 Ace, 37 Two, 38 Three, 39 Four, 40 Five, 41 Six, 42 Seven, 43 Eight, 44 Nine, 45 Ten, 46 Page, 47 Knight, 48 Queen, 49 King)
// Swords: 50..63 (50 Ace, 51 Two, 52 Three, 53 Four, 54 Five, 55 Six, 56 Seven, 57 Eight, 58 Nine, 59 Ten, 60 Page, 61 Knight, 62 Queen, 63 King)
// Pentacles: 64..77 (64 Ace, 65 Two, 66 Three, 67 Four, 68 Five, 69 Six, 70 Seven, 71 Eight, 72 Nine, 73 Ten, 74 Page, 75 Knight, 76 Queen, 77 King)

export interface CardTopicDetail {
  upright: {
    meaning: string;
    advice: string;
    keyword: string;
  };
  reversed: {
    meaning: string;
    advice: string;
    keyword: string;
  };
}

export type TopicInterpretationMap = Record<'love' | 'career' | 'finance', CardTopicDetail>;

// We will build the full dictionary of 56 cards
export const minorCardsData: Record<number, { name: string; enName: string; suit: string; data: TopicInterpretationMap }> = {};

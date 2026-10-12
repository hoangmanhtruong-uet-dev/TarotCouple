import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ReaderId, TopicId, DeckMode } from './schemas';
import type { ReadingSuccessResponse, ClarifierCardPayload } from './api-types';
import { READERS } from '@/data/tarot-cards';
import { normalizeCanonicalReaderId } from './reader-slugs';

export interface ReadingFlowState {
  // Step 1: Reader Selection
  selectedReaderId: ReaderId;
  readerAccentColor: string;
  
  // Step 2: Context & Form
  hasFilledProfile: boolean;
  nickname: string;
  partnerNickname: string;
  zodiacSign: string;
  birthYear: number;
  selectedTopic: TopicId;
  deckMode: DeckMode;
  questionText: string;
  hideQuestionOnShare: boolean;

  // Step 3: Draw
  selectedFanIndices: number[];
  
  // Step 4: Results
  readingSuccess: ReadingSuccessResponse | null;
  clarifierCard: ClarifierCardPayload | null;
  activeQuoteIdx: 0 | 1 | 2;

  setSelectedReaderId: (id: ReaderId, accentColor?: string) => void;
  setContextForm: (data: Partial<{
    hasFilledProfile: boolean;
    nickname: string;
    partnerNickname: string;
    zodiacSign: string;
    birthYear: number;
    selectedTopic: TopicId;
    deckMode: DeckMode;
    questionText: string;
    hideQuestionOnShare: boolean;
  }>) => void;
  setSelectedFanIndices: (indices: number[]) => void;
  setReadingSuccess: (reading: ReadingSuccessResponse | null) => void;
  setClarifierCard: (card: ClarifierCardPayload | null) => void;
  setActiveQuoteIdx: (idx: 0 | 1 | 2) => void;
  resetReadingFlow: () => void;
}

// Fallback dummy storage when running on Node.js / SSR / Unit test environment without window.localStorage
const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useReadingStore = create<ReadingFlowState>()(
  persist(
    (set) => ({
      selectedReaderId: 'ba_ngoai',
      readerAccentColor: '#EAB308',

      hasFilledProfile: false,
      nickname: '',
      partnerNickname: '',
      zodiacSign: '',
      birthYear: 2004,
      selectedTopic: 'love',
      deckMode: 'full_78',
      questionText: '',
      hideQuestionOnShare: true,

      selectedFanIndices: [],

      readingSuccess: null,
      clarifierCard: null,
      activeQuoteIdx: 0,

      setSelectedReaderId: (id, accentColor) => {
        const canonicalId = normalizeCanonicalReaderId(id);
        const fallbackAccent =
          accentColor ||
          READERS.find((r) => r.id === canonicalId)?.accent_color ||
          '#EAB308';
        set({ selectedReaderId: canonicalId, readerAccentColor: fallbackAccent });
      },

      setContextForm: (data) =>
        set((state) => ({ ...state, ...data })),

      setSelectedFanIndices: (indices) =>
        set({ selectedFanIndices: indices }),

      setReadingSuccess: (reading) =>
        set({ readingSuccess: reading }),

      setClarifierCard: (card) =>
        set({ clarifierCard: card }),

      setActiveQuoteIdx: (idx) =>
        set({ activeQuoteIdx: idx }),

      resetReadingFlow: () =>
        set({
          selectedFanIndices: [],
          readingSuccess: null,
          clarifierCard: null,
          activeQuoteIdx: 0,
        }),
    }),
    {
      name: 'tarot-couple-reading-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : dummyStorage
      ),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<ReadingFlowState>) || {};
        const canonicalId = normalizeCanonicalReaderId(
          persisted.selectedReaderId || currentState.selectedReaderId
        );
        const canonicalReader =
          READERS.find((r) => r.id === canonicalId) || READERS[0]!;
        return {
          ...currentState,
          ...persisted,
          selectedReaderId: canonicalId,
          readerAccentColor: canonicalReader.accent_color,
        };
      },
    }
  )
);

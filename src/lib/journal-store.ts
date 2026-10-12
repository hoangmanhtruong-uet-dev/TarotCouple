import type { ReadingSuccessResponse, ClarifierCardPayload, DrawnCardClientPayload } from './api-types';
import type { ReaderId, TopicId } from './schemas';

export interface JournalEntry {
  id: string; // readingId
  createdAt: string;
  readerId: ReaderId;
  readerDisplayName: string;
  topic: TopicId;
  topicLabel: string;
  questionText: string;
  drawnCards: [DrawnCardClientPayload, DrawnCardClientPayload, DrawnCardClientPayload];
  overallVerdict: string;
  savageQuote: string;
  allSavageQuotes: [string, string, string];
  clarifierCard?: ClarifierCardPayload;
  fullResponse: ReadingSuccessResponse;
  isFavorite?: boolean;
  userNote?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'tc_journal_entries_v1';
const MAX_ENTRIES = 20;

export function getJournalEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJournalEntry(reading: ReadingSuccessResponse): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getJournalEntries();
    // Check if already saved
    const existsIdx = current.findIndex((e) => e.id === reading.readingId);

    const quotes = reading.result.shareable_card.savage_quotes;

    const newEntry: JournalEntry = {
      id: reading.readingId,
      createdAt: reading.createdAt || new Date().toISOString(),
      readerId: reading.readerId,
      readerDisplayName: reading.readerDisplayName,
      topic: reading.topic,
      topicLabel: reading.topicLabel,
      questionText: reading.questionText,
      drawnCards: reading.drawnCards,
      overallVerdict: reading.result.overall_verdict,
      savageQuote: reading.result.shareable_card.savage_quote,
      allSavageQuotes: [quotes[0] || '', quotes[1] || '', quotes[2] || ''],
      clarifierCard: reading.clarifier,
      fullResponse: reading,
      isFavorite: existsIdx >= 0 ? current[existsIdx]?.isFavorite : false,
      userNote: existsIdx >= 0 ? current[existsIdx]?.userNote : undefined,
      updatedAt: existsIdx >= 0 ? current[existsIdx]?.updatedAt : undefined,
    };

    let updated: JournalEntry[];
    if (existsIdx >= 0) {
      updated = [...current];
      updated[existsIdx] = newEntry;
    } else {
      updated = [newEntry, ...current].slice(0, MAX_ENTRIES);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function toggleJournalFavorite(readingId: string): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getJournalEntries();
    const updated = current.map((entry) => {
      if (entry.id === readingId) {
        return { ...entry, isFavorite: !entry.isFavorite };
      }
      return entry;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteJournalEntry(readingId: string): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getJournalEntries();
    const updated = current.filter((entry) => entry.id !== readingId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearAllJournal(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function updateJournalNote(id: string, note: string): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getJournalEntries();
    const updated = current.map((entry) => {
      if (entry.id === id) {
        return {
          ...entry,
          userNote: note.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      return entry;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}


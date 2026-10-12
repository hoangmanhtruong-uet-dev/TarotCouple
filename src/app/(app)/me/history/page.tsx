'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Sparkles,
  BookOpen,
  Trash2,
  Bookmark,
  Share2,
  Eye,
  X,
  Filter,
  Check,
  Search,
} from 'lucide-react';
import { useReadingStore } from '@/lib/reading-store';
import {
  getJournalEntries,
  deleteJournalEntry,
  toggleJournalFavorite,
  clearAllJournal,
  updateJournalNote,
  type JournalEntry,
} from '@/lib/journal-store';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';

export default function ReadingHistoryPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const setReadingSuccess = useReadingStore((state) => state.setReadingSuccess);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'favorite' | 'love' | 'career' | 'finance'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [isNoteSaving, setIsNoteSaving] = useState<boolean>(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState<boolean>(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    setEntries(getJournalEntries());
  }, []);

  useEffect(() => {
    if (selectedEntry) {
      setNoteText(selectedEntry.userNote || '');
      setNoteSavedFeedback(false);
    }
  }, [selectedEntry]);

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleJournalFavorite(id);
    setEntries(updated);
    if (selectedEntry && selectedEntry.id === id) {
      setSelectedEntry((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Xóa bản ghi trải bài',
      description: 'Bạn có chắc chắn muốn xóa bản ghi trải bài này khỏi nhật ký? Thao tác này không thể hoàn tác.',
      confirmLabel: 'Xóa bản ghi',
      cancelLabel: 'Hủy bỏ',
      onConfirm: () => {
        const updated = deleteJournalEntry(id);
        setEntries(updated);
        if (selectedEntry?.id === id) setSelectedEntry(null);
        setToastMsg('Đã xóa bản ghi thành công');
        setTimeout(() => setToastMsg(null), 2500);
        setConfirmModal(null);
      },
    });
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa toàn bộ nhật ký',
      description: 'Bạn có chắc chắn muốn xóa TOÀN BỘ nhật ký trải bài trên thiết bị này? Mọi dữ liệu trải bài và ghi chú sẽ bị xóa vĩnh viễn.',
      confirmLabel: 'Xác nhận xóa tất cả',
      cancelLabel: 'Hủy bỏ',
      onConfirm: () => {
        clearAllJournal();
        setEntries([]);
        setSelectedEntry(null);
        setToastMsg('Đã xóa toàn bộ nhật ký');
        setTimeout(() => setToastMsg(null), 2500);
        setConfirmModal(null);
      },
    });
  };

  const handleSaveNote = () => {
    if (!selectedEntry) return;
    setIsNoteSaving(true);
    const updated = updateJournalNote(selectedEntry.id, noteText);
    setEntries(updated);
    const updatedCurrent = updated.find((e) => e.id === selectedEntry.id);
    if (updatedCurrent) {
      setSelectedEntry(updatedCurrent);
    }
    setIsNoteSaving(false);
    setNoteSavedFeedback(true);
    setToastMsg('Đã lưu ghi chú chiêm nghiệm thành công');
    setTimeout(() => setToastMsg(null), 2500);
    setTimeout(() => setNoteSavedFeedback(false), 2000);
  };

  const handleReplayReading = (entry: JournalEntry) => {
    setReadingSuccess(entry.fullResponse);
    router.push('/reading/ket-qua');
  };

  const handleExportStory = (entry: JournalEntry) => {
    setReadingSuccess(entry.fullResponse);
    router.push('/reading/story');
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredEntries = entries.filter((e) => {
    if (filterMode === 'favorite' && !e.isFavorite) return false;
    if (filterMode === 'love' && !(e.topic === 'love' || e.topic === 'crush_school')) return false;
    if (filterMode === 'career' && !(e.topic === 'career' || e.topic === 'study')) return false;
    if (filterMode === 'finance' && !(e.topic === 'finance' || e.topic === 'daily_luck')) return false;

    if (!query) return true;

    const matchQuestion = e.questionText?.toLowerCase().includes(query);
    const matchNote = e.userNote?.toLowerCase().includes(query);
    const matchCards = e.drawnCards.some(
      (c) =>
        c.card.name_vi?.toLowerCase().includes(query) ||
        c.card.name_en?.toLowerCase().includes(query)
    );
    const matchClarifier =
      e.clarifierCard &&
      (e.clarifierCard.card.name_vi?.toLowerCase().includes(query) ||
        e.clarifierCard.card.name_en?.toLowerCase().includes(query));

    return Boolean(matchQuestion || matchNote || matchCards || matchClarifier);
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <CustomCursorFollower />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#C9A24A] text-[#0B0A12] text-xs font-bold shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/me"
          className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#E5C687] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang Tôi</span>
        </Link>
        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-rose-400/80 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
              aria-label="Xóa tất cả nhật ký"
            >
              <Trash2 className="w-3 h-3" />
              <span>Xóa tất cả</span>
            </button>
          )}
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#C9A24A] uppercase">
            TAROT JOURNAL
          </span>
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0] mb-2">
          Nhật Ký Trải Bài Của Bạn
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] max-w-md mx-auto">
          Lưu trữ tối đa 20 phiên bốc bài gần nhất trên thiết bị này. Chạm để xem lại toàn bộ luận giải, ghi chép chiêm nghiệm cá nhân hoặc xuất lại Story 9:16 bất kỳ lúc nào.
        </p>
      </div>

      {/* Instant Search Bar */}
      {entries.length > 0 && (
        <div className="relative max-w-md mx-auto mb-5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#9E96B0] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm câu hỏi, tên lá bài (VN/EN), ghi chú..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#14121F] border border-[#262235] focus:border-[#C9A24A] focus:outline-none text-xs text-[#F8F5F0] placeholder:text-[#9E96B0] shadow-sm transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-[#9E96B0] hover:text-[#F8F5F0] absolute right-2.5 cursor-pointer"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {entries.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar mb-6 pb-1">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'favorite', label: '⭐ Yêu thích' },
            { id: 'love', label: 'Tình cảm' },
            { id: 'career', label: 'Công việc' },
            { id: 'finance', label: 'Tài chính' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterMode === tab.id
                  ? 'bg-[#C9A24A] text-[#0B0A12] shadow-sm'
                  : 'bg-[#14121F] hover:bg-[#1D192C] text-[#9E96B0] border border-[#262235]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* List of Entries */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl bg-[#14121F]/90 border border-[#262235] hover:border-[#C9A24A]/50 transition-all shadow-xl group relative overflow-hidden cursor-pointer"
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#E5C687]">
                    🔮 {entry.readerDisplayName}
                  </span>
                  <span className="text-[10px] text-[#9E96B0] bg-[#0B0A12] px-2 py-0.5 rounded-full border border-[#262235]">
                    {entry.topicLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(entry.id, e)}
                    className="p-1 rounded-full text-[#9E96B0] hover:text-amber-400 transition-colors"
                    aria-label={entry.isFavorite ? 'Bỏ thích bản ghi' : 'Yêu thích bản ghi'}
                    title={entry.isFavorite ? 'Bỏ thích' : 'Yêu thích'}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        entry.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(entry.id, e)}
                    className="p-1 rounded-full text-[#9E96B0] hover:text-rose-400 transition-colors"
                    aria-label="Xóa bản ghi khỏi nhật ký"
                    title="Xóa bản ghi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-[#9E96B0] ml-1">
                    {new Date(entry.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#F8F5F0] italic mb-3 font-serif line-clamp-2">
                &ldquo;{entry.questionText || 'Định hướng năng lượng'}&rdquo;
              </p>

              {/* 3 Cards Mini Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {entry.drawnCards.map((c, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-[#0B0A12] border border-[#262235] text-center"
                  >
                    <p className="text-[10px] font-bold text-[#C9A24A] line-clamp-1">
                      {c.card.name_vi}
                    </p>
                    <span className="text-[9px] text-[#9E96B0]">
                      {c.reversed ? '↓ Ngược' : '↑ Xuôi'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Personal Reflection Note preview if exists */}
              {entry.userNote && (
                <div className="text-[11px] text-[#A39BB5] bg-[#0B0A12] border border-[#262235] rounded-xl px-3 py-2 mb-3 line-clamp-2">
                  <span className="text-[#C9A24A] font-medium mr-1.5">📝 Ghi chú:</span>
                  <span className="italic font-serif text-[#F8F5F0]">&ldquo;{entry.userNote}&rdquo;</span>
                </div>
              )}

              {/* Punchline snippet */}
              <p className="text-[11px] text-[#9E96B0] line-clamp-1 border-t border-[#262235] pt-2 mb-3">
                💬 <span className="italic font-serif text-[#E5C687]">&ldquo;{entry.savageQuote}&rdquo;</span>
              </p>

              {/* Actions footer */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReplayReading(entry);
                  }}
                  className="font-bold text-[#C9A24A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem lại toàn bộ</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportStory(entry);
                  }}
                  className="font-semibold text-[#9E96B0] hover:text-[#F8F5F0] flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Xuất lại Story 9:16</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#14121F]/60 border border-[#262235] rounded-3xl p-8">
          <BookOpen className="w-10 h-10 text-[#C9A24A] mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-[#F8F5F0] mb-1">
            {entries.length === 0
              ? 'Chưa có nhật ký nào được lưu'
              : 'Không tìm thấy bản ghi phù hợp'}
          </h3>
          <p className="text-xs text-[#9E96B0] mb-6 max-w-sm mx-auto">
            {entries.length === 0
              ? 'Khi bạn hoàn thành một lượt bốc bài, kết quả sẽ tự động được lưu lại tại đây trên thiết bị của bạn.'
              : 'Hãy thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc chủ đề khác.'}
          </p>
          {entries.length === 0 ? (
            <Link
              href="/reading/reader"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C9A24A] text-[#0B0A12] font-bold text-xs shadow-md"
            >
              <span>Bắt Đầu Bốc Bài Ngay &rarr;</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterMode('all');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1D192C] hover:bg-[#262138] border border-[#262235] text-xs font-semibold text-[#E5C687] transition-colors cursor-pointer"
            >
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>
      )}

      {/* Modal Quick View Detail */}
      <AnimatePresence>
        {selectedEntry && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto no-scrollbar bg-[#14121F] border border-[#C9A24A]/40 rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#9E96B0] hover:text-white"
                aria-label="Đóng chi tiết trải bài"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <span className="text-[10px] font-bold text-[#C9A24A] uppercase tracking-wider block mb-1">
                  CHI TIẾT TRẢI BÀI NGÀY {new Date(selectedEntry.createdAt).toLocaleDateString('vi-VN')}
                </span>
                <h3 className="font-display text-lg font-bold text-[#F8F5F0]">
                  {selectedEntry.readerDisplayName} • {selectedEntry.topicLabel}
                </h3>
              </div>

              {/* Question */}
              <div className="p-3.5 rounded-2xl bg-[#0B0A12] border border-[#262235]">
                <p className="text-[10px] text-[#9E96B0] uppercase font-bold mb-1">Nỗi niềm:</p>
                <p className="text-xs text-[#F8F5F0] italic font-serif">
                  &ldquo;{selectedEntry.questionText || 'Định hướng năng lượng'}&rdquo;
                </p>
              </div>

              {/* 3 Cards */}
              <div className="space-y-2">
                <p className="text-[10px] text-[#C9A24A] uppercase font-bold tracking-wider">
                  3 Lá Bài Định Mệnh:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedEntry.drawnCards.map((c, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-2xl bg-[#0B0A12] border border-[#262235] text-center"
                    >
                      <p className="text-[10px] font-bold text-[#E5C687] truncate mb-0.5">
                        {c.card.name_vi}
                      </p>
                      <p className="text-[9px] text-[#9E96B0]">
                        {c.position_label}
                      </p>
                      <span className="text-[9px] font-semibold text-amber-300 block mt-1">
                        {c.reversed ? '⬇ Ngược' : '⬆ Xuôi'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall verdict */}
              <div className="p-4 rounded-2xl bg-[#1C172B] border border-[#C9A24A]/30 space-y-2">
                <p className="text-[10px] text-[#C9A24A] font-bold uppercase tracking-wider">
                  Chốt hạ tổng quan:
                </p>
                <p className="text-xs text-[#F8F5F0] leading-relaxed">
                  {selectedEntry.overallVerdict}
                </p>
                <p className="text-xs italic text-[#E5C687] font-serif pt-2 border-t border-[#262235]">
                  &ldquo;{selectedEntry.savageQuote}&rdquo;
                </p>
              </div>

              {/* Personal Reflection Note Editor */}
              <div className="p-4 rounded-2xl bg-[#0B0A12] border border-[#262235] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A24A]" />
                    <span className="text-[10px] text-[#C9A24A] font-bold uppercase tracking-wider">
                      Ghi chú chiêm nghiệm cá nhân
                    </span>
                  </div>
                  {selectedEntry.updatedAt && (
                    <span className="text-[9px] text-[#9E96B0]">
                      Cập nhật: {new Date(selectedEntry.updatedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Ghi lại chiêm nghiệm, cảm xúc hoặc diễn biến thực tế của bạn sau khi đón nhận thông điệp trải bài này..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#14121F] border border-[#262235] focus:border-[#C9A24A] focus:outline-none text-xs text-[#F8F5F0] placeholder:text-[#9E96B0]/60 resize-none transition-colors"
                />

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={isNoteSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C9A24A] hover:bg-[#E5C687] text-[#0B0A12] text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {noteSavedFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã lưu</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Lưu ghi chú</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleExportStory(selectedEntry)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#C49A4D] text-[#0B0A12] font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Xuất Story 9:16</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReplayReading(selectedEntry)}
                  className="flex-1 py-3 rounded-xl bg-[#1D192C] hover:bg-[#262138] border border-[#262235] text-[#F8F5F0] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem Chi Tiết 3D</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accessible Themed Confirmation Dialog */}
      <AnimatePresence>
        {confirmModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-description"
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#13111E] border border-[#C9A24A]/40 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h3
                    id="confirm-dialog-title"
                    className="font-display text-base sm:text-lg font-bold text-[#F8F5F0]"
                  >
                    {confirmModal.title}
                  </h3>
                  <p
                    id="confirm-dialog-description"
                    className="text-xs text-[#9E96B0] leading-relaxed"
                  >
                    {confirmModal.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#9E96B0] hover:text-[#F8F5F0] transition-colors cursor-pointer shrink-0"
                  aria-label="Đóng hộp thoại xác nhận"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 rounded-xl bg-[#1D192C] hover:bg-[#262138] border border-[#262235] text-xs font-semibold text-[#9E96B0] hover:text-[#F8F5F0] transition-colors cursor-pointer"
                >
                  {confirmModal.cancelLabel || 'Hủy bỏ'}
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  {confirmModal.confirmLabel || 'Xác nhận xóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

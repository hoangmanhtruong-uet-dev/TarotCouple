'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  Send,
  Sparkles,
  Star,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  RotateCcw,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import type { FollowupMessagePayload, ReadingSuccessResponse } from '@/lib/api-types';
import { FOLLOWUP_MAX_QUESTION_CHARS, FOLLOWUP_STAR_COST } from '@/lib/quota-store';
import Link from 'next/link';
import OutOfStarsSheet from '@/components/OutOfStarsSheet';

interface FollowupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  reading: ReadingSuccessResponse;
  accentColor: string;
  initialQuestion?: string;
}

const QUICK_CHIPS = [
  'Lá nào ảnh hưởng nhất?',
  'Tuần này mình nên làm gì?',
  'Nếu mình chọn khác thì sao?',
];

function TypewriterText({ text }: { text: string }) {
  const shouldReduceMotion = useReducedMotion();
  const [displayedLength, setDisplayedLength] = useState(shouldReduceMotion ? text.length : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedLength(text.length);
      return;
    }
    setDisplayedLength(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      if (i >= text.length) {
        setDisplayedLength(text.length);
        clearInterval(interval);
      } else {
        setDisplayedLength(i);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text, shouldReduceMotion]);

  return <span>{text.slice(0, displayedLength)}</span>;
}

export default function FollowupChatModal({
  isOpen,
  onClose,
  reading,
  accentColor,
  initialQuestion,
}: FollowupChatModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<FollowupMessagePayload[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recapExpanded, setRecapExpanded] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState<number>(2);
  const [starsBalance, setStarsBalance] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOutOfStarsSheet, setShowOutOfStarsSheet] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const contextualChips = useMemo(() => {
    const t = reading.topic;
    if (t === 'self_healing') {
      return ['Tổn thương nào cần chữa lành trước?', 'Thói quen nào nên buông bỏ ngay?', 'Hành động 48h tới để an yên?'];
    }
    if (t === 'family') {
      return ['Khoảng cách lớn nhất nằm ở đâu?', 'Cách mở lời hòa hợp với gia đình?', 'Nên giữ ranh giới thế nào?'];
    }
    if (t === 'career') {
      return ['Lỗ hổng lớn nhất trong công việc?', 'Tuần này nên ưu tiên việc gì?', 'Có nên kiên trì hay đổi hướng?'];
    }
    if (t === 'finance') {
      return ['Dòng tiền đang rò rỉ ở đâu?', 'Có cơ hội tài chính nào sắp tới?', 'Kế hoạch tài chính tuần này?'];
    }
    return ['Lá nào ảnh hưởng mạnh nhất?', 'Tuần này mình nên làm gì?', 'Nếu mình dứt khoát thì sao?'];
  }, [reading.topic]);

  // Fetch initial messages and quota status
  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/reading/${reading.readingId}/followup`);
      if (res.ok) {
        const data = await res.json();
        if (data?.messages) {
          setMessages(data.messages);
        }
        if (typeof data?.freeFollowupsRemaining === 'number') {
          setFreeRemaining(data.freeFollowupsRemaining);
        }
        if (typeof data?.quota?.starsBalance === 'number') {
          setStarsBalance(data.quota.starsBalance);
        }
      }
    } catch {
      // Offline / fallback
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      setErrorMessage(null);
      if (initialQuestion) {
        setInputText(initialQuestion);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, reading.readingId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isSending]);

  const handleSendMessage = async (customQuestion?: string) => {
    const questionToSend = (customQuestion || inputText).trim();
    if (!questionToSend || isSending) return;

    if (questionToSend.length > FOLLOWUP_MAX_QUESTION_CHARS) {
      setErrorMessage(`Câu hỏi không được quá ${FOLLOWUP_MAX_QUESTION_CHARS} ký tự.`);
      return;
    }

    setErrorMessage(null);
    setIsSending(true);

    // Optimistic temporary user message
    const tempUserMsg: FollowupMessagePayload = {
      id: `temp_${Date.now()}`,
      readingId: reading.readingId,
      role: 'user',
      content: questionToSend,
      costType: freeRemaining > 0 ? 'free' : 'star',
      starsDeducted: freeRemaining > 0 ? 0 : FOLLOWUP_STAR_COST,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText('');

    try {
      const res = await fetch(`/api/reading/${reading.readingId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionToSend }),
      });

      const data = await res.json();

      if (res.status === 402 || data?.code === 'INSUFFICIENT_STARS') {
        // Roll back optimistic message and show sheet
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        setShowOutOfStarsSheet(true);
        setIsSending(false);
        return;
      }

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        setErrorMessage(data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        setIsSending(false);
        return;
      }

      if (data?.messages) {
        setMessages(data.messages);
      } else if (data?.assistantMessage) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          data.userMessage,
          data.assistantMessage,
        ]);
      }

      if (typeof data?.quota?.freeFollowupsRemaining === 'number') {
        setFreeRemaining(data.quota.freeFollowupsRemaining);
      }
      if (typeof data?.quota?.starsBalance === 'number') {
        setStarsBalance(data.quota.starsBalance);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setErrorMessage('Không thể kết nối tới server. Vui lòng thử lại sau.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const costLabel =
    freeRemaining > 0
      ? `Còn ${freeRemaining} câu miễn phí`
      : `${FOLLOWUP_STAR_COST} Sao / câu (Có: ${starsBalance} ⭐)`;

  const sendBtnLabel = freeRemaining > 0 ? 'Gửi · Miễn phí' : `Gửi · ${FOLLOWUP_STAR_COST} Sao`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl h-[88dvh] sm:h-[820px] max-h-[92dvh] bg-[#0E0D17] border border-[#262235] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[#262235] flex items-center justify-between bg-[#14121F]/90">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border"
              style={{
                borderColor: accentColor + '60',
                backgroundColor: accentColor + '20',
                color: accentColor,
              }}
            >
              ✦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm sm:text-base font-bold text-[#F8F5F0]">
                  {reading.readerDisplayName}
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase"
                  style={{
                    borderColor: freeRemaining > 0 ? '#10B98160' : accentColor + '60',
                    backgroundColor: freeRemaining > 0 ? '#10B98120' : accentColor + '20',
                    color: freeRemaining > 0 ? '#34D399' : accentColor,
                  }}
                >
                  {costLabel}
                </span>
              </div>
              <p className="text-[11px] text-[#9E96B0]">
                Thắc mắc sâu hơn về trải bài 3 lá của bạn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C172B] hover:bg-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsible 3-Card Summary Recap */}
        <div className="border-b border-[#262235]/60 bg-[#12101B]/70 px-4 py-2">
          <button
            type="button"
            onClick={() => setRecapExpanded(!recapExpanded)}
            className="w-full flex items-center justify-between text-xs text-[#9E96B0] hover:text-[#E5C687] transition-colors cursor-pointer py-1"
          >
            <span className="font-medium flex items-center gap-1.5">
              <span>🔮 Tóm tắt 3 lá đã bốc</span>
              <span className="text-[10px] text-[#5E5873]">
                ({reading.drawnCards.map((c) => c.card.name_vi).join(' • ')})
              </span>
            </span>
            {recapExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {recapExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pt-2 pb-1 space-y-2 text-xs"
              >
                <div className="grid grid-cols-3 gap-2">
                  {reading.drawnCards.map((c, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-[#171424] border border-[#262235] text-center"
                    >
                      <div className="text-[9px] text-[#9E96B0] truncate">{c.position_label}</div>
                      <div className="font-bold text-[#F8F5F0] text-[11px] truncate mt-0.5">
                        {c.card.name_vi}
                      </div>
                      <div className="text-[9px]" style={{ color: accentColor }}>
                        {c.reversed ? 'Ngược' : 'Xuôi'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 rounded-xl bg-[#171424]/60 border border-[#262235] text-[11px] text-[#9E96B0] leading-relaxed">
                  <span className="text-[#C9A24A] font-bold">Chốt hạ: </span>
                  {reading.result.overall_verdict}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message Thread */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-start"
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-bold text-[#9E96B0]">
                  {reading.readerDisplayName}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded text-[#E5C687] border border-[#C9A24A]/30">
                  Lời mở đầu
                </span>
              </div>
              <div
                className="max-w-[88%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-[1.6] bg-[#151322] text-[#F8F5F0] rounded-tl-sm border border-[#262235]"
                style={{ borderLeft: `3px solid ${accentColor}` }}
              >
                Chào {reading.nickname || 'bạn'}! {reading.readerDisplayName} đã xem xong trải bài 3 lá ({reading.drawnCards.map((c) => c.card.name_vi).join(' • ')}). Con/bạn còn khúc mắc hay muốn đào sâu hơn điều gì không? Hãy chọn các gợi ý bên dưới hoặc gõ câu hỏi nhé (2 câu đầu hoàn toàn miễn phí)!
              </div>
            </motion.div>
          )}

          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            const isLatestAssistant =
              !isUser &&
              idx === messages.length - 1;

            return (
              <motion.div
                key={m.id || idx}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-[#9E96B0]">
                    {isUser ? 'Bạn' : reading.readerDisplayName}
                  </span>
                  {isUser && (
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded text-emerald-400 border border-emerald-500/30"
                    >
                      {m.costType === 'free' ? 'Miễn phí' : '5 Sao'}
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-[1.6] ${
                    isUser
                      ? 'bg-[#2A233D] text-[#F8F5F0] rounded-tr-sm border border-[#3E3458]'
                      : 'bg-[#151322] text-[#F8F5F0] rounded-tl-sm border border-[#262235]'
                  }`}
                  style={!isUser ? { borderLeft: `3px solid ${accentColor}` } : {}}
                >
                  {isLatestAssistant ? (
                    <TypewriterText text={m.content} />
                  ) : (
                    <span>{m.content}</span>
                  )}
                </div>
              </motion.div>
            );
          })}

          {isSending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-[#9E96B0] p-2"
            >
              <Sparkles className="w-4 h-4 animate-spin text-[#C9A24A]" />
              <span>{reading.readerDisplayName} đang đọc năng lượng và soạn câu trả lời...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error alert banner */}
        {errorMessage && (
          <div className="mx-4 mb-2 p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-[#262235]/60 bg-[#12101B] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-[#5E5873] shrink-0 font-medium mr-1">
            Gợi ý:
          </span>
          {contextualChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSending}
              onClick={() => handleSendMessage(chip)}
              className="px-2.5 py-1 rounded-full bg-[#1A1727] hover:bg-[#252037] border border-[#2E2840] hover:border-[#C9A24A]/50 text-[11px] text-[#9E96B0] hover:text-[#F8F5F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 sm:p-4 border-t border-[#262235] bg-[#0E0D17]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                aria-label={`Hỏi ${reading.readerDisplayName}`}
                value={inputText}
                maxLength={FOLLOWUP_MAX_QUESTION_CHARS}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Hỏi ${reading.readerDisplayName}… (tối đa 200 ký tự)`}
                disabled={isSending}
                className="w-full py-2.5 pl-3.5 pr-14 rounded-2xl bg-[#14121F] border border-[#262235] focus:border-[#C9A24A] focus-visible:ring-2 focus-visible:ring-[#C9A24A]/40 focus:outline-none text-sm text-[#F8F5F0] placeholder-[#5E5873] transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#5E5873]">
                {inputText.length}/{FOLLOWUP_MAX_QUESTION_CHARS}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md text-[#0B0A12] shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
              }}
            >
              <span>{sendBtnLabel}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Out of Stars Modal Sheet */}
        <OutOfStarsSheet
          isOpen={showOutOfStarsSheet}
          onClose={() => setShowOutOfStarsSheet(false)}
          requiredStars={FOLLOWUP_STAR_COST}
          currentStars={starsBalance}
          reasonText="Bạn đã dùng hết 2 câu hỏi miễn phí và cần thêm Sao để tiếp tục hỏi sâu."
          onStarsClaimed={() => {
            setStarsBalance((prev) => prev + 2);
          }}
        />
      </motion.div>
    </div>
  );
}

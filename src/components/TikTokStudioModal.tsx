'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Film,
  Copy,
  CheckCircle2,
  Sparkles,
  Music,
  Mic,
  Hash,
  Layers,
  RefreshCw,
} from 'lucide-react';
import type {
  TikTokCarouselKit,
  ReadingSuccessResponse,
} from '@/lib/api-types';

export interface TikTokStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentReading?: ReadingSuccessResponse | null;
}

const DEFAULT_TIKTOK_KITS: TikTokCarouselKit[] = [
  {
    id: 'kit_late_night_ghosting',
    themeTitle: 'Người ấy im lặng 3 ngày: Bận thật hay đang âm thầm Ghost?',
    readerId: 'chi_dai',
    readerName: 'Chị Đại',
    hookTitle: 'Nửa đêm lướt trúng trải bài này thì đừng hỏi sao Chị Đại nói thẳng!',
    slides: [
      {
        slideNumber: 1,
        roleLabel: 'Slide 1: Hook 3s đầu giữ chân người xem',
        headline: 'Người ta im lặng 3 ngày là bận thật hay đang ghost bạn? 🚩',
        bodyText:
          'Nếu bạn đang chờ một tin nhắn lúc 23h59 thì dừng tay 5 giây lướt sang phải xem 3 lá bài Vũ Trụ vừa lật cho bạn.',
        visualPromptNote:
          'Nền tối huyền bí Obsidian Gold, 3 lá bài Tarot úp mặt phát sáng nhẹ cùng dòng chữ Hook cỡ lớn ở giữa.',
      },
      {
        slideNumber: 2,
        roleLabel: 'Slide 2: Lật 3 lá bài & Cú Twist tâm lý',
        headline: 'The Hermit • Seven of Swords • The Tower',
        bodyText:
          '1. Bạn đang tự huyễn hoặc lý do cho người ta.\n2. Đối phương có năng lượng né tránh trách nhiệm (7 Kiếm).\n3. Cục diện báo hiệu cần một cú tỉnh thức dứt khoát.',
        visualPromptNote:
          'Hiển thị 3 lá bài Rider-Waite-Smith 1909 vừa lật mở kèm 3 từ khóa màu vàng kim nổi bật.',
      },
      {
        slideNumber: 3,
        roleLabel: 'Slide 3: Câu chốt hạ & Call-to-Action',
        headline:
          '“Người muốn tìm bạn sẽ tự khắc biết đường, người muốn né thì bận thở cũng là lý do!”',
        bodyText:
          'Tự tay rút 3 lá định mệnh của riêng bạn hoặc mở phòng Bói Đôi ẩn danh tại TarotCouple ngay trên Bio ✨',
        visualPromptNote:
          'Dùng trực tiếp ảnh Story 9:16 xuất từ TarotCouple với câu Savage Quote cực gắt và mã QR góc dưới.',
      },
    ],
    captionSeo:
      'Người ta im lặng 3 ngày là đang bận thật hay đang âm thầm ghost bạn? Lật 3 lá bài cùng Chị Đại để tỉnh mộng ngay đêm nay 🔮👇 Trải bài miễn phí tại tarotcouple.vercel.app',
    hashtags: [
      '#tarotcouple',
      '#chidai',
      '#tarotai',
      '#boitarottinhyeu',
      '#demsuy',
      '#redflag',
      '#tarotvietnam',
    ],
    capcutVoiceoverScript:
      'Nếu người ấy đã im lặng ba ngày liền mà bạn vẫn tự nhủ chắc người ta đang bận, thì nghe Chị Đại phán ngay ba lá bài này nhé! Lá The Hermit đi cùng Bảy Kiếm nói thẳng: người muốn tìm bạn sẽ tự khắc có thời gian, còn người muốn né thì bận thở cũng thành lý do. Vào ngay Tarot Couple để tự tay rút ba lá xem cục diện thật sự của hai người nha!',
    recommendedSoundVibe: 'Nhạc nền Piano Mystery / Lo-fi Đêm Suy (Tốc độ đọc 1.15x)',
  },
  {
    id: 'kit_couple_check_var',
    themeTitle: 'Check Var Độ Hợp Cạ & Red Flag 🚩 Cùng Crush (Bói Đôi 48h)',
    readerId: 'thay_cu_meo',
    readerName: 'Thầy Cú Mèo',
    hookTitle: 'Đừng đoán mò tình cảm nữa, gửi link phòng Bói Đôi bắt người ta rút bài cùng!',
    slides: [
      {
        slideNumber: 1,
        roleLabel: 'Slide 1: Hook 3s đầu kích thích tò mò',
        headline: 'Cách kiểm tra bạn và người ấy Hợp Cạ bao nhiêu % mà không lộ câu hỏi riêng tư 💞',
        bodyText:
          'Gửi link phòng Bói Đôi 48h cho crush: Mỗi người tự rút 1 lá đại diện, AI phân tích lá thứ 3 kết nối!',
        visualPromptNote:
          'Giao diện phòng Bói Đôi TarotCouple hiển thị thanh đo Hợp Cạ 89% và cảnh báo Red Flag.',
      },
      {
        slideNumber: 2,
        roleLabel: 'Slide 2: Lật 3 lá bài & Cú Twist',
        headline: 'Lá của bạn (The Lovers) × Lá người ấy (Two of Cups)',
        bodyText:
          'Thầy Cú Mèo phân tích: Độ Hợp Cạ 91% — Tín hiệu đèn xanh rõ rệt từ cả hai phía, chỉ chờ một người mở lời trước!',
        visualPromptNote:
          'Hai lá bài The Lovers và Two of Cups đặt cạnh nhau kết nối bằng tia sáng vàng kim.',
      },
      {
        slideNumber: 3,
        roleLabel: 'Slide 3: Câu chốt hạ & Call-to-Action',
        headline:
          '“Dữ liệu đã rõ 91%, đầu tư một tin nhắn mở lời ngay tối nay là bước đi hợp lý nhất!”',
        bodyText:
          'Tag ngay người bạn muốn rủ vào phòng Bói Đôi hoặc lấy link tại TarotCouple trên Bio 🔮',
        visualPromptNote:
          'Ảnh Story 9:16 Bói Đôi có huy hiệu Hợp Cạ 91% và dòng kêu gọi Tag tên người ấy.',
      },
    ],
    captionSeo:
      'Gửi ngay link phòng Bói Đôi 48h cho người ấy cùng rút bài mà không sợ lộ câu hỏi riêng tư 💞 Kiểm tra chỉ số Hợp Cạ (%) và Red Flag 🚩 tại tarotcouple.vercel.app',
    hashtags: [
      '#tarotcouple',
      '#boidoi',
      '#thaycumeo',
      '#checkvartinhyeu',
      '#tarotai',
      '#crush',
      '#genztarot',
    ],
    capcutVoiceoverScript:
      'Muốn biết crush thực sự nghĩ gì về mình mà không cần hỏi thẳng? Hãy tạo ngay một phòng Bói Đôi trên Tarot Couple rồi gửi link cho người ấy. Người kia chỉ thấy lời mời rút lá bài của họ, hoàn toàn không thấy câu hỏi bí mật của bạn. Khi cả hai rút xong, hệ thống mới mở khóa điểm số Hợp Cạ và chỉ số Red Flag. Thử ngay tối nay nhé!',
    recommendedSoundVibe: 'Nhạc nền R&B Chill / Synthwave cuốn hút (Tốc độ đọc 1.1x)',
  },
  {
    id: 'kit_healing_career_finance',
    themeTitle: 'Thông Điệp Ấm Áp & Bước Ngoặt Tài Chính Tuần Mới',
    readerId: 'ba_ngoai',
    readerName: 'Bà Ngoại',
    hookTitle: 'Dừng lại hít một hơi thật sâu, Bà Ngoại gửi riêng cho con 3 lá bài lành vía này.',
    slides: [
      {
        slideNumber: 1,
        roleLabel: 'Slide 1: Hook 3s đầu đồng cảm',
        headline: 'Dành cho những ai đang kiệt sức vì áp lực học tập & công việc tuần qua 🌸',
        bodyText:
          'Con không tình cờ nhìn thấy video này đâu. Hãy lướt sang phải để nhận lời dặn từ Bà Ngoại nhé.',
        visualPromptNote:
          'Tông màu ấm dịu cùng ánh sáng The Sun & The Star lấp lánh trên nền đêm.',
      },
      {
        slideNumber: 2,
        roleLabel: 'Slide 2: Lật 3 lá bài & Cú Twist',
        headline: 'Nine of Pentacles • The Star • Ace of Wands',
        bodyText:
          'Mọi nỗ lực âm thầm của con đang chuẩn bị kết trái. Một cơ hội mới đầy cảm hứng (Ace of Wands) sẽ gõ cửa trong 7 ngày tới.',
        visualPromptNote:
          '3 lá bài 9 Tiền, The Star, Ace of Wands tỏa hào quang ấm áp và vàng kim.',
      },
      {
        slideNumber: 3,
        roleLabel: 'Slide 3: Câu chốt hạ & Call-to-Action',
        headline:
          '“Con đã đi qua những ngày bão giông ngoạn mục nhất, nhớ ăn cơm đúng bữa rồi đón ánh bình minh của riêng mình nghen.”',
        bodyText:
          'Comment “NHẬN VÍA LÀNH” và vào TarotCouple rút lá bài hàng ngày tích lũy Streak nhé ✨',
        visualPromptNote:
          'Ảnh Story 9:16 phong cách Bà Ngoại ấm áp cùng vật phẩm may mắn.',
      },
    ],
    captionSeo:
      'Thông điệp chữa lành và đón vận may tài chính công việc tuần mới từ Bà Ngoại 🌸 Comment “NHẬN VÍA” và tự tay rút bài tại tarotcouple.vercel.app',
    hashtags: [
      '#tarotcouple',
      '#bangoai',
      '#manifestation',
      '#thongdiepvutru',
      '#tarotai',
      '#chualanh',
    ],
    capcutVoiceoverScript:
      'Dừng lại một nhịp và hít thở thật sâu nhé con. Nếu tuần vừa qua con cảm thấy mỏi mệt vì công việc và chuyện học hành, thì ba lá bài Chín Tiền, Ngôi Sao và Át Gậy vừa xuất hiện để nhắn rằng: mọi cố gắng thầm lặng của con sắp đơm hoa kết trái. Hãy dịu dàng với bản thân hơn và vào Tarot Couple đón nhận thông điệp hàng ngày nha.',
    recommendedSoundVibe: 'Nhạc nền Healing Harp / Crystal Bowl êm dịu (Tốc độ đọc 1.0x)',
  },
];

function buildCustomKitFromReading(
  reading: ReadingSuccessResponse
): TikTokCarouselKit {
  const c1 = reading.drawnCards[0];
  const c2 = reading.drawnCards[1];
  const c3 = reading.drawnCards[2];
  const quote = reading.result.shareable_card.savage_quote;

  return {
    id: `custom_reading_${reading.readingId}`,
    themeTitle: `✨ Trải Bài Của @${reading.nickname}: ${reading.topicLabel}`,
    readerId: reading.readerId,
    readerName: reading.readerDisplayName,
    hookTitle: reading.result.greeting_hook,
    slides: [
      {
        slideNumber: 1,
        roleLabel: 'Slide 1: Hook 3s đầu từ câu chuyện của bạn',
        headline: `Chủ đề ${reading.topicLabel}: “${reading.questionText}”`,
        bodyText: `${reading.readerDisplayName} mở màn: “${reading.result.greeting_hook}” — Lướt sang phải để xem 3 lá bài vừa lật!`,
        visualPromptNote:
          'Chụp màn hình bước xáo bài 3D hoặc ảnh Story 9:16 chế độ ẩn câu hỏi.',
      },
      {
        slideNumber: 2,
        roleLabel: 'Slide 2: Lật 3 lá bài & Cú Twist giải mã',
        headline: `${c1.card.name_vi} • ${c2.card.name_vi} • ${c3.card.name_vi}`,
        bodyText: `1. ${c1.position_label}: ${reading.result.cards_analysis[0]?.energy_keyword}\n2. ${c2.position_label}: ${reading.result.cards_analysis[1]?.energy_keyword}\n3. ${c3.position_label}: ${reading.result.cards_analysis[2]?.energy_keyword}`,
        visualPromptNote:
          'Ghép ảnh 3 lá bài vừa lật mở kèm kết luận tổng quan từ Reader.',
      },
      {
        slideNumber: 3,
        roleLabel: 'Slide 3: Câu chốt hạ & Call-to-Action',
        headline: `“${quote}”`,
        bodyText: `${reading.result.actionable_next_step} • Vật phẩm độ mệnh: ${reading.result.shareable_card.lucky_item}`,
        visualPromptNote:
          'Sử dụng ảnh Story 9:16 (1080x1920) tải trực tiếp từ TarotCouple.',
      },
    ],
    captionSeo: `Trải bài ${reading.topicLabel} cùng ${reading.readerDisplayName} mà dính câu chốt hạ tỉnh cả người: “${quote}” 🔮✨ Tự tay rút 3 lá tại tarotcouple.vercel.app`,
    hashtags: [
      '#tarotcouple',
      '#bacomohon',
      '#tarotai',
      '#boitarot',
      '#demsuy',
      '#storytarot',
    ],
    capcutVoiceoverScript: `Hôm nay mình vừa vào Tarot Couple hỏi ${reading.readerDisplayName} về chuyện ${reading.topicLabel}. Ba lá bài lật ra là ${c1.card.name_vi}, ${c2.card.name_vi} và ${c3.card.name_vi}. Nghe câu chốt hạ mà tỉnh cả người: ${quote}. Bạn nào đang phân vân thì vào rút thử ba lá xem Vũ Trụ nhắn gì nhé!`,
    recommendedSoundVibe: 'Nhạc nền Trending TikTok Đêm Suy / Tarot Storytime',
  };
}

export function TikTokStudioModal({
  isOpen,
  onClose,
  currentReading,
}: TikTokStudioModalProps) {
  const [serverKits, setServerKits] =
    useState<TikTokCarouselKit[]>(DEFAULT_TIKTOK_KITS);
  const [selectedKitId, setSelectedKitId] = useState<string>('');
  const [copiedType, setCopiedType] = useState<
    'slides' | 'caption' | 'voiceover' | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const customReadingKit = useMemo(() => {
    return currentReading ? buildCustomKitFromReading(currentReading) : null;
  }, [currentReading]);

  const allKits = useMemo(() => {
    if (customReadingKit) {
      return [customReadingKit, ...serverKits];
    }
    return serverKits;
  }, [customReadingKit, serverKits]);

  const fetchTikTokKits = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/growth');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.tiktokKits) && data.tiktokKits.length > 0) {
          setServerKits(data.tiktokKits as TikTokCarouselKit[]);
        }
      }
    } catch {
      // Fallback to DEFAULT_TIKTOK_KITS
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchTikTokKits();
      if (customReadingKit) {
        setSelectedKitId(customReadingKit.id);
      } else if (!selectedKitId && DEFAULT_TIKTOK_KITS[0]) {
        setSelectedKitId(DEFAULT_TIKTOK_KITS[0].id);
      }
    }
  }, [isOpen, customReadingKit, fetchTikTokKits, selectedKitId]);

  const activeKit = useMemo(() => {
    return (
      allKits.find((k) => k.id === selectedKitId) ??
      allKits[0] ??
      DEFAULT_TIKTOK_KITS[0]!
    );
  }, [allKits, selectedKitId]);

  const handleCopyText = async (
    type: 'slides' | 'caption' | 'voiceover',
    text: string
  ) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedType(type);
      setTimeout(() => {
        setCopiedType((prev) => (prev === type ? null : prev));
      }, 2400);
    } catch {
      setCopiedType(type);
    }
  };

  const fullSlidesText = useMemo(() => {
    return activeKit.slides
      .map(
        (s) =>
          `[${s.roleLabel}]\nTiêu đề: ${s.headline}\nNội dung: ${s.bodyText}\nGợi ý hình ảnh: ${s.visualPromptNote}`
      )
      .join('\n\n---\n\n');
  }, [activeKit]);

  const fullCaptionAndHashtags = useMemo(() => {
    return `${activeKit.captionSeo}\n\n${activeKit.hashtags.join(' ')}`;
  }, [activeKit]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Xưởng Seeding TikTok & Reels 0đ (3-Slide Carousel Studio)"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="relative w-full max-w-5xl rounded-3xl bg-[#12101B] border border-[#D4AF37]/45 shadow-[0_24px_80px_rgba(0,0,0,0.92)] overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4AF37]/25 bg-[#09080D]/90">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#F3E5AB]">
                  <Film className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#F8F5F0]">
                    🎬 Xưởng Seeding TikTok & Reels 0đ (3-Slide Carousel Studio)
                  </h3>
                  <p className="text-xs text-[#A39BB5]">
                    Công thức Photo Mode 3 Slide kéo traffic tự nhiên • Tích hợp sẵn kịch bản CapCut TTS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void fetchTikTokKits()}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#F3E5AB] transition-colors cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                  />
                  <span className="hidden sm:inline">Làm mới mẫu</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-[#F8F5F0] transition-colors cursor-pointer"
                  aria-label="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              {/* Kit Selector Pills */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#F3E5AB] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Chọn Chủ Đề Kịch Bản Viral (TikTok Photo Mode / Reels)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {allKits.map((kit) => {
                    const isSelected = kit.id === activeKit.id;
                    const isCustom = kit.id.startsWith('custom_reading_');
                    return (
                      <button
                        key={kit.id}
                        type="button"
                        onClick={() => setSelectedKitId(kit.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#231B32] to-[#161120] border-[#F3E5AB] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                            : 'bg-[#09080D]/75 border-white/10 hover:border-[#D4AF37]/45'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/30">
                              {kit.readerName}
                            </span>
                            {isCustom ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                                Phiên vừa rút của bạn
                              </span>
                            ) : null}
                          </div>
                          <p className="font-display text-sm sm:text-base font-bold text-[#F8F5F0]">
                            {kit.themeTitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Slides Visual Cards */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-display text-lg font-bold text-[#F8F5F0] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>Cấu Trúc 3 Slide Chuẩn Thuật Toán TikTok Photo Mode</span>
                  </h4>
                  <span className="text-xs text-amber-200 flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/30 px-3 py-1 rounded-full">
                    <Music className="w-3.5 h-3.5 text-amber-300" />
                    {activeKit.recommendedSoundVibe}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeKit.slides.map((slide) => (
                    <div
                      key={slide.slideNumber}
                      className="rounded-2xl bg-gradient-to-b from-[#1B1528] via-[#130F1D] to-[#09080D] border border-[#D4AF37]/40 p-5 flex flex-col justify-between space-y-4 shadow-[0_12px_30px_rgba(0,0,0,0.65)]"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#09080D] text-[11px] font-bold">
                            SLIDE 0{slide.slideNumber}
                          </span>
                          <span className="text-[11px] text-[#F3E5AB] font-medium">
                            {slide.slideNumber === 1
                              ? 'Hook 3s đầu'
                              : slide.slideNumber === 2
                                ? 'Lật 3 lá & Cú Twist'
                                : 'Câu chốt hạ & CTA'}
                          </span>
                        </div>

                        <p className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold">
                          {slide.roleLabel}
                        </p>

                        <h5 className="font-display text-lg font-bold text-[#F8F5F0] leading-snug">
                          {slide.headline}
                        </h5>

                        <p className="text-xs sm:text-sm text-[#D8D2E7] whitespace-pre-line leading-relaxed">
                          {slide.bodyText}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/10">
                        <p className="text-[11px] text-[#A39BB5] italic">
                          🎨 <strong>Gợi ý hình nền:</strong>{' '}
                          {slide.visualPromptNote}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caption SEO + Hashtags & CapCut Voiceover Script */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Box 1: Caption SEO + Hashtags */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#171424] border border-white/10 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F3E5AB] flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-[#D4AF37]" />
                      Caption Chuẩn SEO & Hashtag Xu Hướng
                    </span>
                    <p className="text-xs sm:text-sm text-[#F8F5F0] leading-relaxed bg-[#09080D]/80 p-3.5 rounded-xl border border-white/10">
                      {activeKit.captionSeo}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeKit.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs font-mono text-[#F3E5AB]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Box 2: CapCut Voiceover Script */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#171424] border border-white/10 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-emerald-400" />
                      Kịch Bản Voiceover (Dán vào CapCut Đọc Văn Bản Tự Động)
                    </span>
                    <p className="text-xs sm:text-sm text-[#D8D2E7] leading-relaxed italic bg-[#09080D]/80 p-3.5 rounded-xl border border-emerald-400/25">
                      “{activeKit.capcutVoiceoverScript}”
                    </p>
                  </div>
                  <p className="text-[11px] text-[#A39BB5]">
                    💡 Mẹo: Chọn giọng đọc AI “Cô gái miền Nam” hoặc “Bà ngoại kể chuyện” trong CapCut và tăng tốc độ lên 1.15x.
                  </p>
                </div>
              </div>

              {/* 3 One-Click Copy Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => void handleCopyText('slides', fullSlidesText)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#09080D] font-bold text-xs sm:text-sm shadow-[0_8px_25px_rgba(212,175,55,0.35)] hover:brightness-110 transition-all cursor-pointer active:scale-[0.98]"
                >
                  {copiedType === 'slides' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã Copy kịch bản 3 Slide!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy trọn bộ kịch bản 3 Slide</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleCopyText('caption', fullCaptionAndHashtags)
                  }
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#171424] hover:bg-[#231D36] border border-[#D4AF37]/45 text-[#F3E5AB] font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-[0.98]"
                >
                  {copiedType === 'caption' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Đã Copy Caption + Hashtag!</span>
                    </>
                  ) : (
                    <>
                      <Hash className="w-4 h-4 text-[#D4AF37]" />
                      <span>Copy Caption chuẩn SEO + Hashtag</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleCopyText(
                      'voiceover',
                      activeKit.capcutVoiceoverScript
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#171424] hover:bg-[#231D36] border border-emerald-400/40 text-emerald-200 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-[0.98]"
                >
                  {copiedType === 'voiceover' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Đã Copy Voiceover CapCut!</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>Copy Kịch bản Voiceover CapCut</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

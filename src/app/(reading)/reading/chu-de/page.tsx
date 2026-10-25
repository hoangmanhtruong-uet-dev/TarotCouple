'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { gsap } from 'gsap';
import * as THREE from 'three';
import {
  detectHardwareTier,
  disposeThreeScene,
  attachWebGLContextLostGuard,
} from '@/lib/three/core';
import {
  ASTRAL_VORTEX_VERTEX_SHADER,
  ASTRAL_VORTEX_FRAGMENT_SHADER,
} from '@/lib/three/shaders';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';
import { useReadingStore } from '@/lib/reading-store';
import { classifyAgeTier, scanCrisisAndInjection } from '@/lib/safety';
import {
  CURRENT_REFERENCE_YEAR,
  type TopicId,
  type ReaderId,
  type DeckMode,
} from '@/lib/schemas';
import { READERS } from '@/data/tarot-cards';
import { soundManager } from '@/lib/sound-effects';
import { useQuotaSync } from '@/lib/use-quota';
import {
  Heart,
  Briefcase,
  Coins,
  Sparkles,
  GraduationCap,
  Sun,
  ShieldCheck,
  Check,
  Flame,
  Layers,
  ArrowRight,
  ArrowLeft,
  Lock,
  Unlock,
  Shuffle,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// SVG MYSTICAL ARTWORKS FOR TOPICS
// ============================================================================
function MysticLoveCardArt() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="110" r="50" stroke="#C9A24A" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.4" />
      <circle cx="80" cy="110" r="68" stroke="#C9A24A" strokeWidth="0.5" opacity="0.25" />
      <path
        d="M60 25 C78 25, 88 40, 84 58 C72 56, 52 48, 50 38 C48 30, 52 26, 60 25 Z"
        fill="#C9A24A"
        opacity="0.9"
      />
      <circle cx="62" cy="38" r="1.5" fill="#14121F" />
      <path d="M58 45 Q64 48 60 52" stroke="#14121F" strokeWidth="1" fill="none" />
      <g transform="translate(80, 110)">
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <path
            key={deg}
            d="M0 -30 L4 -20 L0 -16 L-4 -20 Z"
            fill="#C9A24A"
            transform={`rotate(${deg})`}
            opacity="0.85"
          />
        ))}
        {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="-18"
            x2="0"
            y2="-26"
            stroke="#C9A24A"
            strokeWidth="1.2"
            transform={`rotate(${deg})`}
            opacity="0.6"
          />
        ))}
        <circle cx="0" cy="0" r="15" fill="#C9A24A" />
        <circle cx="-5" cy="-3" r="1.2" fill="#14121F" />
        <circle cx="5" cy="-3" r="1.2" fill="#14121F" />
        <path d="M-4 4 Q0 8 4 4" stroke="#14121F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <circle cx="-7" cy="1" r="1.5" fill="#C9A24A" opacity="0.6" />
        <circle cx="7" cy="1" r="1.5" fill="#C9A24A" opacity="0.6" />
      </g>
      <circle cx="32" cy="75" r="1.5" fill="#C9A24A" opacity="0.7" />
      <circle cx="45" cy="85" r="1" fill="#C9A24A" opacity="0.5" />
      <circle cx="125" cy="65" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="135" cy="95" r="1" fill="#C9A24A" opacity="0.6" />
      <path d="M115 45 Q115 50 120 50 Q115 50 115 55 Q115 50 110 50 Q115 50 115 45 Z" fill="#C9A24A" opacity="0.8" />
    </svg>
  );
}

function MysticCareerCardArt() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="110" rx="55" ry="70" stroke="#C9A24A" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.35" />
      <g transform="translate(80, 110)">
        <rect x="-38" y="-72" width="76" height="6" rx="2" fill="#C9A24A" opacity="0.9" />
        <rect x="-38" y="66" width="76" height="6" rx="2" fill="#C9A24A" opacity="0.9" />
        <path
          d="M-30 -63 C-28 -20, -6 -6, 0 0 C6 -6, 28 -20, 30 -63 Z"
          stroke="#C9A24A"
          strokeWidth="2"
          fill="#14121F"
          fillOpacity="0.4"
        />
        <path
          d="M-30 63 C-28 20, -6 6, 0 0 C6 6, 28 20, 30 63 Z"
          stroke="#C9A24A"
          strokeWidth="2"
          fill="#14121F"
          fillOpacity="0.4"
        />
        <g transform="translate(0, -34)">
          <circle cx="0" cy="0" r="10" fill="#C9A24A" opacity="0.9" />
        </g>
        <circle cx="0" cy="0" r="4" fill="#C9A24A" opacity="0.9" />
      </g>
      <circle cx="28" cy="45" r="1.5" fill="#C9A24A" opacity="0.7" />
      <circle cx="132" cy="48" r="1.2" fill="#C9A24A" opacity="0.6" />
    </svg>
  );
}

function MysticFinanceCardArt() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(80, 110)">
        <polygon points="0,-72 62,36 -62,36" stroke="#C9A24A" strokeWidth="1" opacity="0.4" fill="none" />
        <polygon points="0,72 62,-36 -62,-36" stroke="#C9A24A" strokeWidth="1" opacity="0.4" fill="none" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <path
            key={deg}
            d="M0 -42 L5 -32 L0 -26 L-5 -32 Z"
            fill="#C9A24A"
            transform={`rotate(${deg})`}
            opacity="0.85"
          />
        ))}
        <circle cx="0" cy="0" r="24" fill="#C9A24A" />
        <circle cx="-7" cy="-4" r="1.8" fill="#14121F" />
        <circle cx="7" cy="-4" r="1.8" fill="#14121F" />
        <path d="M-5 8 Q0 13 5 8" stroke="#14121F" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </g>
      <circle cx="28" cy="30" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="132" cy="30" r="1.5" fill="#C9A24A" opacity="0.8" />
    </svg>
  );
}

function MysticHealthCardArt() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="110" r="60" stroke="#C9A24A" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
      <g transform="translate(80, 110)">
        <path
          d="M-5 -75 C-12 -65, -8 -50, 2 -40 C14 -28, 22 -10, 10 5 C-2 20, -18 35, -4 55 C6 68, -2 80, 0 85"
          stroke="#C9A24A"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <circle cx="0" cy="0" r="7" fill="#C9A24A" />
      </g>
      <circle cx="35" cy="55" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="122" cy="60" r="1.5" fill="#C9A24A" opacity="0.8" />
    </svg>
  );
}

function MysticHealingCardArt() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="110" r="58" stroke="#C9A24A" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.35" />
      <g transform="translate(80, 110)">
        <path
          d="M0 -42 C12 -28, 22 -12, 0 14 C-22 -12, -12 -28, 0 -42 Z"
          fill="#C9A24A"
          opacity="0.85"
        />
        <path
          d="M-28 -20 C-36 -4, -30 14, 0 24 C-10 14, -20 -4, -28 -20 Z"
          fill="#C9A24A"
          opacity="0.65"
        />
        <path
          d="M28 -20 C36 -4, 30 14, 0 24 C10 14, 20 -4, 28 -20 Z"
          fill="#C9A24A"
          opacity="0.65"
        />
        <circle cx="0" cy="2" r="6" fill="#14121F" stroke="#C9A24A" strokeWidth="1.2" />
        <circle cx="0" cy="2" r="2.5" fill="#C9A24A" />
      </g>
      <circle cx="34" cy="40" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="126" cy="40" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="80" cy="190" r="1.8" fill="#C9A24A" opacity="0.7" />
    </svg>
  );
}

function MysticFamilyCardArt() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="110" r="54" stroke="#C9A24A" strokeWidth="0.6" opacity="0.3" />
      <g transform="translate(80, 110)">
        <circle cx="0" cy="-14" r="22" stroke="#C9A24A" strokeWidth="1.2" fill="none" opacity="0.85" />
        <circle cx="-14" cy="12" r="22" stroke="#C9A24A" strokeWidth="1.2" fill="none" opacity="0.85" />
        <circle cx="14" cy="12" r="22" stroke="#C9A24A" strokeWidth="1.2" fill="none" opacity="0.85" />
        <circle cx="0" cy="3" r="4.5" fill="#C9A24A" />
      </g>
      <circle cx="38" cy="45" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="122" cy="45" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="80" cy="185" r="1.5" fill="#C9A24A" opacity="0.8" />
    </svg>
  );
}

// Map each TopicId to display config
const TAROT_TOPIC_CONFIG: Record<
  TopicId,
  {
    titleVi: string;
    roman: string;
    description: string;
    resonancePct: number;
    spreadSlots: [string, string, string];
    artwork: React.ComponentType;
  }
> = {
  love: {
    titleVi: 'TÌNH CẢM & CRUSH',
    roman: 'I • AMOR',
    description: 'Tình duyên, crush, mập mờ hoặc người thương hiện tại',
    resonancePct: 96,
    spreadSlots: ['Tâm Tình Hiện Tại', 'Nút Thắt Tiềm Ẩn', 'Gợi Mở Hướng Đi'],
    artwork: MysticLoveCardArt,
  },
  career: {
    titleVi: 'CÔNG VIỆC & SỰ NGHIỆP',
    roman: 'II • FATUM',
    description: 'Định hướng sự nghiệp, công việc, tháo gỡ trì hoãn',
    resonancePct: 92,
    spreadSlots: ['Thực Trạng Năng Lượng', 'Điểm Mù Cần Tránh', 'Cơ Hội Bứt Phá'],
    artwork: MysticCareerCardArt,
  },
  finance: {
    titleVi: 'TÀI CHÍNH & TÀI LỘC',
    roman: 'III • OPULENTIA',
    description: 'Dòng tiền tài lộc, cơ hội sắp tới và tích lũy',
    resonancePct: 89,
    spreadSlots: ['Dòng Chảy Tiền Bạc', 'Lỗ Hổng Chi Tiêu', 'Tài Vận Sắp Tới'],
    artwork: MysticFinanceCardArt,
  },
  self_healing: {
    titleVi: 'CHỮA LÀNH & BẢN THÂN',
    roman: 'IV • SANATIO',
    description: 'Nỗi bất an nội tâm, cởi bỏ áp lực, tái tạo năng lượng yêu thương bản thân',
    resonancePct: 95,
    spreadSlots: ['Tổn Thương Cốt Lõi', 'Thói Quen Cần Buông', 'Chìa Khóa Chữa Lành'],
    artwork: MysticHealingCardArt,
  },
  family: {
    titleVi: 'GIA ĐÌNH & NGƯỜI THÂN',
    roman: 'V • FAMILIA',
    description: 'Kỳ vọng thế hệ, khoảng cách giao tiếp và cách tìm lại sự hòa hợp',
    resonancePct: 91,
    spreadSlots: ['Sợi Dây Gắn Kết', 'Khoảng Cách Vô Hình', 'Hướng Đi Hòa Hợp'],
    artwork: MysticFamilyCardArt,
  },
  crush_school: {
    titleVi: 'TÌNH BẠN & HỌC ĐƯỜNG',
    roman: 'I • AMICITIA',
    description: 'Chuyện bạn bè, crush trường lớp trong sáng',
    resonancePct: 98,
    spreadSlots: ['Ánh Nhìn Của Bạn Ấy', 'Hiểu Lầm Tiềm Ẩn', 'Bước Tiến Dễ Thương'],
    artwork: MysticLoveCardArt,
  },
  study: {
    titleVi: 'HỌC TẬP & THI CỬ',
    roman: 'II • DOCTRINA',
    description: 'Thi cử, bài vở, phương pháp học tập bứt phá',
    resonancePct: 94,
    spreadSlots: ['Trọng Tâm Bài Vở', 'Áp Lực Cần Tháo', 'Điểm Số Mục Tiêu'],
    artwork: MysticCareerCardArt,
  },
  daily_luck: {
    titleVi: 'VẬN MAY & KHỞI ĐẦU',
    roman: 'III • FORTUNA',
    description: 'Năng lượng ngày mới, niềm vui và sự tích cực',
    resonancePct: 95,
    spreadSlots: ['Năng Lượng Ngày Mới', 'Điềm Lành Vũ Trụ', 'Lời Khuyên Tâm Hồn'],
    artwork: MysticHealthCardArt,
  },
};

const SAMPLE_PROMPT_BY_TOPIC: Record<TopicId, string> = {
  love: 'Người ấy im lặng 3 ngày nay là đang bận thật hay đang âm thầm ghost mình vậy?',
  career: 'Mình đang phân vân giữa việc nhảy việc sang môi trường mới hay ở lại chờ cơ hội?',
  finance: 'Tình hình tài chính tháng này của mình cần lưu ý lỗ hổng chi tiêu nào nhất?',
  crush_school: 'Bạn ngồi bàn bên dạo này hay nhìn mình cười, không biết bạn ấy nghĩ gì về mình nhỉ?',
  study: 'Kỳ thi sắp tới mình nên tập trung ôn luyện thế nào để đạt điểm cao nhất?',
  daily_luck: 'Thời gian tới sẽ có niềm vui hay chuyển biến tích cực nào mở ra với mình?',
  self_healing: 'Dạo này mình luôn cảm thấy bất an và kiệt sức, làm sao để tái tạo năng lượng yêu thương bản thân?',
  family: 'Mình và gia đình đang có khoảng cách lớn về quan điểm, làm sao để lắng nghe và tìm lại tiếng nói chung?',
};

const SAMPLE_QUESTIONS_BY_TOPIC: Record<TopicId, string[]> = {
  love: [
    'Người ấy im lặng là đang bận thật hay đang âm thầm ghost mình?',
    'Mối quan hệ mập mờ hiện tại có cơ hội tiến tới chính thức không?',
    'Mình nên chủ động nhắn tin trước hay lùi lại để quan sát thái độ?',
    'Có nên cho người yêu cũ thêm một cơ hội quay lại hay dứt khoát?',
  ],
  career: [
    'Mình nên nhảy việc sang môi trường mới hay tiếp tục ở lại kiên trì?',
    'Dự án sắp tới đang gặp điểm nghẽn gì cần giải quyết ngay?',
    'Làm sao để lấy lại nhiệt huyết và thoát khỏi cảm giác trì hoãn?',
  ],
  finance: [
    'Tình hình tài chính tháng này cần lưu ý lỗ hổng chi tiêu nào nhất?',
    'Sắp tới mình có cơ hội tăng thu nhập hay nguồn thu phụ nào không?',
    'Đầu tư vào dự định mới lúc này có an toàn và sinh lời không?',
  ],
  self_healing: [
    'Dạo này mình luôn cảm thấy bất an và kiệt sức, làm sao để lấy lại năng lượng?',
    'Nút thắt tâm lý lớn nhất khiến mình chưa thể yêu thương bản thân trọn vẹn là gì?',
    'Làm thế nào để buông bỏ thói quen tự phán xét và ngừng overthinking?',
    'Hành động cụ thể nào trong 48h tới giúp mình chữa lành và bình yên hơn?',
  ],
  family: [
    'Làm sao để hóa giải khoảng cách thế hệ và sự bất đồng quan điểm với bố mẹ?',
    'Kỳ vọng quá lớn từ gia đình đang khiến mình nghẹt thở, mình nên đối thoại ra sao?',
    'Mối quan hệ với người thân đang có hiểu lầm gì cần được gỡ rối chân thành?',
    'Làm cách nào để giữ trọn ranh giới cá nhân mà vẫn hòa thuận trong gia đình?',
  ],
  crush_school: [
    'Bạn ấy dạo này hay nhìn mình cười, không biết có cảm xúc gì không nhỉ?',
    'Làm sao để bắt chuyện tự nhiên với crush mà không bị ngại ngùng?',
    'Tụi mình xích mích chuyện hiểu lầm, làm cách nào để làm hòa?',
  ],
  study: [
    'Kỳ thi sắp tới mình cần tập trung ôn luyện phần kiến thức nào nhất?',
    'Làm sao để duy trì sự tập trung khi học bài mà không bị phân tâm?',
  ],
  daily_luck: [
    'Tuần này vũ trụ gửi gắm điềm lành nào đến cho mình?',
    'Điều gì mình nên nắm bắt và điều gì nên buông bỏ lúc này?',
  ],
};

const READER_GREETINGS: Record<ReaderId, string> = {
  ba_ngoai: 'Hôm nay điều gì đang nằm trong lòng con? Kể bà nghe một chút nào.',
  chi_dai: 'Nói thẳng nha, đừng vòng vo. Đang vướng mắc chuyện gì thì chọn chủ đề đi!',
  ban_than: 'Kể đi, tao nghe hết, không phán xét đâu. Đang vướng drama gì chọn lẹ nào bồ!',
  thay_cu_meo: 'Hãy bắt đầu từ điều khiến con bận tâm nhất. Chọn chủ đề cốt lõi để cùng phân tích.',
  ba_co_mo_hon: 'Nào, đêm nay muốn soi chuyện gì? Chọn một chủ đề để Bà Cố mổ xẻ tận gốc rễ nào!',
  tien_tu_chua_lanh: 'Chào bạn thương. Hãy lắng nghe trái tim bạn đang rung động vì chủ đề nào nhất nhé...',
  tong_tai_ly_tri: 'Xác định bài toán chính cần giải quyết. Hãy chọn một chủ đề trọng tâm để bắt đầu phân tích.',
  phap_su_toi_co: 'Vũ trụ đang lắng nghe tần số của bạn. Hãy chọn cánh cổng chủ đề dẫn lối định mệnh...',
};

const READER_TOPIC_PREVIEW: Record<string, Record<string, string>> = {
  ba_ngoai: {
    love: 'Chuyện tình cảm không có đúng sai, bà nghe con nói hết nha.',
    career: 'Công việc hay mệt lắm, nhưng cứ cố từng bước một đi con.',
    finance: 'Tiền bạc quan trọng nhưng sức khỏe và niềm vui mới đáng quý.',
    self_healing: 'Thương cái thân mình trước nha con, đừng gồng gánh chi nhiều.',
    family: 'Chuyện trong nhà chín bỏ làm mười, bà chỉ cách tháo gỡ cùng con.',
    crush_school: 'Ối giời ơi, cái tuổi này dễ thương lắm! Kể bà nghe đi.',
    study: 'Học giỏi là tốt, nhưng đừng quên ngủ đủ giấc nghen con.',
    daily_luck: 'Hôm nay trời thương thì có phước, bà cầu cho con mọi điều tốt.',
  },
  chi_dai: {
    love: 'Tình cảm mà mập mờ là đừng để lâu, chị giúp bóc tách ngay.',
    career: 'Chị nói thẳng, thị trường không chờ ai cả. Phải ra tay thôi!',
    finance: 'Tiền không tự nhiên đến, nhưng chị sẽ chỉ em chỗ cần chú ý.',
    self_healing: 'Yêu bản thân không phải khẩu hiệu, mà là ranh giới thép, rõ chưa!',
    family: 'Gia đình có kỳ vọng thì mình đối thoại sòng phẳng, đừng trốn tránh.',
    crush_school: 'Crush ở trường hả? Nếu không chủ động thì đừng trách muộn!',
    study: 'Học không đều sẽ thiệt thòi. Chị mổ xẻ kế hoạch cho em nào.',
    daily_luck: 'Mỗi ngày là một chiến trận. Đi thôi, chị dẫn đường!',
  },
  ban_than: {
    love: 'Ôi trời, chuyện tình hay thế! Kể hết cho tao nghe với!',
    career: 'Công việc căng à? Ngồi xuống đây, có tao ở đây rồi.',
    finance: 'Tiền bạc này nọ bồ đừng lo, tao soi quẻ rồi mình cùng xử.',
    self_healing: 'Bớt tự dằn vặt mình lại mày ơi, đi làm ly trà sữa rồi chữa lành nè!',
    family: 'Bị phụ huynh càm ràm à? Tao hiểu cảm giác đó mà, ngồi kể tao nghe!',
    crush_school: 'Heyyy, crush ở trường! Kể hết đi, tao không kể ai đâu!',
    study: 'Ôn thi stress ghê ta, nhưng có tao bên cạnh là ổn hà.',
    daily_luck: 'Tuần mới rồi! Lá bài nói gì hay ho lắm không chịu xem đi!',
  },
  thay_cu_meo: {
    love: 'Tình cảm là bài toán năng lượng. Thầy sẽ phân tích nguyên nhân và kết quả.',
    career: 'Sự nghiệp cần chiến lược dài hạn. Thầy sẽ chỉ ra điểm mù cần chú ý.',
    finance: 'Tài chính phản ánh tư duy. Thầy sẽ giúp em nhìn rõ mô hình tiêu dùng.',
    self_healing: 'Chữa lành là quá trình nhận diện chấp niệm để thấu tỏ nội tâm.',
    family: 'Gia đình là trường năng lượng tương hỗ. Cần sự kiên nhẫn và thấu cảm.',
    crush_school: 'Bạn bè và mối quan hệ là lưới xã hội quan trọng. Thầy cùng phân tích.',
    study: 'Học tập là đầu tư dài hạn cho bản thân. Cùng xây lộ trình tối ưu nhé.',
    daily_luck: 'Mỗi ngày là cơ hội tích lũy. Thầy sẽ đọc xu hướng năng lượng hôm nay.',
  },
};

const READER_DECK_PROMPTS: Record<ReaderId, string> = {
  ba_ngoai: '22 lá: đủ để nghe điều quan trọng nhất. 78 lá: chi tiết hơn, hợp khi con muốn nghe kỹ nghen.',
  chi_dai: 'Lượt đầu mở bung cả 78 lá thì tùy ý, các lượt sau muốn mở 78 lá thì cống nạp Sao cho Chị Đại nhé!',
  ban_than: '22 lá hay 78 lá đây bồ ơi? Lượt đầu free 78 lá, lượt sau thì tốn chút Sao thôi nhưng chi tiết tới từng chân tơ kẽ tóc!',
  thay_cu_meo: 'Bộ 22 lá mang năng lượng cốt lõi và định hướng tổng quan. Bộ 78 lá phân tích đa chiều từng chi tiết nguyên nhân - kết quả.',
  ba_co_mo_hon: 'Lượt đầu mở bung cả 78 lá thì tùy ý, các lượt sau muốn mở 78 lá thì cống nạp 5 Sao cho Bà Cố nhé!',
  tien_tu_chua_lanh: 'Mỗi bộ bài mang một tầng số khác nhau. Bộ 22 lá cho bức tranh cốt lõi, còn 78 lá mở khóa từng ngóc ngách tâm hồn...',
  tong_tai_ly_tri: 'Phân tầng tài nguyên: Lượt đầu miễn phí trọn gói 78 lá. Các phiên sau ưu tiên 22 lá hoặc đầu tư 5 Sao để mở phân tích toàn diện.',
  phap_su_toi_co: 'Khai mở năng lượng của 22 đại diện định mệnh hay triệu hồi trọn vẹn 78 tầng rung động huyền bí...',
};

// ============================================================================
// CONSOLIDATED PREPARATION STEPPER
// ============================================================================
function ChuDeStepperContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const { quota } = useQuotaSync();

  const {
    selectedReaderId,
    readerAccentColor,
    hasFilledProfile,
    nickname,
    birthYear,
    selectedTopic,
    deckMode,
    questionText,
    setContextForm,
  } = useReadingStore();

  const initialStepParam = Number(searchParams.get('step')) || 1;
  const [subStep, setSubStep] = useState<number>(() => {
    return initialStepParam >= 1 && initialStepParam <= 3 ? initialStepParam : 1;
  });

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Route guard: Nếu chưa điền hồ sơ thì chuyển về /reading/ve-ban
  useEffect(() => {
    if (!isHydrated) return;
    const hasProfile = hasFilledProfile && Boolean(nickname?.trim()) && Boolean(birthYear);
    if (!hasProfile) {
      router.replace('/reading/ve-ban');
    }
  }, [isHydrated, hasFilledProfile, nickname, birthYear, router]);

  const activeReader = useMemo(() => {
    return READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;
  }, [selectedReaderId]);

  const agePolicy = useMemo(() => {
    return classifyAgeTier(birthYear || 2004, CURRENT_REFERENCE_YEAR, selectedReaderId);
  }, [birthYear, selectedReaderId]);

  const allowedTopics = agePolicy.allowedTopics;

  // Question & deck state
  const [inputText, setInputText] = useState(questionText || '');
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<DeckMode>(deckMode || 'major_22');
  const [tappedTopicId, setTappedTopicId] = useState<TopicId | null>(null);

  // 3D & WebGL refs
  const cardRefsMap = useRef<Map<string, HTMLElement>>(new Map());
  const foilGlareRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const previewTooltipRef = useRef<HTMLDivElement | null>(null);
  const webglMountRef = useRef<HTMLDivElement | null>(null);
  const pointerBridgeRef = useRef({ x: 0, y: 0 });

  // Single-Instance Three.js Cosmic Astral Vortex Stage
  useEffect(() => {
    if (shouldReduceMotion) return;
    const container = webglMountRef.current;
    if (!container) return;

    const tierConfig = detectHardwareTier();
    if (!tierConfig.enableWebGL) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: tierConfig.tier === 'tier1',
        powerPreference: 'high-performance',
        stencil: false,
      });
    } catch {
      return;
    }

    const w = container.clientWidth || window.innerWidth || 800;
    const h = container.clientHeight || window.innerHeight || 900;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(w, h);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const detachContextGuard = attachWebGLContextLostGuard(
      renderer.domElement,
      () => {}
    );

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 20);
    camera.position.set(0, 0, 4.2);

    // GLSL Astral Vortex Plane
    const vortexGeom = new THREE.PlaneGeometry(6.4, 6.4, 28, 28);
    const vortexUniforms = {
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uVelocity: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColorGold: { value: new THREE.Color(readerAccentColor || '#C9A24A') },
      uColorViolet: { value: new THREE.Color(0x38195a) },
      uColorRose: { value: new THREE.Color(0xd43f68) },
    };

    const vortexMat = new THREE.ShaderMaterial({
      vertexShader: ASTRAL_VORTEX_VERTEX_SHADER,
      fragmentShader: ASTRAL_VORTEX_FRAGMENT_SHADER,
      uniforms: vortexUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const vortexMesh = new THREE.Mesh(vortexGeom, vortexMat);
    vortexMesh.position.set(0, 0, -1.2);
    scene.add(vortexMesh);

    // 64 Floating Sacred Crystals (1 Single GPU Draw Call)
    const crystalCount = 64;
    const crystalGeom = new THREE.OctahedronGeometry(0.045, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8f5f0,
      emissive: new THREE.Color(readerAccentColor || '#C9A24A'),
      emissiveIntensity: 0.55,
      metalness: 0.85,
      roughness: 0.2,
    });
    const instancedCrystals = new THREE.InstancedMesh(
      crystalGeom,
      crystalMat,
      crystalCount
    );

    const dummyObj = new THREE.Object3D();
    const crystalSeeds = Array.from({ length: crystalCount }, (_, i) => ({
      angle: (i / crystalCount) * Math.PI * 2,
      radius: 1.2 + (i % 6) * 0.32,
      yOffset: (Math.random() - 0.5) * 3.2,
      speed: 0.25 + (i % 4) * 0.12,
      scale: 0.45 + (i % 3) * 0.3,
    }));
    scene.add(instancedCrystals);

    let isInViewport = true;
    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              isInViewport = entries[0]?.isIntersecting ?? true;
            },
            { threshold: 0.05 }
          )
        : null;
    observer?.observe(container);

    const handleResize = () => {
      if (!renderer || !container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    let rafId: number | null = null;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isInViewport || (typeof document !== 'undefined' && document.hidden)) {
        return;
      }

      const elapsed = clock.getElapsedTime();
      const ptr = pointerBridgeRef.current;

      vortexUniforms.uTime.value = elapsed;
      vortexUniforms.uMouse.value.lerp(new THREE.Vector2(ptr.x, ptr.y), 0.08);

      for (let i = 0; i < crystalCount; i++) {
        const seed = crystalSeeds[i]!;
        const angle = seed.angle + elapsed * seed.speed * 0.35;
        dummyObj.position.set(
          Math.cos(angle) * seed.radius + ptr.x * 0.12,
          seed.yOffset + Math.sin(elapsed * seed.speed + i) * 0.12,
          Math.sin(angle) * seed.radius * 0.4 - 0.5
        );
        dummyObj.rotation.set(elapsed * seed.speed, elapsed * 0.45, angle);
        dummyObj.scale.setScalar(seed.scale);
        dummyObj.updateMatrix();
        instancedCrystals.setMatrixAt(i, dummyObj.matrix);
      }
      instancedCrystals.instanceMatrix.needsUpdate = true;

      renderer?.render(scene, camera);
    };

    animate();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
      detachContextGuard();
      disposeThreeScene(scene, renderer);
      soundManager.cleanupRouteAudio();
    };
  }, [readerAccentColor, shouldReduceMotion]);

  // GSAP mount stagger reveal
  useEffect(() => {
    if (shouldReduceMotion || subStep !== 1) return;
    gsap.fromTo(
      '[data-topic-card]',
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.42, stagger: 0.065, ease: 'power3.out' }
    );
  }, [shouldReduceMotion, subStep]);

  // Card 3D tilt handlers
  const handleCardPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, topId: string) => {
      const el = cardRefsMap.current.get(topId);
      if (!el || shouldReduceMotion) return;
      const rect = el.getBoundingClientRect();
      const normX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, -((e.clientY - rect.top) / rect.height) * 2 + 1));
      pointerBridgeRef.current = { x: normX, y: normY };

      el.style.transform = `perspective(900px) rotateX(${(normY * 11).toFixed(2)}deg) rotateY(${(normX * 13).toFixed(2)}deg) scale3d(1.035, 1.035, 1.035)`;

      const glareEl = foilGlareRefsMap.current.get(topId);
      if (glareEl) {
        const pctX = ((normX + 1) * 50).toFixed(1);
        const pctY = ((1 - normY) * 50).toFixed(1);
        glareEl.style.opacity = '0.38';
        glareEl.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, ${readerAccentColor}99 0%, transparent 65%)`;
      }

      const preview = READER_TOPIC_PREVIEW[selectedReaderId]?.[topId];
      if (previewTooltipRef.current && preview) {
        previewTooltipRef.current.textContent = `“${preview}”`;
        previewTooltipRef.current.style.opacity = '1';
        previewTooltipRef.current.style.transform = 'translateY(0px)';
      }
    },
    [shouldReduceMotion, selectedReaderId, readerAccentColor]
  );

  const handleCardPointerLeave = useCallback((topId: string) => {
    const el = cardRefsMap.current.get(topId);
    if (el) el.style.transform = '';
    const glareEl = foilGlareRefsMap.current.get(topId);
    if (glareEl) glareEl.style.opacity = '0';
    pointerBridgeRef.current = { x: 0, y: 0 };
    if (previewTooltipRef.current) {
      previewTooltipRef.current.style.opacity = '0';
      previewTooltipRef.current.style.transform = 'translateY(6px)';
    }
  }, []);

  const handleSelectTopic = (topId: TopicId) => {
    soundManager.playCrispClick();
    setTappedTopicId(topId);
    setContextForm({ selectedTopic: topId });
    if (!inputText.trim()) {
      const presets = SAMPLE_QUESTIONS_BY_TOPIC[topId] || SAMPLE_QUESTIONS_BY_TOPIC.love;
      if (presets && presets[0]) {
        setInputText(presets[0]);
        setContextForm({ questionText: presets[0] });
      }
    }
    setTimeout(() => {
      setSubStep(2);
    }, shouldReduceMotion ? 20 : 200);
  };

  const handleProceedToDeck = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setQuestionError('Vui lòng gửi gắm một câu hỏi hoặc nỗi niềm để Reader soi chiếu.');
      return;
    }
    const scan = scanCrisisAndInjection(trimmed);
    if (scan.isPromptInjection) {
      setQuestionError('Câu hỏi chứa cú pháp không phù hợp. Vui lòng hỏi tự nhiên chân thành.');
      return;
    }
    soundManager.playCrispClick();
    setContextForm({ questionText: scan.sanitizedText });
    setQuestionError(null);
    setSubStep(3);
  };

  const handleProceedToRutBai = () => {
    soundManager.playMysticChime();
    setContextForm({ deckMode: selectedDeck });
    router.push('/reading/rut-bai');
  };

  const currentTopicConfig = TAROT_TOPIC_CONFIG[selectedTopic] || TAROT_TOPIC_CONFIG.love;
  const readerGreeting = READER_GREETINGS[selectedReaderId] || READER_GREETINGS.ba_ngoai;

  return (
    <div className="min-h-screen bg-[#09080D] text-[#F8F5F0] pt-4 pb-28 px-4 sm:px-6 relative select-none">
      <CustomCursorFollower />

      {/* Single-Instance Three.js Cosmic Astral Vortex Stage (GLSL Shader + 64 InstancedMesh Crystals) */}
      <div
        ref={webglMountRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 w-full h-full z-0 opacity-75"
      />

      <div className="relative z-10 max-w-xl mx-auto space-y-5">
        {/* ================= STEPPER PROGRESS BAR ================= */}
        <div className="rounded-2xl bg-[#14111E] border border-white/10 p-3.5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#C9A24A] uppercase tracking-wider">
              {subStep === 1
                ? 'Bước 2.1: Chọn Chủ Đề'
                : subStep === 2
                ? 'Bước 2.2: Gửi Gắm Nỗi Niềm'
                : 'Bước 2.3: Chọn Bộ Bài'}
            </span>
            <span className="text-[11px] text-[#9E96B0]">
              Tiến trình: {subStep}/3
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#201C2F] overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#C9A24A] to-[#E6CA65]"
              animate={{ width: subStep === 1 ? '33%' : subStep === 2 ? '66%' : '100%' }}
              transition={{ duration: 0.35 }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-[#716A85]">
            <span className={subStep >= 1 ? 'text-[#F3E5AB] font-semibold' : ''}>1. Chủ Đề</span>
            <span className={subStep >= 2 ? 'text-[#F3E5AB] font-semibold' : ''}>2. Tâm Sự</span>
            <span className={subStep >= 3 ? 'text-[#F3E5AB] font-semibold' : ''}>3. Bộ Bài</span>
          </div>
        </div>

        {/* Reader Greeting Banner */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#120F1D] border border-white/10 shadow-lg">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border"
            style={{
              backgroundColor: `${readerAccentColor || activeReader.accent_color}20`,
              borderColor: `${readerAccentColor || activeReader.accent_color}50`,
              color: readerAccentColor || activeReader.accent_color,
            }}
          >
            {activeReader.avatar_symbol}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-[#F8F5F0]">
                {activeReader.name} đang lắng nghe
              </p>
              <Link
                href="/reading/reader"
                className="text-[10px] text-[#C9A24A] hover:underline"
              >
                Đổi Reader
              </Link>
            </div>
            <p className="text-[11px] text-[#E5C687] line-clamp-1 italic font-serif">
              &ldquo;{readerGreeting}&rdquo;
            </p>
          </div>
        </div>

        {/* ================= SUB-STEP 1: CHỌN CHỦ ĐỀ ================= */}
        <AnimatePresence mode="wait">
          {subStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                  Bạn muốn soi chiếu khía cạnh nào?
                </h2>
                <p className="text-xs text-[#9E96B0]">
                  Chạm vào một lá bài năng lượng bên dưới để bắt đầu trải bài cùng {activeReader.name}.
                </p>
              </div>

              {/* Grid 2 Cột Topic Cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {allowedTopics.map((top) => {
                  const isSelected = selectedTopic === top.id;
                  const isTapped = tappedTopicId === top.id;
                  const config = TAROT_TOPIC_CONFIG[top.id as TopicId] || TAROT_TOPIC_CONFIG.love;
                  const ArtworkComp = config.artwork;

                  return (
                    <button
                      key={top.id}
                      type="button"
                      data-topic-card
                      data-cursor={`CHỌN ${config.titleVi}`}
                      ref={(el) => { if (el) cardRefsMap.current.set(top.id, el); }}
                      onClick={() => handleSelectTopic(top.id as TopicId)}
                      onPointerMove={(e) => handleCardPointerMove(e, top.id)}
                      onPointerLeave={() => handleCardPointerLeave(top.id)}
                      className={`group relative text-center rounded-2xl p-3 sm:p-4 border transition-all cursor-pointer flex flex-col justify-between aspect-[9/14] sm:aspect-[9/13] overflow-hidden select-none will-change-transform ${
                        isSelected || isTapped
                          ? 'bg-[#181427]/95 ring-2 ring-[#C9A24A] shadow-[0_0_25px_rgba(201,162,74,0.3)]'
                          : 'bg-[#100D1B]/90 hover:bg-[#151124] border-[#2B263D]'
                      }`}
                      style={{
                        borderColor: isSelected || isTapped ? (readerAccentColor || '#C9A24A') : '#2B263D',
                      }}
                    >
                      {/* Holographic Foil Glare */}
                      <div
                        ref={(el) => { if (el) foilGlareRefsMap.current.set(top.id, el); }}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-30 opacity-0 transition-opacity duration-200"
                      />

                      {/* Header Card: Roman + Resonance Pct */}
                      <div className="relative z-10 flex items-center justify-between px-1 text-[8px] sm:text-[9px] font-bold tracking-[0.16em] uppercase">
                        <span className="text-[#C9A24A]/90">{config.roman}</span>
                        <span
                          style={{ color: readerAccentColor || '#C9A24A' }}
                          className="flex items-center gap-0.5"
                        >
                          <Flame className="w-2.5 h-2.5" />
                          <span>{config.resonancePct}%</span>
                        </span>
                      </div>

                      {/* Center Artwork */}
                      <div className="flex-1 w-full flex items-center justify-center p-1.5 sm:p-2 relative z-10 transition-transform duration-300 group-hover:scale-105">
                        <ArtworkComp />
                      </div>

                      {/* Footer Card: Title + Spread Slots */}
                      <div className="relative z-10 pt-1 pb-1 space-y-1">
                        <h3 className="font-serif tracking-wider text-xs sm:text-sm font-extrabold text-[#C9A24A] uppercase transition-colors group-hover:text-[#F3E5AB] truncate">
                          {config.titleVi}
                        </h3>

                        <div className="hidden sm:flex items-center justify-center gap-1 text-[8px] text-[#9E96B0]">
                          <Layers className="w-2.5 h-2.5 text-[#C9A24A]" />
                          <span className="truncate max-w-[130px]">
                            Trải 3 lá: {config.spreadSlots[0]} &bull; {config.spreadSlots[1]} &bull; {config.spreadSlots[2]}
                          </span>
                        </div>
                      </div>

                      {(isSelected || isTapped) && (
                        <div
                          className="absolute top-2.5 right-2.5 z-40 w-4 h-4 rounded-full flex items-center justify-center text-[#0B0A12] font-bold text-[10px]"
                          style={{ backgroundColor: readerAccentColor || '#C9A24A' }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reader Voice Preview Tooltip */}
              <div
                ref={previewTooltipRef}
                aria-hidden="true"
                className="z-50 text-center font-serif text-xs italic text-[#E5C687] opacity-0 transition-all duration-200 py-1"
                style={{ transform: 'translateY(6px)' }}
              />
            </motion.div>
          )}

          {/* ================= SUB-STEP 2: GỬI GẮM NỖI NIỀM ================= */}
          {subStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                    Gửi gắm nỗi niềm của bạn
                  </h2>
                  <p className="text-xs text-[#9E96B0]">
                    Chủ đề: <strong className="text-[#F3E5AB]">{currentTopicConfig.titleVi}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubStep(1)}
                  className="inline-flex items-center gap-1 text-xs text-[#C9A24A] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Đổi chủ đề</span>
                </button>
              </div>

              {/* Sample Question Suggestions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#9E96B0]">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A24A]" />
                    <span>Gợi ý câu hỏi thường gặp:</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(SAMPLE_QUESTIONS_BY_TOPIC[selectedTopic] || SAMPLE_QUESTIONS_BY_TOPIC.love).map(
                    (q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          soundManager.playCrispClick();
                          setInputText(q);
                          setQuestionError(null);
                        }}
                        className="text-left text-[11px] px-3 py-1.5 rounded-xl bg-[#14111E] hover:bg-[#1D192C] border border-white/10 text-[#D8D2E7] hover:text-white transition cursor-pointer"
                      >
                        &ldquo;{q}&rdquo;
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Question Textarea */}
              <div className="space-y-1.5">
                <textarea
                  rows={4}
                  maxLength={280}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (questionError) setQuestionError(null);
                  }}
                  placeholder="Nhập câu chuyện hoặc điều bạn đang trăn trở nhất..."
                  className="w-full p-4 rounded-2xl bg-[#120F1D] border border-white/10 text-xs sm:text-sm text-[#F8F5F0] placeholder-[#5E5873] focus:outline-none focus:border-[#C9A24A] transition-colors resize-none leading-relaxed"
                />
                <div className="flex justify-between items-center text-[10px] text-[#716A85] px-1">
                  <span>Bảo mật 100% · Không lưu trữ danh tính cá nhân</span>
                  <span>{inputText.length}/280 ký tự</span>
                </div>
                {questionError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{questionError}</span>
                  </p>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubStep(1)}
                  className="py-3 px-4 rounded-xl bg-[#14111E] hover:bg-[#1C182A] border border-white/10 text-xs font-semibold text-[#D8D2E7] transition cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleProceedToDeck}
                  className="flex-1 py-3 px-6 rounded-xl bg-[#C9A24A] hover:bg-[#E6CA65] text-[#09080D] font-bold text-xs sm:text-sm transition shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Tiếp tục: Chọn bộ bài</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= SUB-STEP 3: CHỌN BỘ BÀI ================= */}
          {subStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                    Chọn tầng sóng bộ bài
                  </h2>
                  <p className="text-xs text-[#9E96B0]">
                    Lời khuyên từ {activeReader.name}: &ldquo;{READER_DECK_PROMPTS[activeReader.id]}&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubStep(2)}
                  className="inline-flex items-center gap-1 text-xs text-[#C9A24A] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Sửa câu hỏi</span>
                </button>
              </div>

              {/* Deck Mode Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 22 Major Arcana */}
                <div
                  onClick={() => {
                    soundManager.playCrispClick();
                    setSelectedDeck('major_22');
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative space-y-2.5 ${
                    selectedDeck === 'major_22'
                      ? 'bg-gradient-to-b from-[#1C172E] to-[#120F1D] border-[#C9A24A] shadow-[0_0_25px_rgba(201,162,74,0.25)]'
                      : 'bg-[#14111E] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-[#E6CA65] uppercase font-bold">
                      22 LÁ ĐẠI BÍ MẬT
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      MIỄN PHÍ
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#F8F5F0]">
                    Major Arcana (Khởi Sắc Cốt Lõi)
                  </h3>
                  <p className="text-xs text-[#9E96B0] leading-relaxed">
                    Tập trung vào bức tranh tổng thể, các bước ngoặt số phận và thông điệp vũ trụ mang tính định mệnh.
                  </p>
                </div>

                {/* 78 Full Deck */}
                <div
                  onClick={() => {
                    soundManager.playCrispClick();
                    setSelectedDeck('full_78');
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative space-y-2.5 ${
                    selectedDeck === 'full_78'
                      ? 'bg-gradient-to-b from-[#1C172E] to-[#120F1D] border-[#C9A24A] shadow-[0_0_25px_rgba(201,162,74,0.25)]'
                      : 'bg-[#14111E] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-[#E6CA65] uppercase font-bold">
                      78 LÁ TOÀN PHẦN
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#C9A24A]/20 text-[#F3E5AB] font-bold border border-[#C9A24A]/30">
                      CHUYÊN SÂU
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#F8F5F0]">
                    Trọn Bộ RWS 1909 (Đa Chiều)
                  </h3>
                  <p className="text-xs text-[#9E96B0] leading-relaxed">
                    Mở rộng toàn bộ 56 lá Tiểu bí mật (Gậy, Ly, Kiếm, Tiền), bóc tách chi tiết từng lát cắt tâm lý và hành động cụ thể.
                  </p>
                </div>
              </div>

              {/* Selected Summary Card */}
              <div className="p-4 rounded-2xl bg-[#0F0D1A] border border-white/5 text-xs space-y-1">
                <div className="flex justify-between text-[#9E96B0]">
                  <span>Câu hỏi của bạn:</span>
                  <span className="text-[#F3E5AB] font-bold truncate max-w-[200px]">
                    &ldquo;{inputText}&rdquo;
                  </span>
                </div>
                <div className="flex justify-between text-[#9E96B0]">
                  <span>Vị Reader:</span>
                  <span className="text-[#F8F5F0] font-semibold">{activeReader.name}</span>
                </div>
                <div className="flex justify-between text-[#9E96B0]">
                  <span>Tầng sóng bài:</span>
                  <span className="text-[#C9A24A] font-semibold">
                    {selectedDeck === 'full_78' ? '78 Lá Toàn Phần' : '22 Lá Đại Bí Mật'}
                  </span>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubStep(2)}
                  className="py-3.5 px-4 rounded-xl bg-[#14111E] hover:bg-[#1C182A] border border-white/10 text-xs font-semibold text-[#D8D2E7] transition cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleProceedToRutBai}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#C9A24A] via-[#E6CA65] to-[#C9A24A] text-[#09080D] font-bold text-xs sm:text-sm transition shadow-[0_0_25px_rgba(201,162,74,0.35)] hover:brightness-110 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Bước Vào Nghi Thức Rút Bài</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ChuDePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09080D] flex items-center justify-center text-[#C9A24A] text-sm font-medium">Đang chuẩn bị không gian bốc bài...</div>}>
      <ChuDeStepperContent />
    </Suspense>
  );
}

import type { CanonicalReaderId } from '@/lib/reader-slugs';

export interface SanctuaryPersonaSpec {
  roman: string;
  arcanaName: string;
  signatureCardTitle: string;
  signatureCardImage: string;
  totemName: string;
  frequencyLabel: string;
  spreadStyle: string;
  secondaryHex: string;
  baseAffinity: number;
  moodPillLabel: string;
  moodEmoji: string;
  topicMastery: [
    { topic: string; score: number },
    { topic: string; score: number },
    { topic: string; score: number },
  ];
}

export const SANCTUARY_SPEC_MAP: Record<CanonicalReaderId, SanctuaryPersonaSpec> = {
  ba_ngoai: {
    roman: 'I',
    arcanaName: 'XIX • THE SUN',
    signatureCardTitle: 'Lá Mặt Trời (The Sun)',
    signatureCardImage:
      'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
    totemName: 'Đèn Trà Sen Gốm Cổ',
    frequencyLabel: '432 Hz • Sóng Âm Chữa Lành',
    spreadStyle: '3 Lá Tâm Sự Đời Thường',
    secondaryHex: '#451A03',
    baseAffinity: 96,
    moodPillLabel: 'Đang mệt mỏi, cần vỗ về',
    moodEmoji: '🥺',
    topicMastery: [
      { topic: 'Chữa Lành Tâm Hồn & Gia Đình', score: 99 },
      { topic: 'Tình Cảm & Sự Bao Dung', score: 95 },
      { topic: 'Học Tập & Nhịp Sống Bình Yên', score: 90 },
    ],
  },
  chi_dai: {
    roman: 'II',
    arcanaName: 'XV • THE DEVIL (REV)',
    signatureCardTitle: 'Lá Ác Quỷ Đảo Chiều (The Devil)',
    signatureCardImage:
      'https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg',
    totemName: 'Ly Pha Lê Ruby Đỏ',
    frequencyLabel: '528 Hz • Sóng Âm Tỉnh Thức',
    spreadStyle: '3 Lá Bóc Trần Sự Thật',
    secondaryHex: '#4C0519',
    baseAffinity: 94,
    moodPillLabel: 'Đang lụy / mập mờ, cần mắng tỉnh',
    moodEmoji: '🔥',
    topicMastery: [
      { topic: 'Soi Kèo Mập Mờ & Thoát Lụy Tình', score: 99 },
      { topic: 'Bản Lĩnh Cá Nhân & Tự Trọng', score: 97 },
      { topic: 'Quyết Đoán Sự Nghiệp & Tài Chính', score: 91 },
    ],
  },
  ban_than: {
    roman: 'III',
    arcanaName: '0 • THE FOOL',
    signatureCardTitle: 'Lá Kẻ Khờ (The Fool)',
    signatureCardImage:
      'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
    totemName: 'Tinh Cầu Sao Hồng',
    frequencyLabel: '639 Hz • Sóng Âm Đồng Cảm',
    spreadStyle: '3 Lá Không Phán Xét',
    secondaryHex: '#4A044E',
    baseAffinity: 95,
    moodPillLabel: 'Muốn xả stress, tâm sự lầy lội',
    moodEmoji: '😂',
    topicMastery: [
      { topic: 'Tâm Sự Thầm Kín Không Phán Xét', score: 99 },
      { topic: 'Chuyện Crush, Bạn Bè & Gen Z Vibe', score: 96 },
      { topic: 'Giải Tỏa Áp Lực Tinh Thần', score: 93 },
    ],
  },
  thay_cu_meo: {
    roman: 'IV',
    arcanaName: 'IV • THE EMPEROR',
    signatureCardTitle: 'Lá Hoàng Đế (The Emperor)',
    signatureCardImage:
      'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg',
    totemName: 'Thiên Cầu Nghi Đồng Thau',
    frequencyLabel: '741 Hz • Sóng Âm Minh Triết',
    spreadStyle: '3 Lá Phân Tích Nhân Quả',
    secondaryHex: '#172554',
    baseAffinity: 97,
    moodPillLabel: 'Đang rối bời, cần phân tích logic',
    moodEmoji: '🧭',
    topicMastery: [
      { topic: 'Định Hướng Sự Nghiệp & Học Tập', score: 99 },
      { topic: 'Phân Tích Tài Chính & Kế Hoạch', score: 97 },
      { topic: 'Gỡ Rối Quyết Định Khó Khăn', score: 95 },
    ],
  },
};
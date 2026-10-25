// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import {
  computeCoupleLoveLanguage,
  computeCoupleSecretAdvice,
  computeCoupleQuests,
  generateCoupleInterpretationBundle,
} from '../src/lib/couple-interpretation';
import { CoupleModeView } from '../src/components/CoupleModeView';

describe('Couple Mode V2 — Rebuild & New Features Test Suite', () => {
  afterEach(() => {
    cleanup();
  });

  describe('1. Love Language Prediction & Harmony Assessment', () => {
    it('computes valid love language profiles for both partners', () => {
      const result = computeCoupleLoveLanguage(6, false, 19, false);

      expect(result.ownerProfile).toBeDefined();
      expect(result.partnerProfile).toBeDefined();
      expect(result.ownerProfile.percentage).toBeGreaterThanOrEqual(65);
      expect(result.partnerProfile.percentage).toBeGreaterThanOrEqual(65);
      expect(result.ownerProfile.nameVi).toBeTruthy();
      expect(result.partnerProfile.nameVi).toBeTruthy();
      expect(result.matchScore).toBeGreaterThanOrEqual(50);
      expect(result.matchScore).toBeLessThanOrEqual(100);
      expect(result.advice).toBeTruthy();
    });

    it('identifies identical love languages as highly harmonious', () => {
      // Same card id and orientation produces identical love language
      const result = computeCoupleLoveLanguage(1, false, 1, false);

      expect(result.ownerProfile.type).toBe(result.partnerProfile.type);
      expect(result.matchScore).toBe(94);
      expect(result.harmonyLevel).toBe('rat_dong_dieu');
      expect(result.harmonyTitle).toContain('Đồng Điệu');
    });
  });

  describe('2. Secret Advice (Empathy Perspective)', () => {
    it('generates distinct advice for owner and partner based on relationship status', () => {
      const adviceDating = computeCoupleSecretAdvice({
        ownerName: 'Hoàng',
        partnerName: 'Mai',
        c1Name: 'The Lovers',
        c1Rev: false,
        c2Name: 'The Sun',
        c2Rev: false,
        c3Name: 'The Star',
        relationshipStatus: 'dating',
      });

      expect(adviceDating.forOwner.title).toContain('Hoàng');
      expect(adviceDating.forPartner.title).toContain('Mai');
      expect(adviceDating.forOwner.whatPartnerExpects).toContain('Mai');
      expect(adviceDating.forPartner.whatOwnerExpects).toContain('Hoàng');
      expect(adviceDating.forOwner.caution).toBeTruthy();
      expect(adviceDating.forPartner.caution).toBeTruthy();
    });

    it('tailors advice for crush / situationship dynamics', () => {
      const adviceCrush = computeCoupleSecretAdvice({
        ownerName: 'An',
        partnerName: 'Bình',
        c1Name: 'The Magician',
        c1Rev: false,
        c2Name: 'The Fool',
        c2Rev: false,
        c3Name: 'The Wheel of Fortune',
        relationshipStatus: 'crush',
      });

      expect(adviceCrush.forOwner.whatPartnerExpects).toMatch(/dè chừng|thu hút|rõ ràng/);
      expect(adviceCrush.forPartner.whatOwnerExpects).toMatch(/chủ động|dứt khoát|tin nhắn/);
    });
  });

  describe('3. 7-Day Couple Quest (Actionable Mini-Missions)', () => {
    it('generates exactly 3 structured quests across 7 days', () => {
      const quests = computeCoupleQuests('Minh', 'Linh', 'dating');

      expect(quests).toHaveLength(3);
      expect(quests[0]?.dayLabel).toContain('Ngày 1 - 2');
      expect(quests[1]?.dayLabel).toContain('Ngày 3 - 4');
      expect(quests[2]?.dayLabel).toContain('Ngày 5 - 7');

      quests.forEach((q) => {
        expect(q.title).toBeTruthy();
        expect(q.mission).toBeTruthy();
        expect(q.purpose).toBeTruthy();
        expect(q.icon).toBeTruthy();
      });
    });
  });

  describe('4. Full Bundle Generator', () => {
    it('integrates love language, secret advice, and quests into a single bundle', () => {
      const bundle = generateCoupleInterpretationBundle({
        ownerName: 'Tuấn',
        partnerName: 'Trang',
        c1: { id: 0, reversed: false, name_vi: 'The Fool' },
        c2: { id: 1, reversed: true, name_vi: 'The Magician' },
        c3: { id: 2, reversed: false, name_vi: 'The High Priestess' },
        relationshipStatus: 'situationship',
      });

      expect(bundle.loveLanguage).toBeDefined();
      expect(bundle.secretAdvice).toBeDefined();
      expect(bundle.coupleQuests).toHaveLength(3);
    });
  });

  describe('5. CoupleModeView UI Component Integration', () => {
    it('renders the 2 visual mode cards on initial load', () => {
      render(
        <CoupleModeView
          nickname="Bạn"
          birthYear={2002}
          selectedReaderId="chi_dai"
          onSelectReaderId={() => {}}
          deckMode="full_78"
          onOpenStoryModal={() => {}}
        />
      );

      // Card 1
      expect(screen.getByText('Bói Bí Mật 1 Mình')).toBeDefined();
      expect(screen.getByText('Bắt Đầu Soi Bí Mật')).toBeDefined();

      // Card 2
      expect(screen.getByText('Phòng Hẹn Hò 2 Người')).toBeDefined();
      expect(screen.getByText('Khai Mở Phòng Hẹn Hò')).toBeDefined();
    });

    it('transitions to Solo Couple form when Card 1 is clicked', () => {
      render(
        <CoupleModeView
          nickname="Huy"
          birthYear={2001}
          selectedReaderId="ba_ngoai"
          onSelectReaderId={() => {}}
          deckMode="full_78"
          onOpenStoryModal={() => {}}
        />
      );

      const card1Btn = screen.getByText('Bắt Đầu Soi Bí Mật');
      fireEvent.click(card1Btn);

      expect(screen.getByLabelText('Biệt danh của bạn')).toBeDefined();
      expect(screen.getByLabelText('Biệt danh người ấy')).toBeDefined();
      expect(screen.getByText(/Khai Mở Bói Đôi & Rút 3 Lá Bài/i)).toBeDefined();
    });

    it('transitions to Co-op Room form when Card 2 is clicked', () => {
      render(
        <CoupleModeView
          nickname="Huy"
          birthYear={2001}
          selectedReaderId="ba_ngoai"
          onSelectReaderId={() => {}}
          deckMode="full_78"
          onOpenStoryModal={() => {}}
        />
      );

      const card2Btn = screen.getByText('Khai Mở Phòng Hẹn Hò');
      fireEvent.click(card2Btn);

      expect(screen.getByLabelText('Biệt danh của bạn')).toBeDefined();
      expect(screen.getByText(/Khai Mở Phòng Hẹn Hò & Rút Lá Số 1 Của Bạn/i)).toBeDefined();
    });
  });
});

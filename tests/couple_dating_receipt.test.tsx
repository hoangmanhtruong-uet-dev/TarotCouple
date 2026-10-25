// @vitest-environment jsdom
import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { CoupleDatingReceiptModal } from '../src/components/CoupleDatingReceiptModal';

describe('Couple Mode 2.0 — Dating Receipt Modal Suite', () => {
  afterEach(() => {
    cleanup();
  });
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CoupleDatingReceiptModal
        isOpen={false}
        onClose={() => {}}
        ownerNickname="Minh"
        partnerNickname="Lan"
        relationshipLabel="Mập mờ"
        compatScore={88}
        redFlagLevel={15}
        readerName="Cô Sáu"
        vibeTag="Định Mệnh Hút Nhau"
        verdictSnippet="Hai bạn rất có tiềm năng."
        savageQuote="Bớt suy nghĩ, rủ đi ăn đi."
        c1Name="The Lovers"
        c2Name="The Sun"
        c3Name="The Star"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders complete receipt information when open', () => {
    render(
      <CoupleDatingReceiptModal
        isOpen={true}
        onClose={() => {}}
        ownerNickname="Minh"
        partnerNickname="Lan"
        relationshipLabel="Mập mờ"
        compatScore={88}
        redFlagLevel={15}
        readerName="Cô Sáu"
        vibeTag="Định Mệnh Hút Nhau"
        verdictSnippet="Hai bạn rất có tiềm năng."
        savageQuote="Bớt suy nghĩ, rủ đi ăn đi."
        c1Name="The Lovers"
        c2Name="The Sun"
        c3Name="The Star"
      />
    );

    expect(screen.getByText(/TAROT COUPLE SANCTUARY/i)).toBeDefined();
    expect(screen.getByText(/KHÁCH: @Minh & @Lan/i)).toBeDefined();
    expect(screen.getByText(/88%/)).toBeDefined();
    expect(screen.getByText(/15%/)).toBeDefined();
    expect(screen.getByText(/The Star/)).toBeDefined();
    expect(screen.getByText(/"Bớt suy nghĩ, rủ đi ăn đi."/)).toBeDefined();
  });

  it('triggers onClose when close button is clicked', () => {
    let closed = false;
    render(
      <CoupleDatingReceiptModal
        isOpen={true}
        onClose={() => {
          closed = true;
        }}
        ownerNickname="Minh"
        partnerNickname="Lan"
        relationshipLabel="Mập mờ"
        compatScore={88}
        redFlagLevel={15}
        readerName="Cô Sáu"
        vibeTag="Định Mệnh Hút Nhau"
        verdictSnippet="Hai bạn rất có tiềm năng."
        savageQuote="Bớt suy nghĩ, rủ đi ăn đi."
        c1Name="The Lovers"
        c2Name="The Sun"
        c3Name="The Star"
      />
    );

    const closeBtn = screen.getByLabelText('Đóng hóa đơn');
    fireEvent.click(closeBtn);
    expect(closed).toBe(true);
  });
});

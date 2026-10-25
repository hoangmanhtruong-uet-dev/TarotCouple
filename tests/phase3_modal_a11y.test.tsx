// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import { useModalA11y, isEditableTarget } from '../src/lib/use-modal-a11y';

describe('M4 + M6 — Modal accessibility & editable-target guard (behavioral)', () => {
  afterEach(() => {
    document.body.style.overflow = '';
    vi.restoreAllMocks();
  });

  it('locks body scroll while open and restores it on unmount', () => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'auto';

    const { unmount } = renderHook(() => useModalA11y(true, () => {}));
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('auto');

    document.body.style.overflow = previous;
  });

  it('does nothing to scroll when closed', () => {
    document.body.style.overflow = 'auto';
    renderHook(() => useModalA11y(false, () => {}));
    expect(document.body.style.overflow).toBe('auto');
  });

  it('calls onClose on Escape keydown while open', () => {
    const onClose = vi.fn();
    renderHook(() => useModalA11y(true, onClose));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closed', () => {
    const onClose = vi.fn();
    renderHook(() => useModalA11y(false, onClose));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('isEditableTarget returns true for inputs/textareas/selects/contentEditable', () => {
    const input = document.createElement('input');
    expect(isEditableTarget(input)).toBe(true);

    const textarea = document.createElement('textarea');
    expect(isEditableTarget(textarea)).toBe(true);

    const select = document.createElement('select');
    expect(isEditableTarget(select)).toBe(true);

    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    expect(isEditableTarget(editable)).toBe(true);
  });

  it('isEditableTarget returns false for non-editable elements and non-elements', () => {
    const div = document.createElement('div');
    expect(isEditableTarget(div)).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget({})).toBe(false);
  });

  it('traps Tab focus inside the dialog container (M4 focus trap)', () => {
    function DialogFixture({ open }: { open: boolean }) {
      const dialogRef = useModalA11y(open, () => {});
      if (!open) return null;
      return (
        <div role="dialog" ref={dialogRef}>
          <button>First</button>
          <button>Last</button>
        </div>
      );
    }

    render(<DialogFixture open={true} />);
    const first = screen.getByText('First');
    const last = screen.getByText('Last');

    // Focus the last button, then Tab should wrap back to the first.
    act(() => last.focus());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    });
    expect(document.activeElement).toBe(first);

    // Shift+Tab from the first should wrap back to the last.
    act(() => first.focus());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
      );
    });
    expect(document.activeElement).toBe(last);
  });
});

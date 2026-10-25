'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * M4 (modal accessibility): activate Escape-to-close, body scroll lock, and a
 * Tab focus trap while a modal/dialog is open, with correct cleanup.
 *
 * The focus trap anchors Tab/Shift+Tab to the dialog's container (the closest
 * `[role="dialog"]` ancestor of the returned ref) so keyboard focus cannot
 * escape to the page behind the overlay.
 *
 * Usage:
 *   const dialogRef = useModalA11y(isOpen, onClose);
 *   return <div role="dialog" ref={dialogRef}>…</div>;
 */
export function useModalA11y(isOpen: boolean, onClose?: () => void) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );

      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return dialogRef;
}

/**
 * M6: returns true when the keydown event originated from an interactive
 * element (input / textarea / select / contentEditable). Callers should skip
 * their global arrow-key navigation in that case so typing in a field or
 * navigating a nested control is never hijacked.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  const editable = (target as HTMLElement).isContentEditable;
  if (editable === true) return true;
  // jsdom/older engines may not expose isContentEditable reliably — fall back
  // to the contentEditable property, which is 'inherit' when false/unset.
  const attr = (target as HTMLElement).contentEditable;
  return attr === 'true' || attr === 'plaintext-only';
}

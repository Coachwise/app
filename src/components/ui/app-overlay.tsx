import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './utils';

interface AppOverlayProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  /** Dismiss on Escape / backdrop tap. Default true. */
  dismissible?: boolean;
  /** Show the floating close (X) button. Default true when onClose is given. */
  showClose?: boolean;
  /** Extra classes for the inner content column (max-w-md, centered by default). */
  className?: string;
  /** Backdrop classes — override for marketing takeovers (e.g. an image/gradient). */
  backdropClassName?: string;
}

/**
 * A full-screen app overlay rendered in a portal above everything. Generic on
 * purpose: the first use is the guided workout run, but it is also the vehicle
 * for future marketing takeovers, announcements and campaigns — so it only owns
 * the shell (portal, backdrop, scroll-lock, dismissal) and lets callers fill it.
 */
export function AppOverlay({
  open,
  onClose,
  children,
  dismissible = true,
  showClose,
  className,
  backdropClassName,
}: AppOverlayProps) {
  // Lock body scroll while open so the page behind can't move.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes a dismissible overlay.
  useEffect(() => {
    if (!open || !dismissible || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  if (!open) return null;

  const withClose = showClose ?? !!onClose;

  return createPortal(
    <div
      className={cn('fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm', backdropClassName)}
      onClick={dismissible && onClose ? onClose : undefined}
    >
      <div
        className={cn('relative flex-1 w-full max-w-md mx-auto flex flex-col', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {withClose && onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 p-2 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-6" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

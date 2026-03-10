'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FullScreenModalProps {
  isOpen: boolean;
  onClose?: () => void;
  hasCloseButton?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FullScreenModal = ({
  isOpen,
  onClose,
  hasCloseButton = true,
  children,
  className,
}: FullScreenModalProps) => {
  // Guard against SSR: portals require document.body
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed inset-0 w-screen h-screen z-50',
        'bg-black/60 backdrop-blur-sm',
        'flex items-center justify-center',
        // Entry animation — uses utilities defined in globals.css
        'animate-in fade-in zoom-in-95 anim-duration-200',
      )}
    >
      <div className={cn('relative w-full h-full', className)}>
        {hasCloseButton && onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 min-h-14 min-w-14 flex items-center justify-center rounded-full bg-white/90 shadow-lg active:scale-95 transition-transform"
          >
            <X size={28} className="text-slate-700" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
};

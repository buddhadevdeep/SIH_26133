import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  className?: string;
  hideCloseButton?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  children,
  maxWidth = 'xl',
  className,
  hideCloseButton = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || !mounted) return null;

  const maxWidths = {
    sm: 'max-w-md',
    md: 'max-w-xl sm:max-w-2xl',
    lg: 'max-w-2xl sm:max-w-3xl',
    xl: 'max-w-3xl sm:max-w-4xl',
    '2xl': 'max-w-4xl sm:max-w-5xl',
    '3xl': 'max-w-5xl sm:max-w-6xl',
    '4xl': 'max-w-6xl sm:max-w-7xl',
    '5xl': 'max-w-[92vw]',
    full: 'max-w-[96vw]',
  };

  const dialogElement = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto p-4 sm:p-6 flex min-h-full items-start justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full my-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl transition-all border border-slate-200 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col overflow-hidden',
          maxWidths[maxWidth],
          className
        )}
      >
        {!hideCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 min-h-[44px] min-w-[44px] flex items-center justify-center z-20 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );

  return createPortal(dialogElement, document.body);
};

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 text-left pb-4 border-b border-slate-100 shrink-0', className)} {...props} />
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn('text-xl font-bold tracking-tight text-slate-900', className)} {...props} />
);

export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-sm text-slate-500 leading-relaxed', className)} {...props} />
);

export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('py-4 overflow-y-auto text-left flex-1', className)} {...props} />
);

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0', className)} {...props} />
);

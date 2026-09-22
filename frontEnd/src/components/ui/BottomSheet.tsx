import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ open, onOpenChange, title, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div className="relative z-50 w-full rounded-t-3xl bg-white p-5 shadow-2xl max-h-[85vh] flex flex-col border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
        {/* Drag handle */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          {title ? <h3 className="font-bold text-lg text-slate-900">{title}</h3> : <div />}
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close sheet"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto pt-4 flex-1">{children}</div>
      </div>
    </div>
  );
};

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  position?: 'left' | 'right';
  children: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  title,
  position = 'right',
  children,
  width = 'max-w-lg sm:max-w-xl',
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed inset-y-0 z-50 flex w-full bg-white shadow-2xl transition-transform border-slate-200 flex-col',
          width,
          position === 'right' ? 'right-0 border-l' : 'left-0 border-r'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          {title && <h3 className="font-bold text-lg text-slate-900">{title}</h3>}
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center ml-auto"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

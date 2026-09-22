import React, { useState, useRef, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  name?: string;
  label?: string;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  options?: (SelectOption | string)[];
  children?: React.ReactNode;
  onChange?: ((value: string) => void) | ((e: { target: { value: string; name?: string } }) => void);
  onValueChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  wrapperClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      id,
      name,
      label,
      value,
      defaultValue,
      placeholder = 'Select an option...',
      options,
      children,
      onChange,
      onValueChange,
      error,
      helperText,
      required = false,
      disabled = false,
      searchable,
      className,
      wrapperClassName,
      size = 'md',
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);

    // Normalize options from props or children
    const parsedOptions: SelectOption[] = React.useMemo(() => {
      if (options && options.length > 0) {
        return options.map((opt) =>
          typeof opt === 'string'
            ? { value: opt, label: opt }
            : opt
        );
      }

      if (children) {
        const extracted: SelectOption[] = [];
        React.Children.forEach(children, (child) => {
          if (React.isValidElement(child) && child.props) {
            const childProps = child.props as { value?: any; children?: any; disabled?: boolean };
            const val = childProps.value !== undefined ? String(childProps.value) : '';
            const text =
              typeof childProps.children === 'string'
                ? childProps.children
                : String(childProps.value ?? '');
            extracted.push({
              value: val,
              label: text,
              disabled: Boolean(childProps.disabled),
            });
          }
        });
        return extracted;
      }

      return [];
    }, [options, children]);

    // Uncontrolled fallback state if value is undefined
    const [internalValue, setInternalValue] = useState<string | number>(
      value !== undefined ? value : defaultValue !== undefined ? defaultValue : ''
    );

    const activeValue = value !== undefined ? value : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    // Auto-enable search if more than 6 options unless explicitly specified false
    const isSearchable = searchable !== undefined ? searchable : parsedOptions.length > 6;

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
      if (!searchTerm.trim()) return parsedOptions;
      const query = searchTerm.toLowerCase().trim();
      return parsedOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(query)) ||
          String(opt.value).toLowerCase().includes(query)
      );
    }, [parsedOptions, searchTerm]);

    // Find currently selected option
    const selectedOption = parsedOptions.find(
      (opt) => String(opt.value) === String(activeValue)
    );

    // Close on click outside
    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
      }

      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('touchstart', handleOutsideClick);
      };
    }, [isOpen]);

    // Focus search input when opened
    useEffect(() => {
      if (isOpen && isSearchable) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [isOpen, isSearchable]);

    const handleSelectOption = (opt: SelectOption) => {
      if (opt.disabled || disabled) return;

      const stringVal = String(opt.value);
      setInternalValue(stringVal);
      setIsOpen(false);
      setSearchTerm('');

      if (onValueChange) {
        onValueChange(stringVal);
      }

      if (onChange) {
        // Trigger synthetic event-like object for standard React event handlers
        const syntheticEvent = {
          target: { value: stringVal, name: name || id || '' },
          currentTarget: { value: stringVal, name: name || id || '' },
          value: stringVal,
          preventDefault: () => {},
          stopPropagation: () => {},
        };
        (onChange as any)(syntheticEvent);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        }
      } else if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
        }
      } else if (e.key === 'ArrowDown' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    // Height/padding styling based on size
    const sizeClasses =
      size === 'sm'
        ? 'min-h-[36px] py-1.5 px-3 text-xs'
        : size === 'lg'
        ? 'min-h-[48px] py-3 px-4 text-base'
        : 'min-h-[42px] py-2.5 px-3.5 text-xs sm:text-sm';

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as any).current = node;
        }}
        className={cn('w-full space-y-1.5 text-left relative', wrapperClassName)}
        onKeyDown={handleKeyDown}
      >
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Custom Trigger Button */}
          <button
            id={selectId}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${selectId}-menu`}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            className={cn(
              'w-full flex items-center justify-between gap-2 rounded-xl border bg-white font-medium text-slate-900 shadow-2xs transition-all duration-150 cursor-pointer text-left select-none',
              'border-slate-300 hover:border-slate-400',
              'focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20',
              isOpen && 'border-teal-700 ring-2 ring-teal-700/20 shadow-xs',
              disabled && 'cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200 opacity-60 shadow-none',
              error && 'border-red-500 ring-2 ring-red-500/20',
              sizeClasses,
              className
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
              {selectedOption?.icon && (
                <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
              )}

              {selectedOption ? (
                <div className="truncate flex items-center gap-2">
                  <span className="font-semibold text-slate-900 truncate">
                    {selectedOption.label}
                  </span>
                  {selectedOption.badge && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                      {selectedOption.badge}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 font-normal truncate">{placeholder}</span>
              )}
            </div>

            {/* Custom chevron with smooth 180-deg flip */}
            <div
              className={cn(
                'shrink-0 text-slate-400 transition-transform duration-200 pointer-events-none',
                isOpen && 'rotate-180 text-teal-700'
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>

          {/* Floating Dropdown Popover Menu (Pure White, Custom Website Dropdown) */}
          {isOpen && (
            <div
              id={`${selectId}-menu`}
              role="listbox"
              className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 origin-top"
            >
              {/* Optional Search Filter Bar */}
              {isSearchable && (
                <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search options..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700"
                    />
                  </div>
                </div>
              )}

              {/* Options List Container */}
              <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 overscroll-contain">
                {filteredOptions.length === 0 ? (
                  <div className="py-6 px-3 text-center text-xs text-slate-400 font-medium">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = String(opt.value) === String(activeValue);

                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={opt.disabled}
                        onClick={() => handleSelectOption(opt)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer select-none',
                          isSelected
                            ? 'bg-teal-50 text-teal-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 font-medium',
                          opt.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {opt.icon && (
                            <span
                              className={cn(
                                'shrink-0',
                                isSelected ? 'text-teal-700' : 'text-slate-400'
                              )}
                            >
                              {opt.icon}
                            </span>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="truncate">{opt.label}</span>
                              {opt.badge && (
                                <span
                                  className={cn(
                                    'inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-bold border shrink-0',
                                    isSelected
                                      ? 'bg-teal-100 text-teal-900 border-teal-300'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  )}
                                >
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            {opt.sublabel && (
                              <p
                                className={cn(
                                  'text-[11px] truncate mt-0.5',
                                  isSelected ? 'text-teal-700 font-normal' : 'text-slate-400 font-normal'
                                )}
                              >
                                {opt.sublabel}
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="h-4 w-4 text-teal-700 shrink-0 ml-1.5" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p id={`${selectId}-error`} className="text-xs font-medium text-rose-600 mt-1 flex items-center gap-1">
            <span>●</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-desc`} className="text-xs text-slate-500 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export const CustomSelect = Select;

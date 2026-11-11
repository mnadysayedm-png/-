import React, { useRef } from 'react';
import { X } from 'lucide-react';

interface ClearableInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number;
  onClear?: () => void;
  containerClassName?: string;
  icon?: React.ReactNode;
}

export const ClearableInput: React.FC<ClearableInputProps> = ({
  value,
  onChange,
  onClear,
  containerClassName = '',
  className = '',
  icon,
  placeholder,
  disabled,
  type = 'text',
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const strVal = value !== undefined && value !== null ? String(value) : '';
  const hasValue = strVal.length > 0;

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Call explicit onClear if provided
    if (onClear) {
      onClear();
    }

    // 2. Also trigger onChange with empty value so controlled components update immediately
    if (onChange) {
      const syntheticEvent = {
        target: { value: '', name: props.name || '' },
        currentTarget: { value: '', name: props.name || '' },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }

    // Re-focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  return (
    <div className={`relative flex items-center ${containerClassName}`}>
      {icon && (
        <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center z-10">
          {icon}
        </div>
      )}

      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pr-9' : 'pr-3'} ${hasValue ? 'pl-8' : 'pl-3'} py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition bg-white text-slate-900 ${className}`}
        {...props}
      />

      {hasValue && !disabled && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()} // prevent blur before click
          onClick={handleClear}
          aria-label="مسح المدخل"
          title="مسح المدخل"
          className="absolute left-2 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer z-20 flex items-center justify-center bg-white/80"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};

interface ClearableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onClear?: () => void;
  containerClassName?: string;
}

export const ClearableTextarea: React.FC<ClearableTextareaProps> = ({
  value,
  onChange,
  onClear,
  containerClassName = '',
  className = '',
  placeholder,
  disabled,
  rows = 4,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const strVal = value !== undefined && value !== null ? String(value) : '';
  const hasValue = strVal.length > 0;

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClear) {
      onClear();
    }

    if (onChange) {
      const syntheticEvent = {
        target: { value: '', name: props.name || '' },
        currentTarget: { value: '', name: props.name || '' },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
    }

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);
  };

  return (
    <div className={`relative ${containerClassName}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className={`w-full p-3 ${hasValue ? 'pl-8' : 'pl-3'} rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition bg-white text-slate-900 ${className}`}
        {...props}
      />

      {hasValue && !disabled && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
          aria-label="مسح المدخل"
          title="مسح المدخل"
          className="absolute left-2.5 top-2.5 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer z-20 flex items-center justify-center bg-white/90"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};

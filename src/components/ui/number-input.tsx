import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from './utils';

interface NumberInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Increment for the +/- buttons. Default 1. */
  step?: number;
  /** Allow a decimal point (weights, distance). Default false = whole numbers. */
  allowDecimal?: boolean;
  /** Hide the +/- buttons (plain typed field). */
  noStepper?: boolean;
  /** Class for the outer group (e.g. width). */
  className?: string;
}

/**
 * The standard numeric field. Tuned for mobile: a text field with a numeric
 * keypad (`inputMode` + `pattern`) rather than `type="number"`, so phones open
 * the number pad and there are no spinner quirks. It keeps its own string so the
 * box can be empty while editing and selects-all on focus, so the first
 * keystroke replaces the value instead of landing after a stray 0. Flanked by
 * −/+ buttons for quick adjustment; empty commits to `min` (or 0) on blur.
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  allowDecimal = false,
  noStepper = false,
  disabled,
  className,
  onFocus,
  onBlur,
  ...rest
}: NumberInputProps) {
  const fmt = (n: number) => (Number.isFinite(n) ? String(n) : '');
  const [text, setText] = useState(fmt(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(fmt(value));
  }, [value]);

  const clamp = (n: number) => {
    if (min != null) n = Math.max(min, n);
    if (max != null) n = Math.min(max, n);
    return n;
  };

  const commit = (raw: string) => {
    let cleaned = raw.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '');
    if (allowDecimal) {
      const dot = cleaned.indexOf('.');
      if (dot !== -1) cleaned = cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
    }
    setText(cleaned);
    if (cleaned === '' || cleaned === '.') {
      onChange(min ?? 0);
      return;
    }
    const parsed = allowDecimal ? parseFloat(cleaned) : parseInt(cleaned, 10);
    onChange(clamp(Number.isNaN(parsed) ? min ?? 0 : parsed));
  };

  const nudge = (delta: number) => {
    const next = clamp((Number.isFinite(value) ? value : 0) + delta);
    setText(fmt(next));
    onChange(next);
  };

  const stepBtn = 'flex items-center justify-center w-8 shrink-0 text-gray-500 hover:text-foreground active:bg-gray-100 disabled:opacity-40 disabled:hover:text-gray-500';

  return (
    <div
      className={cn(
        'inline-flex items-stretch rounded-lg border border-gray-300 bg-card overflow-hidden focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-transparent',
        disabled && 'opacity-60',
        className,
      )}
    >
      {!noStepper && (
        <button type="button" tabIndex={-1} disabled={disabled} onClick={() => nudge(-step)} className={stepBtn} aria-label="decrease">
          <Minus className="w-4 h-4" />
        </button>
      )}
      <input
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        pattern={allowDecimal ? undefined : '[0-9]*'}
        disabled={disabled}
        value={text}
        onChange={(e) => commit(e.target.value)}
        onFocus={(e) => {
          focused.current = true;
          e.target.select();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          focused.current = false;
          setText(fmt(value));
          onBlur?.(e);
        }}
        className={cn(
          'min-w-0 flex-1 bg-transparent px-2 py-2 text-foreground tabular-nums outline-none text-center disabled:cursor-not-allowed',
          noStepper && 'text-start',
        )}
        {...rest}
      />
      {!noStepper && (
        <button type="button" tabIndex={-1} disabled={disabled} onClick={() => nudge(step)} className={stepBtn} aria-label="increase">
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

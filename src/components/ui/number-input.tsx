import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from './utils';

// Thousands separators on the integer part only, so a decimal tail is untouched.
const group = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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
  /** Separate thousands while typing — for money, where Toman runs to millions. */
  grouped?: boolean;
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
  grouped = false,
  disabled,
  className,
  onFocus,
  onBlur,
  ...rest
}: NumberInputProps) {
  const display = (digits: string) => {
    if (!grouped) return digits;
    const [int, ...dec] = digits.split('.');
    return dec.length ? `${group(int)}.${dec.join('')}` : group(int);
  };
  const fmt = (n: number) => (Number.isFinite(n) ? display(String(n)) : '');
  const [text, setText] = useState(fmt(value));
  const focused = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Separators shift every character after them, so the caret is restored by
  // digit count rather than by index — otherwise it drifts as groups form.
  const caret = useRef<number | null>(null);

  useEffect(() => {
    if (!focused.current) setText(fmt(value));
  }, [value]);

  useLayoutEffect(() => {
    if (caret.current == null || !inputRef.current) return;
    const target = caret.current;
    caret.current = null;
    let seen = 0;
    let pos = text.length;
    for (let i = 0; i < text.length; i++) {
      if (/[0-9]/.test(text[i])) seen++;
      if (seen === target) {
        pos = i + 1;
        break;
      }
    }
    inputRef.current.setSelectionRange(target === 0 ? 0 : pos, target === 0 ? 0 : pos);
  }, [text]);

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
    setText(display(cleaned));
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
        ref={inputRef}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        pattern={allowDecimal ? undefined : '[0-9]*'}
        disabled={disabled}
        value={text}
        onChange={(e) => {
          if (grouped) {
            const upto = e.target.value.slice(0, e.target.selectionStart ?? 0);
            caret.current = upto.replace(/[^0-9]/g, '').length;
          }
          commit(e.target.value);
        }}
        onFocus={(e) => {
          focused.current = true;
          // An empty box beats a placeholder 0: the click that focuses the field
          // collapses any select-all, so a leftover 0 would swallow a keystroke
          // and turn 30 into 300. Blur commits back to min when nothing is typed.
          if (value === (min ?? 0)) setText('');
          else e.target.select();
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

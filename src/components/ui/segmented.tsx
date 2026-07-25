import * as React from 'react';
import { cn } from './utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// The design-system segmented control: a mist (secondary) track with a raised
// white "thumb" on the active item and brand-ink text. Matches the redesign
// mockups; use it for in-screen section switches instead of hand-rolled tabs.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex bg-secondary rounded-xl p-1 gap-1', className)}>
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={active}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all',
              active
                ? 'bg-card text-tint-ink shadow-sm'
                : 'text-secondary-foreground hover:text-foreground',
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

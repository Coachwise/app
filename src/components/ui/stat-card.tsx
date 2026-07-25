import * as React from 'react';
import { cn } from './utils';

// The design-system metric card (see docs/design-system.md + the redesign mockups):
// a soft-accent icon tile, a big accent number, a muted label. Used anywhere a
// screen shows a headline stat so they all match instead of being hand-rolled.
export function StatCard({
  icon: Icon,
  value,
  label,
  accent = true,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  value: React.ReactNode;
  label: string;
  // accent=true colours the number with the brand ink; false keeps it neutral ink.
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('bg-card border border-border rounded-2xl p-4 shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && (
          <span className="w-8 h-8 rounded-lg bg-tint-soft flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-tint-ink" />
          </span>
        )}
        <span className="text-muted-foreground text-xs">{label}</span>
      </div>
      <div
        className={cn(
          'text-3xl font-semibold tabular-nums leading-none',
          accent ? 'text-tint-ink' : 'text-foreground',
        )}
      >
        {value}
      </div>
    </div>
  );
}

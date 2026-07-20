import { V_GRADES, FONT_GRADES } from '../../lib/grades';
import { cn } from './utils';

/**
 * A climbing grade picker: bouldering V-scale and route Font scale in one
 * dropdown. Value is the grade string (e.g. "V4", "7a"), stored as-is.
 */
export function GradeSelect({
  value,
  onChange,
  className,
  placeholder = 'Grade',
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('rounded-lg border border-gray-300 bg-card px-2 py-1.5 text-sm text-foreground', className)}
    >
      <option value="">{placeholder}</option>
      <optgroup label="Bouldering (V)">
        {V_GRADES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </optgroup>
      <optgroup label="Route (Font)">
        {FONT_GRADES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </optgroup>
    </select>
  );
}

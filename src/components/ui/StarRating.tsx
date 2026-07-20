import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  label?: string;
  className?: string;
}

/**
 * StarRating - A star-based rating component
 * Perfect for quality ratings, satisfaction scores, or any star-based input
 *
 * Interactive stars that fill on hover and click
 */
export function StarRating({
  value,
  onChange,
  max = 10,
  label,
  className = ''
}: StarRatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const displayValue = hoveredValue !== null ? hoveredValue : value;

  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-medium text-gray-700 mb-2 block">
          {label}
        </label>
      )}

      <div className="flex items-center gap-1">
        {/* Stars */}
        <div className="flex items-center gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map((starValue) => (
            <button
              key={starValue}
              type="button"
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHoveredValue(starValue)}
              onMouseLeave={() => setHoveredValue(null)}
              className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
              aria-label={`Rate ${starValue} out of ${max}`}
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  starValue <= displayValue
                    ? 'fill-yellow-400 text-tint-ink'
                    : 'fill-none text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Numeric value display */}
        <span className="ml-2 text-sm font-medium text-gray-700 min-w-[3ch]">
          {value}/{max}
        </span>
      </div>
    </div>
  );
}

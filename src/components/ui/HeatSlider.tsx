import { useState } from 'react';

interface HeatSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}

/**
 * HeatSlider - A volume-style slider with heat map colors
 * Perfect for intensity levels, feedback ratings, or any 1-10 scale inputs
 *
 * Colors transition from green (low) → yellow → orange → red (high)
 */
export function HeatSlider({
  value,
  onChange,
  min = 1,
  max = 10,
  label,
  className = ''
}: HeatSliderProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const range = max - min;
  const percentage = ((value - min) / range) * 100;

  // Get color based on value position in range
  const getHeatColor = (val: number): string => {
    const position = (val - min) / range;
    if (position <= 0.3) return '#22c55e'; // green
    if (position <= 0.5) return '#eab308'; // yellow
    if (position <= 0.7) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const currentColor = getHeatColor(value);
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-medium text-gray-700 mb-2 block">
          {label}
        </label>
      )}

      <div
        className="relative py-2"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setShowTooltip(false)}
      >
        {/* Heat gradient background track */}
        <div className="relative h-3 rounded-full overflow-hidden">
          {/* Base gradient (30% opacity) */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(to right, #22c55e 0%, #84cc16 20%, #eab308 40%, #f59e0b 50%, #f97316 70%, #ef4444 85%, #dc2626 100%)',
              opacity: 0.3
            }}
          />

          {/* Filled portion */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(to right, #22c55e 0%, ${currentColor} 100%)`,
              opacity: 0.8
            }}
          />
        </div>

        {/* Invisible range input for interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label={label || 'Heat slider'}
        />

        {/* Custom thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 shadow-lg pointer-events-none transition-all duration-150 ease-out"
          style={{
            left: `calc(${percentage}% - 10px)`,
            borderColor: currentColor,
            boxShadow: `0 2px 4px rgba(0,0,0,0.2), 0 0 0 3px ${currentColor}20`
          }}
        />

        {/* Visual tick marks */}
        <div className="absolute top-0 left-0 right-0 flex justify-between px-1 pointer-events-none">
          {steps.map((tick) => (
            <div
              key={tick}
              className="w-0.5 h-2 bg-gray-400 rounded-full opacity-40"
              style={{ marginTop: '2px' }}
            />
          ))}
        </div>

        {/* Tooltip on hover */}
        {showTooltip && (
          <div
            className="absolute -top-9 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded shadow-lg transition-opacity duration-150 pointer-events-none"
            style={{
              left: `${percentage}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {value}
            {/* Tooltip arrow */}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid #111827'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

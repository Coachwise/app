// "Bolt" — the AI assistant mascot: a blue visor bot with two glowing eyes and
// an antenna whose droplet pulses. Self-contained inline SVG + CSS (animations
// in styles/globals.css) — no GIF/asset, so it works offline. Fixed brand
// colors so it reads the same on any theme.
const NAVY = '#0c1b2e';
const EYE = '#7fe6ff';
const SHELL = '#1f8fe6';

export function AiRobot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 46 46" fill="none" className={`ai-robot ${className ?? ''}`} aria-hidden="true">
      <g className="ai-robot-body">
        {/* shoulders */}
        <rect x="10" y="33" width="26" height="14" rx="7" fill={SHELL} />
        {/* antenna + pulsing droplet */}
        <line x1="23" y1="7" x2="23" y2="4.2" stroke={NAVY} strokeWidth="1.6" strokeLinecap="round" />
        <path className="ai-robot-drop" d="M23 0.6 C24.8 2.5 24.8 4.1 23 4.4 C21.2 4.1 21.2 2.5 23 0.6 Z" fill={EYE} />
        {/* ears */}
        <rect x="6.4" y="17" width="3.2" height="7" rx="1.6" fill={NAVY} />
        <rect x="36.4" y="17" width="3.2" height="7" rx="1.6" fill={NAVY} />
        {/* head */}
        <rect x="8" y="7" width="30" height="23" rx="11" fill={SHELL} />
        <ellipse cx="16" cy="12.5" rx="6" ry="2.8" fill="#ffffff" opacity="0.22" />
        {/* visor */}
        <rect x="11" y="12" width="24" height="14" rx="7" fill={NAVY} />
        {/* eyes */}
        <g className="ai-robot-eyes" fill={EYE}>
          <circle cx="18" cy="19" r="3" />
          <circle cx="28" cy="19" r="3" />
          <circle cx="16.9" cy="17.8" r="1" fill="#eafffb" />
          <circle cx="26.9" cy="17.8" r="1" fill="#eafffb" />
        </g>
      </g>
    </svg>
  );
}

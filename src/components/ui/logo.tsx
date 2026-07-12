interface LogoProps {
  className?: string;
}

/**
 * The Coachwise mark: one iceberg, cut by the waterline. The summit and the
 * submerged mass are the same colour — the mass is simply dimmed, as ice seen
 * through water — so the two shapes read as one body rather than as a sail on
 * a hull. Both fills inherit `currentColor`, so it works on any background.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="currentColor" aria-hidden="true">
      <polygon points="196,268 212,230 238,162 270,214 286,196 302,246 316,268" />
      <polygon
        opacity="0.42"
        points="192,276 320,276 386,300 352,344 300,410 250,376 196,400 140,336 168,296"
      />
    </svg>
  );
}

import { ArrowLeft } from "lucide-react";

import { Button } from "./button";
import { cn } from "./utils";

// The header back arrow used on every navy top bar. One component so the icon,
// hit area, and hover are identical everywhere.
export function BackButton({
  onClick,
  className,
  "aria-label": ariaLabel = "Back",
}: {
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Button
      variant="navGhost"
      size="icon"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn("-ml-2", className)}
    >
      <ArrowLeft className="size-6" />
    </Button>
  );
}

import { useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  url?: string | null;
  alt?: string;
  /** Tailwind size classes for the circle, e.g. "w-12 h-12". */
  sizeClass?: string;
  /** Tailwind size classes for the fallback icon, e.g. "w-6 h-6". */
  iconClass?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Avatar with a simple default: shows the image when available, otherwise a
 * generic person icon. Falls back to the icon if the image fails to load.
 */
export function UserAvatar({
  url,
  alt = '',
  sizeClass = 'w-12 h-12',
  iconClass = 'w-1/2 h-1/2',
  className = '',
  onClick,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  // Reset the error state when the source changes.
  useEffect(() => {
    setFailed(false);
  }, [url]);

  const interactive = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={alt}
        onClick={onClick}
        onError={() => setFailed(true)}
        className={`${sizeClass} rounded-full object-cover ${interactive} ${className}`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      // Solid (opaque) background so the default reads correctly over any
      // surface — e.g. the navy cover on a profile, not just white list cards.
      // Uses standard palette colors (not arbitrary hex) so the utility is
      // always generated.
      className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center text-gray-400 ${interactive} ${className}`}
    >
      <UserIcon className={iconClass} />
    </div>
  );
}

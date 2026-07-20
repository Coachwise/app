import { Crown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProBadge({ size = 'md', className = '' }: ProBadgeProps) {
  const { t } = useLanguage();
  const sizeClasses = {
    sm: 'w-4 h-4 text-[8px]',
    md: 'w-5 h-5 text-[9px]',
    lg: 'w-6 h-6 text-[10px]',
  };

  const iconSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-yellow-500 rounded-full flex items-center justify-center ${className}`}
      title={t('proUser')}
    >
      <Crown className={`${iconSizes[size]} text-foreground`} />
    </div>
  );
}

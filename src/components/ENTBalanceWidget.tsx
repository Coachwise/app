import { Coins, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ENTBalanceWidgetProps {
  availableBalance: number;
  pendingBalance: number;
  onNavigate: (view: string) => void;
  compact?: boolean;
}

export function ENTBalanceWidget({ 
  availableBalance, 
  pendingBalance, 
  onNavigate,
  compact = false 
}: ENTBalanceWidgetProps) {
  const { t } = useLanguage();
  const hasPending = pendingBalance > 0;

  if (compact) {
    // Compact version for header
    return (
      <button
        onClick={() => onNavigate('claim-ent')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          hasPending 
            ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-foreground shadow-md hover:shadow-lg animate-pulse' 
            : 'bg-tint text-tint-fg hover:bg-tint-2'
        }`}
      >
        <Coins className={`w-4 h-4 ${hasPending ? 'text-foreground' : 'text-tint-ink'}`} />
        <div className="flex items-center gap-1">
          <span className={`text-xs font-bold ${hasPending ? 'text-foreground' : 'text-tint-ink'}`}>
            SPARK {availableBalance.toFixed(1)}
          </span>
          {hasPending && (
            <div className="flex items-center gap-0.5 ms-1">
              <Zap className="w-3 h-3 text-foreground" />
              <span className="text-foreground text-xs font-medium">{t('claimNow')}</span>
            </div>
          )}
        </div>
      </button>
    );
  }

  // Full version for dashboard/home
  return (
    <button
      onClick={() => onNavigate('claim-ent')}
      className={`w-full rounded-xl p-4 transition-all ${
        hasPending 
          ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-lg hover:shadow-xl' 
          : 'bg-tint hover:bg-tint-2'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${
            hasPending ? 'bg-tint' : 'bg-yellow-500'
          }`}>
            <Coins className={`w-6 h-6 ${
              hasPending ? 'text-tint-ink' : 'text-foreground'
            }`} />
          </div>
          <div className="text-left">
            <div className={`text-sm ${
              hasPending ? 'text-foreground/70' : 'text-gray-400'
            }`}>
              {t('entBalance')}
            </div>
            <div className={`text-2xl font-bold ${
              hasPending ? 'text-foreground' : 'text-tint-ink'
            }`}>
              {availableBalance.toFixed(1)} {t('entSymbol')}
            </div>
          </div>
        </div>

        {hasPending && (
          <div className="flex flex-col items-end">
            <div className="bg-tint px-3 py-1 rounded-full flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-tint-ink" />
              <span className="text-tint-ink text-xs font-bold">+{pendingBalance.toFixed(1)}</span>
            </div>
            <div className="text-foreground text-sm font-semibold">
              {t('claimNow')} →
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
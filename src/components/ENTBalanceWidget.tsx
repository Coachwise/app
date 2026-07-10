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
            ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-navy shadow-md hover:shadow-lg animate-pulse' 
            : 'bg-navy text-yellow-500 hover:bg-navy-light'
        }`}
      >
        <Coins className={`w-4 h-4 ${hasPending ? 'text-navy' : 'text-yellow-500'}`} />
        <div className="flex items-center gap-1">
          <span className={`text-xs font-bold ${hasPending ? 'text-navy' : 'text-yellow-500'}`}>
            SPARK {availableBalance.toFixed(1)}
          </span>
          {hasPending && (
            <div className="flex items-center gap-0.5 ms-1">
              <Zap className="w-3 h-3 text-navy" />
              <span className="text-navy text-xs font-medium">{t('claimNow')}</span>
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
          : 'bg-navy hover:bg-navy-light'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${
            hasPending ? 'bg-navy' : 'bg-yellow-500'
          }`}>
            <Coins className={`w-6 h-6 ${
              hasPending ? 'text-yellow-500' : 'text-navy'
            }`} />
          </div>
          <div className="text-left">
            <div className={`text-sm ${
              hasPending ? 'text-navy/70' : 'text-gray-400'
            }`}>
              {t('entBalance')}
            </div>
            <div className={`text-2xl font-bold ${
              hasPending ? 'text-navy' : 'text-yellow-500'
            }`}>
              {availableBalance.toFixed(1)} {t('entSymbol')}
            </div>
          </div>
        </div>

        {hasPending && (
          <div className="flex flex-col items-end">
            <div className="bg-navy px-3 py-1 rounded-full flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-yellow-500 text-xs font-bold">+{pendingBalance.toFixed(1)}</span>
            </div>
            <div className="text-navy text-sm font-semibold">
              {t('claimNow')} →
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
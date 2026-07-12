import { ArrowLeft, Dumbbell } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { APP_VERSION, APP_IS_BETA } from '../config';

interface AboutProps {
  onBack: () => void;
}

export function About({ onBack }: AboutProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-navy px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-navy-light rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl">{t('about')}</h1>
        </div>
      </div>

      <div className="p-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-navy flex items-center justify-center shadow-sm mt-6">
          <Dumbbell className="w-10 h-10 text-yellow-500" />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold text-navy">Coachwise</h2>
          {APP_IS_BETA && (
            <span className="px-2 py-0.5 rounded-md bg-yellow-500 text-navy text-xs font-bold tracking-wide">
              {t('beta')}
            </span>
          )}
        </div>

        <p className="mt-1 text-gray-500 text-sm tabular-nums" dir="ltr">v{APP_VERSION}</p>
        <p className="mt-4 max-w-xs text-gray-600 text-sm leading-relaxed">{t('aboutTagline')}</p>

        <div className="mt-10 w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-gray-500 text-sm">{t('version')}</span>
            <span className="text-navy text-sm font-medium tabular-nums" dir="ltr">{APP_VERSION}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-gray-500 text-sm">{t('releaseChannel')}</span>
            <span className="text-navy text-sm font-medium">{APP_IS_BETA ? t('beta') : t('stable')}</span>
          </div>
        </div>

        <p className="mt-10 text-gray-400 text-xs">© {new Date().getFullYear()} Coachwise</p>
      </div>
    </div>
  );
}

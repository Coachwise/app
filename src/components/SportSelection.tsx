import { Dumbbell, Mountain } from 'lucide-react';
import type { SportType } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface SportSelectionProps {
  onSelectSport: (sport: SportType) => void;
}

export function SportSelection({ onSelectSport }: SportSelectionProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="mb-2 text-navy">{t('selectSportType')}</h1>
      <p className="text-gray-600 mb-8 text-center">{t('chooseWhatToLog')}</p>
      
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => onSelectSport('fitness')}
          className="w-full bg-white border-2 border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-4 hover:border-yellow-500 transition-all active:scale-95"
        >
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-center">
            <h3 className="text-navy mb-1">{t('strengthTraining')}</h3>
            <p className="text-gray-600 text-sm">{t('strengthTrainingDesc')}</p>
          </div>
        </button>

        <button
          onClick={() => onSelectSport('climbing')}
          className="w-full bg-white border-2 border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-4 hover:border-yellow-500 transition-all active:scale-95"
        >
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Mountain className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-center">
            <h3 className="text-navy mb-1">{t('sportClimbing')}</h3>
            <p className="text-gray-600 text-sm">{t('climbingDesc')}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
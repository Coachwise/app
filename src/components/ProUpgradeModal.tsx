import { X, Crown, Calendar, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature: 'schedule' | 'log' | 'plan-limit' | 'general';
}

export function ProUpgradeModal({ isOpen, onClose, onUpgrade, feature }: ProUpgradeModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const getMessage = () => {
    switch (feature) {
      case 'schedule':
        return t('scheduleWorkoutsProMessage');
      case 'log':
        return t('logWorkoutsProMessage');
      case 'plan-limit':
        return t('planLimitProMessage');
      default:
        return t('freeUserNote');
    }
  };

  const getTitle = () => {
    if (feature === 'plan-limit') {
      return t('planLimitReached');
    }
    return t('proFeatureTitle');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-navy-light px-6 py-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-navy" />
            </div>
            <div>
              <h2 className="text-white text-xl">{getTitle()}</h2>
              <p className="text-white/80 text-sm">{t('viewOnlyMode')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">{getMessage()}</p>

          {/* Features List */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
            <h3 className="text-navy mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-600" />
              <span>{t('proFeaturesInclude')}</span>
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>{t('featureScheduleWorkouts')}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>{t('featureLogProgress')}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>{t('featureUnlimitedPlans')}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>{t('featurePlusViewPlans')}</span>
              </li>
            </ul>
          </div>

          {/* How to Upgrade */}
          <div className="mb-6">
            <h4 className="text-navy mb-3">{t('howToUpgrade')}</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 bg-yellow-500 text-navy rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <span className="text-gray-700">{t('upgradeOption1')}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 bg-yellow-500 text-navy rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <span className="text-gray-700">{t('upgradeOption2')}</span>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900 text-sm">
              💡 {t('freeUserNote')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onUpgrade}
              className="w-full bg-yellow-500 text-navy py-3 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" />
              <span>{t('subscribeToCoach')}</span>
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Crown, Check, Zap, Coins } from 'lucide-react';
import { BackButton } from './ui/back-button';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FEATURES } from '../config';
import { PurchaseSheet } from './PurchaseSheet';

interface ProSubscriptionProps {
  onBack: () => void;
  onPurchase?: (plan: string) => void;
  entBalance?: number;
  onNavigate?: (route: string) => void;
}

export function ProSubscription({ onBack, entBalance, onNavigate }: ProSubscriptionProps) {
  const { t, language } = useLanguage();
  const { user, refreshUser } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isPro = Boolean(user?.pro);
  const proUntil = user?.pro_until
    ? new Date(user.pro_until).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')
    : null;

  const proFeatures = [
    t('proFeatureSchedule'),
    t('proFeatureLog'),
    t('proFeaturePlans'),
    t('proFeaturePRs'),
    t('proFeatureAnalytics'),
    t('proFeatureSupport'),
  ];

  // The SPARK/ENT token path (feature-flagged off) falls back to the real
  // purchase sheet for now.
  const handleSelectPlan = () => setSheetOpen(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} aria-label={t('back')} />
          <h1 className="text-foreground text-xl flex items-center gap-2">
            <Crown className="w-6 h-6 text-tint-ink" />
            {t('becomePro')}
          </h1>
        </div>
      </div>

      <div className="p-4 pb-28">
        {/* Hero Section */}
        <div className="bg-tint rounded-2xl p-6 mb-6 text-tint-fg">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-yellow-500 rounded-full p-4">
              <Crown className="w-12 h-12 text-foreground" />
            </div>
          </div>
          {isPro ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-center text-2xl">{t('proActiveTitle')}</h2>
                <span className="bg-yellow-500 text-foreground text-xs font-medium px-2 py-0.5 rounded-full">{t('activeStatus')}</span>
              </div>
              <p className="text-center text-tint-fg/70">
                {proUntil ? t('proActiveUntil', { date: proUntil }) : t('allFeaturesUnlocked')}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-center text-2xl mb-2">{t('unlockPotential')}</h2>
              <p className="text-center text-tint-fg/70">{t('getUnlimitedAccess')}</p>
            </>
          )}
        </div>

        {/* Pro Features */}
        <div className="bg-card rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-tint-ink" />
            {t('proFeaturesTitle')}
          </h3>
          <div className="space-y-3">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="bg-yellow-500 rounded-full p-0.5">
                    <Check className="w-4 h-4 text-foreground" />
                  </div>
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ENT Token (SPARK) Payment Option — hidden for first release */}
        {FEATURES.spark && (<>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-xl p-5 mb-6 shadow-lg border-2 border-yellow-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-tint rounded-full p-2">
              <Coins className="w-6 h-6 text-tint-ink" />
            </div>
            <div className="flex-1">
              <h3 className="text-foreground font-bold">{t('payWithTokens')}</h3>
              <p className="text-foreground/70 text-sm">{t('upgradeWithTokens')}</p>
            </div>
          </div>

          <div className="bg-tint rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-tint-fg text-sm mb-1">{t('yourSparkBalance')}</div>
                <div className="text-tint-ink text-2xl font-bold">
                  {entBalance !== undefined ? entBalance.toFixed(1) : '7.0'} SPARK
                </div>
              </div>
              <div className="text-right">
                <div className="text-tint-fg text-sm mb-1">{t('required')}</div>
                <div className="text-tint-ink text-2xl font-bold">10 SPARK</div>
              </div>
            </div>
          </div>

          {(entBalance !== undefined ? entBalance : 7.0) >= 10 ? (
            <button
              onClick={() => handleSelectPlan()}
              className="w-full bg-tint text-tint-fg py-3 rounded-lg hover:bg-tint-2 transition-colors font-semibold"
            >
              {t('upgradeWithTokens')} ✨
            </button>
          ) : (
            <div>
              <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-2 text-sm text-center">
                ⚠️ {t('needMoreSpark')} {(10 - (entBalance !== undefined ? entBalance : 7.0)).toFixed(1)} {t('moreSpark')}
              </div>
              <button
                onClick={() => onNavigate?.('claim-ent')}
                className="w-full bg-tint text-tint-fg py-3 rounded-lg hover:bg-tint-2 transition-colors"
              >
                {t('earnTokens')}
              </button>
            </div>
          )}
        </div>

        {/* OR Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-gray-500 text-sm">{t('or')}</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        </>)}

        {/* Continue → choose duration, currency & payment method in the sheet */}
        <Button variant="brand" size="block" icon={<Crown className="size-5" />} onClick={() => setSheetOpen(true)}>
          {isPro ? t('renewPro') : t('upgradeToPro')}
        </Button>

        {/* FAQ Note */}
        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>{t('needHelpContact')}</p>
        </div>
      </div>

      <PurchaseSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        kind="PRO"
        onSuccess={async () => { await refreshUser(); onBack(); }}
      />
    </div>
  );
}
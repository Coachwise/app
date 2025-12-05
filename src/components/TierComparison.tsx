import { useState } from 'react';
import { ArrowLeft, Check, TrendingUp } from 'lucide-react';
import type { SubscriptionTier } from './SubscriptionTierBuilder';
import { useLanguage } from '../contexts/LanguageContext';

interface TierComparisonProps {
  onCancel: () => void;
  coachName: string;
}

export function TierComparison({ onCancel, coachName }: TierComparisonProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const { t } = useLanguage();

  // Mock tiers data
  const tiers: SubscriptionTier[] = [
    {
      id: '1',
      name: t('basic'),
      description: t('basicDesc'),
      pricing: {
        monthly: 30,
        annual: 300,
      },
      features: {
        plansIncluded: 1,
        checkInFrequency: 'monthly',
        videoAccess: false,
        nutritionGuides: false,
        customFeatures: [t('emailSupport'), t('basicProgressTracking')],
      },
      trialDays: 7,
      isActive: true,
    },
    {
      id: '2',
      name: t('pro'),
      description: t('proDesc'),
      pricing: {
        monthly: 60,
        annual: 600,
      },
      features: {
        plansIncluded: 3,
        checkInFrequency: 'weekly',
        videoAccess: true,
        nutritionGuides: true,
        customFeatures: [t('prioritySupport'), t('formVideoAnalysis'), t('customProgramming')],
      },
      trialDays: 14,
      isActive: true,
      popular: true,
    },
    {
      id: '3',
      name: t('elite'),
      description: t('eliteDesc'),
      pricing: {
        monthly: 100,
        annual: 1000,
      },
      features: {
        plansIncluded: 999,
        checkInFrequency: 'daily',
        videoAccess: true,
        nutritionGuides: true,
        customFeatures: [
          t('prioritySupport'),
          t('formVideoAnalysis'),
          t('customProgramming'),
          t('oneOnOneVideoCalls'),
          t('competitionPrepPlanning'),
          t('nutritionMacrosTracking'),
        ],
      },
      trialDays: 14,
      isActive: true,
    },
  ];

  // Helper function to get all features as a list
  const getFeaturesArray = (tier: SubscriptionTier): string[] => {
    const features: string[] = [];
    
    // Plans included
    const planText = tier.features.plansIncluded === 999 
      ? t('unlimitedWorkoutPlans')
      : `${tier.features.plansIncluded} ${t('workoutPlans')}`;
    features.push(planText);
    
    // Check-in frequency
    const checkInText = tier.features.checkInFrequency === 'daily'
      ? t('dailyCheckIns')
      : tier.features.checkInFrequency === 'weekly'
      ? t('weeklyCheckIns')
      : t('monthlyCheckIns');
    features.push(checkInText);
    
    // Video access
    if (tier.features.videoAccess) {
      features.push(t('formVideoAnalysis'));
    }
    
    // Nutrition guides
    if (tier.features.nutritionGuides) {
      features.push(t('nutritionGuides'));
    }
    
    // Custom features
    if (tier.features.customFeatures) {
      features.push(...tier.features.customFeatures);
    }
    
    return features;
  };

  // Mock price history
  const priceHistory = {
    '2': [
      { date: 'Jan 2024', price: 50 },
      { date: 'Jun 2024', price: 55 },
      { date: 'Dec 2024', price: 60 },
    ],
  };

  const handleSubscribe = (tierId: string) => {
    setSelectedTier(tierId);
    const tierName = tiers.find(t => t.id === tierId)?.name;
    // Mock subscription - in real app would process payment
    alert(`✨ Subscription successful!\n\nYou've subscribed to the ${tierName} plan.\n\nYour subscription request has been sent to your coach and is pending approval. They will accept and assign you a workout plan soon!`);
    onCancel(); // Go back to profile
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white">{t('chooseYourPlan')}</h2>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4">
        {/* Coach Info */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
              alt={coachName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="text-[#0E0E55]">{coachName}</h3>
              <p className="text-gray-600 text-sm">{t('strengthAndClimbingCoach')}</p>
            </div>
          </div>
        </div>

        {/* Platform Fee Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-900 mb-1">{t('transparentPricing')}</p>
          <p className="text-blue-800 text-sm">
            {t('platformFeeNotice')}
          </p>
        </div>

        {/* Tiers */}
        <div className="space-y-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-lg shadow-lg p-5 transition-all border-2 ${
                tier.popular
                  ? 'bg-yellow-500 border-[#0E0E55]'
                  : 'bg-white border-gray-200'
              }`}
            >
              {tier.popular && (
                <span className="inline-block px-3 py-1 bg-[#0E0E55] text-white rounded-lg text-xs mb-3">
                  ⭐ {t('mostPopular')}
                </span>
              )}
              
              <h3 className={tier.popular ? 'text-[#0E0E55]' : 'text-[#0E0E55]'}>{tier.name}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-4xl ${tier.popular ? 'text-[#0E0E55]' : 'text-[#0E0E55]'}`}>
                  ${tier.pricing.monthly}
                </span>
                <span className={tier.popular ? 'text-[#0E0E55]/80' : 'text-gray-600'}>{t('perMonth')}</span>
              </div>
              
              <ul className="space-y-3 mb-6">
                {getFeaturesArray(tier).map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tier.popular ? 'text-[#0E0E55]' : 'text-yellow-600'}`} />
                    <span className={tier.popular ? 'text-[#0E0E55]/90' : 'text-gray-700'}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSubscribe(tier.id)}
                className={`w-full py-3 rounded-lg transition-colors ${
                  tier.popular
                    ? 'bg-[#0E0E55] text-white hover:bg-[#1A1A6E]'
                    : 'bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400'
                }`}
              >
                {t('choose')} {tier.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
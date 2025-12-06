import { ArrowLeft, Crown, Check, Zap, Coins } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProSubscriptionProps {
  onBack: () => void;
  onPurchase?: (plan: string) => void;
  entBalance?: number;
  onNavigate?: (route: string) => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  savings?: number;
  popular?: boolean;
  billingCycle: string;
}

export function ProSubscription({ onBack, onPurchase, entBalance, onNavigate }: ProSubscriptionProps) {
  const { t } = useLanguage();

  const plans: SubscriptionPlan[] = [
    {
      id: 'monthly',
      name: 'Monthly',
      duration: '1 Month',
      price: 5,
      billingCycle: 'per month',
    },
    {
      id: '3-months',
      name: '3 Months',
      duration: '3 Months',
      price: 12,
      originalPrice: 15,
      discount: 20,
      savings: 3,
      billingCycle: 'billed every 3 months',
    },
    {
      id: '6-months',
      name: '6 Months',
      duration: '6 Months',
      price: 22.5,
      originalPrice: 30,
      discount: 25,
      savings: 7.5,
      popular: true,
      billingCycle: 'billed every 6 months',
    },
    {
      id: 'yearly',
      name: 'Yearly',
      duration: '12 Months',
      price: 42,
      originalPrice: 60,
      discount: 30,
      savings: 18,
      billingCycle: 'billed annually',
    },
  ];

  const proFeatures = [
    'Schedule workouts to calendar',
    'Log unlimited workout sessions',
    'Create unlimited workout plans',
    'Track all your PRs and progress',
    'Advanced analytics & insights',
    'Priority support',
  ];

  const handleSelectPlan = (planId: string) => {
    if (onPurchase) {
      onPurchase(planId);
    } else {
      alert(`Selected plan: ${planId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            {t('becomePro')}
          </h1>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#0E0E55] to-[#1A1A6E] rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-yellow-500 rounded-full p-4">
              <Crown className="w-12 h-12 text-[#0E0E55]" />
            </div>
          </div>
          <h2 className="text-center text-2xl mb-2">Unlock Your Full Potential</h2>
          <p className="text-center text-gray-300">Get unlimited access to all premium features</p>
        </div>

        {/* Pro Features */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="text-[#0E0E55] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Pro Features
          </h3>
          <div className="space-y-3">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="bg-yellow-500 rounded-full p-0.5">
                    <Check className="w-4 h-4 text-[#0E0E55]" />
                  </div>
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ENT Token Payment Option */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-xl p-5 mb-6 shadow-lg border-2 border-yellow-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#0E0E55] rounded-full p-2">
              <Coins className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-[#0E0E55] font-bold">{t('payWithTokens')}</h3>
              <p className="text-[#0E0E55]/70 text-sm">{t('upgradeWithTokens')}</p>
            </div>
          </div>

          <div className="bg-[#0E0E55] rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm mb-1">Your SPARK Balance</div>
                <div className="text-yellow-500 text-2xl font-bold">
                  {entBalance !== undefined ? entBalance.toFixed(1) : '7.0'} SPARK
                </div>
              </div>
              <div className="text-right">
                <div className="text-white text-sm mb-1">Required</div>
                <div className="text-yellow-400 text-2xl font-bold">10 SPARK</div>
              </div>
            </div>
          </div>

          {(entBalance !== undefined ? entBalance : 7.0) >= 10 ? (
            <button
              onClick={() => handleSelectPlan('ent-payment')}
              className="w-full bg-[#0E0E55] text-yellow-500 py-3 rounded-lg hover:bg-[#1A1A6E] transition-colors font-semibold"
            >
              {t('upgradeWithTokens')} ✨
            </button>
          ) : (
            <div>
              <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-2 text-sm text-center">
                ⚠️ {t('needMoreSpark')} {(10 - (entBalance !== undefined ? entBalance : 7.0)).toFixed(1)} {t('moreSpark')}
              </div>
              <button
                onClick={() => onNavigate('claim-ent')}
                className="w-full bg-[#0E0E55] text-white py-3 rounded-lg hover:bg-[#1A1A6E] transition-colors"
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

        {/* Pricing Plans */}
        <div className="space-y-4 mb-6">
          <h3 className="text-[#0E0E55] text-center mb-4">Choose Your Plan</h3>
          
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl p-5 shadow-sm border-2 transition-all ${
                plan.popular
                  ? 'border-yellow-500 shadow-lg'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-500 text-[#0E0E55] px-4 py-1 rounded-full text-xs shadow-md flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-[#0E0E55] text-lg">{plan.name}</h4>
                  <p className="text-gray-500 text-sm">{plan.duration}</p>
                </div>
                <div className="text-right">
                  {plan.discount && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400 line-through text-sm">
                        ${plan.originalPrice}
                      </span>
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs">
                        -{plan.discount}%
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl text-[#0E0E55]">${plan.price}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{plan.billingCycle}</p>
                </div>
              </div>

              {plan.savings && (
                <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg mb-3 text-sm text-center">
                  💰 Save ${plan.savings} compared to monthly
                </div>
              )}

              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-3 rounded-lg transition-colors ${
                  plan.popular
                    ? 'bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400'
                    : 'bg-[#0E0E55] text-white hover:bg-[#1A1A6E]'
                }`}
              >
                Select Plan
              </button>
            </div>
          ))}
        </div>

        {/* Money Back Guarantee */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-blue-900 text-sm">
            ✨ <span className="font-medium">30-Day Money Back Guarantee</span>
          </p>
          <p className="text-blue-700 text-xs mt-1">
            Try Coachwise Pro risk-free. Cancel anytime.
          </p>
        </div>

        {/* FAQ Note */}
        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>Need help? Contact us at support@coachwise.app</p>
        </div>
      </div>
    </div>
  );
}
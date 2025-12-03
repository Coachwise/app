import { useState } from 'react';
import { ArrowLeft, Check, TrendingUp } from 'lucide-react';
import type { SubscriptionTier } from './SubscriptionTierBuilder';

interface TierComparisonProps {
  onCancel: () => void;
  coachName: string;
}

export function TierComparison({ onCancel, coachName }: TierComparisonProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Mock tiers data
  const tiers: SubscriptionTier[] = [
    {
      id: '1',
      name: 'Basic',
      description: 'Perfect for beginners starting their fitness journey',
      pricing: {
        monthly: 30,
        annual: 300,
      },
      features: {
        plansIncluded: 1,
        checkInFrequency: 'monthly',
        videoAccess: false,
        nutritionGuides: false,
        customFeatures: ['Email support', 'Basic progress tracking'],
      },
      trialDays: 7,
      isActive: true,
    },
    {
      id: '2',
      name: 'Pro',
      description: 'For serious athletes looking to level up',
      pricing: {
        monthly: 60,
        annual: 600,
      },
      features: {
        plansIncluded: 3,
        checkInFrequency: 'weekly',
        videoAccess: true,
        nutritionGuides: true,
        customFeatures: ['Priority support', 'Form video analysis', 'Custom programming'],
      },
      trialDays: 14,
      isActive: true,
    },
    {
      id: '3',
      name: 'Elite',
      description: 'Maximum support for competitive athletes',
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
          'Priority support',
          'Form video analysis',
          'Custom programming',
          '1-on-1 video calls (2x/month)',
          'Competition prep planning',
          'Nutrition macros tracking',
        ],
      },
      trialDays: 14,
      isActive: true,
    },
  ];

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
    // Would navigate to payment or show subscription modal
    alert(`Subscribing to ${tiers.find(t => t.id === tierId)?.name} tier`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white">Choose Your Plan</h2>
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
              <h3 className="text-[#3D3D3D]">{coachName}</h3>
              <p className="text-gray-600 text-sm">Strength & Climbing Coach</p>
            </div>
          </div>
        </div>

        {/* Platform Fee Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 mb-1">Transparent Pricing</p>
          <p className="text-blue-800 text-sm">
            All prices shown are what the coach receives after Coachwise's 5% platform fee.
          </p>
        </div>

        {/* Tiers */}
        <div className="space-y-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-lg shadow-lg p-5 transition-all border-2 ${
                tier.popular
                  ? 'bg-yellow-500 border-[#3D3D3D]'
                  : 'bg-white border-gray-200'
              }`}
            >
              {tier.popular && (
                <span className="inline-block px-3 py-1 bg-[#3D3D3D] text-white rounded-lg text-xs mb-3">
                  ⭐ Most Popular
                </span>
              )}
              
              <h3 className={tier.popular ? 'text-[#3D3D3D]' : 'text-[#3D3D3D]'}>{tier.name}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-4xl ${tier.popular ? 'text-[#3D3D3D]' : 'text-[#3D3D3D]'}`}>
                  ${tier.price}
                </span>
                <span className={tier.popular ? 'text-[#3D3D3D]/80' : 'text-gray-600'}>/month</span>
              </div>
              
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tier.popular ? 'text-[#3D3D3D]' : 'text-yellow-600'}`} />
                    <span className={tier.popular ? 'text-[#3D3D3D]/90' : 'text-gray-700'}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => alert(`Subscribing to ${tier.name} plan`)}
                className={`w-full py-3 rounded-lg transition-colors ${
                  tier.popular
                    ? 'bg-[#3D3D3D] text-white hover:bg-[#2A2A2A]'
                    : 'bg-yellow-500 text-[#3D3D3D] hover:bg-yellow-400'
                }`}
              >
                Choose {tier.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
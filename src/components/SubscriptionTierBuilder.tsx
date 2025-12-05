import { useState } from 'react';
import { ArrowLeft, Plus, Copy, Trash2 } from 'lucide-react';

interface SubscriptionTierBuilderProps {
  onCancel: () => void;
  onSave: () => void;
  existingTier?: SubscriptionTier;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  pricing: {
    monthly?: number;
    annual?: number;
    oneTime?: number;
  };
  features: {
    plansIncluded: number;
    checkInFrequency: string;
    videoAccess: boolean;
    nutritionGuides: boolean;
    customFeatures: string[];
  };
  trialDays: number;
  isActive: boolean;
  popular?: boolean;
}

export function SubscriptionTierBuilder({ onCancel, onSave, existingTier }: SubscriptionTierBuilderProps) {
  const [name, setName] = useState(existingTier?.name || '');
  const [description, setDescription] = useState(existingTier?.description || '');
  const [monthlyPrice, setMonthlyPrice] = useState(existingTier?.pricing.monthly?.toString() || '');
  const [annualPrice, setAnnualPrice] = useState(existingTier?.pricing.annual?.toString() || '');
  const [oneTimePrice, setOneTimePrice] = useState(existingTier?.pricing.oneTime?.toString() || '');
  const [plansIncluded, setPlansIncluded] = useState(existingTier?.features.plansIncluded.toString() || '1');
  const [checkInFrequency, setCheckInFrequency] = useState(existingTier?.features.checkInFrequency || 'weekly');
  const [videoAccess, setVideoAccess] = useState(existingTier?.features.videoAccess || false);
  const [nutritionGuides, setNutritionGuides] = useState(existingTier?.features.nutritionGuides || false);
  const [customFeatures, setCustomFeatures] = useState<string[]>(existingTier?.features.customFeatures || []);
  const [trialDays, setTrialDays] = useState(existingTier?.trialDays.toString() || '0');
  const [newFeature, setNewFeature] = useState('');

  const handleSave = () => {
    if (name.trim() && (monthlyPrice || annualPrice || oneTimePrice)) {
      // Mock save - would send to backend
      onSave();
    }
  };

  const addCustomFeature = () => {
    if (newFeature.trim()) {
      setCustomFeatures([...customFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeCustomFeature = (index: number) => {
    setCustomFeatures(customFeatures.filter((_, i) => i !== index));
  };

  const handleClone = () => {
    // Would create a copy of this tier
    alert('Tier cloned as template!');
  };

  const isFormValid = () => {
    return name.trim() && (monthlyPrice || annualPrice || oneTimePrice);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white">Create Tier</h2>
          <button
            onClick={handleSave}
            disabled={!isFormValid()}
            className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Tier Name & Price */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="text-[#3D3D3D] mb-2 block">Tier Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Premium Plan"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#3D3D3D]"
              />
            </div>
            
            <div>
              <label className="text-[#3D3D3D] mb-2 block">Monthly Price ($)</label>
              <input
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="99"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#3D3D3D]"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2 text-gray-900">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's included in this tier?"
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Pricing Options */}
        <div>
          <label className="block mb-3 text-gray-900">Pricing Options *</label>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Monthly Price ($)</label>
              <input
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="30"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Annual Price ($)</label>
              <input
                type="number"
                value={annualPrice}
                onChange={(e) => setAnnualPrice(e.target.value)}
                placeholder="300"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {annualPrice && monthlyPrice && (
                <p className="text-green-600 text-sm mt-1">
                  Save ${((Number(monthlyPrice) * 12) - Number(annualPrice)).toFixed(2)}/year
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">One-Time Purchase ($)</label>
              <input
                type="number"
                value={oneTimePrice}
                onChange={(e) => setOneTimePrice(e.target.value)}
                placeholder="150"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Free Trial */}
        <div>
          <label className="block mb-2 text-gray-900">Free Trial (Days)</label>
          <input
            type="number"
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
            placeholder="7"
            min="0"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="mt-2 flex gap-2">
            {[0, 7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setTrialDays(days.toString())}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                {days === 0 ? 'None' : `${days}d`}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="block mb-3 text-gray-900">Tier Features</label>
          
          <div className="space-y-4">
            {/* Plans Included */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Number of Plans Included</label>
              <input
                type="number"
                value={plansIncluded}
                onChange={(e) => setPlansIncluded(e.target.value)}
                min="1"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Check-in Frequency */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Check-in Frequency</label>
              <select
                value={checkInFrequency}
                onChange={(e) => setCheckInFrequency(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={videoAccess}
                  onChange={(e) => setVideoAccess(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-900">Access to video library</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nutritionGuides}
                  onChange={(e) => setNutritionGuides(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-900">Nutrition guides included</span>
              </label>
            </div>

            {/* Custom Features */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Custom Features</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="e.g., Form video analysis"
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
                />
                <button
                  onClick={addCustomFeature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {customFeatures.length > 0 && (
                <div className="space-y-2">
                  {customFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2">
                      <span className="text-gray-800 text-sm">{feature}</span>
                      <button
                        onClick={() => removeCustomFeature(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-900 mb-3">Preview</div>
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-gray-900 mb-2">{name || 'Tier Name'}</h3>
            <p className="text-gray-600 text-sm mb-3">{description || 'Description'}</p>
            <div className="flex gap-2 mb-3">
              {monthlyPrice && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  ${monthlyPrice}/mo
                </span>
              )}
              {annualPrice && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                  ${annualPrice}/yr
                </span>
              )}
            </div>
            <div className="text-gray-700 text-sm space-y-1">
              <div>✓ {plansIncluded} plan{Number(plansIncluded) > 1 ? 's' : ''} included</div>
              <div>✓ {checkInFrequency} check-ins</div>
              {videoAccess && <div>✓ Video library access</div>}
              {nutritionGuides && <div>✓ Nutrition guides</div>}
              {customFeatures.map((feature, i) => (
                <div key={i}>✓ {feature}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Clone Button */}
        {existingTier && (
          <button
            onClick={handleClone}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Copy className="w-5 h-5" />
            Clone as Template
          </button>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Save } from 'lucide-react';
import { BackButton } from './ui/back-button';
import { Button } from './ui/button';
import { NumberInput } from './ui/number-input';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { PackagesAPI, PlansAPI } from '../api';
import type { Plan } from '../api/types';
import { toast } from 'sonner';

interface SubscriptionTierBuilderProps {
  onCancel: () => void;
  onSave: () => void;
  token: string;
  packageId?: string; // when set, edit an existing package
}

const TOTAL_STEPS = 4;

const toIntOrNull = (v: number): number | null => (v > 0 ? v : null);

export function SubscriptionTierBuilder({ onCancel, onSave, token, packageId }: SubscriptionTierBuilderProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  const [annualPrice, setAnnualPrice] = useState(0);
  const [oneTimePrice, setOneTimePrice] = useState(0);
  const [checkInFrequency, setCheckInFrequency] = useState('weekly');
  const [videoAccess, setVideoAccess] = useState(false);
  const [nutritionGuides, setNutritionGuides] = useState(false);
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [trialDays, setTrialDays] = useState(0);
  const [popular, setPopular] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(packageId);

  // Load the coach's plans (for bundling) and, when editing, the package itself.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await PlansAPI.listPlans(token);
        // Only the coach's own plans can be bundled (the backend enforces ownership).
        if (active) setPlans(res.items.filter((p) => p.user_id === user?.id));
      } catch (e) {
        toast.error((e as Error).message);
      }
      if (!packageId) return;
      try {
        const pkg = await PackagesAPI.getPackage(token, packageId);
        if (!active) return;
        setName(pkg.name);
        setDescription(pkg.description || '');
        setMonthlyPrice(pkg.price_monthly ?? 0);
        setAnnualPrice(pkg.price_annual ?? 0);
        setOneTimePrice(pkg.price_one_time ?? 0);
        setCheckInFrequency(pkg.check_in_frequency || 'weekly');
        setVideoAccess(pkg.video_access);
        setNutritionGuides(pkg.nutrition_guides);
        setCustomFeatures(pkg.custom_features || []);
        setTrialDays(pkg.trial_days);
        setPopular(pkg.popular);
        setSelectedPlanIds((pkg.plans || []).map((p) => p.id));
      } catch (e) {
        toast.error((e as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [token, packageId, user?.id]);

  const togglePlan = (id: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
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

  const hasPrice = Boolean(monthlyPrice || annualPrice || oneTimePrice);
  const isFormValid = () => Boolean(name.trim()) && hasPrice;

  // A step must be valid before you can advance past it.
  const canAdvance = (s: number) => {
    if (s === 1) return Boolean(name.trim());
    if (s === 3) return hasPrice;
    return true;
  };

  const stepTitles = [t('stepBasics'), t('stepPlans'), t('stepPricing'), t('stepFeatures')];

  const handleSave = async () => {
    if (!isFormValid() || saving) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price_monthly: toIntOrNull(monthlyPrice),
      price_annual: toIntOrNull(annualPrice),
      price_one_time: toIntOrNull(oneTimePrice),
      trial_days: trialDays || 0,
      check_in_frequency: checkInFrequency,
      video_access: videoAccess,
      nutrition_guides: nutritionGuides,
      custom_features: customFeatures,
      popular,
      plan_ids: selectedPlanIds,
    };
    try {
      if (packageId) {
        await PackagesAPI.updatePackage(token, packageId, payload);
      } else {
        await PackagesAPI.createPackage(token, payload);
      }
      toast.success(t('saved'));
      onSave();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header + progress */}
      <div className="bg-navy px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <BackButton onClick={() => (step === 1 ? onCancel() : setStep(step - 1))} aria-label={t('back')} />
          <h2 className="text-white">{isEdit ? t('editTier') : t('createTier')}</h2>
          {step < TOTAL_STEPS ? (
            <Button variant="brand" size="sm" disabled={!canAdvance(step)} onClick={() => canAdvance(step) && setStep(step + 1)}>
              {t('next')}
            </Button>
          ) : (
            <Button variant="brand" size="sm" icon={<Save />} loading={saving} disabled={!isFormValid()} onClick={handleSave}>
              {t('save')}
            </Button>
          )}
        </div>
        {/* Step segments */}
        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-yellow-500' : 'bg-navy-light'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white text-sm">{stepTitles[step - 1]}</span>
          <span className="text-gray-300 text-xs">
            {t('stepProgress', { current: String(step), total: String(TOTAL_STEPS) })}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-8">
        {/* STEP 1 — Basics */}
        {step === 1 && (
          <>
            <div>
              <label className="text-[#3D3D3D] mb-2 block">{t('tierName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('premiumPlanPlaceholder')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#3D3D3D]"
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-900">{t('descriptionRequired')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('whatsIncluded')}
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </>
        )}

        {/* STEP 2 — Bundle plans */}
        {step === 2 && (
          <div>
            <label className="block mb-2 text-gray-900">
              {t('bundledPlans')} ({selectedPlanIds.length})
            </label>
            <p className="text-gray-500 text-sm mb-3">{t('bundledPlansHint')}</p>
            {plans.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
                {t('noPlansToBundle')}
              </div>
            ) : (
              <div className="space-y-2">
                {plans.map((plan) => {
                  const checked = selectedPlanIds.includes(plan.id);
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => togglePlan(plan.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                        checked ? 'bg-yellow-50 border-yellow-500' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="text-navy text-sm">{plan.name}</div>
                        {plan.exercise_count != null && (
                          <div className="text-gray-500 text-xs">
                            {t('exercises')}: {plan.exercise_count}
                          </div>
                        )}
                      </div>
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                          checked ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300'
                        }`}
                      >
                        {checked && <Check className="w-4 h-4 text-navy" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Pricing & trial */}
        {step === 3 && (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('monthlyPrice')}</label>
              <NumberInput noStepper min={0} value={monthlyPrice} onChange={setMonthlyPrice} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('annualPrice')}</label>
              <NumberInput noStepper min={0} value={annualPrice} onChange={setAnnualPrice} className="w-full" />
              {annualPrice > 0 && monthlyPrice > 0 && (
                <p className="text-green-600 text-sm mt-1">
                  {t('savePerYear', { amount: ((monthlyPrice * 12) - annualPrice).toLocaleString() })}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('oneTimePurchase')}</label>
              <NumberInput noStepper min={0} value={oneTimePrice} onChange={setOneTimePrice} className="w-full" />
            </div>
            <div>
              <label className="block mb-2 text-gray-900">{t('freeTrialDays')}</label>
              <NumberInput min={0} max={365} value={trialDays} onChange={setTrialDays} className="w-full" />
              <div className="mt-2 flex gap-2">
                {[0, 7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTrialDays(days)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {days === 0 ? t('none') : `${days}${t('daysSuffix')}`}
                  </button>
                ))}
              </div>
            </div>
            {!hasPrice && <p className="text-red-500 text-sm">{t('pricingOptions')}</p>}
          </>
        )}

        {/* STEP 4 — Features + review */}
        {step === 4 && (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('checkInFrequency')}</label>
              <select
                value={checkInFrequency}
                onChange={(e) => setCheckInFrequency(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">{t('freqDaily')}</option>
                <option value="weekly">{t('freqWeekly')}</option>
                <option value="biweekly">{t('freqBiweekly')}</option>
                <option value="monthly">{t('freqMonthly')}</option>
                <option value="none">{t('none')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={videoAccess} onChange={(e) => setVideoAccess(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-gray-900">{t('accessVideoLibrary')}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={nutritionGuides} onChange={(e) => setNutritionGuides(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-gray-900">{t('nutritionGuidesIncluded')}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-gray-900">{t('markAsPopular')}</span>
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">{t('customFeaturesLabel')}</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)}
                  placeholder={t('formVideoPlaceholder')}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
                />
                <button onClick={addCustomFeature} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {customFeatures.length > 0 && (
                <div className="space-y-2">
                  {customFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2">
                      <span className="text-gray-800 text-sm">{feature}</span>
                      <button onClick={() => removeCustomFeature(index)} className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-900 mb-3">{t('preview')}</div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="text-gray-900 mb-2">{name || t('tierName')}</h3>
                <p className="text-gray-600 text-sm mb-3">{description || t('descriptionLabel')}</p>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {monthlyPrice > 0 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {monthlyPrice.toLocaleString()}{t('perMoShort')}
                    </span>
                  )}
                  {annualPrice > 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                      {annualPrice.toLocaleString()}{t('perYrShort')}
                    </span>
                  )}
                </div>
                <div className="text-gray-700 text-sm space-y-1">
                  <div>✓ {t('plansIncludedCount', { count: String(selectedPlanIds.length) })}</div>
                  <div>✓ {checkInFrequency} {t('checkinsWord')}</div>
                  {videoAccess && <div>✓ {t('videoLibraryAccessShort')}</div>}
                  {nutritionGuides && <div>✓ {t('nutritionGuidesShort')}</div>}
                  {customFeatures.map((feature, i) => (
                    <div key={i}>✓ {feature}</div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

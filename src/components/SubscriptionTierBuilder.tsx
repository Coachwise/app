import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Save } from 'lucide-react';
import { BackButton } from './ui/back-button';
import { Button } from './ui/button';
import { NumberInput } from './ui/number-input';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { PackagesAPI, PlansAPI } from '../api';
import * as PricingAPI from '../api/pricing';
import type { Currency, Plan } from '../api/types';
import { currencyLabel, formatAmount, formatMoney } from '../lib/money';
import { toast } from 'sonner';

interface SubscriptionTierBuilderProps {
  onCancel: () => void;
  onSave: () => void;
  token: string;
  packageId?: string; // when set, edit an existing package
}

const TOTAL_STEPS = 4;

// A new package takes the server's default currency (coach_packages.currency
// defaults to IRR) — the builder can't choose one yet, so mirror that default
// rather than guessing, and show an existing package's own currency when editing.
const DEFAULT_CURRENCY = 'IRR';

const toIntOrNull = (v: number): number | null => (v > 0 ? v : null);

// The optional price points. Monthly is the anchor: switching one of these on
// seeds it from the monthly price, and it keeps following until the coach types
// their own number. A zero price means the coach doesn't offer it, so it's off.
// One-time is lifetime access, not a duration — it has no discount to show.
type PriceKey = 'quarterly' | 'annual' | 'oneTime';
const OPTIONAL_PRICES: { key: PriceKey; label: string; months?: number; derive: (monthly: number) => number }[] = [
  { key: 'quarterly', label: 'quarterlyPrice', months: 3, derive: (m) => Math.round(m * 3 * 0.85) },
  { key: 'annual', label: 'annualPrice', months: 12, derive: (m) => Math.round(m * 12 * 0.7) },
  { key: 'oneTime', label: 'oneTimePurchase', derive: (m) => m * 12 },
];

export function SubscriptionTierBuilder({ onCancel, onSave, token, packageId }: SubscriptionTierBuilderProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  const [prices, setPrices] = useState<Record<PriceKey, number>>({ quarterly: 0, annual: 0, oneTime: 0 });
  // 3-month and yearly are offered by default; one-time is opt-in.
  const [enabled, setEnabled] = useState<Record<PriceKey, boolean>>({ quarterly: true, annual: true, oneTime: false });
  // Which of the above the coach typed themselves — those stop tracking monthly.
  const [manual, setManual] = useState<Record<PriceKey, boolean>>({ quarterly: false, annual: false, oneTime: false });
  const [checkInFrequency, setCheckInFrequency] = useState('weekly');
  const [videoAccess, setVideoAccess] = useState(false);
  const [nutritionGuides, setNutritionGuides] = useState(false);
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [popular, setPopular] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(packageId);

  // The currencies the platform sells in. A single one needs no picker, so the
  // label alone carries it; the select appears once there's a real choice.
  useEffect(() => {
    let active = true;
    PricingAPI.listCurrencies(token)
      .then((res) => {
        if (!active) return;
        setCurrencies(res);
        // A new package defaults to the first enabled currency the server offers.
        if (!packageId && res.length > 0) setCurrency((cur) => (res.some((c) => c.code === cur) ? cur : res[0].code));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token, packageId]);

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
        setCurrency(pkg.currency || DEFAULT_CURRENCY);
        setMonthlyPrice(pkg.price_monthly ?? 0);
        setPrices({
          quarterly: pkg.price_quarterly ?? 0,
          annual: pkg.price_annual ?? 0,
          oneTime: pkg.price_one_time ?? 0,
        });
        // 3-month and yearly stay on even for a package saved without them;
        // lifetime stays off unless this package actually sells one.
        setEnabled({ quarterly: true, annual: true, oneTime: (pkg.price_one_time ?? 0) > 0 });
        // A saved price is the coach's own — never re-derive it behind their back.
        setManual({
          quarterly: (pkg.price_quarterly ?? 0) > 0,
          annual: (pkg.price_annual ?? 0) > 0,
          oneTime: true,
        });
        setCheckInFrequency(pkg.check_in_frequency || 'weekly');
        setVideoAccess(pkg.video_access);
        setNutritionGuides(pkg.nutrition_guides);
        setCustomFeatures(pkg.custom_features || []);
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

  // Typing a monthly price pulls every enabled, still-auto option along with it.
  const changeMonthly = (v: number) => {
    setMonthlyPrice(v);
    setPrices((prev) => {
      const next = { ...prev };
      for (const { key, derive } of OPTIONAL_PRICES) {
        if (enabled[key] && !manual[key]) next[key] = derive(v);
      }
      return next;
    });
  };

  // Switching an option on seeds it from monthly; switching it off drops its
  // price, which is how "not offered" reaches the backend.
  const toggleOptionalPrice = (key: PriceKey, on: boolean) => {
    const spec = OPTIONAL_PRICES.find((p) => p.key === key)!;
    setEnabled((prev) => ({ ...prev, [key]: on }));
    setPrices((prev) => ({ ...prev, [key]: on ? spec.derive(monthlyPrice) : 0 }));
    setManual((prev) => ({ ...prev, [key]: false }));
  };

  const editOptionalPrice = (key: PriceKey, v: number) => {
    setPrices((prev) => ({ ...prev, [key]: v }));
    setManual((prev) => ({ ...prev, [key]: true }));
  };

  const hasPrice = Boolean(monthlyPrice || prices.quarterly || prices.annual || prices.oneTime);
  const isFormValid = () => Boolean(name.trim()) && hasPrice;

  // A step must be valid before you can advance past it.
  const canAdvance = (s: number) => {
    if (s === 1) return Boolean(name.trim());
    if (s === 3) return hasPrice;
    return true;
  };

  const stepTitles = [t('stepBasics'), t('stepPlans'), t('stepPricing'), t('stepFeatures')];
  const currencyName = currencyLabel(currency, language);

  const handleSave = async () => {
    if (!isFormValid() || saving) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      currency,
      description: description.trim() || null,
      price_monthly: toIntOrNull(monthlyPrice),
      price_quarterly: toIntOrNull(enabled.quarterly ? prices.quarterly : 0),
      price_annual: toIntOrNull(enabled.annual ? prices.annual : 0),
      price_one_time: toIntOrNull(enabled.oneTime ? prices.oneTime : 0),
      trial_days: 0,
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
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <BackButton onClick={() => (step === 1 ? onCancel() : setStep(step - 1))} aria-label={t('back')} />
          <h2 className="text-foreground">{isEdit ? t('editTier') : t('createTier')}</h2>
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
                s <= step ? 'bg-yellow-500' : 'bg-tint-2'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground text-sm">{stepTitles[step - 1]}</span>
          <span className="text-muted-foreground text-xs">
            {t('stepProgress', { current: String(step), total: String(TOTAL_STEPS) })}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-8">
        {/* STEP 1 — Basics */}
        {step === 1 && (
          <>
            <div>
              <label className="text-foreground mb-2 block">{t('tierName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('premiumPlanPlaceholder')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent text-foreground"
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-900">{t('descriptionRequired')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('whatsIncluded')}
                rows={4}
                className="w-full px-4 py-3 bg-card border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent resize-none"
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
              <div className="bg-card border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
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
                        checked ? 'bg-yellow-50 border-yellow-500' : 'bg-card border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="text-foreground text-sm">{plan.name}</div>
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
                        {checked && <Check className="w-4 h-4 text-foreground" />}
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
            {currencies.length > 1 && (
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="package-currency">{t('currencyLabel')}</label>
                <select
                  id="package-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-gray-300 rounded-lg text-foreground focus:ring-2 focus:ring-tint focus:border-transparent"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {currencyLabel(c.code, language)} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('monthlyPrice', { currency: currencyName })}</label>
              <NumberInput noStepper grouped min={0} value={monthlyPrice} onChange={changeMonthly} className="w-full" />
            </div>

            {OPTIONAL_PRICES.map(({ key, label, months }) => {
              const amount = prices[key];
              const on = enabled[key];
              const full = months ? monthlyPrice * months : 0;
              // Read the discount off the real numbers, so it tracks whatever the
              // coach types rather than the percentage we happened to seed with.
              const off = full > 0 && amount > 0 && amount < full ? Math.round(((full - amount) / full) * 100) : null;
              const title = t(label, { currency: currencyName });
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-gray-600" htmlFor={`price-${key}`}>{title}</label>
                    <div className="flex items-center gap-2">
                      {on && off !== null && (
                        <span className="text-xs text-green-600">
                          {t('percentOff', { percent: formatAmount(off, language) })}
                        </span>
                      )}
                      {on && !months && <span className="text-xs text-muted-foreground">{t('lifetimeAccess')}</span>}
                      <input
                        type="checkbox"
                        aria-label={title}
                        checked={on}
                        onChange={(e) => toggleOptionalPrice(key, e.target.checked)}
                        className="size-4 accent-yellow-500"
                      />
                    </div>
                  </div>
                  {on && (
                    <NumberInput
                      id={`price-${key}`}
                      noStepper
                      grouped
                      min={0}
                      value={amount}
                      onChange={(v) => editOptionalPrice(key, v)}
                      className="w-full"
                    />
                  )}
                  {on && off !== null && (
                    <p className="text-green-600 text-sm mt-1">
                      {t('saveVsMonthly', { amount: formatMoney(full - amount, currency, language) })}
                    </p>
                  )}
                </div>
              );
            })}
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
                className="w-full px-4 py-3 bg-card border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent"
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
                  className="w-5 h-5 text-tint-ink rounded border-gray-300 focus:ring-tint" />
                <span className="text-gray-900">{t('accessVideoLibrary')}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={nutritionGuides} onChange={(e) => setNutritionGuides(e.target.checked)}
                  className="w-5 h-5 text-tint-ink rounded border-gray-300 focus:ring-tint" />
                <span className="text-gray-900">{t('nutritionGuidesIncluded')}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)}
                  className="w-5 h-5 text-tint-ink rounded border-gray-300 focus:ring-tint" />
                <span className="text-gray-900">{t('markAsPopular')}</span>
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">{t('customFeaturesLabel')}</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)}
                  placeholder={t('formVideoPlaceholder')}
                  className="flex-1 px-4 py-2 bg-card border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
                />
                <button onClick={addCustomFeature} className="px-4 py-2 bg-tint text-tint-fg rounded-lg hover:bg-tint-2">
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
            <div className="bg-tint-soft border border-blue-200 rounded-lg p-4">
              <div className="text-blue-900 mb-3">{t('preview')}</div>
              <div className="bg-card rounded-lg p-4">
                <h3 className="text-gray-900 mb-2">{name || t('tierName')}</h3>
                <p className="text-gray-600 text-sm mb-3">{description || t('descriptionLabel')}</p>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {monthlyPrice > 0 && (
                    <span className="px-3 py-1 bg-tint-soft text-blue-700 rounded text-sm">
                      {formatMoney(monthlyPrice, currency, language)}{t('perMoShort')}
                    </span>
                  )}
                  {prices.quarterly > 0 && (
                    <span className="px-3 py-1 bg-tint-soft text-blue-700 rounded text-sm">
                      {formatMoney(prices.quarterly, currency, language)}{t('perQuarterShort')}
                    </span>
                  )}
                  {prices.annual > 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                      {formatMoney(prices.annual, currency, language)}{t('perYrShort')}
                    </span>
                  )}
                  {prices.oneTime > 0 && (
                    <span className="px-3 py-1 bg-muted text-foreground rounded text-sm">
                      {formatMoney(prices.oneTime, currency, language)} {t('oneTimeShort')}
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

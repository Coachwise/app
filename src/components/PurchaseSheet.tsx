import { useEffect, useMemo, useState } from 'react';
import { X, Check, Loader2, Wallet as WalletIcon, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useRealtimeRefetch } from '../contexts/RealtimeContext';
import * as PricingAPI from '../api/pricing';
import * as WalletAPI from '../api/wallet';
import * as PackagesAPI from '../api/packages';
import { errorText } from '../api/errors';
import { formatMoney, currencyLabel } from '../lib/money';
import { openExternal } from '../lib/platform';
import type { CoachPackage, DurationTier, PaymentProvider, Quote, WalletBalance } from '../api/types';

interface PurchaseSheetProps {
  open: boolean;
  onClose: () => void;
  kind: 'PRO' | 'PACKAGE';
  pkg?: CoachPackage; // required when kind === 'PACKAGE'
  onSuccess: () => void;
}

type CurrencyOption = { currency: string; providers: PaymentProvider[] };

// One flow for buying Pro or a coach package: pick currency → provider → (for
// subscriptions) duration, see the server-computed quote, confirm. The buy call
// auto-tops-up the wallet shortfall, so it reads as a single "pay" action.
export function PurchaseSheet({ open, onClose, kind, pkg, onSuccess }: PurchaseSheetProps) {
  const { tokens } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const token = tokens?.access_token ?? '';
  const isOneTime = kind === 'PACKAGE' && pkg?.billing_type === 'ONE_TIME';

  const [options, setOptions] = useState<CurrencyOption[]>([]);
  const [tiers, setTiers] = useState<DurationTier[]>([]);
  const [currency, setCurrency] = useState('');
  const [provider, setProvider] = useState('');
  const [months, setMonths] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the purchase options (currencies + their providers) and duration tiers.
  useEffect(() => {
    if (!open || !token) return;
    let active = true;
    setLoadingOpts(true);
    setError(null);
    (async () => {
      try {
        const [opts, tierList] = await Promise.all([
          loadOptions(),
          PricingAPI.listTiers(token),
        ]);
        if (!active) return;
        setOptions(opts);
        setTiers(tierList);
        const first = opts[0];
        setCurrency(first?.currency ?? '');
        setProvider(first?.providers[0]?.name ?? '');
        setMonths(tierList[0]?.months ?? 1);
      } catch (err) {
        if (active) setError(errorText(t, err));
      } finally {
        if (active) setLoadingOpts(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token, kind, pkg?.id]);

  async function loadOptions(): Promise<CurrencyOption[]> {
    if (kind === 'PACKAGE' && pkg) {
      const opts = await PricingAPI.packageOptions(token, pkg.id);
      return opts.map((o) => ({ currency: o.currency, providers: o.providers }));
    }
    // PRO: platform currencies that have at least one provider.
    const currencies = await PricingAPI.listCurrencies(token);
    const withProviders = await Promise.all(
      currencies.map(async (c) => ({
        currency: c.code,
        providers: await PricingAPI.providersFor(token, c.code),
      })),
    );
    return withProviders.filter((o) => o.providers.length > 0);
  }

  const providers = useMemo(
    () => options.find((o) => o.currency === currency)?.providers ?? [],
    [options, currency],
  );

  // Keep the provider valid for the chosen currency.
  useEffect(() => {
    if (providers.length && !providers.some((p) => p.name === provider)) {
      setProvider(providers[0].name);
    }
  }, [providers, provider]);

  // Refetch the quote whenever currency / months change.
  useEffect(() => {
    if (!open || !token || !currency) return;
    let active = true;
    setQuoting(true);
    (async () => {
      try {
        const q = await PricingAPI.quote(token, {
          kind,
          currency,
          months: isOneTime ? undefined : months,
          packageId: pkg?.id,
        });
        if (active) { setQuote(q); setError(null); }
      } catch (err) {
        if (active) { setQuote(null); setError(errorText(t, err)); }
      } finally {
        if (active) setQuoting(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token, currency, months, isOneTime, kind, pkg?.id]);

  // Current wallet balance, so we can tell whether a redirect top-up is needed.
  useEffect(() => {
    if (!open || !token) return;
    WalletAPI.getWallet(token).then(setBalance).catch(() => setBalance(null));
  }, [open, token]);

  const selectedProvider = providers.find((p) => p.name === provider);
  const isRedirect = Boolean(selectedProvider?.redirect);

  // Run the actual purchase, funded from the wallet balance.
  const doPurchase = async () => {
    if (kind === 'PRO') {
      await WalletAPI.buyPro(token, { currency, provider, months });
    } else if (pkg) {
      await PackagesAPI.purchasePackage(token, pkg.id, {
        currency,
        provider,
        months: isOneTime ? undefined : months,
      });
    }
    onSuccess();
    onClose();
  };

  const confirm = async () => {
    if (!quote || !provider) return;
    setSubmitting(true);
    setError(null);
    try {
      const shortfall = quote.total - (balance?.available ?? 0);
      // Redirect gateway + not enough balance → top up the shortfall in a new tab,
      // then finish the purchase when the realtime "wallet" signal arrives.
      if (shortfall > 0 && isRedirect) {
        const { redirect_url } = await WalletAPI.initiateTopup(token, { amount: shortfall, provider });
        setWaiting(true);
        // In-app browser on native, new tab on web. When it closes we re-check the
        // wallet (the realtime "wallet" signal is the primary trigger; this is a
        // fallback for when the socket message is missed).
        await openExternal(redirect_url, () => { onWalletChanged(); });
        return;
      }
      await doPurchase();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setSubmitting(false);
    }
  };

  // When the wallet changes (gateway callback fired the "wallet" signal), refetch
  // the balance and — if we're waiting on a top-up — complete the purchase.
  const onWalletChanged = async () => {
    if (!token) return;
    try {
      const bal = await WalletAPI.getWallet(token);
      setBalance(bal);
      if (waiting && quote && bal.available >= quote.total) {
        setWaiting(false);
        await doPurchase();
      }
    } catch { /* ignore */ }
  };
  useRealtimeRefetch('wallet', onWalletChanged);

  // Fallback if the socket signal is missed: re-check when the user returns here.
  useEffect(() => {
    if (!waiting) return;
    const onFocus = () => { onWalletChanged(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, quote?.total]);

  if (!open) return null;

  const title = kind === 'PRO' ? t('upgradeToPro') : pkg?.name ?? t('purchase');
  const durationTiers = tiers;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-2xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h3 className="text-navy font-medium">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-navy"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
          {loadingOpts ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>
          ) : options.length === 0 ? (
            <p className="text-center text-gray-500 py-10 text-sm">{t('noPaymentOptions')}</p>
          ) : (
            <>
              {isOneTime && (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-navy">
                  <ShieldCheck className="w-4 h-4 text-yellow-600 shrink-0" />
                  {t('oneTimeLifetimeHint')}
                </div>
              )}

              {/* Currency */}
              {options.length > 1 && (
                <Field label={t('currencyLabel')}>
                  <div className="flex flex-wrap gap-2">
                    {options.map((o) => (
                      <Chip key={o.currency} active={o.currency === currency} onClick={() => setCurrency(o.currency)}>
                        {currencyLabel(o.currency, language)}
                      </Chip>
                    ))}
                  </div>
                </Field>
              )}

              {/* Duration (subscriptions only) */}
              {!isOneTime && (
                <Field label={t('duration')}>
                  <div className="flex flex-wrap gap-2">
                    {durationTiers.map((tier) => (
                      <Chip key={tier.months} active={tier.months === months} onClick={() => setMonths(tier.months)}>
                        <span>{t('monthsCount', { count: tier.months })}</span>
                        {tier.discount_percent > 0 && (
                          <span className="ms-1 text-xs text-green-600">−{tier.discount_percent}%</span>
                        )}
                      </Chip>
                    ))}
                  </div>
                </Field>
              )}

              {/* Provider */}
              <Field label={t('paymentMethod')}>
                <div className="space-y-2">
                  {providers.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setProvider(p.name)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-start ${p.name === provider ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {p.logo && <img src={p.logo} alt="" className="w-6 h-6 object-contain shrink-0" />}
                        <span className="text-navy text-sm truncate">{p.title}</span>
                      </span>
                      {p.name === provider && <Check className="w-4 h-4 text-yellow-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Quote breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                {quoting || !quote ? (
                  <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>
                ) : (
                  <>
                    <Row label={t('subtotal')} value={formatMoney(quote.subtotal, quote.currency, language)} />
                    {quote.discount_amount > 0 && (
                      <Row label={`${t('discount')} (${quote.discount_percent}%)`} value={`− ${formatMoney(quote.discount_amount, quote.currency, language)}`} green />
                    )}
                    {quote.pro_included && quote.pro_amount > 0 && (
                      <Row label={t('proMembershipLine', { count: quote.pro_months })} value={`+ ${formatMoney(quote.pro_amount, quote.currency, language)}`} />
                    )}
                    <div className="border-t border-gray-200 my-1" />
                    <Row label={t('total')} value={formatMoney(quote.total, quote.currency, language)} bold />
                    {/* Only mention Pro when it's actually bundled here (buyer
                        wasn't already Pro). An existing Pro member keeps theirs. */}
                    {quote.pro_included && (
                      <p className="text-xs text-gray-500 pt-1">{t('proRequiredHint')}</p>
                    )}
                  </>
                )}
              </div>

              {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{error}</div>}
            </>
          )}
        </div>

        {options.length > 0 && (
          <div className="p-4 border-t border-gray-100 shrink-0">
            {waiting ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-navy text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                  {t('waitingForPayment')}
                </div>
                <p className="text-gray-500 text-xs">{t('completePaymentHint')}</p>
                <button
                  type="button"
                  onClick={onWalletChanged}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 text-navy py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  {t('checkPaymentStatus')}
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="brand"
                size="block"
                loading={submitting}
                disabled={quoting || !quote || !provider}
                icon={isRedirect ? <ExternalLink className="size-5" /> : <WalletIcon className="size-5" />}
                onClick={confirm}
              >
                {quote ? t('payAmount', { amount: formatMoney(quote.total, quote.currency, language) }) : t('pleaseWait')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-navy text-sm mb-2">{label}</p>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${active ? 'border-yellow-500 bg-yellow-50 text-navy' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
    >
      {children}
    </button>
  );
}

function Row({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'text-navy' : 'text-gray-500'}>{label}</span>
      <span className={`${bold ? 'text-navy font-medium' : green ? 'text-green-600' : 'text-navy'}`} dir="ltr">{value}</span>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Loader2, Clock, Wallet as WalletIcon, Send, CreditCard, Pencil, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useRealtimeRefetch } from '../contexts/RealtimeContext';
import * as WalletAPI from '../api/wallet';
import * as PricingAPI from '../api/pricing';
import { errorText } from '../api/errors';
import { formatMoney, formatAmount, currencyLabel } from '../lib/money';
import { openExternal } from '../lib/platform';

// Convert Persian/Arabic-indic digits to ASCII so numeric input works when the
// field is showing localized (FA) digits.
function normalizeDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
import type { PaymentProvider, Payout, PayoutAccount, WalletBalance, WalletTransaction, WalletTxType } from '../api/types';

interface WalletProps {
  onBack: () => void;
}

const CREDIT_TYPES: WalletTxType[] = ['TOPUP', 'SALE', 'REFUND'];

export function Wallet({ onBack }: WalletProps) {
  const { tokens, user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const token = tokens?.access_token ?? '';
  const isCoach = Boolean(user?.is_coach);
  // Persian UI shows Shamsi (Jalali) dates; other locales use the browser default.
  const dateLocale = language === 'fa' ? 'fa-IR-u-ca-persian' : undefined;

  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [bal, tx] = await Promise.all([
        WalletAPI.getWallet(token),
        WalletAPI.listTransactions(token, { limit: 50 }),
      ]);
      setBalance(bal);
      setTxns(tx);
      if (isCoach) {
        const [pos, acc] = await Promise.all([
          WalletAPI.listPayouts(token, { limit: 50 }),
          WalletAPI.getPayoutAccount(token),
        ]);
        setPayouts(pos.items);
        setPayoutAccount(acc.account);
      }
      setError(null);
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);
  // A gateway top-up credits the wallet server-side and fires a "wallet" signal.
  useRealtimeRefetch('wallet', load);

  return (
    <div className="min-h-screen bg-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-br from-navy to-navy-light text-white p-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-lg">
            <ArrowLeft className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="text-xl">{t('wallet')}</h1>
        </div>

        <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
          <WalletIcon className="w-4 h-4" />
          {t('availableBalance')}
        </div>
        <div className="text-4xl mb-3" dir="ltr">
          {balance ? formatMoney(balance.available, balance.currency, language) : '—'}
        </div>
        {balance && balance.pending > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-sm text-white/80">
            <Clock className="w-3.5 h-3.5" />
            {t('pendingBalance')}: <span dir="ltr">{formatMoney(balance.pending, balance.currency, language)}</span>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setTopUpOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-navy py-2.5 rounded-lg hover:bg-yellow-400 font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('addFunds')}
          </button>
          {isCoach && (
            <button
              onClick={() => (payoutAccount ? setPayoutOpen(true) : setAccountOpen(true))}
              disabled={!balance || balance.available <= 0}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white py-2.5 rounded-lg hover:bg-white/20 disabled:opacity-50 font-medium"
            >
              <Send className="w-4 h-4" />
              {t('requestPayout')}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 -mt-4">
        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm mb-4">{error}</div>}

        {isCoach && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-navy text-sm">
                <CreditCard className="w-4 h-4 text-yellow-600" />
                {t('payoutInfo')}
              </div>
              <button
                onClick={() => setAccountOpen(true)}
                className="inline-flex items-center gap-1 text-yellow-600 hover:text-yellow-700 text-sm font-medium"
              >
                {payoutAccount ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                {payoutAccount ? t('editPayoutInfo') : t('addPayoutInfo')}
              </button>
            </div>
            {payoutAccount ? (
              <div>
                <div className="flex items-center gap-2 text-navy" dir="ltr">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="tracking-wider">{maskCard(payoutAccount.card_number)}</span>
                </div>
                {payoutAccount.account_holder && (
                  <p className="text-gray-500 text-sm mt-1">{payoutAccount.account_holder}</p>
                )}
                {payoutAccount.status === 'UNVERIFIED' && (
                  <p className="text-gray-400 text-xs mt-2">{t('payoutAccountPendingReview')}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t('payoutInfoSetupPrompt')}</p>
            )}
          </div>
        )}

        {isCoach && payouts.length > 0 && (
          <div className="mb-5">
            <h2 className="text-navy text-sm mb-2">{t('payouts')}</h2>
            <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-50">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-navy" dir="ltr">{formatMoney(p.amount, p.currency, language)}</div>
                    <div className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString(dateLocale)}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${payoutBadge(p.status)}`}>{t(`payout_${p.status}`)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-navy text-sm mb-2">{t('transactions')}</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>
        ) : txns.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">{t('noTransactions')}</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-50">
            {txns.map((tx) => {
              const credit = CREDIT_TYPES.includes(tx.type);
              const pending = new Date(tx.available_at).getTime() > Date.now() && credit;
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${credit ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {credit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-navy text-sm truncate">{t(`txType_${tx.type}`)}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      {new Date(tx.created_at).toLocaleDateString(dateLocale)}
                      {pending && <><Clock className="w-3 h-3" /> {t('pending')}</>}
                    </div>
                  </div>
                  <div className={`text-sm ${credit ? 'text-green-600' : 'text-navy'}`} dir="ltr">
                    {credit ? '+' : '−'} {formatMoney(Math.abs(tx.amount), tx.currency, language)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {payoutOpen && balance && (
        <PayoutSheet
          balance={balance}
          onClose={() => setPayoutOpen(false)}
          onDone={() => { setPayoutOpen(false); load(); }}
        />
      )}

      {accountOpen && balance && (
        <PayoutAccountSheet
          currency={balance.currency}
          account={payoutAccount}
          onClose={() => setAccountOpen(false)}
          onDone={() => { setAccountOpen(false); load(); }}
        />
      )}

      {topUpOpen && balance && (
        <TopUpSheet
          currency={balance.currency}
          onClose={() => setTopUpOpen(false)}
        />
      )}
    </div>
  );
}

// Show only the last 4 digits of a stored card number.
function maskCard(card?: string | null): string {
  const digits = (card || '').replace(/\D/g, '');
  if (digits.length < 4) return '•••• •••• •••• ••••';
  return `•••• •••• •••• ${digits.slice(-4)}`;
}

// Group a digit string into blocks of 4 for display (card number formatting).
function groupCard(digits: string): string {
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function payoutBadge(status: string): string {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-700';
    case 'APPROVED': return 'bg-blue-100 text-blue-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    default: return 'bg-yellow-100 text-yellow-700';
  }
}

function PayoutSheet({ balance, onClose, onDone }: { balance: WalletBalance; onClose: () => void; onDone: () => void }) {
  const { tokens } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const token = tokens?.access_token ?? '';
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) { setError(t('enterValidAmount')); return; }
    if (value > balance.available) { setError(t('errPayoutExceedsAvailable')); return; }
    setSubmitting(true);
    setError(null);
    try {
      await WalletAPI.requestPayout(token, { amount: value });
      onDone();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="text-navy font-medium">{t('requestPayout')}</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{t('availableBalance')}</span>
          <button
            type="button"
            onClick={() => setAmount(String(balance.available))}
            className="text-yellow-600 hover:text-yellow-700 font-medium"
            dir="ltr"
          >
            {t('max')}: {formatMoney(balance.available, balance.currency, language)}
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={amount ? formatAmount(Number(amount), language) : ''}
            onChange={(e) => setAmount(normalizeDigits(e.target.value).replace(/[^\d]/g, ''))}
            placeholder="0"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-navy text-center text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-yellow-500"
            dir="ltr"
            autoFocus
          />
          <span className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-gray-400 text-sm`}>
            {currencyLabel(balance.currency, language)}
          </span>
        </div>
        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{error}</div>}
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-navy py-3 rounded-lg hover:bg-yellow-400 disabled:opacity-50 font-medium"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
          {t('requestPayout')}
        </button>
      </div>
    </div>
  );
}

// Set up where a coach's earnings are sent. The form is currency-driven: IRR
// collects a bank card number (+ optional holder); other currencies show a
// "Stripe coming soon" placeholder until Stripe Connect is wired.
function PayoutAccountSheet({
  currency,
  account,
  onClose,
  onDone,
}: {
  currency: string;
  account: PayoutAccount | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { tokens } = useAuth();
  const { t, isRTL } = useLanguage();
  const token = tokens?.access_token ?? '';
  const isIRR = currency === 'IRR';

  const [card, setCard] = useState((account?.card_number || '').replace(/\D/g, ''));
  const [holder, setHolder] = useState(account?.account_holder || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (card.length !== 16) { setError(t('cardNumberInvalid')); return; }
    setSubmitting(true);
    setError(null);
    try {
      await WalletAPI.savePayoutAccount(token, {
        card_number: card,
        account_holder: holder.trim() || undefined,
      });
      onDone();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="text-navy font-medium">{t('payoutInfo')}</h3>

        {isIRR ? (
          <>
            <div>
              <label className="text-gray-500 text-sm">{t('cardNumber')}</label>
              <input
                type="text"
                inputMode="numeric"
                value={groupCard(card)}
                onChange={(e) => setCard(normalizeDigits(e.target.value).replace(/\D/g, '').slice(0, 16))}
                placeholder="•••• •••• •••• ••••"
                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-navy text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-yellow-500"
                dir="ltr"
                autoFocus
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm">{t('accountHolderOptional')}</label>
              <input
                type="text"
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-navy focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{error}</div>}
            <button
              onClick={submit}
              disabled={submitting || card.length !== 16}
              className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-navy py-3 rounded-lg hover:bg-yellow-400 disabled:opacity-50 font-medium"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {t('save')}
            </button>
          </>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
            {t('payoutStripeSoon')}
          </div>
        )}
      </div>
    </div>
  );
}

// Add funds to the wallet via a redirect gateway (SEP). Opens the gateway in a
// new tab; the wallet refreshes when the "wallet" realtime signal arrives.
function TopUpSheet({ currency, onClose }: { currency: string; onClose: () => void }) {
  const { tokens } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const token = tokens?.access_token ?? '';
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('');
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedProvider = providers.find((p) => p.name === provider);

  useEffect(() => {
    if (!token) return;
    PricingAPI.providersFor(token, currency)
      .then((list) => {
        // Prefer redirect gateways for top-up; fall back to whatever's available.
        const redirects = list.filter((p) => p.redirect);
        const pick = redirects.length ? redirects : list;
        setProviders(pick);
        setProvider(pick[0]?.name ?? '');
      })
      .catch(() => {});
  }, [token, currency]);

  const submit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) { setError(t('enterValidAmount')); return; }
    if (!provider) { setError(t('noPaymentOptions')); return; }
    setSubmitting(true);
    setError(null);
    try {
      const { redirect_url } = await WalletAPI.initiateTopup(token, { amount: value, provider });
      // In-app browser on native, new tab on web. The wallet refreshes over the
      // realtime "wallet" signal once the gateway callback settles the top-up.
      await openExternal(redirect_url);
      onClose();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="text-navy font-medium">{t('addFunds')}</h3>

        <div>
          <label className="text-gray-500 text-sm">{t('topUpAmount')}</label>
          <div className="relative mt-1">
            <input
              type="text"
              inputMode="numeric"
              value={amount ? formatAmount(Number(amount), language) : ''}
              onChange={(e) => setAmount(normalizeDigits(e.target.value).replace(/[^\d]/g, ''))}
              placeholder="0"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-navy text-center text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-yellow-500"
              dir="ltr"
              autoFocus
            />
            <span className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-gray-400 text-sm`}>
              {currencyLabel(currency, language)}
            </span>
          </div>
        </div>

        {providers.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setProvider(p.name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${p.name === provider ? 'border-yellow-500 bg-yellow-50 text-navy' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {p.logo && <img src={p.logo} alt="" className="w-5 h-5 object-contain" />}
                {p.title}
              </button>
            ))}
          </div>
        ) : (
          selectedProvider && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {selectedProvider.logo && <img src={selectedProvider.logo} alt="" className="w-6 h-6 object-contain" />}
              {selectedProvider.title}
            </div>
          )
        )}

        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{error}</div>}
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-navy py-3 rounded-lg hover:bg-yellow-400 disabled:opacity-50 font-medium"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t('addFunds')}
        </button>
      </div>
    </div>
  );
}

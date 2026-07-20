import { useEffect, useState } from 'react';
import { Globe, KeyRound, Smartphone, ArrowLeft, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Brand } from './ui/logo';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as AuthAPI from '../api/auth';
import { errorText } from '../api/errors';
import { SearchSelect } from './ui/SearchSelect';
import { COUNTRIES, DEFAULT_COUNTRY, detectCountry, normalizePhone, type Country } from '../lib/countries';
import { config, APP_VERSION, APP_IS_BETA } from '../config';

// Host only (no scheme/path) — enough to spot a build pointed at the wrong API.
const apiHost = (() => {
  try {
    return new URL(config.apiURL).host;
  } catch {
    return config.apiURL;
  }
})();

interface AuthProps {
  onLogin: () => void;
}

// Passwordless phone-only auth: enter a number → receive a one-time code → verify.
type AuthMode = 'phone' | 'phone-code';

export function Auth({ onLogin }: AuthProps) {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { setTokens } = useAuth();

  const [mode, setMode] = useState<AuthMode>('phone');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [showCountries, setShowCountries] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sentPhone, setSentPhone] = useState(''); // the E.164 number a code was sent to

  // Default the dial-code prefix from the caller's IP (best-effort).
  useEffect(() => {
    let active = true;
    detectCountry().then((c) => { if (active) setCountry(c); });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'phone') {
        const full = normalizePhone(country.dial, phone);
        if (full.replace(/\D/g, '').length < 8) throw new Error(t('enterValidPhone'));
        await AuthAPI.sendPhoneOtp(full);
        setSentPhone(full);
        setCode('');
        setMode('phone-code');
        return;
      }
      // phone-code
      if (code.trim().length < 4) throw new Error(t('enterTheCode'));
      const tokens = await AuthAPI.verifyPhoneOtp(sentPhone, code.trim());
      setTokens(tokens);
      onLogin();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    try { await AuthAPI.sendPhoneOtp(sentPhone); }
    catch (err) { setError(errorText(t, err)); }
  };

  const subtitle = mode === 'phone' ? t('signInWithPhone') : t('enterSmsCode');
  const submitLabel = loading ? t('pleaseWait') : mode === 'phone' ? t('sendCode') : t('verifyContinue');

  return (
    <div className="min-h-screen bg-tint flex flex-col">
      <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-10`}>
        <button
          onClick={() => setShowLanguageSelector(!showLanguageSelector)}
          className="p-3 bg-black/5 backdrop-blur rounded-full hover:bg-black/10 transition-colors"
        >
          <Globe className="w-5 h-5 text-tint-fg" />
        </button>
        {showLanguageSelector && (
          <div className={`absolute top-14 ${isRTL ? 'left-0' : 'right-0'} bg-card rounded-lg shadow-xl p-2 min-w-[140px]`}>
            {(['en', 'fa'] as const).map((lng) => (
              <button
                key={lng}
                onClick={() => { setLanguage(lng); setShowLanguageSelector(false); }}
                className={`w-full text-start px-3 py-2 rounded transition-colors ${language === lng ? 'bg-yellow-500 text-foreground' : 'hover:bg-gray-100 text-foreground'}`}
              >
                {lng === 'en' ? t('english') : t('persian')}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Brand name={t('appName')} tile="yellow" size="lg" className="text-tint-fg mb-3" />
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          <div className="bg-card rounded-2xl shadow-2xl p-6">
            {mode === 'phone-code' && (
              <button
                type="button"
                onClick={() => { setMode('phone'); setError(null); }}
                className="flex items-center gap-1.5 text-gray-500 hover:text-foreground text-sm mb-4"
              >
                <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                {t('back')}
              </button>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{error}</div>}

              {/* PHONE: country prefix + number */}
              {mode === 'phone' && (
                <div>
                  <label className="block text-foreground text-sm mb-2">{t('phoneNumber')}</label>
                  <div className="flex gap-2" dir="ltr">
                    <button
                      type="button"
                      onClick={() => setShowCountries(true)}
                      className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-foreground hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <span className="text-lg leading-none">{country.flag}</span>
                      <span className="text-sm tabular-nums">{country.dial}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="relative flex-1">
                      <Smartphone className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('phonePlaceholder')}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-foreground tracking-wide focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">{t('phonePasswordlessHint')}</p>
                </div>
              )}

              {/* PHONE: enter code */}
              {mode === 'phone-code' && (
                <div>
                  <label className="block text-foreground text-sm mb-2">{t('smsCode')}</label>
                  <div className="relative">
                    <KeyRound className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="- - - - - -"
                      maxLength={6}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-foreground text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-gray-500" dir="ltr">{t('codeSentTo', { phone: sentPhone })}</span>
                    <button type="button" className="text-yellow-600" onClick={resend} disabled={loading}>{t('resendCode')}</button>
                  </div>
                </div>
              )}

              <Button type="submit" variant="brand" size="block" loading={loading}>
                {submitLabel}
              </Button>
            </form>
          </div>

          {/* Build info. The API host is shown while in beta: a device build that
              silently points at the wrong host is otherwise undebuggable. */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-xs">
              <span className="tabular-nums" dir="ltr">v{APP_VERSION}</span>
              {APP_IS_BETA && <span className="ml-1 text-tint-fg/80 font-semibold">· {t('beta')}</span>}
            </p>
            {APP_IS_BETA && (
              <p className="mt-0.5 text-tint-fg/40 text-[10px] truncate" dir="ltr">{apiHost}</p>
            )}
          </div>
        </div>
      </div>

      <SearchSelect<Country>
        open={showCountries}
        onClose={() => setShowCountries(false)}
        title={t('selectCountry')}
        placeholder={t('searchCountry')}
        source={{
          items: COUNTRIES,
          match: (c, q) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q),
        }}
        keyOf={(c) => c.code}
        onSelect={setCountry}
        renderItem={(c) => (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-xl leading-none">{c.flag}</span>
            <span className="flex-1 text-foreground">{c.name}</span>
            <span className="text-gray-400 tabular-nums" dir="ltr">{c.dial}</span>
          </div>
        )}
      />
    </div>
  );
}

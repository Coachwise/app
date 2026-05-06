import { useEffect, useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Dumbbell, Globe, KeyRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as AuthAPI from '../api/auth';

interface AuthProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'register' | 'otp' | 'forgot' | 'reset';

export function Auth({ onLogin }: AuthProps) {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { login, setTokens } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<'unknown' | 'checking' | 'ok' | 'email_exists' | 'username_exists'>('unknown');
  const [forgotFlow, setForgotFlow] = useState(false);
  const [resetTokens, setResetTokens] = useState<{ access_token: string; refresh_token: string; token: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    otpCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'email' || name === 'username') {
      setAvailability('unknown');
    }
  };

  // Auto-check availability for email/username after user stops typing (register mode)
  useEffect(() => {
    if (mode !== 'register') return;
    if (!formData.email && !formData.username) return;

    const handle = setTimeout(async () => {
      try {
        setAvailability('checking');
        const pre = await AuthAPI.preRegister({
          email: formData.email,
          username: formData.username,
        });
        if (pre.email === 'EXISTS') {
          setAvailability('email_exists');
          return;
        }
        if (pre.username === 'EXISTS') {
          setAvailability('username_exists');
          return;
        }
        setAvailability('ok');
      } catch {
        setAvailability('unknown');
      }
    }, 400);

    return () => clearTimeout(handle);
  }, [formData.email, formData.username, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ email: formData.email, password: formData.password });
        onLogin();
        return;
      }

      if (mode === 'register') {
        if (!formData.username.trim()) {
          throw new Error('Username is required');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        // Ensure availability check
        if (availability !== 'ok') {
          const pre = await AuthAPI.preRegister({
            email: formData.email,
            username: formData.username,
          });
          if (pre.email === 'EXISTS') {
            setAvailability('email_exists');
            throw new Error('Email already exists');
          }
          if (pre.username === 'EXISTS') {
            setAvailability('username_exists');
            throw new Error('Username already exists');
          }
          setAvailability('ok');
        }
        await AuthAPI.register({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          first_name: formData.fullName.split(' ')[0] || formData.fullName,
          last_name: formData.fullName.split(' ').slice(1).join(' ') || undefined,
        });
        setMode('otp');
        return;
      }

      if (mode === 'forgot') {
        await AuthAPI.forgotPassword({ email: formData.email });
        setMode('otp');
        return;
      }

      if (mode === 'reset') {
        if (formData.password.length < 8) throw new Error('Password must be at least 8 characters');
        if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
        if (!resetTokens) throw new Error('Session expired, please start over');
        await AuthAPI.changePassword(resetTokens.access_token, { password: formData.password });
        setTokens(resetTokens);
        onLogin();
        return;
      }

      // OTP verify (used for both registration and forgot password flows)
      if (!formData.otpCode || formData.otpCode.length < 6) {
        throw new Error('Enter the 6-digit code');
      }
      const tokens = await AuthAPI.verifyOtp({
        email: formData.email,
        code: formData.otpCode,
      });
      if (forgotFlow) {
        setResetTokens(tokens);
        setMode('reset');
        return;
      }
      setTokens(tokens);
      onLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await AuthAPI.sendOtp({ email: formData.email });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to resend code';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E0E55] to-[#1A1A6E] flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowLanguageSelector(!showLanguageSelector)}
          className="p-3 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-colors"
        >
          <Globe className="w-5 h-5 text-white" />
        </button>

        {showLanguageSelector && (
          <div className="absolute top-14 right-0 bg-white rounded-lg shadow-xl p-2 min-w-[140px]">
            <button
              onClick={() => {
                setLanguage('en');
                setShowLanguageSelector(false);
              }}
              className={`w-full text-left px-3 py-2 rounded transition-colors ${
                language === 'en' ? 'bg-yellow-500 text-[#0E0E55]' : 'hover:bg-gray-100 text-[#0E0E55]'
              }`}
            >
              {t('english')}
            </button>
            <button
              onClick={() => {
                setLanguage('fa');
                setShowLanguageSelector(false);
              }}
              className={`w-full text-left px-3 py-2 rounded transition-colors ${
                language === 'fa' ? 'bg-yellow-500 text-[#0E0E55]' : 'hover:bg-gray-100 text-[#0E0E55]'
              }`}
            >
              {t('persian')}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-2xl mb-4">
              <Dumbbell className="w-8 h-8 text-[#0E0E55]" />
            </div>
            <h1 className="text-white text-3xl mb-2">Coachwise</h1>
            <p className="text-white/80">
              {mode === 'login' ? t('loginToAccount') : mode === 'register' ? t('createYourAccount') : mode === 'forgot' ? 'Reset your password' : mode === 'reset' ? 'Set new password' : 'Verify your email'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6">
            {mode !== 'otp' && mode !== 'forgot' && mode !== 'reset' && (
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-[#0E0E55] text-white'
                      : 'text-gray-600 hover:text-[#0E0E55]'
                  }`}
                >
                  {t('login')}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    mode === 'register'
                      ? 'bg-[#0E0E55] text-white'
                      : 'text-gray-600 hover:text-[#0E0E55]'
                  }`}
                >
                  {t('register')}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
              {mode === 'register' && availability === 'email_exists' && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                  Email already exists. Try another.
                </div>
              )}
              {mode === 'register' && availability === 'username_exists' && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                  Username already exists. Try another.
                </div>
              )}

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[#0E0E55] text-sm mb-2">
                      {t('fullName')}
                    </label>
                    <div className="relative">
                      <User className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder={t('fullNamePlaceholder')}
                        className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-[#0E0E55] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#0E0E55] text-sm mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <User className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="your_username"
                        className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-[#0E0E55] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {mode !== 'reset' && (
                <div>
                  <label className="block text-[#0E0E55] text-sm mb-2">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('emailPlaceholder')}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-[#0E0E55] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                      required={mode !== 'otp'}
                    />
                  </div>
                </div>
              )}

              {mode !== 'otp' && mode !== 'forgot' && mode !== 'reset' && (
                <>
                  <div>
                    <label className="block text-[#0E0E55] text-sm mb-2">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={t('passwordPlaceholder')}
                        className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-3 ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} text-[#0E0E55] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-gray-400 hover:text-[#0E0E55]`}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label className="block text-[#0E0E55] text-sm mb-2">
                        {t('confirmPassword')}
                      </label>
                      <div className="relative">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder={t('passwordPlaceholder')}
                          className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-3 ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} text-[#0E0E55] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-gray-400 hover:text-[#0E0E55]`}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {mode === 'otp' && (
                <div>
                  <label className="block text-[#0E0E55] text-sm mb-2">
                    Enter OTP sent to your email
                  </label>
                  <div className="relative">
                    <KeyRound className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                    <input
                      type="text"
                      name="otpCode"
                      value={formData.otpCode}
                      onChange={handleChange}
                      placeholder="123456"
                      maxLength={6}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-[#0E0E55] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                    <span>We emailed a 6-digit code to {formData.email || 'your email'}.</span>
                    <button type="button" className="text-yellow-600" onClick={handleResendOTP} disabled={loading}>
                      Resend
                    </button>
                  </div>
                </div>
              )}

              {mode === 'reset' && (
                <>
                  <div>
                    <label className="block text-[#0E0E55] text-sm mb-2">New password</label>
                    <div className="relative">
                      <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 8 characters"
                        className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-3 ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} text-[#0E0E55] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-gray-400 hover:text-[#0E0E55]`}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#0E0E55] text-sm mb-2">Confirm new password</label>
                    <div className="relative">
                      <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repeat new password"
                        className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-3 ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} text-[#0E0E55] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-gray-400 hover:text-[#0E0E55]`}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <span className="text-sm text-gray-600">{t('rememberMe')}</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-yellow-600 hover:text-yellow-700"
                    onClick={() => { setForgotFlow(true); setMode('forgot'); setError(null); }}
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
              )}

              {mode === 'register' && (
                <div className="text-xs text-gray-600 text-center">
                  {t('byCreatingAccount')}{' '}
                  <button type="button" className="text-yellow-600 hover:text-yellow-700">
                    {t('termsOfService')}
                  </button>{' '}
                  {t('and')}{' '}
                  <button type="button" className="text-yellow-600 hover:text-yellow-700">
                    {t('privacyPolicy')}
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-yellow-500 text-[#0E0E55] py-3 rounded-lg hover:bg-yellow-400 transition-colors shadow-md disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? t('login')
                    : mode === 'register'
                      ? t('createAccount')
                      : mode === 'forgot'
                        ? 'Send reset code'
                        : mode === 'reset'
                          ? 'Set new password'
                          : 'Verify & Continue'}
              </button>
            </form>
          </div>

          {mode !== 'otp' && mode !== 'forgot' && mode !== 'reset' && (
            <div className="text-center text-white/80 mt-6">
              <p>
                {mode === 'login' ? t('dontHaveAccount') : t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  className="text-yellow-300 hover:text-yellow-200 font-semibold"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                >
                  {mode === 'login' ? t('signUp') : t('signIn')}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

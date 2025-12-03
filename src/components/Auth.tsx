import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Dumbbell, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'register';

export function Auth({ onLogin }: AuthProps) {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real app, this would call an API
    onLogin();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E0E55] to-[#1A1A6E] flex flex-col">
      {/* Language Selector Button */}
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
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-2xl mb-4">
              <Dumbbell className="w-8 h-8 text-[#0E0E55]" />
            </div>
            <h1 className="text-white text-3xl mb-2">Coachwise</h1>
            <p className="text-white/80">
              {mode === 'login' ? t('loginToAccount') : t('createYourAccount')}
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name - Register Only */}
              {mode === 'register' && (
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
              )}

              {/* Email */}
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
                    required
                  />
                </div>
              </div>

              {/* Password */}
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

              {/* Confirm Password - Register Only */}
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

              {/* Remember Me & Forgot Password - Login Only */}
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
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
              )}

              {/* Terms - Register Only */}
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

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-yellow-500 text-[#0E0E55] py-3 rounded-lg hover:bg-yellow-400 transition-colors shadow-md"
              >
                {mode === 'login' ? t('login') : t('createAccount')}
              </button>
            </form>
          </div>

          {/* Footer Text */}
          <p className="text-center text-white/80 text-sm mt-6">
            {mode === 'login' ? t('dontHaveAccount') : t('alreadyHaveAccount')}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-yellow-500 hover:text-yellow-400"
            >
              {mode === 'login' ? t('signUp') : t('signIn')}
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-white/60 text-xs">
        <p>Coachwise v1.0.0</p>
      </div>
    </div>
  );
}

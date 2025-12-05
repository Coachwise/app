import { useState } from 'react';
import { Menu, X, Bell, Shield, LogOut, Settings, Users, DollarSign, Globe, User, Crown } from 'lucide-react';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../translations';

interface HamburgerMenuProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  userName?: string;
  userAvatar?: string;
  userUsername?: string;
  isPro?: boolean;
}

export function HamburgerMenu({ 
  userRole, 
  onNavigate,
  userName = 'Jordan Smith',
  userAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  userUsername = '@jordansmith',
  isPro = false
}: HamburgerMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  return (
    <>
      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="bg-[#0E0E55] px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg">{t('menu')}</h2>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-[#1A1A6E] rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            {/* User Info in Menu */}
            <button 
              onClick={() => {
                onNavigate('profile');
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full hover:bg-[#1A1A6E] p-2 rounded-lg transition-colors"
            >
              <img 
                src={userAvatar} 
                alt={userName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
              <div className="text-left">
                <p className="text-white font-medium">{userName}</p>
                <p className="text-gray-300 text-sm">{userUsername}</p>
              </div>
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Pro Status Display */}
              {isPro ? (
                // Show Pro Badge for Pro Users
                <>
                  <div className="w-full p-4 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-xl border-2 border-yellow-600 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#0E0E55] rounded-full p-2">
                        <Crown className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[#0E0E55] font-bold text-lg">{t('proMember')}</div>
                        <div className="text-[#0E0E55]/70 text-xs">{t('allFeaturesUnlocked')}</div>
                      </div>
                      <div className="bg-[#0E0E55] text-yellow-500 px-3 py-1 rounded-full text-xs font-semibold">
                        {t('activeStatus')}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              ) : (
                // Show Become Pro Button for Free Users
                <>
                  <button 
                    onClick={() => {
                      onNavigate('pro-subscription');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-500 to-yellow-400 text-[#0E0E55] rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-lg border-2 border-yellow-600"
                  >
                    <div className="bg-[#0E0E55] rounded-lg p-1.5">
                      <Crown className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold block">{t('becomePro')}</span>
                      <span className="text-xs text-[#0E0E55]/70">Unlock all features</span>
                    </div>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* Coach-specific actions */}
              {userRole === 'coach' && (
                <>
                  <button 
                    onClick={() => {
                      onNavigate('coach-dashboard');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>{t('dashboard')}</span>
                  </button>
                  <button 
                    onClick={() => {
                      onNavigate('tier-builder');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <span className="text-[#0E0E55]">{t('createSubscriptionTier')}</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* Athlete-specific action - SUBTLE STYLE */}
              {userRole !== 'coach' && (
                <>
                  <button 
                    onClick={() => {
                      onNavigate('coach-application');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 border-2 border-gray-300 text-[#0E0E55] rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>{t('becomeACoach')}</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* Common actions */}
              <button 
                onClick={() => {
                  onNavigate('athlete-search');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">{t('athletesAndCoaches')}</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">{t('notifications')}</span>
              </button>

              <button 
                onClick={() => {
                  onNavigate('privacy-settings');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">{t('privacySecurity')}</span>
              </button>

              {/* Language Selector */}
              <button 
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Globe className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55] flex-1">{t('language')}</span>
                <span className="text-gray-500 text-sm">{language === 'en' ? 'EN' : 'فا'}</span>
              </button>

              {showLanguageSelector && (
                <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setShowLanguageSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      language === 'en' ? 'bg-yellow-500 text-[#0E0E55]' : 'hover:bg-gray-200 text-[#0E0E55]'
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
                      language === 'fa' ? 'bg-yellow-500 text-[#0E0E55]' : 'hover:bg-gray-200 text-[#0E0E55]'
                    }`}
                  >
                    {t('persian')}
                  </button>
                </div>
              )}

              <div className="border-t border-gray-200 my-2"></div>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                <LogOut className="w-5 h-5" />
                <span>{t('logOut')}</span>
              </button>
            </div>
          </div>

          {/* Menu Footer */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-gray-600 text-xs text-center">Coachwise v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Hamburger Button */}
      <button 
        onClick={() => setIsMenuOpen(true)}
        className="p-2 hover:bg-[#1A1A6E] rounded-lg transition-colors"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>
    </>
  );
}
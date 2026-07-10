import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, X, Bell, Shield, LogOut, Settings, Users, DollarSign, Globe, User, Crown, Coins, ClipboardList } from 'lucide-react';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../translations';
import { ENTBalanceWidget } from './ENTBalanceWidget';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeRefetch } from '../contexts/RealtimeContext';
import { NotificationsAPI } from '../api';
import { FEATURES } from '../config';

interface HamburgerMenuProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  userName?: string;
  userAvatar?: string | null;
  userUsername?: string;
  isPro?: boolean;
}

export function HamburgerMenu({ 
  userRole, 
  onNavigate,
  userName,
  userAvatar = null,
  userUsername,
  isPro
}: HamburgerMenuProps) {
  const { user, logout, tokens } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [unread, setUnread] = useState(0);

  // Unread count for the bell badge. Fetched on mount and refreshed live by the
  // realtime "notifications" refetch signal — no polling.
  const fetchUnread = useCallback(() => {
    const token = tokens?.access_token;
    if (!token) return;
    NotificationsAPI.unreadCount(token).then((r) => setUnread(r.count)).catch(() => {});
  }, [tokens?.access_token]);
  useEffect(() => { fetchUnread(); }, [fetchUnread]);
  useRealtimeRefetch('notifications', fetchUnread);

  const openNotifications = () => { onNavigate('notifications'); setIsMenuOpen(false); };

  const displayName = useMemo(() => {
    if (userName && userName.trim()) return userName.trim();
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    return 'User';
  }, [userName, user]);

  const displayHandle = useMemo(() => {
    if (userUsername) return userUsername;
    if (user?.username) return `@${user.username}`;
    return '';
  }, [userUsername, user]);

  const avatarUrl = userAvatar || user?.avatar?.url || null;
  const proStatus = isPro ?? Boolean(user?.pro);

  const initials = useMemo(() => {
    if (displayName && displayName.trim()) {
      const parts = displayName.trim().split(' ');
      const first = parts[0]?.[0] ?? '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
      const combined = `${first}${last}`.trim();
      return (combined || 'U').toUpperCase();
    }
    return 'U';
  }, [userName]);

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
          <div className="bg-navy px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg">{t('menu')}</h2>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-navy-light rounded-lg transition-colors"
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
              className="flex items-center gap-3 w-full hover:bg-navy-light p-2 rounded-lg transition-colors"
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-white font-bold">
                  {initials}
                </div>
              )}
              <div className="text-left">
                <p className="text-white font-medium">{displayName}</p>
                <p className="text-gray-300 text-sm">{displayHandle}</p>
              </div>
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Pro Status Display */}
              {proStatus ? (
                // Show Pro Badge for Pro Users
                <>
                  <div className="w-full p-4 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-xl border-2 border-yellow-600 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-navy rounded-full p-2">
                        <Crown className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-navy font-bold text-lg">{t('proMember')}</div>
                        <div className="text-navy/70 text-xs">{t('allFeaturesUnlocked')}</div>
                      </div>
                      <div className="bg-navy text-yellow-500 px-3 py-1 rounded-full text-xs font-semibold">
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
                    className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-500 to-yellow-400 text-navy rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-lg border-2 border-yellow-600"
                  >
                    <div className="bg-navy rounded-lg p-1.5">
                      <Crown className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold block">{t('becomePro')}</span>
                      <span className="text-xs text-navy/70">{t('unlockAllFeatures')}</span>
                    </div>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* ENT Balance Widget (SPARK) — hidden for first release */}
              {FEATURES.spark && (
                <>
                  <ENTBalanceWidget
                    availableBalance={7.0}
                    pendingBalance={5.5}
                    onNavigate={(view) => {
                      onNavigate(view);
                      setIsMenuOpen(false);
                    }}
                    compact={true}
                  />
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
                    className="w-full flex items-center gap-3 p-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors"
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
                    <span className="text-navy">{t('createSubscriptionTier')}</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* Athlete-specific action - SUBTLE STYLE */}
              {userRole !== 'coach' && (
                <>
                  <button
                    onClick={() => {
                      onNavigate('athlete-tests');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <ClipboardList className="w-5 h-5 text-gray-600" />
                    <span className="text-navy">{t('myAssessments')}</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('coach-application');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 border-2 border-gray-300 text-navy rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>{t('becomeACoach')}</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* General actions for all users */}
              <button
                onClick={openNotifications}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-navy flex-1">{t('notifications')}</span>
                {unread > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-yellow-500 text-navy text-xs font-bold rounded-full tabular-nums">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onNavigate('wallet');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <DollarSign className="w-5 h-5 text-gray-600" />
                <span className="text-navy">{t('wallet')}</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('privacy-settings');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="text-navy">{t('privacySecurity')}</span>
              </button>

              {/* Language Selector */}
              <button 
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <Globe className="w-5 h-5 text-gray-600" />
                <span className="text-navy flex-1">{t('language')}</span>
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
                      language === 'en' ? 'bg-yellow-500 text-navy' : 'hover:bg-gray-200 text-navy'
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
                      language === 'fa' ? 'bg-yellow-500 text-navy' : 'hover:bg-gray-200 text-navy'
                    }`}
                  >
                    {t('persian')}
                  </button>
                </div>
              )}

              <div className="border-t border-gray-200 my-2"></div>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600 text-left"
              >
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

      {/* Bell + Hamburger triggers */}
      <div className="flex items-center gap-1">
        <button
          onClick={openNotifications}
          aria-label={t('notifications')}
          className="relative p-2 hover:bg-navy-light rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6 text-white" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-yellow-500 text-navy text-[10px] font-bold rounded-full tabular-nums">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 hover:bg-navy-light rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>
    </>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, Shield, LogOut, Settings, Users, DollarSign, Globe, User, Crown, Coins, ClipboardList, Info, LifeBuoy, Sun, Moon, Palette, Activity, ChevronDown } from 'lucide-react';
import { AiRobot } from './ui/ai-robot';
import { getTheme, setTheme } from '../lib/theme';
import { APP_VERSION, APP_IS_BETA } from '../config';
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
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setThemePref] = useState(getTheme());
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
      {/* Overlay + slide-out drawer are portaled to <body> so they escape any
          stacking context created by the header they're triggered from (the
          Workouts header is `position: sticky`, which forms its own stacking
          context — without the portal a low z-index page element like the
          rest-day icon can paint over the open menu). */}
      {createPortal(
        <>
          {/* Hamburger Menu Overlay */}
          {isMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
      )}

      {/* Slide-out Menu — opens from the same edge the trigger sits on, which
          follows the global language direction (right in LTR, left in RTL). */}
      <div
        className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-80 bg-card shadow-2xl z-50 transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : isRTL ? '-translate-x-full' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="bg-card border-b border-border px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-foreground text-lg">{t('menu')}</h2>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-tint-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
            </div>
            {/* User Info in Menu */}
            <button 
              onClick={() => {
                onNavigate('profile');
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full hover:bg-tint-2 p-2 rounded-lg transition-colors"
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-tint-fg/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-tint-soft border-2 border-tint/20 flex items-center justify-center text-tint-ink font-bold">
                  {initials}
                </div>
              )}
              <div className="text-left">
                <p className="text-foreground font-medium">{displayName}</p>
                <p className="text-muted-foreground text-sm">{displayHandle}</p>
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
                      <div className="bg-tint rounded-full p-2">
                        <Crown className="w-6 h-6 text-tint-ink" />
                      </div>
                      <div className="flex-1">
                        <div className="text-foreground font-bold text-lg">{t('proMember')}</div>
                        <div className="text-foreground/70 text-xs">{t('allFeaturesUnlocked')}</div>
                      </div>
                      <div className="bg-tint text-tint-fg px-3 py-1 rounded-full text-xs font-semibold">
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
                    className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-500 to-yellow-400 text-foreground rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-lg border-2 border-yellow-600"
                  >
                    <div className="bg-tint rounded-lg p-1.5">
                      <Crown className="w-5 h-5 text-tint-ink" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold block">{t('becomePro')}</span>
                      <span className="text-xs text-foreground/70">{t('unlockAllFeatures')}</span>
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
                    className="w-full flex items-center gap-3 p-3 bg-tint text-tint-fg rounded-lg hover:bg-tint-2 transition-colors"
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
                    <span className="text-foreground">{t('createSubscriptionTier')}</span>
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
                    <span className="text-foreground">{t('myAssessments')}</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('coach-application');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 border-2 border-gray-300 text-foreground rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>{t('becomeACoach')}</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* General actions for all users */}
              {/* My Training Analytics — personal workout analytics for BOTH roles;
                  lives here (not the bottom nav) so a coach's own training stays
                  separate from their coaching/business dashboard. */}
              <button
                onClick={() => {
                  onNavigate('analytics');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <Activity className="w-5 h-5 text-gray-600" />
                <span className="text-foreground">{t('myTrainingAnalytics')}</span>
              </button>

              <button
                onClick={openNotifications}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-foreground flex-1 text-start">{t('notifications')}</span>
                {unread > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-yellow-500 text-foreground text-xs font-bold rounded-full tabular-nums">
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
                <span className="text-foreground">{t('wallet')}</span>
              </button>

              {/* Settings — collapsible group holding privacy, language & appearance */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                aria-expanded={showSettings}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground flex-1 text-start">{t('settings')}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>

              {showSettings && (
                <div className="ps-3 space-y-1">
                  {/* Privacy & Security */}
                  <button
                    onClick={() => {
                      onNavigate('privacy-settings');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                  >
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{t('privacySecurity')}</span>
                  </button>

                  {/* Language */}
                  <button
                    onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                  >
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground flex-1 text-start">{t('language')}</span>
                    <span className="text-muted-foreground text-sm">{language === 'en' ? 'EN' : 'فا'}</span>
                  </button>

                  {showLanguageSelector && (
                    <div className="bg-muted rounded-lg p-2 space-y-1">
                      <button
                        onClick={() => {
                          setLanguage('en');
                          setShowLanguageSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded transition-colors ${
                          language === 'en' ? 'bg-tint text-tint-fg' : 'hover:bg-secondary text-foreground'
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
                          language === 'fa' ? 'bg-tint text-tint-fg' : 'hover:bg-secondary text-foreground'
                        }`}
                      >
                        {t('persian')}
                      </button>
                    </div>
                  )}

                  {/* Appearance — colour mode + accent */}
                  <div className="p-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Palette className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground flex-1 text-start">{t('appearance')}</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {([['light', t('themeLight'), Sun], ['dark', t('themeDark'), Moon]] as const).map(([m, label, Ic]) => (
                        <button
                          key={m}
                          onClick={() => setThemePref(setTheme({ mode: m }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            theme.mode === m ? 'bg-tint text-tint-fg border-tint' : 'bg-card text-muted-foreground border-border'
                          }`}
                        >
                          <Ic className="w-4 h-4" />{label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {([['azure', '#0097e6', 'Azure'], ['pink', '#fda7df', 'Pink']] as const).map(([a, color, label]) => (
                        <button
                          key={a}
                          onClick={() => setThemePref(setTheme({ accent: a }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            theme.accent === a ? 'border-tint bg-tint-soft text-tint-ink' : 'bg-card text-muted-foreground border-border'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full" style={{ background: color }} />{label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Support */}
              <button
                onClick={() => {
                  onNavigate('support');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
              >
                <LifeBuoy className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">{t('support')}</span>
              </button>

              <div className="border-t border-gray-200 my-2"></div>

              <button
                onClick={() => { onNavigate('about'); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors text-foreground text-left"
              >
                <Info className="w-5 h-5" />
                <span>{t('about')}</span>
              </button>

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
          <button
            onClick={() => { onNavigate('about'); setIsMenuOpen(false); }}
            className="p-4 border-t border-gray-200 w-full text-center hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-600 text-xs">
              Coachwise <span className="tabular-nums" dir="ltr">v{APP_VERSION}</span>
              {APP_IS_BETA && <span className="ml-1 text-yellow-600 font-semibold">· {t('beta')}</span>}
            </span>
          </button>
        </div>
      </div>
        </>,
        document.body,
      )}

      {/* Beta flag + AI + Bell + Hamburger triggers */}
      <div className="flex items-center gap-1">
        {APP_IS_BETA && (
          <span className="mr-1 px-1.5 py-0.5 rounded bg-yellow-500 text-foreground text-[10px] font-bold tracking-wide leading-none">
            {t('beta')}
          </span>
        )}
        {FEATURES.ai && (
          <button
            onClick={() => onNavigate('ai-assistant')}
            aria-label={t('aiAssistant')}
            className="p-1.5 hover:bg-tint-2 rounded-lg transition-colors text-primary"
          >
            <AiRobot className="h-7 w-auto" />
          </button>
        )}
        <button
          onClick={openNotifications}
          aria-label={t('notifications')}
          className="relative p-2 hover:bg-tint-2 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6 text-foreground" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-yellow-500 text-foreground text-[10px] font-bold rounded-full tabular-nums">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <button
          onClick={() => setIsMenuOpen(true)}
          aria-label={t('menu')}
          className="rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tint"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover border border-border"
            />
          ) : (
            <span className="w-9 h-9 rounded-full bg-tint-soft border border-tint/20 flex items-center justify-center text-tint-ink text-sm font-bold">
              {initials}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, UserPlus, Clock, Check, X, ArrowLeft, ArrowRight, MessageCircle, Package, Users, Globe, Instagram } from 'lucide-react';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { HamburgerMenu } from './HamburgerMenu';
import { ProBadge } from './ProBadge';
import { UserAvatar } from './UserAvatar';
import { TrophyCase } from './TrophyCase';
import { useAuth } from '../contexts/AuthContext';
import * as UsersAPI from '../api/users';
import * as ConnectionsAPI from '../api/connections';
import * as PackagesAPI from '../api/packages';
import * as AchievementsAPI from '../api/achievements';
import type { User, CoachPackage, UserAchievements } from '../api/types';
import { PurchaseSheet } from './PurchaseSheet';
import { formatMoney } from '../lib/money';
import { toast } from 'sonner';

interface ProfileProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  onBack?: () => void;
  onMessage?: (peerId: string) => void;
  viewingUserId?: string | null;
  onViewProfile?: (userId: string) => void;
  onPackagePurchased?: () => void;
  isPro?: boolean;
}

export function Profile({ userRole, onNavigate, onBack, onMessage, viewingUserId = null, onPackagePurchased, isPro = false }: ProfileProps) {
  const { user, tokens, refreshUser } = useAuth();
  const { t, isRTL, language } = useLanguage();

  // Determine if viewing own profile
  const isOwnProfile = viewingUserId === null;

  // Connection state + fetched profile for the viewed (other) user.
  const [connStatus, setConnStatus] = useState<string>('none');
  const [connBusy, setConnBusy] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [viewedLoading, setViewedLoading] = useState(false);
  // Id of the pending request this user sent us (so we can accept/reject here).
  const [incomingReqId, setIncomingReqId] = useState<string | null>(null);
  // Coach's offered packages (when viewing a coach) + which the viewer is subscribed to.
  const [coachPackages, setCoachPackages] = useState<CoachPackage[]>([]);
  const [subscribedPackageIds, setSubscribedPackageIds] = useState<Set<string>>(new Set());
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [purchasePkg, setPurchasePkg] = useState<CoachPackage | null>(null);
  const [achievements, setAchievements] = useState<UserAchievements | null>(null);

  useEffect(() => {
    const token = tokens?.access_token;
    if (isOwnProfile || !token || !viewingUserId) return;
    let cancelled = false;
    setViewedLoading(true);
    setViewedUser(null);
    setIncomingReqId(null);
    UsersAPI.getUser(token, viewingUserId)
      .then((u) => {
        if (cancelled) return;
        setViewedUser(u);
        setConnStatus(u.connection_status ?? 'none');
        // If they've requested us, look up the request id to enable accept/reject.
        if (u.connection_status === 'pending_incoming') {
          ConnectionsAPI.listRequests(token, { status: 'PENDING', limit: 100 })
            .then((r) => {
              if (cancelled) return;
              const match = r.items.find((it) => it.user?.id === viewingUserId);
              setIncomingReqId(match?.id ?? null);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setViewedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, viewingUserId, tokens?.access_token]);

  // When viewing a coach, load their active packages + which ones the viewer is subscribed to.
  useEffect(() => {
    const token = tokens?.access_token;
    if (isOwnProfile || !token || !viewingUserId || !viewedUser?.is_coach) {
      setCoachPackages([]);
      setSubscribedPackageIds(new Set());
      return;
    }
    let cancelled = false;
    Promise.all([
      PackagesAPI.listCoachPackages(token, viewingUserId),
      PackagesAPI.mySubscriptions(token),
    ])
      .then(([pkgs, subs]) => {
        if (cancelled) return;
        setCoachPackages(pkgs.items);
        setSubscribedPackageIds(new Set(subs.items.map((s) => s.package_id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, viewingUserId, viewedUser?.is_coach, tokens?.access_token]);

  // Load the profile owner's achievements (PRs + coach-granted badges).
  useEffect(() => {
    const token = tokens?.access_token;
    const profileId = isOwnProfile ? user?.id : viewingUserId;
    if (!token || !profileId) {
      setAchievements(null);
      return;
    }
    let cancelled = false;
    AchievementsAPI.getUserAchievements(token, profileId)
      .then((a) => { if (!cancelled) setAchievements(a); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isOwnProfile, viewingUserId, user?.id, tokens?.access_token]);

  const handleAcceptIncoming = async () => {
    const token = tokens?.access_token;
    if (!token || !incomingReqId) return;
    setConnBusy(true);
    const prev = connStatus;
    setConnStatus('connected');
    try {
      await ConnectionsAPI.acceptRequest(token, incomingReqId);
    } catch {
      setConnStatus(prev);
    } finally {
      setConnBusy(false);
    }
  };

  const handleRejectIncoming = async () => {
    const token = tokens?.access_token;
    if (!token || !incomingReqId) return;
    setConnBusy(true);
    const prev = connStatus;
    setConnStatus('none');
    try {
      await ConnectionsAPI.rejectRequest(token, incomingReqId);
    } catch {
      setConnStatus(prev);
    } finally {
      setConnBusy(false);
    }
  };

  const handleConnect = async () => {
    const token = tokens?.access_token;
    if (!token || !viewingUserId) return;
    setConnBusy(true);
    const prev = connStatus;
    setConnStatus('pending_outgoing');
    try {
      await ConnectionsAPI.sendConnect(token, viewingUserId);
    } catch {
      setConnStatus(prev);
    } finally {
      setConnBusy(false);
    }
  };

  const handleCancelConnect = async () => {
    const token = tokens?.access_token;
    if (!token || !viewingUserId) return;
    setConnBusy(true);
    const prev = connStatus;
    setConnStatus('none');
    try {
      await ConnectionsAPI.cancelConnect(token, viewingUserId);
    } catch {
      setConnStatus(prev);
    } finally {
      setConnBusy(false);
    }
  };

  const hasCoachSubscription = coachPackages.some((p) => subscribedPackageIds.has(p.id));

  const subscribe = async (pkgId: string) => {
    const token = tokens?.access_token;
    if (!token || subscribingId) return;
    setSubscribingId(pkgId);
    try {
      await PackagesAPI.subscribePackage(token, pkgId);
      setSubscribedPackageIds((prev) => new Set(prev).add(pkgId));
      toast.success(t('subscribed'));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubscribingId(null);
    }
  };

  // Coach status: own profile from the authed user, other profiles from the fetched user.
  const isCoachProfile = isOwnProfile ? Boolean(user?.is_coach) : Boolean(viewedUser?.is_coach);
  const proStatus = isOwnProfile && (isPro || Boolean(user?.pro));

  const displayName = useMemo(() => {
    if (isOwnProfile) {
      return user?.first_name || user?.username || 'User';
    }
    if (viewedUser) {
      const full = `${viewedUser.first_name ?? ''} ${viewedUser.last_name ?? ''}`.trim();
      return full || viewedUser.username;
    }
    return '';
  }, [isOwnProfile, user, viewedUser]);

  const displayHandle = useMemo(() => {
    if (isOwnProfile) {
      return user ? `@${user.username}` : '';
    }
    return viewedUser ? `@${viewedUser.username}` : '';
  }, [isOwnProfile, user, viewedUser]);

  const avatarUrl = isOwnProfile ? (user?.avatar?.url ?? null) : (viewedUser?.avatar?.url ?? null);
  const profileData = isOwnProfile ? user : viewedUser;
  const jobTitle = profileData?.job_title;
  const bio = profileData?.bio;
  const website = profileData?.website;
  const instagram = profileData?.instagram;

  // Connection action button for other users' profiles.
  const connectionButton = connStatus === 'connected' ? (
    <button
      onClick={() => viewingUserId && onMessage?.(viewingUserId)}
      className="w-full py-3 rounded-lg bg-[#0E0E55] text-white hover:bg-[#1A1A6E] transition-colors flex items-center justify-center gap-2"
    >
      <MessageCircle className="w-5 h-5" />
      <span>{t('message')}</span>
    </button>
  ) : connStatus === 'pending_outgoing' ? (
    <button
      onClick={handleCancelConnect}
      disabled={connBusy}
      className="w-full py-3 rounded-lg bg-gray-200 text-[#0E0E55] hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
    >
      <Clock className="w-5 h-5" />
      <span>{t('requested')}</span>
    </button>
  ) : connStatus === 'pending_incoming' ? (
    <div className="flex gap-2">
      <button
        onClick={handleAcceptIncoming}
        disabled={connBusy || !incomingReqId}
        className="flex-1 py-3 rounded-lg bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Check className="w-5 h-5" />
        <span>{t('accept')}</span>
      </button>
      <button
        onClick={handleRejectIncoming}
        disabled={connBusy || !incomingReqId}
        className="flex-1 py-3 rounded-lg bg-gray-200 text-[#0E0E55] hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <X className="w-5 h-5" />
        <span>{t('reject')}</span>
      </button>
    </div>
  ) : (
    <button
      onClick={handleConnect}
      disabled={connBusy}
      className="w-full py-3 rounded-lg bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
    >
      <UserPlus className="w-5 h-5" />
      <span>{t('connect')}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-br from-[#0E0E55] to-[#1A1A6E]">
        {!isOwnProfile && (
          <button
            onClick={() => (onBack ? onBack() : onNavigate('athlete-search'))}
            className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors`}
            aria-label={t('back')}
          >
            {isRTL ? <ArrowRight className="w-6 h-6 text-white" /> : <ArrowLeft className="w-6 h-6 text-white" />}
          </button>
        )}
        <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
          <HamburgerMenu
            userRole={userRole}
            onNavigate={onNavigate}
            userName={isOwnProfile ? displayName : undefined}
            userAvatar={isOwnProfile ? avatarUrl : undefined}
            userUsername={isOwnProfile ? displayHandle : undefined}
            isPro={proStatus}
          />
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-0 pb-4">
          {/* Avatar */}
          <div className="relative -mt-12 mb-3 w-24">
            <UserAvatar url={avatarUrl} alt={displayName} sizeClass="w-24 h-24" iconClass="w-12 h-12" className="border-4 border-white" />
            {proStatus && <ProBadge size="md" className="absolute top-0 right-0" />}
            {isCoachProfile && (
              <div className={`absolute bottom-0 ${isRTL ? 'left-0' : 'right-0'} bg-yellow-500 rounded-full p-1 border-2 border-white`}>
                <CheckCircle2 className="w-5 h-5 text-[#0E0E55]" />
              </div>
            )}
          </div>

          {/* Name & meta */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[#0E0E55]">{displayName || (viewedLoading ? '…' : t('athlete'))}</h2>
              <span className={`px-2 py-0.5 rounded text-xs ${isCoachProfile ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                {isCoachProfile ? t('coach') : t('athlete')}
              </span>
            </div>
            {displayHandle && <p className="text-gray-600">{displayHandle}</p>}
            {jobTitle && <p className="text-gray-700 mt-2">{jobTitle}</p>}
            {bio && <p className="text-gray-700 mt-2 text-sm whitespace-pre-line">{bio}</p>}
            {(website || instagram) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                {website && (
                  <a href={/^https?:\/\//.test(website) ? website : `https://${website}`} target="_blank" rel="noreferrer" className="text-yellow-600 hover:underline inline-flex items-center gap-1" dir="ltr">
                    <Globe className="w-4 h-4" />
                    {website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {instagram && (
                  <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="text-yellow-600 hover:underline inline-flex items-center gap-1" dir="ltr">
                    <Instagram className="w-4 h-4" />
                    @{instagram}
                  </a>
                )}
              </div>
            )}
          </div>

          {isOwnProfile ? (
            <button
              onClick={() => onNavigate?.('profile-settings')}
              className="w-full bg-yellow-500 text-[#0E0E55] py-3 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {t('editProfile')}
            </button>
          ) : (
            connectionButton
          )}
        </div>
      </div>

      {/* Coaching packages (when viewing a coach) */}
      {!isOwnProfile && isCoachProfile && (
        <div className="p-4">
          <h3 className="text-[#0E0E55] font-medium mb-3">{t('coachPackagesTitle')}</h3>
          {coachPackages.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm">{t('noPackagesOffered')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coachPackages.map((pkg) => {
                const isSubscribed = subscribedPackageIds.has(pkg.id);
                const blocked = !isSubscribed && hasCoachSubscription;
                return (
                  <div key={pkg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="w-10 h-10 rounded-xl bg-[#0E0E55] flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-yellow-400" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[#0E0E55] font-medium truncate">{pkg.name}</h4>
                            {pkg.popular && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px]">{t('popular')}</span>
                            )}
                          </div>
                          {pkg.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{pkg.description}</p>}
                        </div>
                      </div>

                      {/* Price */}
                      {pkg.price_monthly != null && (
                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="text-2xl font-semibold text-[#0E0E55] tabular-nums" dir="ltr">
                            {formatMoney(pkg.price_monthly, pkg.currency, language)}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {pkg.billing_type === 'ONE_TIME' ? t('oneTimeShort') : t('perMoShort')}
                          </span>
                        </div>
                      )}

                      {/* What's included */}
                      <div className="mt-3 space-y-1 text-sm text-gray-700">
                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-600 shrink-0" />{t('plansIncludedCount', { count: String(pkg.plan_count) })}</div>
                        {pkg.video_access && <div className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-600 shrink-0" />{t('videoLibraryAccessShort')}</div>}
                        {pkg.nutrition_guides && <div className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-600 shrink-0" />{t('nutritionGuidesShort')}</div>}
                        {(pkg.custom_features || []).map((f, i) => (
                          <div key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-600 shrink-0" />{f}</div>
                        ))}
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => !isSubscribed && !blocked && setPurchasePkg(pkg)}
                        disabled={isSubscribed || blocked}
                        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          isSubscribed
                            ? 'bg-green-50 text-green-700 cursor-default'
                            : blocked
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400'
                        }`}
                      >
                        {isSubscribed ? (
                          <><CheckCircle2 className="w-4 h-4" />{t('subscribed')}</>
                        ) : blocked ? (
                          t('alreadyHavePackage')
                        ) : pkg.billing_type === 'ONE_TIME' ? (
                          t('buyNow')
                        ) : (
                          t('subscribe')
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Coach credential: active clients */}
      {isCoachProfile && achievements && (
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-br from-[#0E0E55] to-[#1A1A6E] rounded-2xl p-4 flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-yellow-400" />
            </span>
            <div>
              <div className="text-white text-3xl font-semibold tabular-nums leading-none">
                {achievements.active_clients.toLocaleString()}
              </div>
              <div className="text-white/60 text-xs mt-1.5">{t('activeClientsLabel')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements trophy case — records + coach-granted badges, curatable */}
      {achievements && (isOwnProfile || achievements.records.length > 0 || achievements.badges.length > 0) && (
        <TrophyCase
          data={achievements}
          isOwner={isOwnProfile}
          token={tokens?.access_token || ''}
          onLayoutSaved={(layout) => setAchievements((prev) => (prev ? { ...prev, layout } : prev))}
        />
      )}

      <PurchaseSheet
        open={purchasePkg != null}
        onClose={() => setPurchasePkg(null)}
        kind="PACKAGE"
        pkg={purchasePkg ?? undefined}
        onSuccess={async () => {
          if (purchasePkg) setSubscribedPackageIds((prev) => new Set(prev).add(purchasePkg.id));
          toast.success(t('purchaseSuccess'));
          await refreshUser(); // package grants Pro — reflect it in the client
          onPackagePurchased?.();
        }}
      />
    </div>
  );
}

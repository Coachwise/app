import { useCallback, useEffect, useState } from 'react';
import { Bell, UserPlus, CheckCircle2, ClipboardList, Send, Award, Package, Dumbbell, CheckCheck, LifeBuoy } from 'lucide-react';
import { BackButton } from './ui/back-button';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeRefetch } from '../contexts/RealtimeContext';
import { NotificationsAPI } from '../api';
import type { Notification } from '../api/types';
import { UserAvatar } from './UserAvatar';
import { toast } from 'sonner';

interface NotificationsProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
  onViewProfile?: (userId: string) => void;
  onOpenSupport?: (ticketId: string) => void;
}

// Icon + tint per notification type (fallback for actors without an avatar).
const TYPE_META: Record<string, { icon: typeof Bell; cls: string }> = {
  CONNECTION_REQUEST: { icon: UserPlus, cls: 'bg-tint-soft text-tint-ink' },
  CONNECTION_ACCEPTED: { icon: CheckCircle2, cls: 'bg-green-100 text-green-600' },
  ASSESSMENT_ASSIGNED: { icon: ClipboardList, cls: 'bg-yellow-100 text-yellow-700' },
  ASSESSMENT_SUBMITTED: { icon: Send, cls: 'bg-yellow-100 text-yellow-700' },
  BADGE_GRANTED: { icon: Award, cls: 'bg-yellow-100 text-yellow-700' },
  PACKAGE_SUBSCRIBED: { icon: Package, cls: 'bg-tint-soft text-tint-ink' },
  PACKAGE_ASSIGNED: { icon: Package, cls: 'bg-green-100 text-green-600' },
  PACKAGE_REMOVED: { icon: Package, cls: 'bg-gray-100 text-gray-500' },
  PLAN_ASSIGNED: { icon: Dumbbell, cls: 'bg-green-100 text-green-600' },
  PLAN_REMOVED: { icon: Dumbbell, cls: 'bg-gray-100 text-gray-500' },
  SUPPORT_REPLY: { icon: LifeBuoy, cls: 'bg-yellow-100 text-yellow-700' },
  SUPPORT_UPDATE: { icon: LifeBuoy, cls: 'bg-gray-100 text-gray-500' },
};

export function Notifications({ onBack, onNavigate, onViewProfile, onOpenSupport }: NotificationsProps) {
  const { t, language } = useLanguage();
  const { tokens } = useAuth();
  const token = tokens?.access_token || '';

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const dateLocale = language === 'fa' ? 'fa-IR-u-ca-persian' : undefined;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await NotificationsAPI.listNotifications(token, { limit: 100 });
      setItems(res.items);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefetch('notifications', load);

  const actorName = (n: Notification) => {
    const a = n.actor;
    if (!a) return t('someone');
    return `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.username;
  };

  // Localized one-line message per type, filling in the actor + entity name.
  const message = (n: Notification): string => {
    const who = actorName(n);
    const name = n.data?.name || n.data?.title || '';
    switch (n.type) {
      case 'CONNECTION_REQUEST': return t('notifConnectionRequest', { who });
      case 'CONNECTION_ACCEPTED': return t('notifConnectionAccepted', { who });
      case 'ASSESSMENT_ASSIGNED': return t('notifAssessmentAssigned', { who, name });
      case 'ASSESSMENT_SUBMITTED': return t('notifAssessmentSubmitted', { who, name });
      case 'BADGE_GRANTED': return t('notifBadgeGranted', { who, name });
      case 'PACKAGE_SUBSCRIBED': return t('notifPackageSubscribed', { who, name });
      case 'PACKAGE_ASSIGNED': return t('notifPackageAssigned', { who, name });
      case 'PACKAGE_REMOVED': return t('notifPackageRemoved', { who, name });
      case 'PLAN_ASSIGNED': return t('notifPlanAssigned', { who, name });
      case 'PLAN_REMOVED': return t('notifPlanRemoved', { who, name });
      case 'SUPPORT_REPLY': return t('notifSupportReply', { preview: n.data?.preview || '' });
      case 'SUPPORT_UPDATE':
        return n.data?.event === 'closed_by_support' ? t('notifSupportClosed') : t('notifSupportUpdate');
      default: return t('notifGeneric');
    }
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return t('minutesAgo', { n: String(mins) });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('hoursAgo', { n: String(hrs) });
    return new Date(iso).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });
  };

  const open = async (n: Notification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      NotificationsAPI.markRead(token, n.id).catch(() => {});
    }
    // Deep-link to the most relevant screen.
    switch (n.type) {
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPTED':
        if (n.actor_id && onViewProfile) onViewProfile(n.actor_id);
        else onNavigate('athletes-coaches');
        break;
      case 'ASSESSMENT_ASSIGNED':
        onNavigate('athlete-tests');
        break;
      case 'ASSESSMENT_SUBMITTED':
      case 'PACKAGE_SUBSCRIBED':
        onNavigate('coach-dashboard');
        break;
      case 'BADGE_GRANTED':
      case 'PACKAGE_ASSIGNED':
      case 'PACKAGE_REMOVED':
        onNavigate('profile');
        break;
      case 'PLAN_ASSIGNED':
      case 'PLAN_REMOVED':
        onNavigate('workouts-home');
        break;
      case 'SUPPORT_REPLY':
      case 'SUPPORT_UPDATE':
        // Deep-link straight into the ticket thread, not just the support list.
        if (n.entity_id && onOpenSupport) onOpenSupport(n.entity_id);
        else onNavigate('support');
        break;
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    try {
      await NotificationsAPI.markAllRead(token);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;

  // Group notifications (already newest-first) into Today / This week / Earlier
  // so the list reads as a timeline rather than an undifferentiated stack.
  const bucketOf = (iso: string): 'today' | 'thisWeek' | 'earlier' => {
    const d = new Date(iso).getTime();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (d >= startOfToday) return 'today';
    if (d >= startOfToday - 6 * 86400000) return 'thisWeek';
    return 'earlier';
  };

  const renderRow = (n: Notification) => {
    const meta = TYPE_META[n.type] || { icon: Bell, cls: 'bg-gray-100 text-gray-500' };
    const Icon = meta.icon;
    const hasAvatar = Boolean(n.actor?.avatar?.url);
    return (
      <button
        key={n.id}
        onClick={() => open(n)}
        className={`relative w-full text-start flex items-start gap-3 p-3.5 rounded-2xl border overflow-hidden transition-colors ${
          n.read
            ? 'bg-card border-gray-100 shadow-sm hover:bg-gray-50'
            : 'bg-yellow-50 border-yellow-200 shadow hover:bg-yellow-100/70'
        }`}
      >
        {/* Unread accent bar on the leading edge */}
        {!n.read && (
          <span
            className="absolute rounded-full bg-yellow-500"
            style={{ insetInlineStart: 0, top: 8, bottom: 8, width: 4 }}
          />
        )}

        {/* Avatar with a small type badge; or a typed icon chip when no avatar */}
        {hasAvatar ? (
          <div className="relative shrink-0">
            <UserAvatar url={n.actor!.avatar!.url} alt={actorName(n)} sizeClass="w-12 h-12" iconClass="w-6 h-6" />
            <span
              className={`absolute w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white ${meta.cls}`}
              style={{ insetInlineStart: -4, bottom: -4 }}
            >
              <Icon className="w-3 h-3" />
            </span>
          </div>
        ) : (
          <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${meta.cls}`}>
            <Icon className="w-5 h-5" />
          </span>
        )}

        <div className="flex-1 min-w-0 py-0.5">
          <p className={`text-sm leading-snug ${n.read ? 'text-gray-700' : 'text-foreground'}`}>{message(n)}</p>
          <p className="text-gray-400 text-xs mt-1">{relativeTime(n.created_at)}</p>
        </div>

        {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />}
      </button>
    );
  };

  // Precompute where each group header should appear.
  let lastBucket: string | null = null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <BackButton onClick={onBack} aria-label={t('back')} />
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-foreground text-xl truncate">{t('notifications')}</h1>
            {unreadCount > 0 && (
              <span className="bg-yellow-500 text-foreground text-xs font-semibold rounded-full px-2 py-0.5 shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 ? (
            <button
              onClick={markAll}
              title={t('markAllRead')}
              aria-label={t('markAllRead')}
              className="p-2 -me-2 text-muted-foreground hover:bg-tint-2 rounded-lg transition-colors shrink-0"
            >
              <CheckCheck className="w-5 h-5" />
            </button>
          ) : (
            <span className="w-9 shrink-0" />
          )}
        </div>
      </div>

      <div className="p-4 pb-28">
        {loading && <div className="text-center text-gray-500 py-8">{t('loading')}</div>}

        {!loading && items.length === 0 && (
          <div className="bg-card rounded-2xl p-10 text-center border border-gray-100 shadow-sm mt-6">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">{t('noNotifications')}</p>
          </div>
        )}

        {!loading && items.map((n) => {
          const bucket = bucketOf(n.created_at);
          const showHeader = bucket !== lastBucket;
          lastBucket = bucket;
          return (
            <div key={n.id}>
              {showHeader && (
                <h2 className="text-gray-400 text-xs font-medium px-1 mb-2 mt-4 first:mt-0">
                  {t(bucket)}
                </h2>
              )}
              <div className="mb-2">{renderRow(n)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Home, ClipboardList, LayoutDashboard, MessageCircle, Compass } from 'lucide-react';
import type { ViewType, UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeRefetch } from '../contexts/RealtimeContext';
import * as ConnectionsAPI from '../api/connections';
import * as MessagesAPI from '../api/messages';
import { FEATURES } from '../config';

interface NavigationProps {
  currentView: ViewType;
  onNavigate: (view: string) => void;
  userRole: UserRole;
}

export function Navigation({ currentView, onNavigate, userRole }: NavigationProps) {
  const { t } = useLanguage();
  const { tokens } = useAuth();
  const [hasRequests, setHasRequests] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Notification dots: Discover (pending connection requests) and Messages
  // (unread conversations). Refreshed on view change (so they clear once the
  // user handles them) AND live via the realtime "messages"/"connections"
  // signals (so a new message shows a dot even while on another tab).
  const refreshDots = useCallback(() => {
    const token = tokens?.access_token;
    if (!token) return;
    ConnectionsAPI.listRequests(token, { status: 'PENDING', limit: 1 })
      .then((res) => setHasRequests(res.total > 0))
      .catch(() => {});
    MessagesAPI.listThreads(token, { limit: 50 })
      .then((res) => setHasUnreadMessages(res.items.some((thr) => thr.unread_count > 0)))
      .catch(() => {});
  }, [tokens?.access_token]);

  useEffect(() => { refreshDots(); }, [refreshDots, currentView]);
  useRealtimeRefetch('messages', refreshDots);
  useRealtimeRefetch('connections', refreshDots);

  const navItems = [
    ...(FEATURES.feed ? [{ id: 'feed' as ViewType, icon: Home, label: t('feed') }] : []),
    { id: 'athlete-search' as ViewType, icon: Compass, label: t('discover') },
    { id: 'workouts-home' as ViewType, icon: ClipboardList, label: t('workouts') },
    { id: 'messages' as ViewType, icon: MessageCircle, label: t('messages') },
    // Personal training analytics lives in the side menu for both roles (keeps the
    // bottom nav consistent and a coach's own training out of their work dashboard).
    ...(userRole === 'coach' ? [
      { id: 'coach-dashboard' as ViewType, icon: LayoutDashboard, label: t('dashboard') },
    ] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border max-w-md mx-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || 
            (item.id === 'workouts-home' && (currentView === 'workout-session' || currentView === 'logging')) ||
            (item.id === 'messages' && (currentView === 'message-thread' || currentView === 'channel-view'));
          
          const showDot =
            (item.id === 'athlete-search' && hasRequests) ||
            (item.id === 'messages' && hasUnreadMessages);

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-4 transition-all ${
                isActive ? 'text-tint-ink' : 'text-muted-foreground'
              }`}
            >
              <span className="relative">
                <Icon className="w-6 h-6" />
                {showDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-tint" />
                )}
              </span>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
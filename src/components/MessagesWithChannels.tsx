import { useCallback, useEffect, useState } from 'react';
import { SquarePen, X } from 'lucide-react';
import { Button } from './ui/button';
import { HamburgerMenu } from './HamburgerMenu';
import { UserAvatar } from './UserAvatar';
import { ConnectionPicker } from './ConnectionPicker';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeRefetch } from '../contexts/RealtimeContext';
import * as MessagesAPI from '../api/messages';
import type { Thread } from '../api/messages';
import type { User } from '../api/types';

interface MessagesProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  onViewProfile?: (userId: string) => void;
  setCurrentConversationId: (id: string) => void;
  setCurrentChannelId: (id: string | null) => void;
  activeTab: 'dms' | 'channels';
  setActiveTab: (tab: 'dms' | 'channels') => void;
}

const peerName = (u: User) => {
  const full = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  return full || u.username;
};

export function MessagesWithChannels({ userRole, onNavigate, setCurrentConversationId }: MessagesProps) {
  const { t, language } = useLanguage();
  const { tokens } = useAuth();
  const token = tokens?.access_token;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);

  // "New chat" picker: start a conversation with one of your connections.
  const [showNew, setShowNew] = useState(false);

  // Re-callable so a future socket event can refresh the list in place.
  const loadThreads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await MessagesAPI.listThreads(token, { limit: 50 });
      setThreads(res.items);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);
  useRealtimeRefetch('messages', loadThreads);

  const openThread = (thread: Thread) => {
    if (!thread.peer) return;
    setCurrentConversationId(thread.peer.id);
    onNavigate('message-thread');
  };

  const openChatWith = (userId: string) => {
    setShowNew(false);
    setCurrentConversationId(userId);
    onNavigate('message-thread');
  };

  const fmtTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      const sameDay = d.toDateString() === today.toDateString();
      const locale = language === 'fa' ? 'fa-IR' : 'en-US';
      return sameDay
        ? d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const fa = (n: number) => n.toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-navy px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl">{t('messages')}</h1>
          <div className="flex items-center gap-1">
            <Button variant="brand" size="sm" icon={<SquarePen />} onClick={() => setShowNew((v) => !v)}>
              {t('newChat')}
            </Button>
            <HamburgerMenu userRole={userRole} onNavigate={onNavigate} />
          </div>
        </div>

        {/* New-chat: pick a connection (shared ConnectionPicker) */}
        {showNew && (
          <div className="mt-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
              <span className="text-navy text-sm font-medium">{t('startConversation')}</span>
              <button onClick={() => setShowNew(false)} className="p-1 text-gray-400 hover:text-gray-600" aria-label={t('cancel')}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <ConnectionPicker token={token} onSelect={(u) => openChatWith(u.id)} />
          </div>
        )}
      </div>

      {/* Thread list */}
      <div className="p-4">
        {loading && threads.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">{t('loading')}</div>
        ) : threads.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-md border border-gray-200">
            <p className="text-gray-600 mb-1">{t('noConversations')}</p>
            <p className="text-gray-400 text-sm">{t('noConversationsHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <button
                key={thread.chat_id}
                onClick={() => openThread(thread)}
                className="w-full bg-white rounded-lg p-3 shadow-sm border border-gray-200 flex items-center gap-3 hover:bg-gray-50 transition-colors text-start"
              >
                <UserAvatar
                  url={thread.peer?.avatar?.url}
                  alt={thread.peer ? peerName(thread.peer) : ''}
                  sizeClass="w-12 h-12"
                  iconClass="w-6 h-6"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-navy truncate">{thread.peer ? peerName(thread.peer) : ''}</span>
                    <span className="text-gray-400 text-xs flex-shrink-0">{fmtTime(thread.last_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className={`truncate text-sm ${thread.unread_count > 0 ? 'text-navy font-medium' : 'text-gray-500'}`}>
                      {thread.last_message}
                    </span>
                    {thread.unread_count > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold inline-flex items-center justify-center">
                        {fa(thread.unread_count)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

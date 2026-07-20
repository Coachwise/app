import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeRefetch } from '../contexts/RealtimeContext';
import { UserAvatar } from './UserAvatar';
import * as MessagesAPI from '../api/messages';
import * as UsersAPI from '../api/users';
import type { Message, User } from '../api/types';

interface MessageThreadProps {
  conversationId: string | null; // peer user id
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
}

const peerName = (u: User | null) => {
  if (!u) return '';
  const full = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  return full || u.username;
};

export function MessageThread({ conversationId, onBack, onViewProfile }: MessageThreadProps) {
  const { t, isRTL, language } = useLanguage();
  const { user, tokens } = useAuth();
  const token = tokens?.access_token;
  const peerId = conversationId;

  const [peer, setPeer] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Kept as a re-callable function so a future socket event can refresh in place.
  const loadMessages = useCallback(async () => {
    if (!token || !peerId) return;
    setLoading(true);
    try {
      const list = await MessagesAPI.listMessages(token, peerId, { limit: 100 });
      // API returns newest-first; show oldest-first with newest at the bottom.
      setMessages([...list].reverse());
      await MessagesAPI.markRead(token, peerId).catch(() => {});
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [token, peerId]);

  useEffect(() => {
    if (!token || !peerId) return;
    UsersAPI.getUser(token, peerId).then(setPeer).catch(() => setPeer(null));
    loadMessages();
  }, [token, peerId, loadMessages]);
  // Live-refresh the open chat when a new message arrives.
  useRealtimeRefetch('messages', loadMessages);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const body = text.trim();
    if (!token || !peerId || !body || sending) return;
    setSending(true);
    setText('');
    try {
      await MessagesAPI.sendMessage(token, { recipient_id: peerId, body });
      await loadMessages();
    } catch {
      setText(body); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString(language === 'fa' ? 'fa-IR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 max-w-md mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-3 py-3 flex items-center gap-2">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-tint-2 transition-colors" aria-label={t('back')}>
          <BackIcon className="w-6 h-6 text-foreground" />
        </button>
        <button
          onClick={() => peer && onViewProfile?.(peer.id)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <UserAvatar url={peer?.avatar?.url} alt={peerName(peer)} sizeClass="w-10 h-10" iconClass="w-5 h-5" />
          <div className="min-w-0 text-start">
            <p className="text-foreground truncate">{peerName(peer) || '…'}</p>
            {peer && <p className="text-muted-foreground text-xs truncate">@{peer.username}</p>}
          </div>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-sm">{t('noMessagesYet')}</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-2xl ${
                    mine
                      ? 'bg-yellow-500 text-foreground rounded-br-sm'
                      : 'bg-card text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <div className={`text-[10px] mt-1 ${mine ? 'text-foreground/60' : 'text-gray-400'} text-end`}>
                    {fmtTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="bg-card border-t border-gray-200 p-3 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t('typeMessage')}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <Button
          variant="brand"
          size="icon"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          aria-label={t('send')}
          className="rounded-full"
        >
          <Send className={`size-5 ${isRTL ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    </div>
  );
}

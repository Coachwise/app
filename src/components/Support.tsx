import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Send, Plus, LifeBuoy, Lock, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeRefetch } from '../contexts/RealtimeContext';
import * as SupportAPI from '../api/support';
import type { SupportTicket, SupportTicketListItem, SupportMessage } from '../api/support';
import { ticketRef } from '../api/support';
import { errorText } from '../api/errors';

interface SupportProps {
  onBack: () => void;
  // When set (e.g. opened from a notification), jump straight into that thread.
  initialTicketId?: string | null;
}

type Mode = { name: 'list' } | { name: 'new' } | { name: 'thread'; id: string };

export function Support({ onBack, initialTicketId }: SupportProps) {
  const { t, isRTL, language } = useLanguage();
  const { tokens } = useAuth();
  const token = tokens?.access_token;

  const [mode, setMode] = useState<Mode>(
    initialTicketId ? { name: 'thread', id: initialTicketId } : { name: 'list' },
  );
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-gray-100 max-w-md mx-auto flex flex-col">
      <div className="bg-navy px-3 py-3 flex items-center gap-2">
        <button
          onClick={() => (mode.name === 'list' ? onBack() : setMode({ name: 'list' }))}
          className="p-2 rounded-lg hover:bg-navy-light transition-colors"
          aria-label={t('back')}
        >
          <BackIcon className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white text-lg flex-1">{t('support')}</h1>
        {mode.name === 'list' && (
          <button
            onClick={() => setMode({ name: 'new' })}
            className="flex items-center gap-1 bg-yellow-500 text-navy px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-yellow-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('newTicket')}
          </button>
        )}
      </div>

      {mode.name === 'list' && (
        <TicketList
          token={token}
          fmtTime={fmtTime}
          onOpen={(id) => setMode({ name: 'thread', id })}
          onNew={() => setMode({ name: 'new' })}
        />
      )}
      {mode.name === 'new' && (
        <NewTicket token={token} onCreated={(id) => setMode({ name: 'thread', id })} />
      )}
      {mode.name === 'thread' && (
        <Thread token={token} ticketId={mode.id} fmtTime={fmtTime} />
      )}
    </div>
  );
}

// SYSTEM rows carry a stable marker ("closed_by_support"), not prose, so that the
// wording is localized here rather than frozen in whatever language wrote it.
// Shared by the thread and the list — both render the same rows.
type Translate = (key: string, values?: Record<string, string>) => string;

const systemText = (t: Translate, body: string): string => {
  switch (body) {
    case 'closed_by_user': return t('ticketClosedByYou');
    case 'closed_by_support': return t('ticketClosedBySupport');
    default: return body;
  }
};

// One line of preview for the list. A SYSTEM row speaks for itself and takes no
// "Support:"/"You:" prefix — it isn't from either of them.
const previewText = (t: Translate, sender: string | null, body: string): string => {
  if (sender === 'SYSTEM') return systemText(t, body);
  const who = sender === 'USER' ? t('you') : t('supportTeam');
  return `${who}: ${body}`;
};

function StatusChip({ ticket }: { ticket: SupportTicket | SupportTicketListItem }) {
  const { t } = useLanguage();
  if (ticket.status === 'CLOSED') {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">{t('ticketClosed')}</span>;
  }
  if (ticket.turn === 'USER') {
    // The support team has answered and it's the user's move — highlight it.
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500 text-navy font-semibold">{t('yourTurn')}</span>;
  }
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy/10 text-navy">{t('awaitingSupport')}</span>;
}

function TicketList({
  token,
  fmtTime,
  onOpen,
  onNew,
}: {
  token?: string;
  fmtTime: (iso: string) => string;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const { t } = useLanguage();
  const [items, setItems] = useState<SupportTicketListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await SupportAPI.listTickets(token, { limit: 50 });
      setItems(res.items);
    } catch {
      /* leave the last-known list on a transient error */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);
  // The worker pushes a "support" signal when an admin replies — reload in place.
  useRealtimeRefetch('support', load);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">{t('loading')}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
        <LifeBuoy className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">{t('noTicketsYet')}</p>
        <button
          onClick={onNew}
          className="mt-2 bg-yellow-500 text-navy px-5 py-2.5 rounded-full font-semibold hover:bg-yellow-400 transition-colors"
        >
          {t('openFirstTicket')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {items.map((ti) => (
        <button
          key={ti.id}
          onClick={() => onOpen(ti.id)}
          className="w-full bg-white rounded-xl p-3 text-start shadow-sm hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <p className="text-navy font-semibold flex-1 truncate">{ti.subject}</p>
            <StatusChip ticket={ti} />
          </div>
          {ti.last_body && (
            <p className="text-gray-500 text-sm truncate mt-1">
              {previewText(t, ti.last_sender, ti.last_body)}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400 text-[11px] font-mono" dir="ltr">#{ticketRef(ti.id)}</span>
            <span className="text-gray-300 text-[11px]">·</span>
            <span className="text-gray-400 text-[11px]">{fmtTime(ti.last_message_at)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function NewTicket({ token, onCreated }: { token?: string; onCreated: (id: string) => void }) {
  const { t } = useLanguage();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!token || !subject.trim() || !body.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await SupportAPI.openTicket(token, subject.trim(), body.trim());
      onCreated(res.ticket.id);
    } catch (err) {
      setError(errorText(t, err));
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <label className="block text-navy font-semibold mb-1">{t('ticketSubject')}</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={140}
          placeholder={t('ticketSubjectPlaceholder')}
          className="w-full bg-white rounded-lg px-4 py-2.5 text-navy border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-navy font-semibold mb-1">{t('ticketMessage')}</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
          rows={7}
          placeholder={t('ticketMessagePlaceholder')}
          className="w-full bg-white rounded-lg px-4 py-2.5 text-navy border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        onClick={submit}
        disabled={!subject.trim() || !body.trim() || busy}
        className="w-full bg-yellow-500 text-navy py-3 rounded-full font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50"
      >
        {busy ? t('sending') : t('sendTicket')}
      </button>
      <p className="text-gray-400 text-xs text-center">{t('supportReplyHint')}</p>
    </div>
  );
}

function Thread({
  token,
  ticketId,
  fmtTime,
}: {
  token?: string;
  ticketId: string;
  fmtTime: (iso: string) => string;
}) {
  const { t, isRTL } = useLanguage();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await SupportAPI.getTicket(token, ticketId);
      setTicket(res.ticket);
      setMessages(res.messages);
    } catch {
      /* keep what we have */
    }
  }, [token, ticketId]);

  useEffect(() => {
    load();
  }, [load]);
  useRealtimeRefetch('support', load);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const canSend = ticket?.status === 'OPEN' && ticket?.turn === 'USER';

  const close = async () => {
    if (!token || !ticket || ticket.status !== 'OPEN' || closing) return;
    setClosing(true);
    setError('');
    try {
      const res = await SupportAPI.closeTicket(token, ticketId);
      setTicket(res.ticket);
      load();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setClosing(false);
    }
  };

  const send = async () => {
    if (!token || !text.trim() || sending || !canSend) return;
    setSending(true);
    setError('');
    try {
      const res = await SupportAPI.sendMessage(token, ticketId, text.trim());
      setMessages((prev) => [...prev, res.message]);
      setText('');
      // Our turn is over now; reload to reflect the flipped turn.
      load();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* The ticket's identity, pinned above the thread: the subject, its
          reference for quoting in a follow-up, and the way to close it. */}
      {ticket && (
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-navy font-semibold truncate">{ticket.subject}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-gray-400 text-[11px] font-mono" dir="ltr">
                #{ticketRef(ticket.id)}
              </span>
              <StatusChip ticket={ticket} />
            </div>
          </div>
          {ticket.status === 'OPEN' && (
            <button
              onClick={close}
              disabled={closing}
              className="flex items-center gap-1 text-gray-500 hover:text-red-600 text-xs px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              {closing ? t('sending') : t('closeTicket')}
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => {
          if (m.sender === 'SYSTEM') {
            return (
              <div key={m.id} className="flex justify-center">
                <p className="text-gray-400 text-xs bg-gray-200 rounded-full px-3 py-1">
                  {systemText(t, m.body)}
                </p>
              </div>
            );
          }
          const mine = m.sender === 'USER';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl ${
                  mine
                    ? 'bg-yellow-500 text-navy rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                }`}
              >
                {!mine && <p className="text-[10px] text-navy/60 font-semibold mb-0.5">{t('supportTeam')}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <div className={`text-[10px] mt-1 ${mine ? 'text-navy/60' : 'text-gray-400'} text-end`}>
                  {fmtTime(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-red-600 text-sm px-4 pb-1">{error}</p>}

      {ticket?.status === 'CLOSED' ? (
        <div className="bg-white border-t border-gray-200 p-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          {t('ticketClosedHint')}
        </div>
      ) : canSend ? (
        <div className="bg-white border-t border-gray-200 p-3 flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t('typeMessage')}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="p-2.5 rounded-full bg-yellow-500 text-navy hover:bg-yellow-400 transition-colors disabled:opacity-50"
            aria-label={t('send')}
          >
            <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
      ) : (
        <div className="bg-white border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
          {t('awaitingSupportHint')}
        </div>
      )}
    </>
  );
}

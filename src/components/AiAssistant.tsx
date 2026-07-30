import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Send, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeRefetch } from '../contexts/RealtimeContext';
import { errorText } from '../api/errors';
import * as AI from '../api/ai';
import type { AiMessage, AiAction } from '../api/ai';
import { getExecutor } from '../lib/aiActions';
import { toast } from 'sonner';

interface AiAssistantProps {
  onBack: () => void;
}

type Decision = 'approve' | 'reject';

export function AiAssistant({ onBack }: AiAssistantProps) {
  const { t, isRTL } = useLanguage();
  const { tokens } = useAuth();
  const token = tokens?.access_token || '';

  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [applying, setApplying] = useState(false);
  // messageId -> (action index -> decision)
  const [decisions, setDecisions] = useState<Record<string, Record<number, Decision>>>({});

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThread = useCallback(async (id: string) => {
    const res = await AI.getConversation(token, id);
    setMessages(res.messages);
  }, [token]);

  const reload = useCallback(() => {
    if (convId) loadThread(convId).catch(() => {});
  }, [convId, loadThread]);

  // Load the most recent conversation on mount (single-thread MVP).
  useEffect(() => {
    if (!token) return;
    AI.listConversations(token, { limit: 1 })
      .then((res) => {
        const latest = res.items[0];
        if (latest) {
          setConvId(latest.id);
          return loadThread(latest.id);
        }
      })
      .catch(() => {});
  }, [token, loadThread]);

  // The worker signals "ai" when a turn is filled; re-run the loader.
  useRealtimeRefetch('ai', reload);

  // Fallback for when the bus is down (no signal): poll while a turn is pending.
  const pending = messages.some((m) => m.status === 'pending');
  useEffect(() => {
    if (!pending) return;
    const id = setInterval(reload, 1500);
    return () => clearInterval(id);
  }, [pending, reload]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (!convId) {
        const res = await AI.startConversation(token, { text });
        setConvId(res.conversation.id);
        await loadThread(res.conversation.id);
      } else {
        await AI.sendMessage(token, convId, text);
        await loadThread(convId);
      }
      setInput('');
    } catch (e) {
      toast.error(errorText(t, e));
    } finally {
      setSending(false);
    }
  };

  const decide = (messageId: string, index: number, choice: Decision) => {
    setDecisions((prev) => ({ ...prev, [messageId]: { ...prev[messageId], [index]: choice } }));
  };

  const apply = async (msg: AiMessage) => {
    if (!convId || applying) return;
    const chosen = decisions[msg.id] || {};
    if (msg.actions.some((_, i) => !chosen[i])) return; // require a decision on each
    setApplying(true);
    try {
      const results: AI.AiActionResult[] = [];
      for (let i = 0; i < msg.actions.length; i++) {
        const action = msg.actions[i];
        if (chosen[i] === 'reject') {
          results.push({ ok: false, error: 'rejected' });
          continue;
        }
        const exec = getExecutor(action.name);
        if (!exec) {
          results.push({ ok: false, error: 'no executor' });
          continue;
        }
        try {
          const result = await exec(token, action.args || {});
          results.push({ ok: true, result });
        } catch (e) {
          results.push({ ok: false, error: errorText(t, e) });
        }
      }
      await AI.reportResults(token, convId, msg.id, results);
      setDecisions((prev) => ({ ...prev, [msg.id]: {} }));
      await loadThread(convId);
    } catch (e) {
      toast.error(errorText(t, e));
    } finally {
      setApplying(false);
    }
  };

  const actionLabel = (name: string) => {
    const key = `aiAction_${name}`;
    const label = t(key);
    return label === key ? name : label;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 max-w-md mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button onClick={onBack} className="p-1 -ms-1 text-foreground" aria-label={t('back')}>
          <ArrowRight className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'}`} />
        </button>
        <Sparkles className="w-5 h-5 text-primary" />
        <div className="min-w-0">
          <h1 className="text-foreground font-semibold leading-tight">{t('aiAssistant')}</h1>
          <p className="text-foreground/60 text-xs leading-tight">{t('aiAssistantSubtitle')}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-6">
            <Sparkles className="w-10 h-10 text-primary/70" />
            <p className="text-foreground font-medium">{t('aiEmptyTitle')}</p>
            <p className="text-foreground/60 text-sm">{t('aiEmptyDesc')}</p>
          </div>
        )}

        {messages.map((m) => (
          <MessageRow
            key={m.id}
            msg={m}
            t={t}
            actionLabel={actionLabel}
            decisions={decisions[m.id] || {}}
            onDecide={(i, c) => decide(m.id, i, c)}
            onApply={() => apply(m)}
            applying={applying}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-3 py-2 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={t('aiInputPlaceholder')}
          className="flex-1 resize-none max-h-32 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <Button size="icon" onClick={send} disabled={sending || !input.trim()} aria-label={t('aiSend')}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

interface MessageRowProps {
  msg: AiMessage;
  t: (k: string, v?: Record<string, string | number>) => string;
  actionLabel: (name: string) => string;
  decisions: Record<number, Decision>;
  onDecide: (index: number, choice: Decision) => void;
  onApply: () => void;
  applying: boolean;
}

function MessageRow({ msg, t, actionLabel, decisions, onDecide, onApply, applying }: MessageRowProps) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-ee-sm bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap break-words">
          {msg.text}
        </div>
      </div>
    );
  }

  // assistant
  if (msg.status === 'pending') {
    return (
      <div className="flex justify-start">
        <div className="rounded-2xl rounded-ss-sm bg-card border border-border px-3 py-2">
          <TypingDots />
        </div>
      </div>
    );
  }

  const failed = msg.status === 'failed';
  const awaiting = msg.status === 'awaiting_approval';
  const allDecided = msg.actions.every((_, i) => decisions[i]);

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        {failed ? (
          <div className="rounded-2xl rounded-ss-sm bg-destructive/10 text-destructive px-3 py-2 text-sm">
            {t('errAiFailed')}
          </div>
        ) : (
          msg.text && (
            <div className="rounded-2xl rounded-ss-sm bg-card border border-border px-3 py-2 text-sm whitespace-pre-wrap break-words text-foreground">
              {msg.text}
            </div>
          )
        )}

        {msg.actions.map((action, i) => (
          <ActionCard
            key={i}
            action={action}
            label={actionLabel(action.name)}
            t={t}
            interactive={awaiting}
            decision={decisions[i]}
            onDecide={(c) => onDecide(i, c)}
          />
        ))}

        {awaiting && msg.actions.length > 0 && (
          <Button size="sm" className="w-full" onClick={onApply} disabled={!allDecided || applying}>
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : t('aiApply')}
          </Button>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  action,
  label,
  t,
  interactive,
  decision,
  onDecide,
}: {
  action: AiAction;
  label: string;
  t: Tr;
  interactive: boolean;
  decision?: Decision;
  onDecide: (choice: Decision) => void;
}) {
  const done = action.status === 'done';
  const rejected = action.status === 'failed';
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">{label}</span>
        {done && <Check className="w-4 h-4 text-green-600 ms-auto" />}
      </div>
      <ArgPreview args={action.args} t={t} />

      {interactive && (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant={decision === 'approve' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onDecide('approve')}
          >
            <Check className="w-4 h-4" /> {t('aiApprove')}
          </Button>
          <Button
            size="sm"
            variant={decision === 'reject' ? 'destructive' : 'outline'}
            className="flex-1"
            onClick={() => onDecide('reject')}
          >
            <X className="w-4 h-4" /> {t('aiReject')}
          </Button>
        </div>
      )}
      {rejected && <p className="text-foreground/50 text-xs mt-1">{t('aiRejected')}</p>}
    </div>
  );
}

type Tr = (k: string, v?: Record<string, string | number>) => string;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SPORTS = ['STRENGTH', 'CLIMBING', 'CARDIO', 'MOBILITY', 'GENERAL'];

// Human label for a known arg key, falling back to nothing technical.
function fieldLabel(k: string, t: Tr): string {
  const key = 'aiField_' + k;
  const l = t(key);
  return l === key ? k : l;
}

// Turn one arg value into a human string, or null to hide it (ids/uuids/objects).
function humanValue(k: string, v: unknown, t: Tr): string | null {
  if (Array.isArray(v)) return t('aiCount', { count: v.length });
  if (v && typeof v === 'object') return null;
  const s = String(v ?? '').trim();
  if (!s || UUID_RE.test(s)) return null;
  if (k === 'sport' && SPORTS.includes(s)) {
    const key = 'aiSport_' + s;
    const l = t(key);
    return l === key ? s : l;
  }
  return s.length > 140 ? s.slice(0, 140) + '…' : s;
}

// A friendly, non-technical summary of a write's fields: id/uuid fields are
// hidden, keys are localized, sports and counts read as words — never raw JSON.
function ArgPreview({ args, t }: { args?: Record<string, unknown>; t: Tr }) {
  if (!args) return null;
  const rows = Object.entries(args)
    .filter(([k]) => !/_id$/i.test(k) && k !== 'id')
    .map(([k, v]) => [k, humanValue(k, v, t)] as const)
    .filter((r): r is readonly [string, string] => r[1] != null);
  if (!rows.length) return null;
  return (
    <div className="text-foreground/70 text-xs space-y-0.5">
      {rows.map(([k, val]) => (
        <div key={k} className="flex gap-1 min-w-0">
          <span className="text-foreground/50 shrink-0">{fieldLabel(k, t)}:</span>
          <span className="min-w-0 break-words">{val}</span>
        </div>
      ))}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { config } from '../config';

// The realtime layer is a single websocket that only ever receives tiny
// {"refetch":[topics]} hints. Components register a callback per topic and
// re-run their own loader when signalled — no data flows over the socket.
type RefetchCallback = () => void;

interface RealtimeContextValue {
  subscribe: (topic: string, cb: RefetchCallback) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({ subscribe: () => () => {} });

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, tokens } = useAuth();
  const userId = user?.id;

  // topic -> set of callbacks
  const subsRef = useRef<Map<string, Set<RefetchCallback>>>(new Map());

  const subscribe = (topic: string, cb: RefetchCallback) => {
    let set = subsRef.current.get(topic);
    if (!set) { set = new Set(); subsRef.current.set(topic, set); }
    set.add(cb);
    return () => { set!.delete(cb); };
  };

  useEffect(() => {
    if (!userId || !tokens?.access_token) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByUs = false;
    let attempt = 0;

    const connect = () => {
      ws = new WebSocket(`${config.wsURL}/ws?user_id=${encodeURIComponent(userId)}`);

      ws.onopen = () => { attempt = 0; };

      ws.onmessage = (ev) => {
        try {
          const { refetch } = JSON.parse(ev.data) as { refetch?: string[] };
          (refetch || []).forEach((topic) => {
            subsRef.current.get(topic)?.forEach((cb) => { try { cb(); } catch { /* ignore */ } });
          });
        } catch { /* ignore malformed frames */ }
      };

      ws.onclose = () => {
        if (closedByUs) return;
        // Reconnect with capped backoff.
        attempt += 1;
        const delay = Math.min(1000 * 2 ** attempt, 30000);
        reconnectTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => { ws?.close(); };
    };

    connect();

    return () => {
      closedByUs = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [userId, tokens?.access_token]);

  return <RealtimeContext.Provider value={{ subscribe }}>{children}</RealtimeContext.Provider>;
}

// Re-run `cb` whenever a realtime "refetch <topic>" signal arrives.
export function useRealtimeRefetch(topic: string, cb: RefetchCallback) {
  const { subscribe } = useContext(RealtimeContext);
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => subscribe(topic, () => cbRef.current()), [topic, subscribe]);
}

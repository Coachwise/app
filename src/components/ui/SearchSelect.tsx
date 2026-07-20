import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// A source is EITHER static (filter an in-memory list, e.g. country codes) OR
// async + paginated (fetch pages as the user scrolls, e.g. connection search).
export interface SearchSource<T> {
  /** Static list — filtered locally with `match`. */
  items?: T[];
  match?: (item: T, query: string) => boolean;
  /** Async, paginated loader. `page` is zero-based. */
  load?: (query: string, page: number, pageSize: number) => Promise<{ items: T[]; total: number }>;
}

interface SearchSelectProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  placeholder?: string;
  source: SearchSource<T>;
  keyOf: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onSelect: (item: T) => void;
  pageSize?: number;
}

// General-purpose searchable picker used across the app. Opens as a tall bottom
// sheet with a sticky search box and a scrollable, optionally infinite, result
// list. Give it a static `items` source or an async `load` source.
export function SearchSelect<T>({
  open, onClose, title, placeholder, source, keyOf, renderItem, onSelect, pageSize = 20,
}: SearchSelectProps<T>) {
  const { t, isRTL } = useLanguage();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const isAsync = Boolean(source.load);

  useEffect(() => { if (open) setQuery(''); }, [open]);

  // Lock background scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Static path: filter the in-memory list.
  const staticResults = useMemo(() => {
    if (isAsync || !source.items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return source.items;
    const match = source.match ?? (() => true);
    return source.items.filter((it) => match(it, q));
  }, [isAsync, source, query]);

  // Async path: (re)load the first page whenever the query changes (debounced).
  useEffect(() => {
    if (!open || !isAsync) return;
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await source.load!(query.trim(), 0, pageSize);
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
        setPage(0);
        if (listRef.current) listRef.current.scrollTop = 0;
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [open, isAsync, query, pageSize]);

  const loadMore = async () => {
    if (!isAsync || loading || items.length >= total) return;
    setLoading(true);
    try {
      const next = page + 1;
      const res = await source.load!(query.trim(), next, pageSize);
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
      setPage(next);
    } finally {
      setLoading(false);
    }
  };

  const onScroll = () => {
    const el = listRef.current;
    if (!el || !isAsync) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) loadMore();
  };

  if (!open) return null;
  const results = isAsync ? items : staticResults;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center" onClick={onClose}>
      <div
        className="bg-card w-full max-w-md h-full flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h3 className="text-foreground font-medium">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder ?? t('search')}
              className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500`}
            />
          </div>
        </div>
        <div ref={listRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-6">
          {results.map((item) => (
            <button
              key={keyOf(item)}
              type="button"
              onClick={() => { onSelect(item); onClose(); }}
              className="w-full text-start hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              {renderItem(item)}
            </button>
          ))}
          {loading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>}
          {!loading && results.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">{t('noResults')}</p>}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { useLanguage } from '../contexts/LanguageContext';
import * as ConnectionsAPI from '../api/connections';
import type { User } from '../api/types';

interface ConnectionPickerProps {
  onSelect: (user: User) => void;
  /** Preloaded connections; if omitted, they're fetched with `token`. */
  connections?: User[];
  token?: string;
  /** Show the search box (default true). */
  search?: boolean;
  emptyText?: string;
}

const displayName = (u: User) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.username;

/**
 * The single "pick one of my connections" list — used for starting a chat and
 * for assigning things to a client. Consistent avatar/row styling everywhere.
 */
export function ConnectionPicker({ onSelect, connections: provided, token, search = true, emptyText }: ConnectionPickerProps) {
  const { t } = useLanguage();
  const [fetched, setFetched] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const list = provided ?? fetched;

  useEffect(() => {
    if (provided || !token) return;
    let active = true;
    ConnectionsAPI.listConnections(token, { limit: 100 })
      .then((r) => { if (active) setFetched(r.items); })
      .catch(() => {});
    return () => { active = false; };
  }, [provided, token]);

  const filtered = query.trim()
    ? list.filter((c) => `${c.first_name ?? ''} ${c.last_name ?? ''} ${c.username}`.toLowerCase().includes(query.trim().toLowerCase()))
    : list;

  return (
    <div>
      {search && (
        <div className="p-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchConnections')}
              className="w-full ps-9 pe-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm text-foreground"
            />
          </div>
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="px-4 py-3 text-center text-gray-400 text-sm">{emptyText ?? t('noConnectionsToEnroll')}</p>
      ) : (
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
          {filtered.map((conn) => (
            <button
              key={conn.id}
              onClick={() => onSelect(conn)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-start"
            >
              <UserAvatar url={conn.avatar?.url} alt={displayName(conn)} sizeClass="w-10 h-10" iconClass="w-5 h-5" />
              <div className="min-w-0">
                <div className="text-foreground text-sm truncate">{displayName(conn)}</div>
                <div className="text-gray-400 text-xs truncate">@{conn.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

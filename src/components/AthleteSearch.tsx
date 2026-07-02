import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Search, UserPlus, UserCheck, CheckCircle2, Clock, Check, X } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import { UserAvatar } from './UserAvatar';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as UsersAPI from '../api/users';
import * as ConnectionsAPI from '../api/connections';
import type { User } from '../api/types';
import type { ConnectionRequest } from '../api/connections';

type Tab = 'discover' | 'network' | 'requests';

interface AthleteSearchProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  onViewProfile: (userId: string) => void;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

const displayName = (u: User) => {
  const full = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  return full || u.username;
};

function Avatar({ user, onClick }: { user: User; onClick?: () => void }) {
  return (
    <UserAvatar url={user.avatar?.url} alt={displayName(user)} sizeClass="w-12 h-12" iconClass="w-6 h-6" onClick={onClick} />
  );
}

export function AthleteSearch({ userRole, onNavigate, onViewProfile, activeTab: controlledTab, onTabChange }: AthleteSearchProps) {
  const { t, isRTL, language } = useLanguage();
  const { tokens } = useAuth();
  const token = tokens?.access_token;

  // Tab can be controlled by the parent (so it survives leaving for a profile)
  // and still works standalone via internal state.
  const [internalTab, setInternalTab] = useState<Tab>('discover');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: Tab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Discover tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCoachesOnly, setFilterCoachesOnly] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Optimistic per-user status overrides keyed by user id.
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // My Network tab
  const [connections, setConnections] = useState<User[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);

  // Requests tab
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  const statusOf = (u: User): string => statusOverrides[u.id] ?? u.connection_status ?? 'none';

  const setStatus = (id: string, status: string) =>
    setStatusOverrides((prev) => ({ ...prev, [id]: status }));

  const markPending = (id: string, on: boolean) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // Debounced search against the users API (Discover tab).
  useEffect(() => {
    if (!token || activeTab !== 'discover') return;
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const res = await UsersAPI.listUsers(token, {
          search: searchQuery.trim() || undefined,
          coachOnly: filterCoachesOnly || undefined,
          limit: 50,
        });
        setResults(res.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('unableToLoadUsers'));
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterCoachesOnly, token, activeTab]);

  const loadConnections = useCallback(async () => {
    if (!token) return;
    setNetworkLoading(true);
    try {
      const res = await ConnectionsAPI.listConnections(token, { limit: 50 });
      setConnections(res.items);
    } catch {
      setConnections([]);
    } finally {
      setNetworkLoading(false);
    }
  }, [token]);

  const loadRequests = useCallback(async () => {
    if (!token) return;
    setRequestsLoading(true);
    try {
      const res = await ConnectionsAPI.listRequests(token, { status: 'PENDING', limit: 50 });
      setRequests(res.items);
      setRequestCount(res.total);
    } catch {
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [token]);

  // Fetch the pending request count once so the tab badge is accurate.
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (activeTab === 'network') loadConnections();
  }, [activeTab, loadConnections]);

  // --- Connection actions ---
  const handleConnect = async (u: User) => {
    if (!token) return;
    markPending(u.id, true);
    setStatus(u.id, 'pending_outgoing');
    try {
      await ConnectionsAPI.sendConnect(token, u.id);
    } catch {
      setStatus(u.id, 'none');
    } finally {
      markPending(u.id, false);
    }
  };

  const handleCancel = async (u: User) => {
    if (!token) return;
    markPending(u.id, true);
    setStatus(u.id, 'none');
    try {
      await ConnectionsAPI.cancelConnect(token, u.id);
    } catch {
      setStatus(u.id, 'pending_outgoing');
    } finally {
      markPending(u.id, false);
    }
  };

  const handleAccept = async (req: ConnectionRequest) => {
    if (!token) return;
    markPending(req.id, true);
    try {
      await ConnectionsAPI.acceptRequest(token, req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setRequestCount((c) => Math.max(0, c - 1));
      if (req.user) setStatus(req.user.id, 'connected');
    } finally {
      markPending(req.id, false);
    }
  };

  const handleReject = async (req: ConnectionRequest) => {
    if (!token) return;
    markPending(req.id, true);
    try {
      await ConnectionsAPI.rejectRequest(token, req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setRequestCount((c) => Math.max(0, c - 1));
      if (req.user) setStatus(req.user.id, 'none');
    } finally {
      markPending(req.id, false);
    }
  };

  const ConnectButton = ({ user }: { user: User }) => {
    const status = statusOf(user);
    const busy = pendingIds.has(user.id);
    const base = 'px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60';

    if (status === 'connected') {
      return (
        <span className={`${base} bg-green-100 text-green-700`}>
          <UserCheck className="w-4 h-4" />
          <span className="hidden sm:inline">{t('connected')}</span>
        </span>
      );
    }
    if (status === 'pending_outgoing') {
      return (
        <button onClick={() => handleCancel(user)} disabled={busy} className={`${base} bg-gray-200 text-[#0E0E55] hover:bg-gray-300`}>
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">{t('requested')}</span>
        </button>
      );
    }
    if (status === 'pending_incoming') {
      return (
        <button onClick={() => setActiveTab('requests')} className={`${base} bg-[#0E0E55] text-white hover:bg-[#1A1A6E]`}>
          <Check className="w-4 h-4" />
          <span className="hidden sm:inline">{t('respond')}</span>
        </button>
      );
    }
    return (
      <button onClick={() => handleConnect(user)} disabled={busy} className={`${base} bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400`}>
        <UserPlus className="w-4 h-4" />
        <span className="hidden sm:inline">{t('connect')}</span>
      </button>
    );
  };

  const UserRow = ({ user, trailing }: { user: User; trailing?: ReactNode }) => (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="flex items-center gap-3">
        <Avatar user={user} onClick={() => onViewProfile(user.id)} />
        <div className="flex-1 min-w-0">
          <div onClick={() => onViewProfile(user.id)} className="cursor-pointer hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#0E0E55] truncate">{displayName(user)}</span>
              {user.is_coach && <CheckCircle2 className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
            </div>
            <p className="text-gray-600 text-sm">@{user.username}</p>
          </div>
        </div>
        {trailing}
      </div>
    </div>
  );

  const tabClass = (tab: Tab) =>
    `flex-1 py-2 px-3 text-sm rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 ${
      activeTab === tab ? 'bg-yellow-500 text-[#0E0E55]' : 'bg-white/10 text-white'
    }`;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl">{t('discover')}</h1>
          <HamburgerMenu userRole={userRole} onNavigate={onNavigate} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button onClick={() => setActiveTab('discover')} className={tabClass('discover')}>
            {t('discover')}
          </button>
          <button onClick={() => setActiveTab('network')} className={tabClass('network')}>
            {t('myNetwork')}
          </button>
          <button onClick={() => setActiveTab('requests')} className={`${tabClass('requests')} relative`}>
            <span>{t('requests')}</span>
            {requestCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold leading-none inline-flex items-center justify-center ring-2 ring-[#0E0E55]">
                {requestCount.toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US')}
              </span>
            )}
          </button>
        </div>

        {/* Search (Discover only) */}
        {activeTab === 'discover' && (
          <>
            <div className="relative mb-3">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className={`w-full bg-white border-0 rounded-lg py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-[#0E0E55] focus:outline-none focus:ring-2 focus:ring-yellow-500`}
              />
            </div>
            <button
              onClick={() => setFilterCoachesOnly(!filterCoachesOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filterCoachesOnly ? 'bg-yellow-500 text-[#0E0E55]' : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">{t('findACoach')}</span>
            </button>
          </>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* DISCOVER */}
        {activeTab === 'discover' && (
          <>
            <h2 className="text-[#0E0E55]">
              {searchQuery.trim() === '' ? t('allAthletes') : `${results.length} ${t('athletes')}`}
            </h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">{error}</div>
            )}
            {loading ? (
              <div className="text-center py-10 text-gray-500 text-sm">{t('searching')}</div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center shadow-md border border-gray-200">
                <p className="text-gray-600">{t('noUsersFound')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((user) => (
                  <UserRow key={user.id} user={user} trailing={<ConnectButton user={user} />} />
                ))}
              </div>
            )}
          </>
        )}

        {/* MY NETWORK */}
        {activeTab === 'network' && (
          <>
            <h2 className="text-[#0E0E55]">{t('myNetwork')}</h2>
            {networkLoading ? (
              <div className="text-center py-10 text-gray-500 text-sm">{t('searching')}</div>
            ) : connections.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center shadow-md border border-gray-200">
                <p className="text-gray-600">{t('noConnections')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    trailing={
                      <span className="px-4 py-2 rounded-lg bg-green-100 text-green-700 flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('connected')}</span>
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* REQUESTS */}
        {activeTab === 'requests' && (
          <>
            <h2 className="text-[#0E0E55]">{t('connectionRequests')}</h2>
            {requestsLoading ? (
              <div className="text-center py-10 text-gray-500 text-sm">{t('searching')}</div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center shadow-md border border-gray-200">
                <p className="text-gray-600">{t('noRequests')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) =>
                  req.user ? (
                    <UserRow
                      key={req.id}
                      user={req.user}
                      trailing={
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAccept(req)}
                            disabled={pendingIds.has(req.id)}
                            className="p-2 rounded-lg bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400 transition-colors disabled:opacity-60"
                            aria-label={t('accept')}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={pendingIds.has(req.id)}
                            className="p-2 rounded-lg bg-gray-200 text-[#0E0E55] hover:bg-gray-300 transition-colors disabled:opacity-60"
                            aria-label={t('reject')}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      }
                    />
                  ) : null
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

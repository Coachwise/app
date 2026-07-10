import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Users, Calendar, TrendingUp, DollarSign, Package, CheckCircle, Plus, Trash2, Lock, Globe, UserPlus, Search, ClipboardList, Send, Award, LineChart, Pencil, Dumbbell } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import { ConnectionPicker } from './ConnectionPicker';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ConnectionsAPI, PackagesAPI, PlansAPI, TestsAPI, AchievementsAPI } from '../api';
import * as WalletAPI from '../api/wallet';
import { formatMoney } from '../lib/money';
import type { CoachClient, CoachPackage, Plan, User, Test, CoachAssignment, WalletBalance } from '../api/types';
import type { ConnectionRequest } from '../api/connections';
import { toast } from 'sonner';

interface CoachDashboardProps {
  onBack: () => void;
  onNavigate?: (view: string) => void;
  userRole?: UserRole;
  isPro?: boolean;
  onCreatePackage?: () => void;
  onEditPackage?: (id: string) => void;
  onCreatePlan?: () => void;
  onCreateTest?: () => void;
  onEditTest?: (id: string) => void;
  onViewClientHistory?: (testId: string, athleteId: string, clientName: string) => void;
  // Active tab, lifted to the parent so it survives navigating away and back.
  section?: string;
  onSectionChange?: (s: string) => void;
}

type Section = 'clients' | 'plans' | 'packages' | 'tests' | 'analytics';

const displayName = (u: { first_name?: string | null; last_name?: string | null; username: string }) => {
  const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
  return full || u.username;
};

export function CoachDashboard({ onBack, onNavigate, userRole = 'coach', isPro = false, onCreatePackage, onEditPackage, onCreatePlan, onCreateTest, onEditTest, onViewClientHistory, section, onSectionChange }: CoachDashboardProps) {
  const { t, language } = useLanguage();
  const { tokens, user } = useAuth();
  const token = tokens?.access_token || '';

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'fa' ? 'fa-IR-u-ca-persian' : undefined, { month: 'short', day: 'numeric' });

  // Tab state lives in the parent (see props) so it persists across remounts;
  // fall back to local state when the parent doesn't manage it.
  const [localSection, setLocalSection] = useState<Section>('clients');
  const activeSection: Section = (section as Section) ?? localSection;
  const setActiveSection = (s: Section) => { setLocalSection(s); onSectionChange?.(s); };

  // Coach earnings balance, loaded when the analytics tab is open.
  useEffect(() => {
    if (activeSection !== 'analytics' || !token) return;
    WalletAPI.getWallet(token).then(setWallet).catch(() => setWallet(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, token]);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [clients, setClients] = useState<CoachClient[]>([]);
  const [pending, setPending] = useState<ConnectionRequest[]>([]);
  const [myPlans, setMyPlans] = useState<Plan[]>([]);
  const [packages, setPackages] = useState<CoachPackage[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null); // plan picker open for this client
  const [pkgPickerClient, setPkgPickerClient] = useState<string | null>(null); // package picker open for this client
  const [showConnPicker, setShowConnPicker] = useState(false);
  const [assignConn, setAssignConn] = useState<string | null>(null);
  const [connSearch, setConnSearch] = useState('');
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<CoachAssignment[]>([]);
  const [reqPickerTest, setReqPickerTest] = useState<string | null>(null); // test whose "assign to client" picker is open
  const [loading, setLoading] = useState(true);

  const loadTests = useCallback(async () => {
    try {
      const res = await TestsAPI.listTests(token, { limit: 100 });
      setTests(res.items);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [token]);

  const loadAssignments = useCallback(async () => {
    try {
      const res = await TestsAPI.listAssignments(token);
      setAssignments(res.items);
    } catch {
      // non-critical
    }
  }, [token]);

  // Load each list independently so one failing request can't blank out the others
  // (e.g. a clients-call hiccup must not also hide the connection picker).
  const loadClients = useCallback(async () => {
    try {
      const c = await PackagesAPI.listCoachClients(token);
      setClients(c.items);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [token]);

  const loadPending = useCallback(async () => {
    try {
      const p = await ConnectionsAPI.listRequests(token, { status: 'PENDING' });
      setPending(p.items);
    } catch {
      // pending requests are non-critical for the dashboard
    }
  }, [token]);

  const loadConnections = useCallback(async () => {
    try {
      const conns = await ConnectionsAPI.listConnections(token, { limit: 100 });
      setConnections(conns.items);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [token]);

  const loadPlans = useCallback(async () => {
    try {
      const res = await PlansAPI.listPlans(token);
      setMyPlans(res.items.filter((pl) => pl.user_id === user?.id));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [token, user?.id]);

  const loadPackages = useCallback(async () => {
    try {
      const res = await PackagesAPI.listPackages(token);
      setPackages(res.items);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.allSettled([loadClients(), loadPending(), loadConnections(), loadPlans(), loadPackages(), loadTests(), loadAssignments()])
      .finally(() => setLoading(false));
  }, [token, loadClients, loadPending, loadConnections, loadPlans, loadPackages, loadTests, loadAssignments]);

  const acceptPending = async (reqId: string) => {
    try {
      await ConnectionsAPI.acceptRequest(token, reqId);
      toast.success(t('accepted'));
      // Accepting adds a connection (a potential client), not a client itself.
      await Promise.all([loadPending(), loadConnections()]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const declinePending = async (reqId: string) => {
    try {
      await ConnectionsAPI.rejectRequest(token, reqId);
      await loadPending();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const resetAssign = () => {
    setSelectedClient(null);
    setPkgPickerClient(null);
    setAssignConn(null);
    setShowConnPicker(false);
  };

  const assignPlanToClient = async (planId: string, clientId: string) => {
    try {
      await PlansAPI.assignPlan(token, planId, { user_id: clientId });
      toast.success(t('planAssigned'));
      resetAssign();
      await loadClients();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const assignPackageToClient = async (packageId: string, clientId: string) => {
    try {
      // Enrolls the user as a client (creates the subscription) and assigns plans.
      await PackagesAPI.assignPackage(token, packageId, { user_id: clientId });
      toast.success(t('packageAssigned'));
      resetAssign();
      await loadClients();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // Connections that aren't clients yet — candidates to enroll into a package.
  const clientIdSet = new Set(clients.map((c) => c.id));
  const candidateConnections = connections.filter((c) => !clientIdSet.has(c.id));
  const connQuery = connSearch.trim().toLowerCase();
  const filteredConnections = connQuery
    ? candidateConnections.filter(
        (c) => displayName(c).toLowerCase().includes(connQuery) || c.username.toLowerCase().includes(connQuery)
      )
    : candidateConnections;

  const unsubscribeClientPackage = async (packageId: string, clientId: string) => {
    if (!window.confirm(t('removePackageConfirm'))) return;
    try {
      await PackagesAPI.unsubscribeClient(token, packageId, clientId);
      toast.success(t('packageRemoved'));
      await loadClients();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const unassignPlanFromClient = async (planId: string, clientId: string) => {
    try {
      await PlansAPI.unassignPlan(token, planId, clientId);
      toast.success(t('planUnassigned'));
      await loadClients();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const assignTestTo = async (testId: string, client: User) => {
    try {
      await TestsAPI.requestTest(token, testId, client.id);
      toast.success(t('assignedToClient', { client: displayName(client) }));
      setReqPickerTest(null);
      await loadAssignments();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const deleteTest = async (id: string) => {
    if (!window.confirm(t('deleteTestConfirm'))) return;
    try {
      await TestsAPI.deleteTest(token, id);
      await loadTests();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const grantBadge = async (athleteId: string) => {
    const title = window.prompt(t('badgeTitlePrompt'));
    if (!title || !title.trim()) return;
    try {
      await AchievementsAPI.grantAchievement(token, { athlete_id: athleteId, title: title.trim() });
      toast.success(t('badgeGranted'));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const removePackage = async (id: string) => {
    try {
      await PackagesAPI.deletePackage(token, id);
      await loadPackages();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const sections: { key: Section; label: string; icon: typeof Users }[] = [
    { key: 'clients', label: t('clients'), icon: Users },
    { key: 'plans', label: t('plans'), icon: Calendar },
    { key: 'packages', label: t('packages'), icon: Package },
    { key: 'tests', label: t('testsTab'), icon: ClipboardList },
    { key: 'analytics', label: t('analytics'), icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-navy px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-navy-light rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl">{t('coachDashboard')}</h1>
          {onNavigate ? (
            <HamburgerMenu userRole={userRole} onNavigate={onNavigate} isPro={isPro} />
          ) : (
            <div className="w-10"></div>
          )}
        </div>

        {/* Section Selector — segmented control */}
        <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex-1 py-2 rounded-lg transition-all text-xs flex flex-col items-center justify-center gap-1 ${
                activeSection === key
                  ? 'bg-yellow-500 text-navy font-medium shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-28">
        {loading && <div className="text-center text-gray-500 py-8">{t('loading')}</div>}

        {/* CLIENTS SECTION */}
        {!loading && activeSection === 'clients' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-yellow-400" />
                  </span>
                  <span className="text-gray-300 text-xs">{t('activeClients')}</span>
                </div>
                <div className="text-3xl font-semibold text-white tabular-nums">{clients.length}</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-yellow-600" />
                  </span>
                  <span className="text-gray-500 text-xs">{t('packages')}</span>
                </div>
                <div className="text-3xl font-semibold text-navy tabular-nums">{packages.length}</div>
              </div>
            </div>

            {/* Pending requests */}
            {pending.length > 0 && (
              <div className="bg-white rounded-2xl border border-yellow-300 shadow-sm overflow-hidden">
                <div className="px-4 py-3.5 border-b border-yellow-100 flex items-center justify-between bg-yellow-50">
                  <div>
                    <h3 className="text-navy font-medium">{t('pendingClients')}</h3>
                    <p className="text-gray-600 text-xs mt-0.5">{t('newConnectionRequests')}</p>
                  </div>
                  <span className="w-7 h-7 flex items-center justify-center bg-yellow-500 text-navy rounded-full text-sm font-semibold tabular-nums">
                    {pending.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {pending.map((req) => (
                    <div key={req.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar user={req.user} />
                        <div className="flex-1">
                          <h4 className="text-navy mb-1">{displayName(req.user)}</h4>
                          <p className="text-gray-500 text-xs">@{req.user.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptPending(req.id)}
                          className="flex-1 py-2 bg-yellow-500 text-navy rounded-lg hover:bg-yellow-400 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{t('accept')}</span>
                        </button>
                        <button
                          onClick={() => declinePending(req.id)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        >
                          {t('decline')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clients list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-navy font-medium">{t('yourClients')}</h3>
                <button
                  onClick={() => { setShowConnPicker(!showConnPicker); setAssignConn(null); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    showConnPicker
                      ? 'text-gray-500 hover:bg-gray-100'
                      : 'bg-yellow-500 text-navy hover:bg-yellow-400'
                  }`}
                >
                  {showConnPicker ? (
                    t('cancel')
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {t('addClient')}
                    </>
                  )}
                </button>
              </div>

              {/* Enroll a connection into a package (panel inside the card) */}
              {showConnPicker && (
                <div className="border-b border-gray-100 bg-gray-50/60">
                  {packages.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-gray-500 text-sm mb-3">{t('noPackagesYet')}</p>
                      <button
                        onClick={() => onCreatePackage?.()}
                        className="px-3 py-1.5 bg-yellow-500 text-navy rounded-lg hover:bg-yellow-400 transition-colors text-sm inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        {t('createPackage')}
                      </button>
                    </div>
                  ) : candidateConnections.length === 0 ? (
                    <div className="p-5 text-center text-gray-500 text-sm">{t('noConnectionsToEnroll')}</div>
                  ) : (
                    <>
                      <div className="p-3">
                        <p className="text-gray-500 text-xs mb-2">{t('enrollConnectionHint')}</p>
                        <div className="relative">
                          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={connSearch}
                            onChange={(e) => setConnSearch(e.target.value)}
                            placeholder={t('searchConnections')}
                            className="w-full ps-10 pe-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm text-navy"
                          />
                        </div>
                      </div>
                      {filteredConnections.length === 0 ? (
                        <div className="px-4 pb-4 text-center text-gray-500 text-sm">{t('noResults')}</div>
                      ) : (
                        <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                          {filteredConnections.map((conn) => (
                            <div key={conn.id} className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar user={conn} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-navy text-sm truncate">{displayName(conn)}</div>
                                  <div className="text-gray-500 text-xs truncate">@{conn.username}</div>
                                </div>
                                <button
                                  onClick={() => setAssignConn(assignConn === conn.id ? null : conn.id)}
                                  className="px-3 py-1.5 bg-yellow-500 text-navy rounded-lg hover:bg-yellow-400 transition-colors text-sm whitespace-nowrap"
                                >
                                  {assignConn === conn.id ? t('cancel') : t('assignPackage')}
                                </button>
                              </div>
                              {assignConn === conn.id && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-gray-500 text-xs">{t('selectPackageToAssign')}</p>
                                  {packages.map((pkg) => (
                                    <button
                                      key={pkg.id}
                                      onClick={() => assignPackageToClient(pkg.id, conn.id)}
                                      className="w-full text-start p-3 bg-white rounded-lg hover:bg-yellow-50 border border-gray-200 hover:border-yellow-500 transition-colors"
                                    >
                                      <div className="text-navy text-sm">{pkg.name}</div>
                                      <div className="text-gray-500 text-xs">
                                        {t('plansIncludedCount', { count: String(pkg.plan_count) })}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {clients.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">{t('noClientsYet')}</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {clients.map((client) => {
                    const pkg = client.packages[0]; // a client holds at most one package
                    return (
                      <div key={client.id} className="p-4">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <Avatar user={client} />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-navy font-medium truncate">{displayName(client)}</h4>
                            <p className="text-gray-400 text-xs truncate">@{client.username}</p>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1 whitespace-nowrap">
                            {t('assignedPlansCount', { count: String(client.assigned_plans.length) })}
                          </span>
                        </div>

                        {/* Package */}
                        <div className="mt-4">
                          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                            {t('clientPackageLabel')}
                          </div>
                          {pkg ? (
                            <div className="flex items-center gap-3 bg-navy text-white rounded-xl px-4 py-3">
                              <Package className="w-5 h-5 text-yellow-400 shrink-0" />
                              <span className="flex-1 text-sm truncate">{pkg.package_name}</span>
                              <button
                                onClick={() => unsubscribeClientPackage(pkg.package_id, client.id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors whitespace-nowrap"
                              >
                                {t('removePackage')}
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => { setPkgPickerClient(pkgPickerClient === client.id ? null : client.id); setSelectedClient(null); }}
                                disabled={packages.length === 0}
                                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-navy rounded-xl py-3 text-sm hover:border-yellow-500 hover:bg-yellow-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Package className="w-4 h-4" />
                                {pkgPickerClient === client.id ? t('cancel') : t('assignPackage')}
                              </button>
                              {packages.length === 0 && (
                                <p className="text-gray-400 text-[11px] mt-1">{t('noPackagesYet')}</p>
                              )}
                              {pkgPickerClient === client.id && (
                                <div className="mt-2 space-y-2">
                                  {packages.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => assignPackageToClient(p.id, client.id)}
                                      className="w-full text-start p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                                    >
                                      <div className="text-navy text-sm">{p.name}</div>
                                      <div className="text-gray-500 text-xs">{t('plansIncludedCount', { count: String(p.plan_count) })}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Plans */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                              {t('clientPlansLabel')}
                            </span>
                            <button
                              onClick={() => { setSelectedClient(selectedClient === client.id ? null : client.id); setPkgPickerClient(null); }}
                              className="text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {selectedClient === client.id ? t('cancel') : t('addPlan')}
                            </button>
                          </div>

                          {client.assigned_plans.length === 0 ? (
                            <p className="text-gray-400 text-xs py-1">{t('noPlansAssignedYet')}</p>
                          ) : (
                            <div className="space-y-2">
                              {client.assigned_plans.map((ap) => (
                                <div key={ap.plan_id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                                  <span className="flex-1 min-w-0 text-navy text-sm truncate">{ap.plan_name}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${ap.package_id ? 'bg-navy/10 text-navy' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {ap.package_id ? t('fromPackageBadge') : t('manualBadge')}
                                  </span>
                                  <button
                                    onClick={() => unassignPlanFromClient(ap.plan_id, client.id)}
                                    title={t('unassign')}
                                    aria-label={t('unassign')}
                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {selectedClient === client.id && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                              {myPlans.length === 0 ? (
                                <p className="text-gray-500 text-xs">{t('noPlansToBundle')}</p>
                              ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto">
                                  {myPlans.map((plan) => (
                                    <button
                                      key={plan.id}
                                      onClick={() => assignPlanToClient(plan.id, client.id)}
                                      className="w-full text-start p-3 bg-white rounded-lg border border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                                    >
                                      <div className="text-navy text-sm">{plan.name}</div>
                                      {plan.exercise_count != null && (
                                        <div className="text-gray-500 text-xs">{t('exercises')}: {plan.exercise_count}</div>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* PLANS SECTION */}
        {!loading && activeSection === 'plans' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-navy font-medium">{t('yourPlans')}</h3>
                <button
                  onClick={() => (onCreatePlan ? onCreatePlan() : onNavigate?.('plan-builder'))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-500 text-navy hover:bg-yellow-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('create')}
                </button>
              </div>
              {myPlans.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">{t('noPlansToBundle')}</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myPlans.map((plan) => (
                    <div key={plan.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-navy">{plan.name}</h4>
                        {plan.public ? (
                          <Globe className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {plan.exercise_count != null && <span>{plan.exercise_count} {t('exercises')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* PACKAGES SECTION */}
        {!loading && activeSection === 'packages' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-navy font-medium">{t('yourPackages')}</h3>
                <button
                  onClick={() => onCreatePackage?.()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-500 text-navy hover:bg-yellow-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('create')}
                </button>
              </div>
              {packages.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">{t('noPackagesYet')}</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-navy">{pkg.name}</h4>
                            {pkg.popular && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                {t('popular')}
                              </span>
                            )}
                            {!pkg.is_active && (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                                {t('inactive')}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">
                            {t('plansIncludedCount', { count: String(pkg.plan_count) })}
                            {pkg.price_monthly != null && ` • ${pkg.price_monthly.toLocaleString()}${t('perMoShort')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onEditPackage?.(pkg.id)}
                          className="flex-1 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors text-sm"
                        >
                          {t('editPlan')}
                        </button>
                        <button
                          onClick={() => removePackage(pkg.id)}
                          className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* TESTS SECTION */}
        {!loading && activeSection === 'tests' && (
          <>
            {/* My protocols */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-navy font-medium flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-yellow-500" />
                  {t('myProtocols')}
                </h3>
                <button
                  onClick={() => onCreateTest?.()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-500 text-navy hover:bg-yellow-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('create')}
                </button>
              </div>
              {tests.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                  <ClipboardList className="w-9 h-9 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">{t('noTestsYet')}</p>
                  <p className="text-gray-400 text-xs mt-1">{t('coachProtocolsHint')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.map((test) => (
                    <div key={test.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="min-w-0">
                        <h4 className="text-navy font-medium truncate">{test.name}</h4>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {t('exercisesCountShort', { count: String(test.item_count) })}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setReqPickerTest(reqPickerTest === test.id ? null : test.id)}
                          className="flex-1 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors text-sm flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-4 h-4" />
                          {reqPickerTest === test.id ? t('cancel') : t('assignToClient')}
                        </button>
                        <button
                          onClick={() => onEditTest?.(test.id)}
                          className="px-3 py-2 border-2 border-gray-200 text-navy rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          aria-label={t('edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTest(test.id)}
                          className="px-3 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                          aria-label={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Assign-to-client picker (shared ConnectionPicker) */}
                      {reqPickerTest === test.id && (
                        <div className="mt-3 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                          <p className="text-gray-500 text-xs px-3 pt-2">{t('assignToWhom')}</p>
                          <ConnectionPicker connections={connections} onSelect={(u) => assignTestTo(test.id, u)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client assessments — mirrors the athlete view, per client */}
            {assignments.length > 0 && (
              <div>
                <h3 className="text-navy font-medium mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-500" />
                  {t('clientAssessments')}
                </h3>
                <div className="space-y-3">
                  {assignments.map((a) => (
                    <div key={`${a.test_id}:${a.athlete_id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                        <Avatar user={a.athlete} />
                        <div className="flex-1 min-w-0">
                          <div className="text-navy text-sm font-medium truncate">{displayName(a.athlete)}</div>
                          <div className="text-gray-400 text-xs truncate">{a.test_name}</div>
                        </div>
                        <div className="text-end shrink-0">
                          <div className="text-navy text-base font-semibold tabular-nums leading-none">{a.runs_count}</div>
                          <div className="text-gray-400 text-[10px] mt-0.5">{t('runsLabel')}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-400 text-xs truncate">
                          {a.last_run_at ? t('lastRunOn', { date: fmtDate(a.last_run_at) }) : t('clientNoRuns')}
                        </span>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => grantBadge(a.athlete_id)}
                            title={t('grantBadge')}
                            className="px-3 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors text-sm flex items-center"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onViewClientHistory?.(a.test_id, a.athlete_id, displayName(a.athlete))}
                            className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors text-sm flex items-center gap-1.5"
                          >
                            <LineChart className="w-4 h-4" />
                            {t('history')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ANALYTICS SECTION (static placeholder until the payments phase) */}
        {!loading && activeSection === 'analytics' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-600 text-sm">{t('activeClients')}</span>
              </div>
              <div className="text-4xl text-navy">{clients.length}</div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-600 text-sm">{t('totalPlans')}</span>
              </div>
              <div className="text-4xl text-navy">{myPlans.length}</div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-md border border-gray-200 col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <span className="text-gray-600 text-sm">{t('earnings')}</span>
                </div>
                <button onClick={() => onNavigate?.('wallet')} className="text-yellow-600 text-sm hover:text-yellow-700">
                  {t('wallet')} →
                </button>
              </div>
              <div className="text-3xl text-navy mb-1" dir="ltr">
                {wallet ? formatMoney(wallet.available, wallet.currency, language) : '—'}
              </div>
              <div className="text-gray-500 text-sm">{t('availableBalance')}</div>
              {wallet && wallet.pending > 0 && (
                <div className="text-gray-400 text-xs mt-1" dir="ltr">
                  + {formatMoney(wallet.pending, wallet.currency, language)} {t('pendingBalance')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ user }: { user: { avatar?: { url?: string | null }; username: string } }) {
  if (user.avatar?.url) {
    return <img src={user.avatar.url} alt={user.username} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-14 h-14 rounded-full bg-navy-light text-white flex items-center justify-center flex-shrink-0 uppercase">
      {user.username.slice(0, 2)}
    </div>
  );
}

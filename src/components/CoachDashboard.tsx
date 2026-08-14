import { useCallback, useEffect, useState } from 'react';
import { Users, Calendar, TrendingUp, DollarSign, Package, CheckCircle, Plus, Trash2, Lock, Globe, UserPlus, Search, ClipboardList, Send, Award, LineChart, Pencil, Dumbbell, ChevronRight } from 'lucide-react';
import { BackButton } from './ui/back-button';
import { Button } from './ui/button';
import { Segmented } from './ui/segmented';
import { StatCard } from './ui/stat-card';
import { HamburgerMenu } from './HamburgerMenu';
import { ConnectionPicker } from './ConnectionPicker';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ConnectionsAPI, PackagesAPI, PlansAPI, TestsAPI, AchievementsAPI } from '../api';
import * as WalletAPI from '../api/wallet';
import { formatMoney } from '../lib/money';
import type { CoachClient, CoachPackage, Plan, User, Test, CoachAssignment, WalletBalance, WalletIncome } from '../api/types';
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
  onViewClient?: (clientId: string, clientName: string) => void;
  // Active tab, lifted to the parent so it survives navigating away and back.
  section?: string;
  onSectionChange?: (s: string) => void;
}

type Section = 'clients' | 'plans' | 'packages' | 'tests' | 'analytics';

const displayName = (u: { first_name?: string | null; last_name?: string | null; username: string }) => {
  const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
  return full || u.username;
};

export function CoachDashboard({ onBack, onNavigate, userRole = 'coach', isPro = false, onCreatePackage, onEditPackage, onCreatePlan, onCreateTest, onEditTest, onViewClientHistory, onViewClient, section, onSectionChange }: CoachDashboardProps) {
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

  // Coach earnings (cumulative income) + wallet balance, loaded when the
  // analytics tab is open. Income is what they've earned; the wallet balance is
  // what's currently spendable (net of payouts/escrow) — they are not the same.
  useEffect(() => {
    if (activeSection !== 'analytics' || !token) return;
    WalletAPI.getWallet(token).then(setWallet).catch(() => setWallet(null));
    WalletAPI.getIncome(token).then(setIncome).catch(() => setIncome(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, token]);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [income, setIncome] = useState<WalletIncome | null>(null);
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

  const sections: { value: Section; label: string; icon: typeof Users }[] = [
    { value: 'clients', label: t('clients'), icon: Users },
    { value: 'plans', label: t('plans'), icon: Calendar },
    { value: 'packages', label: t('packages'), icon: Package },
    { value: 'tests', label: t('testsTab'), icon: ClipboardList },
    { value: 'analytics', label: t('analytics'), icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <BackButton onClick={onBack} aria-label={t('back')} />
          <h1 className="text-foreground text-xl">{t('coachDashboard')}</h1>
          {onNavigate ? (
            <HamburgerMenu userRole={userRole} onNavigate={onNavigate} isPro={isPro} />
          ) : (
            <div className="w-10"></div>
          )}
        </div>

        {/* Section Selector — segmented control */}
        <Segmented options={sections} value={activeSection} onChange={setActiveSection} />
      </div>

      <div className="p-4 space-y-4 pb-28">
        {loading && <div className="text-center text-muted-foreground py-8">{t('loading')}</div>}

        {/* CLIENTS SECTION */}
        {!loading && activeSection === 'clients' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users} value={clients.length} label={t('activeClients')} />
              <StatCard icon={Package} value={packages.length} label={t('packages')} accent={false} />
            </div>

            {/* Pending requests */}
            {pending.length > 0 && (
              <div className="bg-card rounded-2xl border border-tint/30 shadow-sm overflow-hidden">
                <div className="px-4 py-3.5 border-b border-tint/15 flex items-center justify-between bg-tint-soft">
                  <div>
                    <h3 className="text-foreground font-medium">{t('pendingClients')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('newConnectionRequests')}</p>
                  </div>
                  <span className="w-7 h-7 flex items-center justify-center bg-tint text-tint-fg rounded-full text-sm font-semibold tabular-nums">
                    {pending.length}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {pending.map((req) => (
                    <div key={req.id} className="p-5 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar user={req.user} />
                        <div className="flex-1">
                          <h4 className="text-foreground mb-1">{displayName(req.user)}</h4>
                          <p className="text-muted-foreground text-xs">@{req.user.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="brand" size="sm" icon={<CheckCircle />} onClick={() => acceptPending(req.id)} className="flex-1">
                          {t('accept')}
                        </Button>
                        <button
                          onClick={() => declinePending(req.id)}
                          className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-secondary transition-colors text-sm"
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
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-foreground font-medium">{t('yourClients')}</h3>
                <button
                  onClick={() => { setShowConnPicker(!showConnPicker); setAssignConn(null); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    showConnPicker
                      ? 'text-muted-foreground hover:bg-muted'
                      : 'bg-tint text-tint-fg hover:bg-tint-2'
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
                <div className="border-b border-border bg-muted/60">
                  {packages.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-muted-foreground text-sm mb-3">{t('noPackagesYet')}</p>
                      <Button variant="brand" size="sm" icon={<Plus />} onClick={() => onCreatePackage?.()}>
                        {t('createPackage')}
                      </Button>
                    </div>
                  ) : candidateConnections.length === 0 ? (
                    <div className="p-5 text-center text-muted-foreground text-sm">{t('noConnectionsToEnroll')}</div>
                  ) : (
                    <>
                      <div className="p-3">
                        <p className="text-muted-foreground text-xs mb-2">{t('enrollConnectionHint')}</p>
                        <div className="relative">
                          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={connSearch}
                            onChange={(e) => setConnSearch(e.target.value)}
                            placeholder={t('searchConnections')}
                            className="w-full ps-10 pe-3 py-2 bg-card border border-border rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent text-sm text-foreground"
                          />
                        </div>
                      </div>
                      {filteredConnections.length === 0 ? (
                        <div className="px-4 pb-4 text-center text-muted-foreground text-sm">{t('noResults')}</div>
                      ) : (
                        <div className="divide-y divide-border max-h-72 overflow-y-auto">
                          {filteredConnections.map((conn) => (
                            <div key={conn.id} className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar user={conn} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-foreground text-sm truncate">{displayName(conn)}</div>
                                  <div className="text-muted-foreground text-xs truncate">@{conn.username}</div>
                                </div>
                                <Button variant="brand" size="sm" onClick={() => setAssignConn(assignConn === conn.id ? null : conn.id)} className="whitespace-nowrap">
                                  {assignConn === conn.id ? t('cancel') : t('assignPackage')}
                                </Button>
                              </div>
                              {assignConn === conn.id && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-muted-foreground text-xs">{t('selectPackageToAssign')}</p>
                                  {packages.map((pkg) => (
                                    <button
                                      key={pkg.id}
                                      onClick={() => assignPackageToClient(pkg.id, conn.id)}
                                      className="w-full text-start p-3 bg-card rounded-lg hover:bg-tint-soft border border-border hover:border-tint transition-colors"
                                    >
                                      <div className="text-foreground text-sm">{pkg.name}</div>
                                      <div className="text-muted-foreground text-xs">
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
                <div className="p-8 text-center text-muted-foreground text-sm">{t('noClientsYet')}</div>
              ) : (
                <div className="divide-y divide-border">
                  {clients.map((client) => {
                    const pkg = client.packages[0]; // a client holds at most one package
                    return (
                      <div key={client.id} className="p-4">
                        {/* Header — tap to open the client's analytics */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onViewClient?.(client.id, displayName(client))}
                            className="flex items-center gap-3 flex-1 min-w-0 text-start hover:opacity-80 transition-opacity"
                          >
                            <Avatar user={client} />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-foreground font-medium truncate">{displayName(client)}</h4>
                              <p className="text-muted-foreground text-xs truncate">@{client.username}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </button>
                          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1 whitespace-nowrap">
                            {t('assignedPlansCount', { count: String(client.assigned_plans.length) })}
                          </span>
                        </div>

                        {/* Package */}
                        <div className="mt-4">
                          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            {t('clientPackageLabel')}
                          </div>
                          {pkg ? (
                            <div className="flex items-center gap-3 bg-tint-soft text-tint-ink rounded-xl px-4 py-3 border border-tint/15">
                              <Package className="w-5 h-5 text-tint-ink shrink-0" />
                              <span className="flex-1 text-sm font-medium text-foreground truncate">{pkg.package_name}</span>
                              <button
                                onClick={() => unsubscribeClientPackage(pkg.package_id, client.id)}
                                className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors whitespace-nowrap"
                              >
                                {t('removePackage')}
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => { setPkgPickerClient(pkgPickerClient === client.id ? null : client.id); setSelectedClient(null); }}
                                disabled={packages.length === 0}
                                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border text-foreground rounded-xl py-3 text-sm hover:border-tint hover:bg-tint-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Package className="w-4 h-4" />
                                {pkgPickerClient === client.id ? t('cancel') : t('assignPackage')}
                              </button>
                              {packages.length === 0 && (
                                <p className="text-muted-foreground text-[11px] mt-1">{t('noPackagesYet')}</p>
                              )}
                              {pkgPickerClient === client.id && (
                                <div className="mt-2 space-y-2">
                                  {packages.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => assignPackageToClient(p.id, client.id)}
                                      className="w-full text-start p-3 bg-muted rounded-xl border border-border hover:border-tint hover:bg-tint-soft transition-colors"
                                    >
                                      <div className="text-foreground text-sm">{p.name}</div>
                                      <div className="text-muted-foreground text-xs">{t('plansIncludedCount', { count: String(p.plan_count) })}</div>
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
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                              {t('clientPlansLabel')}
                            </span>
                            <button
                              onClick={() => { setSelectedClient(selectedClient === client.id ? null : client.id); setPkgPickerClient(null); }}
                              className="text-xs text-tint-ink hover:text-tint font-medium flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {selectedClient === client.id ? t('cancel') : t('addPlan')}
                            </button>
                          </div>

                          {client.assigned_plans.length === 0 ? (
                            <p className="text-muted-foreground text-xs py-1">{t('noPlansAssignedYet')}</p>
                          ) : (
                            <div className="space-y-2">
                              {client.assigned_plans.map((ap) => (
                                <div key={ap.plan_id} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                                  <span className="flex-1 min-w-0 text-foreground text-sm truncate">{ap.plan_name}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${ap.package_id ? 'bg-tint-soft text-tint-ink' : 'bg-muted text-muted-foreground'}`}>
                                    {ap.package_id ? t('fromPackageBadge') : t('manualBadge')}
                                  </span>
                                  <button
                                    onClick={() => unassignPlanFromClient(ap.plan_id, client.id)}
                                    title={t('unassign')}
                                    aria-label={t('unassign')}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {selectedClient === client.id && (
                            <div className="mt-2 p-3 bg-muted rounded-xl border border-border">
                              {myPlans.length === 0 ? (
                                <p className="text-muted-foreground text-xs">{t('noPlansToBundle')}</p>
                              ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto">
                                  {myPlans.map((plan) => (
                                    <button
                                      key={plan.id}
                                      onClick={() => assignPlanToClient(plan.id, client.id)}
                                      className="w-full text-start p-3 bg-card rounded-lg border border-border hover:border-tint hover:bg-tint-soft transition-colors"
                                    >
                                      <div className="text-foreground text-sm">{plan.name}</div>
                                      {plan.exercise_count != null && (
                                        <div className="text-muted-foreground text-xs">{t('exercises')}: {plan.exercise_count}</div>
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
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-foreground font-medium">{t('yourPlans')}</h3>
                <Button variant="brand" size="sm" icon={<Plus />} onClick={() => (onCreatePlan ? onCreatePlan() : onNavigate?.('plan-builder'))}>
                  {t('create')}
                </Button>
              </div>
              {myPlans.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">{t('noPlansToBundle')}</div>
              ) : (
                <div className="divide-y divide-border">
                  {myPlans.map((plan) => (
                    <div key={plan.id} className="p-4 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-foreground">{plan.name}</h4>
                        {plan.public ? (
                          <Globe className="w-4 h-4 text-tint-ink" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
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
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-foreground font-medium">{t('yourPackages')}</h3>
                <Button variant="brand" size="sm" icon={<Plus />} onClick={() => onCreatePackage?.()}>
                  {t('create')}
                </Button>
              </div>
              {packages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">{t('noPackagesYet')}</div>
              ) : (
                <div className="divide-y divide-border">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="p-4 hover:bg-muted transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-foreground">{pkg.name}</h4>
                            {pkg.popular && (
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                                {t('popular')}
                              </span>
                            )}
                            {!pkg.is_active && (
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                                {t('inactive')}
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {t('plansIncludedCount', { count: String(pkg.plan_count) })}
                            {pkg.price_monthly != null && ` • ${formatMoney(pkg.price_monthly, pkg.currency, language)}${t('perMoShort')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onEditPackage?.(pkg.id)}
                          className="flex-1 py-2 bg-tint text-tint-fg rounded-lg hover:bg-tint-2 transition-colors text-sm"
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
                <h3 className="text-foreground font-medium flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-tint-ink" />
                  {t('myProtocols')}
                </h3>
                <Button variant="brand" size="sm" icon={<Plus />} onClick={() => onCreateTest?.()}>
                  {t('create')}
                </Button>
              </div>
              {tests.length === 0 ? (
                <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-sm">
                  <ClipboardList className="w-9 h-9 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">{t('noTestsYet')}</p>
                  <p className="text-muted-foreground text-xs mt-1">{t('coachProtocolsHint')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.map((test) => (
                    <div key={test.id} className="bg-card rounded-2xl border border-border shadow-sm p-4">
                      <div className="min-w-0">
                        <h4 className="text-foreground font-medium truncate">{test.name}</h4>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {t('exercisesCountShort', { count: String(test.item_count) })}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setReqPickerTest(reqPickerTest === test.id ? null : test.id)}
                          className="flex-1 py-2 bg-tint text-tint-fg rounded-lg hover:bg-tint-2 transition-colors text-sm flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-4 h-4" />
                          {reqPickerTest === test.id ? t('cancel') : t('assignToClient')}
                        </button>
                        <button
                          onClick={() => onEditTest?.(test.id)}
                          className="px-3 py-2 border-2 border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm"
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
                        <div className="mt-3 bg-muted rounded-xl border border-border overflow-hidden">
                          <p className="text-muted-foreground text-xs px-3 pt-2">{t('assignToWhom')}</p>
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
                <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-tint-ink" />
                  {t('clientAssessments')}
                </h3>
                <div className="space-y-3">
                  {assignments.map((a) => (
                    <div key={`${a.test_id}:${a.athlete_id}`} className="bg-card rounded-2xl border border-border shadow-sm p-4">
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                        <Avatar user={a.athlete} />
                        <div className="flex-1 min-w-0">
                          <div className="text-foreground text-sm font-medium truncate">{displayName(a.athlete)}</div>
                          <div className="text-muted-foreground text-xs truncate">{a.test_name}</div>
                        </div>
                        <div className="text-end shrink-0">
                          <div className="text-foreground text-base font-semibold tabular-nums leading-none">{a.runs_count}</div>
                          <div className="text-muted-foreground text-[10px] mt-0.5">{t('runsLabel')}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs truncate">
                          {a.last_run_at ? t('lastRunOn', { date: fmtDate(a.last_run_at) }) : t('clientNoRuns')}
                        </span>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => grantBadge(a.athlete_id)}
                            title={t('grantBadge')}
                            className="px-3 py-2 border border-tint/30 text-tint-ink rounded-lg hover:bg-tint-soft transition-colors text-sm flex items-center"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onViewClientHistory?.(a.test_id, a.athlete_id, displayName(a.athlete))}
                            className="px-4 py-2 bg-tint text-tint-fg rounded-lg hover:bg-tint-2 transition-colors text-sm flex items-center gap-1.5"
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
            {/* Coaching/business analytics only — the coach's own training analytics
                now lives in the side menu, kept separate from their work metrics. */}
            <div className="bg-card rounded-lg p-5 shadow-md border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-tint-ink" />
                <span className="text-muted-foreground text-sm">{t('activeClients')}</span>
              </div>
              <div className="text-4xl text-foreground">{clients.length}</div>
            </div>
            <div className="bg-card rounded-lg p-5 shadow-md border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-tint-ink" />
                <span className="text-muted-foreground text-sm">{t('totalPlans')}</span>
              </div>
              <div className="text-4xl text-foreground">{myPlans.length}</div>
            </div>
            {/* Income — each figure gets its own full-width card, because Toman
                amounts are long and collide in a 2-up grid. Income is cumulative
                earnings; the wallet balance below is what's actually spendable. */}
            <div className="col-span-2 flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-tint-ink" />
                <span className="text-muted-foreground text-sm">{t('earnings')}</span>
              </div>
              <button onClick={() => onNavigate?.('wallet')} className="text-tint-ink text-sm hover:text-tint-ink">
                {t('wallet')} →
              </button>
            </div>

            <div className="bg-card rounded-lg p-5 shadow-md border border-border col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">{t('totalIncome')}</span>
              </div>
              <div
                className="text-3xl text-foreground font-semibold tabular-nums break-words leading-tight"
                dir="ltr"
              >
                {income ? formatMoney(income.total, income.currency, language) : '—'}
              </div>
            </div>

            <div className="bg-card rounded-lg p-5 shadow-md border border-border col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">{t('thisMonthIncome')}</span>
              </div>
              <div
                className="text-3xl text-foreground font-semibold tabular-nums break-words leading-tight"
                dir="ltr"
              >
                {income ? formatMoney(income.month, income.currency, language) : '—'}
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 shadow-md border border-border col-span-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground text-sm shrink-0">{t('availableBalance')}</span>
                <span className="text-foreground font-medium tabular-nums text-end break-words" dir="ltr">
                  {wallet ? formatMoney(wallet.available, wallet.currency, language) : '—'}
                </span>
              </div>
              {wallet && wallet.pending > 0 && (
                <div className="flex items-baseline justify-between gap-3 mt-1.5">
                  <span className="text-muted-foreground text-xs shrink-0">{t('pendingBalance')}</span>
                  <span className="text-muted-foreground text-xs tabular-nums text-end break-words" dir="ltr">
                    + {formatMoney(wallet.pending, wallet.currency, language)}
                  </span>
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
    <div className="w-14 h-14 rounded-full bg-tint-2 text-tint-fg flex items-center justify-center flex-shrink-0 uppercase">
      {user.username.slice(0, 2)}
    </div>
  );
}

import { useEffect, useState, useMemo, useCallback, type MouseEvent, type TouchEvent } from 'react';
import { Plus, Play, Calendar, Clock, Dumbbell, Trophy, User, X, Trash2, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { HamburgerMenu } from './HamburgerMenu';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as PlansAPI from '../api/plans';
import * as PlanSchedulesAPI from '../api/planSchedules';
import * as SessionsAPI from '../api/sessions';
import type { Plan, PlanSchedule, Session } from '../api/types';

interface WorkoutsHomeProps {
  onStartSession: (planId?: string, scheduleId?: string) => void;
  onCreatePlan: () => void;
  onFindCoach?: () => void; // open Discover pre-filtered to coaches
  onViewPlan?: (planId: string) => void;
  userRole: UserRole;
  onNavigate: (view: string) => void;
  onResumeSession?: () => void;
  onDiscardSession?: () => void;
  isPro?: boolean;
  refreshTrigger?: number; // Timestamp to trigger refresh
}

const ACTIVE_SESSION_KEY = 'coachwise-active-session';

interface WorkoutPlan {
  id: string;
  name: string;
  estimatedSeconds: number;
  type: 'strength' | 'climbing';
  source: 'personal' | 'assigned';
  coachName?: string;
  exercises: number;
}

interface ScheduledWorkout {
  id: string;
  dateStr: string;
  planId: string;
  status: string;
}

interface CompletedWorkout {
  id: string;
  dateStr: string;
  planId?: string;
  sessionType: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  totalSets?: number;
  totalReps?: number;
  exercisesCompleted?: number;
  intensity?: number;
  quality?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_RADIUS = 3; // show +/-3 days around center (7 total)

const initialSchedule: ScheduledWorkout[] = [];

const normalizeDate = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const dateKey = (date: Date) => date.toISOString().split('T')[0];

// Session status check - only sessions have COMPLETED status, not schedules
const isCompletedStatus = (status?: string) => (status || '').toUpperCase() === 'COMPLETED';

const buildRangeDays = (center: Date) => {
  const start = new Date(normalizeDate(center).getTime() - WINDOW_RADIUS * DAY_MS);
  return Array.from({ length: WINDOW_RADIUS * 2 + 1 }, (_, i) => new Date(start.getTime() + i * DAY_MS));
};

const formatRangeLabel = (days: Date[], locale?: string) => {
  if (!days.length) return '';
  const start = days[0];
  const end = days[days.length - 1];
  const fmt = (d: Date) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
};

const windowKey = (center: Date) => {
  const start = new Date(normalizeDate(center).getTime() - WINDOW_RADIUS * DAY_MS);
  const end = new Date(start.getTime() + WINDOW_RADIUS * 2 * DAY_MS);
  return `${dateKey(start)}:${dateKey(end)}`;
};

export function WorkoutsHome({ onStartSession, onCreatePlan, onFindCoach, onViewPlan, userRole, onNavigate, onResumeSession, onDiscardSession, isPro = true, refreshTrigger }: WorkoutsHomeProps) {
  const { t, language, isRTL } = useLanguage();

  // An in-progress session (started then left) that can be resumed or discarded.
  const [activeSession, setActiveSession] = useState<{ sessionId?: string; planId?: string } | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    try { setActiveSession(raw ? JSON.parse(raw) : null); } catch { setActiveSession(null); }
  }, [refreshTrigger]);
  const { tokens, user } = useAuth();
  // Use the Persian (Jalali/Shamsi) calendar with Persian month/day names when in Persian.
  const dateLocale = language === 'fa' ? 'fa-IR-u-ca-persian' : undefined;

  const [libraryPlans, setLibraryPlans] = useState<WorkoutPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [futureSchedules, setFutureSchedules] = useState<ScheduledWorkout[]>([]);
  const [pastSessions, setPastSessions] = useState<CompletedWorkout[]>([]);
  const [dailyAnalytics, setDailyAnalytics] = useState<Map<string, SessionsAPI.DailyAnalytics>>(new Map());
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [schedulesLoaded, setSchedulesLoaded] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  const [centerDate, setCenterDate] = useState(normalizeDate(new Date()));
  const [selectedDate, setSelectedDate] = useState(normalizeDate(new Date()));
  const [isScheduling, setIsScheduling] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);

  const visibleDays = useMemo(() => buildRangeDays(centerDate), [centerDate]);
  const canStartToday = useMemo(() => dateKey(selectedDate) === dateKey(new Date()), [selectedDate]);

  const planLookup = useMemo(() => {
    const map = new Map<string, WorkoutPlan>();
    libraryPlans.forEach(plan => map.set(plan.id, plan));
    return map;
  }, [libraryPlans]);

  const getPlanInfo = (planId: string): WorkoutPlan => {
    return (
      planLookup.get(planId) || {
        id: planId,
        name: t('workoutPlan'),
        estimatedSeconds: 0,
        type: 'strength',
        source: 'personal',
        exercises: 0,
      }
    );
  };

  const loadPlans = useCallback(async () => {
    if (!tokens?.access_token) {
      setLibraryPlans([]);
      setPlanError(null);
      return;
    }
    setLoadingPlans(true);
    setPlanError(null);
    try {
      const response = await PlansAPI.listPlans(tokens.access_token);
      const plans = response.items;

      // exercise_count and estimated_seconds come from the list response — no
      // per-plan request needed.
      const mappedPlans = plans.map((plan: Plan) => {
        // A plan owned by someone else (the coach) is one assigned to me.
        const assigned = !!plan.user && plan.user.id !== user?.id;
        const owner = plan.user;
        const coachName = owner
          ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.username
          : undefined;
        return {
          id: plan.id,
          name: plan.name,
          estimatedSeconds: plan.estimated_seconds ?? 0,
          type: 'strength' as const,
          source: (assigned ? 'assigned' : 'personal') as 'assigned' | 'personal',
          coachName: assigned ? coachName : undefined,
          exercises: plan.exercise_count ?? 0,
        };
      });

      setLibraryPlans(mappedPlans);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('unableToLoadPlans');
      setPlanError(msg);
      setLibraryPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  }, [tokens?.access_token, user?.id]);

  const loadAllFutureSchedules = useCallback(async () => {
    if (!tokens?.access_token) {
      setFutureSchedules(initialSchedule);
      setSchedulesLoaded(true);
      return;
    }

    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const today = dateKey(new Date());
      const response = await PlanSchedulesAPI.listPlanSchedules(tokens.access_token, {
        limit: 100,
      });

      const schedules = response.items;

      const mapped: ScheduledWorkout[] = schedules
        .filter((schedule: PlanSchedule) => Boolean(schedule.plan_id))
        .map((schedule: PlanSchedule) => {
          const status = schedule.status || 'ACTIVE';
          const rawDate = schedule.scheduled_for || schedule.created_at || '';
          const dateStr = rawDate.split('T')[0] || today;

          return {
            id: schedule.id,
            planId: schedule.plan_id as string,
            dateStr,
            status,
          };
        })
        .filter(item => item.status.toUpperCase() === 'ACTIVE');

      setFutureSchedules(mapped);
      setSchedulesLoaded(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('unableToLoadSchedules');
      setScheduleError(msg);
    } finally {
      setScheduleLoading(false);
    }
  }, [tokens?.access_token]);

  const loadPastSessions = useCallback(async () => {
    if (!tokens?.access_token) return;

    try {
      const response = await SessionsAPI.listSessions(tokens.access_token, {
        limit: 100,
      });

      const sessions = response.items;

      const mapped: CompletedWorkout[] = sessions
        .map((session: Session) => {
          const dateStr = session.started_at.split('T')[0];
          return {
            id: session.id,
            dateStr,
            planId: session.plan_id || undefined,
            sessionType: session.session_type,
            status: session.status,
            startedAt: session.started_at,
            endedAt: session.ended_at || undefined,
            intensity: session.intensity || undefined,
            quality: session.quality || undefined,
          };
        });

      setPastSessions(mapped);
      setSessionsLoaded(true);
    } catch (err) {
      console.error('Failed to load past sessions:', err);
    }
  }, [tokens?.access_token]);

  const loadDailyAnalytics = useCallback(async () => {
    if (!tokens?.access_token) return;

    try {
      const response = await SessionsAPI.listDailyAnalytics(tokens.access_token, {
        limit: 30, // Load last 30 days of analytics
      });

      const analyticsMap = new Map<string, SessionsAPI.DailyAnalytics>();
      response.items.forEach(item => {
        analyticsMap.set(item.date, item);
      });

      setDailyAnalytics(analyticsMap);
      setAnalyticsLoaded(true);
    } catch (err) {
      console.error('Failed to load daily analytics:', err);
    }
  }, [tokens?.access_token]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Load schedules and sessions on mount and when refreshTrigger changes
  useEffect(() => {
    if (!schedulesLoaded || refreshTrigger) {
      loadAllFutureSchedules();
    }
    if (!sessionsLoaded || refreshTrigger) {
      loadPastSessions();
    }
    if (!analyticsLoaded || refreshTrigger) {
      loadDailyAnalytics();
    }
  }, [refreshTrigger]); // Only depend on refreshTrigger, not the function itself

  useEffect(() => {
    const inRange = visibleDays.some(day => dateKey(day) === dateKey(selectedDate));
    if (!inRange) {
      const fallback = visibleDays[Math.floor(visibleDays.length / 2)];
      setSelectedDate(fallback);
    }
  }, [visibleDays, selectedDate]);

  const handleScheduleWorkout = async (planId: string) => {
    const dateStr = dateKey(selectedDate);
    const planExists = getPlanInfo(planId);
    if (!planExists) return;

    if (!tokens?.access_token) {
      const newSchedule = { id: Math.random().toString(36).slice(2), planId, dateStr, status: 'SCHEDULED' };
      setFutureSchedules(prev => [...prev, newSchedule]);
      setIsScheduling(false);
      return;
    }

    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const created = await PlanSchedulesAPI.createPlanSchedule(tokens.access_token, {
        plan_id: planId,
        scheduled_for: dateStr,
        status: 'ACTIVE',
      });
      setFutureSchedules(prev => [...prev, {
        id: created.id,
        planId: created.plan_id,
        dateStr: created.scheduled_for?.split('T')[0] || dateStr,
        status: created.status,
      }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('unableToScheduleWorkout');
      setScheduleError(msg);
    } finally {
      setScheduleLoading(false);
      setIsScheduling(false);
    }
  };

  const handleRemoveWorkout = async (instanceId: string, e?: MouseEvent | TouchEvent) => {
    if (e) e.stopPropagation();

    if (!tokens?.access_token) {
      setFutureSchedules(prev => prev.filter(item => item.id !== instanceId));
      return;
    }

    try {
      await PlanSchedulesAPI.updatePlanSchedule(tokens.access_token, instanceId, { status: 'CANCELED' });
      setFutureSchedules(prev => prev.filter(item => item.id !== instanceId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('unableToRemoveWorkout');
      setScheduleError(msg);
    }
  };

  const handleStartScheduledWorkout = async (instanceId: string, planId?: string) => {
    if (!canStartToday) {
      setScheduleError(t('onlyStartTodayError'));
      return;
    }

    // Schedules are always ACTIVE (we filter for that), just start the session
    onStartSession(planId, instanceId);
  };


  const currentWorkouts = useMemo(() => {
    const key = dateKey(selectedDate);
    const isPast = selectedDate < normalizeDate(new Date());
    const isToday = dateKey(selectedDate) === dateKey(new Date());

    if (isPast) {
      // Show completed sessions for past dates
      const daySessions = pastSessions.filter(s => s.dateStr === key);
      return daySessions.map(session => {
        const plan = session.planId ? getPlanInfo(session.planId) : {
          id: session.id,
          name: `${session.sessionType} Session`,
          estimatedSeconds: 0,
          type: 'strength' as const,
          source: 'personal' as const,
          exercises: 0,
        };
        return {
          ...plan,
          planId: session.planId, // real plan id (undefined for freestyle) — NOT plan.id, which falls back to session.id
          instanceId: session.id,
          completed: true,
          status: session.status,
          sessionData: session, // Include full session data for analytics
        };
      });
    } else if (isToday) {
      // For today: show both sessions and schedules, but avoid duplicates
      const daySessions = pastSessions.filter(s => s.dateStr === key);
      const daySchedules = futureSchedules.filter(s => s.dateStr === key);

      // Create a map to track which plan IDs have completed sessions
      const completedPlanIds = new Set<string>();
      daySessions.forEach(session => {
        if (session.planId) {
          completedPlanIds.add(session.planId);
        }
      });

      // Show completed sessions
      const sessionWorkouts = daySessions.map(session => {
        const plan = session.planId ? getPlanInfo(session.planId) : {
          id: session.id,
          name: `${session.sessionType} Session`,
          estimatedSeconds: 0,
          type: 'strength' as const,
          source: 'personal' as const,
          exercises: 0,
        };
        return {
          ...plan,
          planId: session.planId, // real plan id (undefined for freestyle) — NOT plan.id, which falls back to session.id
          instanceId: session.id,
          completed: true,
          status: session.status,
          sessionData: session, // Include full session data for analytics
        };
      });

      // Show schedules, but exclude ones that have already been completed as sessions
      const scheduleWorkouts = daySchedules
        .filter(item => !completedPlanIds.has(item.planId))
        .map(item => {
          const plan = getPlanInfo(item.planId);
          return {
            ...plan,
            planId: item.planId,
            instanceId: item.id,
            completed: false, // Schedules are never completed, only sessions are
            status: item.status,
          };
        });

      return [...sessionWorkouts, ...scheduleWorkouts];
    } else {
      // Show scheduled workouts for future dates
      const daySchedules = futureSchedules.filter(s => s.dateStr === key);
      return daySchedules.map(item => {
        const plan = getPlanInfo(item.planId);
        return {
          ...plan,
          planId: item.planId,
          instanceId: item.id,
          completed: false, // Schedules are never completed, only sessions are
          status: item.status,
        };
      });
    }
  }, [futureSchedules, pastSessions, selectedDate, planLookup]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const shiftWindow = (days: number) => {
    setCenterDate(prev => new Date(prev.getTime() + days * DAY_MS));
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 40) shiftWindow(-3);
    if (deltaX < -40) shiftWindow(3);
    setTouchStartX(null);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setMouseStartX(e.clientX);
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (mouseStartX === null) return;
    const deltaX = e.clientX - mouseStartX;
    if (deltaX > 40) shiftWindow(-3);
    if (deltaX < -40) shiftWindow(3);
    setMouseStartX(null);
  };

  const rangeLabel = formatRangeLabel(visibleDays, dateLocale);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-navy px-4 pt-6 pb-8 rounded-b-[2rem] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-2xl font-bold">{t('workouts')}</h1>
            <p className="text-gray-300 text-sm">{t('swipeToBrowse')}</p>
          </div>
          <HamburgerMenu userRole={userRole} onNavigate={onNavigate} isPro={isPro} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
          <button
            onClick={() => shiftWindow(-3)}
            className="p-2 rounded-lg bg-navy-light hover:bg-navy-light/80 text-white"
            aria-label={t('previousDays')}
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{rangeLabel}</span>
            <button
              onClick={() => {
                const today = normalizeDate(new Date());
                setCenterDate(today);
                setSelectedDate(today);
              }}
              className="px-3 py-1 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-navy text-xs font-bold transition-colors"
            >
              {t('today')}
            </button>
          </div>
          <button
            onClick={() => shiftWindow(3)}
            className="p-2 rounded-lg bg-navy-light hover:bg-navy-light/80 text-white"
            aria-label={t('nextDays')}
          >
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        <div
          className="flex items-center gap-2 overflow-x-auto p-2 bg-navy-light rounded-2xl select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setMouseStartX(null)}
        >
          {visibleDays.map((date) => {
            const key = dateKey(date);
            const isToday = key === dateKey(new Date());
            const isPast = date < normalizeDate(new Date());
            const hasData = isPast
              ? pastSessions.some(s => s.dateStr === key)
              : futureSchedules.some(s => s.dateStr === key);
            const selected = key === dateKey(selectedDate);

            // Styling logic:
            // - Today always gets full yellow background
            // - Selected (non-today) gets only colored border
            // - When scheduling and not today/selected, show orange border
            // - Otherwise default dark background
            let buttonClasses = 'flex flex-col items-center justify-center w-12 h-16 rounded-xl transition-all ';
            if (isToday) {
              buttonClasses += 'bg-yellow-500 text-navy shadow-lg font-bold';
            } else if (selected) {
              buttonClasses += 'text-white bg-[#141457] border-2 border-yellow-500 scale-105';
            } else if (isScheduling && !isPast) {
              buttonClasses += 'text-gray-300 hover:text-white bg-[#141457] border-2 border-orange-500';
            } else {
              buttonClasses += 'text-gray-300 hover:text-white bg-[#141457]';
            }

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={buttonClasses}
              >
                <span className="text-[10px] font-medium uppercase">
                  {date.toLocaleDateString(dateLocale, { weekday: 'narrow' })}
                </span>
                <span className={`text-sm font-bold ${isToday ? '' : 'opacity-80'}`}>
                  {date.toLocaleDateString(dateLocale, { day: 'numeric' })}
                </span>
                {hasData ? (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isToday ? 'bg-navy' : isPast ? 'bg-green-500' : 'bg-yellow-500'}`} />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 -mt-4 space-y-6">
        {activeSession && (
          <div className="bg-navy text-white rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-yellow-500 text-navy flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 ml-0.5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{t('sessionInProgress')}</p>
                <p className="text-xs text-white/70 truncate">{t('resumeOrDiscardSession')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="brand" size="sm" onClick={onResumeSession} className="font-semibold">
                {t('continueSession')}
              </Button>
              <button
                onClick={onDiscardSession}
                aria-label={t('discardSession')}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {(scheduleError || planError) && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">
            {scheduleError || planError}
          </div>
        )}

        {scheduleLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
            {t('refreshingSchedule')}
          </div>
        )}

        {currentWorkouts.length > 0 ? (
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  {selectedDate < normalizeDate(new Date())
                    ? t('completedWorkouts')
                    : dateKey(selectedDate) === dateKey(new Date())
                    ? t('todaysSchedule')
                    : t('scheduledWorkouts')}
                </span>
                {selectedDate >= normalizeDate(new Date()) && (
                  <button
                    onClick={() => setIsScheduling(true)}
                    className="text-xs font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> {t('addAnother')}
                  </button>
                )}
             </div>

             {currentWorkouts.map((workout) => {
               const isCompleted = workout.completed || workout.status === 'COMPLETED';
               const isPastDate = selectedDate < normalizeDate(new Date());
               const isToday = dateKey(selectedDate) === dateKey(new Date());

               return (
                <div key={workout.instanceId} className="bg-white rounded-2xl p-1 shadow-lg border border-gray-100 relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${isCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}></div>

                  <div className="p-5 pl-7">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {workout.source === 'assigned' ? (
                          <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-medium">
                            <User className="w-3 h-3" /> {t('assigned')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-md font-medium">
                            <Dumbbell className="w-3 h-3" /> {t('myPlan')}
                          </span>
                        )}
                        {isCompleted && !isPastDate && (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-md font-medium">
                            <CheckCircle className="w-3 h-3" /> {t('done')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isPastDate && !isCompleted && (
                          <button
                            onClick={(e) => handleRemoveWorkout(workout.instanceId, e)}
                            className="p-1.5 bg-gray-50 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title={t('removeFromSchedule')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h2 className="text-xl text-navy font-bold mb-3">{workout.name}</h2>
                    {workout.coachName && <p className="text-sm text-gray-500 mb-3">{t('byCoach', { coach: workout.coachName })}</p>}

                    {/* Past date: Show daily analytics and session metrics */}
                    {isPastDate && isCompleted ? (
                      (() => {
                        const analytics = dailyAnalytics.get(dateKey(selectedDate));
                        const formatDuration = (minutes?: number | null) => {
                          if (!minutes) return 'N/A';
                          if (minutes < 60) return `${Math.round(minutes)} min`;
                          const hours = Math.floor(minutes / 60);
                          const mins = Math.round(minutes % 60);
                          return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                        };

                        return (
                          <>
                            {/* Session Metrics Grid - Exercises, Intensity, Quality */}
                            <div className="grid grid-cols-3 gap-3 mb-4 mt-4">
                              <div className="flex items-center gap-2">
                                <div className="bg-gray-100 p-1.5 rounded-lg">
                                  <Dumbbell className="w-4 h-4 text-navy" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-500 uppercase">{t('exercisesLabel')}</p>
                                  <p className="font-bold text-sm text-navy">{workout.exercises}</p>
                                </div>
                              </div>

                              {workout.sessionData?.intensity ? (
                                <div className="flex items-center gap-2">
                                  <div className="bg-gray-100 p-1.5 rounded-lg">
                                    <Trophy className={`w-4 h-4 ${
                                      workout.sessionData.intensity <= 3 ? 'text-green-600' :
                                      workout.sessionData.intensity <= 6 ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase">{t('intensity')}</p>
                                    <p className={`font-bold text-sm ${
                                      workout.sessionData.intensity <= 3 ? 'text-green-600' :
                                      workout.sessionData.intensity <= 6 ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {workout.sessionData.intensity}/10
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="bg-gray-100 p-1.5 rounded-lg">
                                    <Trophy className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase">{t('intensity')}</p>
                                    <p className="font-bold text-sm text-gray-400">--</p>
                                  </div>
                                </div>
                              )}

                              {workout.sessionData?.quality ? (
                                <div className="flex items-center gap-2">
                                  <div className="bg-gray-100 p-1.5 rounded-lg">
                                    <CheckCircle className={`w-4 h-4 ${
                                      workout.sessionData.quality <= 2 ? 'text-red-600' :
                                      workout.sessionData.quality <= 3 ? 'text-yellow-600' :
                                      'text-green-600'
                                    }`} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase">{t('quality')}</p>
                                    <p className={`font-bold text-sm ${
                                      workout.sessionData.quality <= 2 ? 'text-red-600' :
                                      workout.sessionData.quality <= 3 ? 'text-yellow-600' :
                                      'text-green-600'
                                    }`}>
                                      {workout.sessionData.quality}/5
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="bg-gray-100 p-1.5 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase">{t('quality')}</p>
                                    <p className="font-bold text-sm text-gray-400">--</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Daily Analytics Section */}
                            <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 rounded-xl p-4 border border-green-200">
                              {analytics && analytics.sessions_count > 1 && (
                                <div className="mb-3 flex items-center gap-1.5 text-xs text-green-700 font-semibold">
                                  <Trophy className="w-3.5 h-3.5" />
                                  <span>{t('sessionsCompletedToday', { count: analytics.sessions_count })}</span>
                                </div>
                              )}
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                <div>
                                  <p className="text-[10px] text-gray-600 uppercase font-semibold mb-1">{t('duration')}</p>
                                  <p className="font-bold text-base text-green-700">
                                    {analytics ? formatDuration(analytics.total_duration) : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-600 uppercase font-semibold mb-1">{t('setsLabel')}</p>
                                  <p className="font-bold text-base text-green-700">
                                    {analytics?.total_sets ?? '--'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-600 uppercase font-semibold mb-1">{t('repsLabel')}</p>
                                  <p className="font-bold text-base text-green-700">
                                    {analytics?.total_reps ?? '--'}
                                  </p>
                                </div>
                              </div>

                              {analytics && analytics.plans_completed && analytics.plans_completed.length > 0 && (
                                <p className="text-[10px] text-gray-600 mb-2">
                                  <span className="font-semibold uppercase">{t('plansColon')} </span>
                                  <span className="text-green-700 font-medium">
                                    {analytics.plans_completed.join(', ')}
                                  </span>
                                </p>
                              )}
                              <p className="text-[10px] text-green-600 uppercase font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {t('workoutCompletedLabel')}
                              </p>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <div className="grid grid-cols-3 gap-3 mb-4 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-100 p-1.5 rounded-lg">
                            <Dumbbell className="w-4 h-4 text-navy" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase">{t('exercisesLabel')}</p>
                            <p className="font-bold text-sm text-navy">{workout.exercises}</p>
                          </div>
                        </div>

                        {workout.sessionData?.intensity ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-100 p-1.5 rounded-lg">
                              <Trophy className={`w-4 h-4 ${
                                workout.sessionData.intensity <= 3 ? 'text-green-600' :
                                workout.sessionData.intensity <= 6 ? 'text-yellow-600' :
                                'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase">{t('intensity')}</p>
                              <p className={`font-bold text-sm ${
                                workout.sessionData.intensity <= 3 ? 'text-green-600' :
                                workout.sessionData.intensity <= 6 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {workout.sessionData.intensity}/10
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-100 p-1.5 rounded-lg">
                              <Trophy className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase">{t('intensity')}</p>
                              <p className="font-bold text-sm text-gray-400">--</p>
                            </div>
                          </div>
                        )}

                        {workout.sessionData?.quality ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-100 p-1.5 rounded-lg">
                              <CheckCircle className={`w-4 h-4 ${
                                workout.sessionData.quality <= 2 ? 'text-red-600' :
                                workout.sessionData.quality <= 3 ? 'text-yellow-600' :
                                'text-green-600'
                              }`} />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase">{t('quality')}</p>
                              <p className={`font-bold text-sm ${
                                workout.sessionData.quality <= 2 ? 'text-red-600' :
                                workout.sessionData.quality <= 3 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {workout.sessionData.quality}/5
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-100 p-1.5 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase">{t('quality')}</p>
                              <p className="font-bold text-sm text-gray-400">--</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons only for today/future */}
                    {!isPastDate && (
                      <div className="flex gap-2">
                        {isCompleted && isToday ? (
                          <button
                            onClick={() => handleStartScheduledWorkout(workout.instanceId, workout.planId)}
                            className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/10 text-sm bg-green-600 text-white hover:bg-green-700"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            {t('repeatWorkout')}
                          </button>
                        ) : !isCompleted ? (
                          <button
                            onClick={() => handleStartScheduledWorkout(workout.instanceId, workout.planId)}
                            disabled={!canStartToday || scheduleLoading}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-navy/10 text-sm ${
                              !canStartToday || scheduleLoading
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-navy text-white hover:bg-navy-light'
                            }`}
                            title={!canStartToday ? t('onlyStartTodayTitle') : undefined}
                          >
                            <Play className="w-4 h-4 fill-current" />
                            {t('startWorkout')}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
               );
             })}

          {canStartToday && (
            <button
              onClick={() => onStartSession()}
              className="w-full mt-3 px-6 py-3 bg-white text-navy border-2 border-navy/10 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              {t('startFreestyle')}
            </button>
          )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center relative overflow-hidden">
             <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-2xl pointer-events-none"></div>

             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
               <Calendar className="w-8 h-8 text-gray-400" />
             </div>

             {selectedDate < normalizeDate(new Date()) ? (
               <>
                 <h3 className="text-lg font-bold text-navy mb-2">{t('noActivity')}</h3>
                 <p className="text-gray-500">{t('noWorkoutsLogged', { date: selectedDate.toLocaleDateString(dateLocale, { weekday: 'long', month: 'short', day: 'numeric' }) })}</p>
               </>
             ) : (
               <>
                 <h3 className="text-lg font-bold text-navy mb-2">{t('restDay')}</h3>
                 <p className="text-gray-500 mb-6">{t('noWorkoutsScheduled', { day: selectedDate.toLocaleDateString(dateLocale, { weekday: 'long' }) })}</p>

                 <div className="grid grid-cols-1 gap-3">
                   <Button variant="brand" size="block" icon={<Plus className="size-5" />} onClick={() => setIsScheduling(true)} className="rounded-xl font-bold">
                     {t('scheduleWorkout')}
                   </Button>

                   {dateKey(selectedDate) === dateKey(new Date()) && (
                     <button
                        onClick={() => onStartSession()}
                        className="w-full px-6 py-3 bg-white text-navy border-2 border-navy/10 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                      >
                        {t('startFreestyle')}
                     </button>
                   )}
                 </div>
               </>
             )}
          </div>
        )}

        {isScheduling && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-navy">{t('selectAPlan')}</h3>
                <button 
                  onClick={() => setIsScheduling(false)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {loadingPlans && (
                <p className="text-xs text-gray-500 mb-3">{t('loadingYourPlans')}</p>
              )}
              {planError && (
                <p className="text-xs text-red-600 mb-3">{planError}</p>
              )}

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {libraryPlans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => handleScheduleWorkout(plan.id)}
                    className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 hover:border-yellow-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-navy group-hover:text-yellow-600 transition-colors">{plan.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {plan.source === 'assigned' ? (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {t('coachLabel', { coach: plan.coachName || '' })}
                            </span>
                          ) : (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                              {t('myPlan')}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">• {t('exercisesCount', { count: plan.exercises.toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US') })}</span>
                          {plan.estimatedSeconds > 0 && (
                            <span className="text-xs text-gray-400">• {t('estMinutes', { count: Math.max(1, Math.round(plan.estimatedSeconds / 60)).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US') })}</span>
                          )}
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-yellow-500 transition-colors">
                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-navy" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-navy font-bold text-lg mb-3">{t('quickActions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onCreatePlan}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-bold text-navy">{t('createPlan')}</h4>
              <p className="text-xs text-gray-500 mt-1">{t('buildCustomRoutine')}</p>
            </button>

            <button
              onClick={() => (onFindCoach ? onFindCoach() : onNavigate('athlete-search'))}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-bold text-navy">{t('findPlans')}</h4>
              <p className="text-xs text-gray-500 mt-1">{t('browseCoachLibrary')}</p>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-navy font-bold text-lg">{t('yourLibrary')}</h3>
            <button className="text-yellow-600 text-sm font-medium">{t('viewAll')}</button>
          </div>
          {planError && (
            <p className="text-sm text-red-600 mb-2">{planError}</p>
          )}
          {loadingPlans && (
            <p className="text-sm text-gray-500 mb-2">{t('loading')}</p>
          )}
          {!loadingPlans && !planError && libraryPlans.length === 0 && (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-600 mb-1">{t('noPlansYet')}</p>
              <p className="text-gray-400 text-sm">{t('noPlansHint')}</p>
            </div>
          )}

          <div className="space-y-3">
            {libraryPlans.map((plan) => (
              <div key={plan.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                <button onClick={() => onViewPlan?.(plan.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    plan.source === 'assigned' ? 'bg-blue-50' : 'bg-green-50'
                  }`}>
                    {plan.source === 'assigned' ? (
                      <User className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Dumbbell className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-navy">{plan.name}</h4>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      {plan.source === 'assigned' ? (
                        <span className="text-blue-600 font-medium">{plan.coachName ? t('assignedByCoach', { coach: plan.coachName }) : t('assignedPlan')}</span>
                      ) : (
                        <span className="text-green-600 font-medium">{t('myPlan')}</span>
                      )}
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">{t('exercisesCount', { count: plan.exercises.toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US') })}</span>
                      {plan.estimatedSeconds > 0 && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500">{t('estMinutes', { count: Math.max(1, Math.round(plan.estimatedSeconds / 60)).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US') })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleScheduleWorkout(plan.id)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-navy transition-colors flex-shrink-0"
                  title={t('addToSchedule')}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

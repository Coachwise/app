import { useEffect, useState, useMemo, useCallback, type MouseEvent, type TouchEvent } from 'react';
import { Plus, Play, Calendar, Clock, Dumbbell, Trophy, User, X, Trash2, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
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
  userRole: UserRole;
  onNavigate: (view: string) => void;
  isPro?: boolean;
  refreshTrigger?: number; // Timestamp to trigger refresh
}

interface WorkoutPlan {
  id: string;
  name: string;
  duration: string;
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

const fallbackPlans: WorkoutPlan[] = [
  {
    id: '1',
    name: 'Upper Body Push',
    duration: '45 min',
    type: 'strength',
    source: 'assigned',
    coachName: 'Sarah Martinez',
    exercises: 5
  },
  {
    id: '2',
    name: 'Climbing Endurance',
    duration: '60 min',
    type: 'climbing',
    source: 'assigned',
    coachName: 'Mike Chen',
    exercises: 6
  },
  {
    id: '3',
    name: 'Morning Mobility',
    duration: '20 min',
    type: 'strength',
    source: 'personal',
    exercises: 4
  },
  {
    id: '4',
    name: 'Core Blaster',
    duration: '15 min',
    type: 'strength',
    source: 'personal',
    exercises: 3
  }
];

const initialSchedule: ScheduledWorkout[] = [
  // No mock schedules - will be loaded from API
];

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

const formatRangeLabel = (days: Date[]) => {
  if (!days.length) return '';
  const start = days[0];
  const end = days[days.length - 1];
  const startLabel = `${start.toLocaleString(undefined, { month: 'short' })} ${start.getDate()}`;
  const endLabel = `${end.toLocaleString(undefined, { month: 'short' })} ${end.getDate()}`;
  return `${startLabel} – ${endLabel}`;
};

const windowKey = (center: Date) => {
  const start = new Date(normalizeDate(center).getTime() - WINDOW_RADIUS * DAY_MS);
  const end = new Date(start.getTime() + WINDOW_RADIUS * 2 * DAY_MS);
  return `${dateKey(start)}:${dateKey(end)}`;
};

const calculateDuration = (startedAt?: string, endedAt?: string): string => {
  if (!startedAt || !endedAt) return 'N/A';

  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const durationMs = end.getTime() - start.getTime();

  if (durationMs < 0) return 'N/A';

  const minutes = Math.floor(durationMs / 60000);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
};

export function WorkoutsHome({ onStartSession, onCreatePlan, userRole, onNavigate, isPro = true, refreshTrigger }: WorkoutsHomeProps) {
  const { t } = useLanguage();
  const { tokens } = useAuth();

  const [libraryPlans, setLibraryPlans] = useState<WorkoutPlan[]>(fallbackPlans);
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
      planLookup.get(planId) ||
      fallbackPlans.find(p => p.id === planId) || {
        id: planId,
        name: 'Scheduled Plan',
        duration: '45 min',
        type: 'strength',
        source: 'personal',
        exercises: 4
      }
    );
  };

  const loadPlans = useCallback(async () => {
    if (!tokens?.access_token) {
      setLibraryPlans(fallbackPlans);
      setPlanError(null);
      return;
    }
    setLoadingPlans(true);
    setPlanError(null);
    try {
      const response = await PlansAPI.listPlans(tokens.access_token);
      const plans = response.items;

      // Fetch exercise count for each plan
      const mappedPlans = await Promise.all(
        plans.map(async (plan: Plan) => {
          try {
            const exercises = await PlansAPI.listPlanExercises(tokens.access_token, plan.id);
            return {
              id: plan.id,
              name: plan.name,
              duration: '45 min', // Default duration
              type: 'strength' as const,
              source: 'personal' as const,
              exercises: exercises.length,
            };
          } catch (err) {
            // If fetching exercises fails, default to 0
            return {
              id: plan.id,
              name: plan.name,
              duration: '45 min',
              type: 'strength' as const,
              source: 'personal' as const,
              exercises: 0,
            };
          }
        })
      );

      setLibraryPlans(mappedPlans.length > 0 ? mappedPlans : fallbackPlans);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load plans';
      setPlanError(msg);
      setLibraryPlans(fallbackPlans);
    } finally {
      setLoadingPlans(false);
    }
  }, [tokens?.access_token]);

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
      const msg = err instanceof Error ? err.message : 'Unable to load schedules';
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
      const msg = err instanceof Error ? err.message : 'Unable to schedule workout';
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
      const msg = err instanceof Error ? err.message : 'Unable to remove workout';
      setScheduleError(msg);
    }
  };

  const handleStartScheduledWorkout = async (instanceId: string, planId: string) => {
    if (!canStartToday) {
      setScheduleError('You can only start workouts scheduled for today.');
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
          duration: '45 min',
          type: 'strength' as const,
          source: 'personal' as const,
          exercises: 0,
        };
        return {
          ...plan,
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
          duration: '45 min',
          type: 'strength' as const,
          source: 'personal' as const,
          exercises: 0,
        };
        return {
          ...plan,
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

  const rangeLabel = formatRangeLabel(visibleDays);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-[#0E0E55] px-4 pt-6 pb-8 rounded-b-[2rem] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-2xl font-bold">{t('workouts')}</h1>
            <p className="text-gray-300 text-sm">Swipe to browse 6-day windows</p>
          </div>
          <HamburgerMenu userRole={userRole} onNavigate={onNavigate} isPro={isPro} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
          <button
            onClick={() => shiftWindow(-3)}
            className="p-2 rounded-lg bg-[#1A1A6E] hover:bg-[#1A1A6E]/80 text-white"
            aria-label="Previous days"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{rangeLabel}</span>
            <button
              onClick={() => {
                const today = normalizeDate(new Date());
                setCenterDate(today);
                setSelectedDate(today);
              }}
              className="px-3 py-1 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-[#0E0E55] text-xs font-bold transition-colors"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => shiftWindow(3)}
            className="p-2 rounded-lg bg-[#1A1A6E] hover:bg-[#1A1A6E]/80 text-white"
            aria-label="Next days"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div
          className="flex items-center gap-2 overflow-x-auto p-2 bg-[#1A1A6E] rounded-2xl select-none"
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
              buttonClasses += 'bg-yellow-500 text-[#0E0E55] shadow-lg font-bold';
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
                  {['S','M','T','W','T','F','S'][date.getDay()]}
                </span>
                <span className={`text-sm font-bold ${isToday ? '' : 'opacity-80'}`}>
                  {date.getDate()}
                </span>
                {hasData ? (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isToday ? 'bg-[#0E0E55]' : isPast ? 'bg-green-500' : 'bg-yellow-500'}`} />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 -mt-4 space-y-6">
        {(scheduleError || planError) && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">
            {scheduleError || planError}
          </div>
        )}

        {scheduleLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
            Refreshing schedule...
          </div>
        )}

        {currentWorkouts.length > 0 ? (
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  {selectedDate < normalizeDate(new Date())
                    ? "Completed Workouts"
                    : dateKey(selectedDate) === dateKey(new Date())
                    ? "Today's Schedule"
                    : "Scheduled Workouts"}
                </span>
                {selectedDate >= normalizeDate(new Date()) && (
                  <button
                    onClick={() => setIsScheduling(true)}
                    className="text-xs font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Another
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
                            <User className="w-3 h-3" /> Assigned
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-md font-medium">
                            <Dumbbell className="w-3 h-3" /> My Plan
                          </span>
                        )}
                        {isCompleted && !isPastDate && (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-md font-medium">
                            <CheckCircle className="w-3 h-3" /> Done
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isPastDate && !isCompleted && (
                          <button
                            onClick={(e) => handleRemoveWorkout(workout.instanceId, e)}
                            className="p-1.5 bg-gray-50 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Remove from schedule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h2 className="text-xl text-[#0E0E55] font-bold mb-3">{workout.name}</h2>
                    {workout.coachName && <p className="text-sm text-gray-500 mb-3">By {workout.coachName}</p>}

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
                                  <Dumbbell className="w-4 h-4 text-[#0E0E55]" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-500 uppercase">Exercises</p>
                                  <p className="font-bold text-sm text-[#0E0E55]">{workout.exercises}</p>
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
                                    <p className="text-[10px] text-gray-500 uppercase">Intensity</p>
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
                                    <p className="text-[10px] text-gray-500 uppercase">Intensity</p>
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
                                    <p className="text-[10px] text-gray-500 uppercase">Quality</p>
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
                                    <p className="text-[10px] text-gray-500 uppercase">Quality</p>
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
                                  <span>{analytics.sessions_count} sessions completed today</span>
                                </div>
                              )}
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                <div>
                                  <p className="text-[10px] text-gray-600 uppercase font-semibold mb-1">Duration</p>
                                  <p className="font-bold text-base text-green-700">
                                    {analytics ? formatDuration(analytics.total_duration) : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-600 uppercase font-semibold mb-1">Sets</p>
                                  <p className="font-bold text-base text-green-700">
                                    {analytics?.total_sets ?? '--'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-600 uppercase font-semibold mb-1">Reps</p>
                                  <p className="font-bold text-base text-green-700">
                                    {analytics?.total_reps ?? '--'}
                                  </p>
                                </div>
                              </div>

                              {analytics && analytics.plans_completed && analytics.plans_completed.length > 0 && (
                                <p className="text-[10px] text-gray-600 mb-2">
                                  <span className="font-semibold uppercase">Plans: </span>
                                  <span className="text-green-700 font-medium">
                                    {analytics.plans_completed.join(', ')}
                                  </span>
                                </p>
                              )}
                              <p className="text-[10px] text-green-600 uppercase font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Workout Completed
                              </p>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <div className="grid grid-cols-3 gap-3 mb-4 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-100 p-1.5 rounded-lg">
                            <Dumbbell className="w-4 h-4 text-[#0E0E55]" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase">Exercises</p>
                            <p className="font-bold text-sm text-[#0E0E55]">{workout.exercises}</p>
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
                              <p className="text-[10px] text-gray-500 uppercase">Intensity</p>
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
                              <p className="text-[10px] text-gray-500 uppercase">Intensity</p>
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
                              <p className="text-[10px] text-gray-500 uppercase">Quality</p>
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
                              <p className="text-[10px] text-gray-500 uppercase">Quality</p>
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
                            onClick={() => handleStartScheduledWorkout(workout.instanceId, workout.id)}
                            className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/10 text-sm bg-green-600 text-white hover:bg-green-700"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            Repeat Workout
                          </button>
                        ) : !isCompleted ? (
                          <button
                            onClick={() => handleStartScheduledWorkout(workout.instanceId, workout.id)}
                            disabled={!canStartToday || scheduleLoading}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0E0E55]/10 text-sm ${
                              !canStartToday || scheduleLoading
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-[#0E0E55] text-white hover:bg-[#1A1A6E]'
                            }`}
                            title={!canStartToday ? 'You can only start today\'s workout' : undefined}
                          >
                            <Play className="w-4 h-4 fill-current" />
                            Start Workout
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
              className="w-full mt-3 px-6 py-3 bg-white text-[#0E0E55] border-2 border-[#0E0E55]/10 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              Start Freestyle
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
                 <h3 className="text-lg font-bold text-[#0E0E55] mb-2">No Activity</h3>
                 <p className="text-gray-500">No workouts logged for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}.</p>
               </>
             ) : (
               <>
                 <h3 className="text-lg font-bold text-[#0E0E55] mb-2">Rest Day</h3>
                 <p className="text-gray-500 mb-6">No workouts scheduled for {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}.</p>

                 <div className="grid grid-cols-1 gap-3">
                   <button
                     onClick={() => setIsScheduling(true)}
                     className="w-full px-6 py-3 bg-yellow-500 text-[#0E0E55] rounded-xl font-bold hover:bg-yellow-400 transition-colors shadow-md flex items-center justify-center gap-2"
                   >
                     <Plus className="w-5 h-5" />
                     Schedule Workout
                   </button>

                   {dateKey(selectedDate) === dateKey(new Date()) && (
                     <button
                        onClick={() => onStartSession()}
                        className="w-full px-6 py-3 bg-white text-[#0E0E55] border-2 border-[#0E0E55]/10 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                      >
                        Start Freestyle
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
                <h3 className="text-xl font-bold text-[#0E0E55]">Select a Plan</h3>
                <button 
                  onClick={() => setIsScheduling(false)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {loadingPlans && (
                <p className="text-xs text-gray-500 mb-3">Loading your plans...</p>
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
                        <h4 className="font-bold text-[#0E0E55] group-hover:text-yellow-600 transition-colors">{plan.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {plan.source === 'assigned' ? (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              Coach {plan.coachName}
                            </span>
                          ) : (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                              My Plan
                            </span>
                          )}
                          <span className="text-xs text-gray-400">• {plan.duration}</span>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-yellow-500 transition-colors">
                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#0E0E55]" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-[#0E0E55] font-bold text-lg mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onCreatePlan}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-bold text-[#0E0E55]">Create Plan</h4>
              <p className="text-xs text-gray-500 mt-1">Build a custom routine</p>
            </button>

            <button 
              onClick={() => onNavigate('coach-marketplace')}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-bold text-[#0E0E55]">Find Plans</h4>
              <p className="text-xs text-gray-500 mt-1">Browse coach library</p>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#0E0E55] font-bold text-lg">Your Library</h3>
            <button className="text-yellow-600 text-sm font-medium">View All</button>
          </div>
          {planError && (
            <p className="text-sm text-red-600 mb-2">{planError}</p>
          )}
          {loadingPlans && (
            <p className="text-sm text-gray-500 mb-2">Loading your plans...</p>
          )}
          
          <div className="space-y-3">
            {libraryPlans.map((plan) => (
              <div key={plan.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    plan.source === 'assigned' ? 'bg-blue-50' : 'bg-green-50'
                  }`}>
                    {plan.source === 'assigned' ? (
                      <User className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Dumbbell className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0E0E55]">{plan.name}</h4>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      {plan.source === 'assigned' ? (
                        <span className="text-blue-600 font-medium">Assigned {plan.coachName ? `by ${plan.coachName}` : 'plan'}</span>
                      ) : (
                        <span className="text-green-600 font-medium">My Plan</span>
                      )}
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">{plan.duration}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleScheduleWorkout(plan.id)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-[#0E0E55] transition-colors"
                  title="Add to schedule"
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

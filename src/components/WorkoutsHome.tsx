import { useEffect, useState } from 'react';
import { Plus, Dumbbell, Calendar, Clock, Play, ChevronRight, CheckCircle, Circle, Edit3, X, ChevronLeft } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as PlansAPI from '../api/plans';
import type { Plan } from '../api/types';

interface WorkoutsHomeProps {
  onStartSession: () => void;
  onCreatePlan: () => void;
  userRole: UserRole;
  onNavigate: (view: string) => void;
  isPro?: boolean; // Track pro status
}

interface AssignedPlan {
  id: string;
  name: string;
  coachName: string;
  coachAvatar: string;
  totalDays: number;
  completedDays: number;
  currentDay: number;
  todayWorkout?: {
    exercises: number;
    duration: string;
  };
}

interface ScheduledWorkout {
  planId: string;
  planName: string;
  completed: boolean;
}

interface DaySchedule {
  date: Date;
  workouts: ScheduledWorkout[];
}

interface WorkoutPlan {
  id: string;
  name: string;
  exerciseCount: number;
  public: boolean;
}

export function WorkoutsHome({ onStartSession, onCreatePlan, userRole, onNavigate, isPro = true }: WorkoutsHomeProps) {
  const { t, language } = useLanguage();
  const { tokens } = useAuth();
  const [activeTab, setActiveTab] = useState<'assigned' | 'my-plans'>('assigned');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = this week, 1 = next week, etc.
  const [showProModal, setShowProModal] = useState(false);
  const [proModalFeature, setProModalFeature] = useState<'schedule' | 'log' | 'post' | 'general'>('schedule');
  const [myWorkoutPlans, setMyWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const loadPlans = async () => {
    if (!tokens?.access_token) {
      setPlanError('Please log in to view your plans.');
      setMyWorkoutPlans([]);
      return;
    }
    setLoadingPlans(true);
    setPlanError(null);
    try {
      const plans = await PlansAPI.listPlans(tokens.access_token);
      const plansWithCounts = await Promise.all(
        plans.map(async (plan: Plan) => {
          try {
            const exercises = await PlansAPI.listPlanExercises(tokens.access_token!, plan.id);
            return {
              id: plan.id,
              name: plan.name,
              exerciseCount: exercises.length,
              public: plan.public,
            } as WorkoutPlan;
          } catch {
            return {
              id: plan.id,
              name: plan.name,
              exerciseCount: 0,
              public: plan.public,
            } as WorkoutPlan;
          }
        })
      );
      setMyWorkoutPlans(plansWithCounts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to load plans';
      setPlanError(msg);
      setMyWorkoutPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.access_token]);
  
  // Initialize schedule with some example data
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
    const initialSchedule: DaySchedule[] = [];
    const today = new Date();
    
    // Create schedule for 4 weeks (past and future)
    for (let i = -7; i < 28; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      initialSchedule.push({
        date,
        workouts: [],
      });
    }
    
    // Add some example scheduled workouts
    const mondayNext = new Date(today);
    mondayNext.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    mondayNext.setHours(0, 0, 0, 0);
    
    const exampleIndex = initialSchedule.findIndex(d => d.date.getTime() === mondayNext.getTime());
    if (exampleIndex !== -1) {
      initialSchedule[exampleIndex].workouts.push({
        planId: '1',
        planName: 'Upper Body Push',
        completed: false,
      });
    }
    
    return initialSchedule;
  });

  // Assigned plans placeholder (API endpoint pending in UI)
  const assignedPlans: AssignedPlan[] = [];

  const daysOfWeek = [
    t('sunday'), t('monday'), t('tuesday'), t('wednesday'),
    t('thursday'), t('friday'), t('saturday')
  ];
  const monthNames = [
    t('january'), t('february'), t('march'), t('april'),
    t('may'), t('june'), t('july'), t('august'),
    t('september'), t('october'), t('november'), t('december')
  ];

  const getWeekDays = (offset: number): Date[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the start of the current week (Sunday)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    // Add offset in weeks
    startOfWeek.setDate(startOfWeek.getDate() + (offset * 7));
    
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    
    return week;
  };

  const getScheduleForDate = (date: Date): DaySchedule | undefined => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return schedule.find(s => s.date.getTime() === normalizedDate.getTime());
  };

  const handleAssignPlanToDate = (planId: string) => {
    if (!selectedDate) return;
    
    const plan = assignedPlans.find(p => p.id === planId);
    if (!plan) return;

    const normalizedDate = new Date(selectedDate);
    normalizedDate.setHours(0, 0, 0, 0);

    setSchedule(prev => {
      const existingIndex = prev.findIndex(s => s.date.getTime() === normalizedDate.getTime());
      
      if (existingIndex !== -1) {
        // Date exists, add workout to it
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          workouts: [
            ...updated[existingIndex].workouts,
            {
              planId,
              planName: plan.name,
              completed: false,
            },
          ],
        };
        return updated;
      } else {
        // Date doesn't exist, create it
        return [
          ...prev,
          {
            date: normalizedDate,
            workouts: [{
              planId,
              planName: plan.name,
              completed: false,
            }],
          },
        ];
      }
    });

    setSelectedDate(null);
    alert(`${plan.name} scheduled for ${monthNames[normalizedDate.getMonth()]} ${normalizedDate.getDate()}!`);
  };

  const handleRemoveWorkout = (date: Date, workoutIndex: number) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    setSchedule(prev => {
      const index = prev.findIndex(s => s.date.getTime() === normalizedDate.getTime());
      if (index === -1) return prev;

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        workouts: updated[index].workouts.filter((_, i) => i !== workoutIndex),
      };
      return updated;
    });
  };

  const handleToggleComplete = (date: Date, workoutIndex: number) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    setSchedule(prev => {
      const index = prev.findIndex(s => s.date.getTime() === normalizedDate.getTime());
      if (index === -1) return prev;

      const updated = [...prev];
      const workouts = [...updated[index].workouts];
      workouts[workoutIndex] = {
        ...workouts[workoutIndex],
        completed: !workouts[workoutIndex].completed,
      };
      updated[index] = {
        ...updated[index],
        workouts,
      };
      return updated;
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const weekDays = getWeekDays(currentWeekOffset);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`
    : `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;

  const getProgressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  const handleCompleteDay = (planId: string) => {
    alert('Day marked as complete! 🎉');
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-6 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl">{t('workouts')}</h1>
          <HamburgerMenu 
            userRole={userRole}
            onNavigate={onNavigate}
            isPro={isPro}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 py-3 rounded-lg transition-all ${
              activeTab === 'assigned'
                ? 'bg-yellow-500 text-[#0E0E55]'
                : 'bg-[#1A1A6E] text-gray-300 hover:bg-[#1A1A6E]/80'
            }`}
          >
            {t('assignedPlans')}
          </button>
          <button
            onClick={() => setActiveTab('my-plans')}
            className={`flex-1 py-3 rounded-lg transition-all ${
              activeTab === 'my-plans'
                ? 'bg-yellow-500 text-[#0E0E55]'
                : 'bg-[#1A1A6E] text-gray-300 hover:bg-[#1A1A6E]/80'
            }`}
          >
            {t('myPlans')}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ASSIGNED PLANS TAB */}
        {activeTab === 'assigned' && (
          <>
            {/* Weekly Schedule Calendar */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#0E0E55]" />
                  </button>
                  
                  <div className="text-center">
                    <h3 className="text-[#0E0E55]">{t('weeklySchedule')}</h3>
                    <p className="text-gray-600 text-xs mt-1">{weekLabel}</p>
                  </div>
                  
                  <button
                    onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-[#0E0E55]" />
                  </button>
                </div>

                {currentWeekOffset !== 0 && (
                  <button
                    onClick={() => setCurrentWeekOffset(0)}
                    className="w-full py-2 text-yellow-600 text-sm hover:text-yellow-700"
                  >
                    {t('backToThisWeek')}
                  </button>
                )}
              </div>

              <div className="p-4">
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((date) => {
                    const daySchedule = getScheduleForDate(date);
                    const hasWorkouts = daySchedule && daySchedule.workouts.length > 0;
                    const today = isToday(date);
                    const past = isPast(date);
                    
                    return (
                      <div key={date.toISOString()} className="flex flex-col gap-1">
                        <span className={`text-xs text-center mb-1 ${today ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>
                          {daysOfWeek[date.getDay()]}
                        </span>
                        <span className={`text-xs text-center mb-1 ${today ? 'text-yellow-600 font-bold' : 'text-gray-400'}`}>
                          {monthNames[date.getMonth()]} {date.getDate()}
                        </span>
                        <button
                          onClick={() => setSelectedDate(date)}
                          className={`relative min-h-24 rounded-lg p-2 transition-all text-xs ${
                            today
                              ? 'ring-2 ring-yellow-500 bg-yellow-50'
                              : past
                              ? 'bg-gray-50'
                              : 'bg-white'
                          } ${
                            hasWorkouts
                              ? 'border-2 border-yellow-500'
                              : 'border-2 border-dashed border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {hasWorkouts ? (
                            <div className="space-y-1">
                              {daySchedule.workouts.map((workout, idx) => (
                                <div
                                  key={idx}
                                  className={`p-1 rounded text-[10px] leading-tight flex items-center gap-1 ${
                                    workout.completed
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-500 text-[#0E0E55]'
                                  }`}
                                >
                                  {workout.completed && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                                  <span className="truncate flex-1">{workout.planName.split(' ')[0]}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Plus className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plan Selector */}
              {selectedDate && (
                <div className="p-4 border-t border-gray-200 bg-yellow-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[#0E0E55] text-sm">
                      {t('scheduleFor')} {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}
                    </h4>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Currently Scheduled */}
                  {(() => {
                    const daySchedule = getScheduleForDate(selectedDate);
                    return daySchedule && daySchedule.workouts.length > 0 ? (
                      <div className="mb-4">
                        <p className="text-gray-600 text-xs mb-2">{t('currentlyScheduled')}:</p>
                        <div className="space-y-2">
                          {daySchedule.workouts.map((workout, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                              <button
                                onClick={() => handleToggleComplete(selectedDate, idx)}
                                className="flex-shrink-0"
                              >
                                {workout.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                              <span className={`flex-1 text-sm ${workout.completed ? 'line-through text-gray-500' : 'text-[#0E0E55]'}`}>
                                {workout.planName}
                              </span>
                              <button
                                onClick={() => handleRemoveWorkout(selectedDate, idx)}
                                className="p-1 hover:bg-red-50 rounded transition-colors"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  <p className="text-gray-600 text-xs mb-2">{t('addPlan')}:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {assignedPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => handleAssignPlanToDate(plan.id)}
                        className="w-full text-left p-3 bg-white rounded-lg hover:bg-yellow-100 border border-gray-200 hover:border-yellow-500 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={plan.coachAvatar}
                            alt={plan.coachName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="text-[#0E0E55] text-sm mb-1">{plan.name}</div>
                            <div className="text-gray-600 text-xs">by {plan.coachName}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assigned Plans List */}
            {assignedPlans.length > 0 ? (
              <>
                <div className="bg-white rounded-lg shadow-md border border-gray-200">
                  <div className="p-5 border-b border-gray-200">
                    <h3 className="text-[#0E0E55]">{t('yourAssignedPlans')}</h3>
                    <p className="text-gray-600 text-sm mt-1">{t('plansFromCoaches')}</p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {assignedPlans.map((plan) => (
                      <div key={plan.id} className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <img
                            src={plan.coachAvatar}
                            alt={plan.coachName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="text-[#0E0E55] mb-1">{plan.name}</h3>
                            <p className="text-gray-600 text-sm">by {plan.coachName}</p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-500 text-[#0E0E55] rounded-lg text-xs font-medium">
                            {getProgressPercentage(plan.completedDays, plan.totalDays)}%
                          </span>
                        </div>

                        <div className="mb-3">
                          <p className="text-gray-600 text-sm mb-2">
                            Day {plan.currentDay} of {plan.totalDays} • {plan.completedDays} completed
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${getProgressPercentage(plan.completedDays, plan.totalDays)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {plan.todayWorkout && (
                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-[#0E0E55] font-medium mb-1">{t('availableWorkout')}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Dumbbell className="w-4 h-4 text-yellow-600" />
                                    {plan.todayWorkout.exercises} {t('exercises')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                    {plan.todayWorkout.duration}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={onStartSession}
                                className="flex-1 bg-[#0E0E55] text-white py-3 rounded-lg hover:bg-[#1A1A6E] transition-colors flex items-center justify-center gap-2"
                              >
                                <Play className="w-4 h-4" />
                                <span>{t('startWorkout')}</span>
                              </button>
                              <button
                                onClick={() => handleCompleteDay(plan.id)}
                                className="px-4 py-3 border-2 border-gray-300 text-[#0E0E55] rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-[#0E0E55] mb-2">{t('noAssignedPlans')}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {t('noAssignedPlansDesc')}
                </p>
                <button
                  onClick={() => onNavigate('coach-marketplace')}
                  className="px-6 py-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  {t('findACoach')}
                </button>
              </div>
            )}
          </>
        )}

        {/* MY PLANS TAB */}
        {activeTab === 'my-plans' && (
          <>
            {/* Quick Start Card */}
            <div className="bg-yellow-500 rounded-lg shadow-lg p-6">
              <h3 className="text-[#0E0E55] mb-3">{t('quickStart')}</h3>
              <p className="text-[#0E0E55]/80 text-sm mb-4">
                {t('startFreestyleSession')}
              </p>
              <button
                onClick={onStartSession}
                className="w-full bg-[#0E0E55] text-white py-3 rounded-lg hover:bg-[#1A1A6E] transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                <span>{t('startFreestyleSession')}</span>
              </button>
            </div>

            {/* Create Plan Button */}
            <button
              onClick={onCreatePlan}
              className="w-full bg-white border-2 border-dashed border-gray-300 text-[#0E0E55] py-5 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors flex items-center justify-center gap-3"
            >
              <Plus className="w-6 h-6 text-yellow-600" />
              <span>{t('createNewPlan')}</span>
            </button>

            {/* My Plans List */}
            {loadingPlans && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 text-sm text-gray-600">
                Loading your plans...
              </div>
            )}
            {planError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                {planError}
              </div>
            )}
            {!loadingPlans && !planError && myWorkoutPlans.length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-[#0E0E55]">{t('myWorkoutPlans')}</h3>
                    <p className="text-gray-600 text-sm mt-1">{t('plansYouCreated')}</p>
                  </div>
                  <button
                    onClick={loadPlans}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Clock className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                <div className="divide-y divide-gray-200">
                  {myWorkoutPlans.map((plan) => (
                    <div key={plan.id} className="w-full p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-[#0E0E55] mb-2">{plan.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Dumbbell className="w-4 h-4 text-yellow-600" />
                              {plan.exerciseCount} {t('exercises')}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full border border-gray-200 bg-gray-50">
                              {plan.public ? 'Public' : 'Private'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!loadingPlans && !planError && myWorkoutPlans.length === 0 && (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-gray-600">
                {t('noAssignedPlansDesc')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

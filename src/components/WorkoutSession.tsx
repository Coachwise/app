import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock, Check, ChevronDown, ChevronUp, Plus, Minus, Search, X, Zap } from 'lucide-react';
import { BackButton } from './ui/back-button';
import { Button } from './ui/button';
import { GradeSelect } from './ui/grade-select';
import { GuidedWorkout, type GuidedSetValues } from './GuidedWorkout';
import { ProUpgradeModal } from './ProUpgradeModal';
import { useAuth } from '../contexts/AuthContext';
import * as SessionsAPI from '../api/sessions';
import * as PlansAPI from '../api/plans';
import * as ExercisesAPI from '../api/exercises';
import type { Exercise } from '../api/types';
import { SessionFeedbackDialog, type SessionFeedback } from './SessionFeedbackDialog';
import { useLanguage } from '../contexts/LanguageContext';
import { localized } from '../lib/localize';

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v)$/i.test(url);

interface WorkoutSessionProps {
  planId?: string;
  scheduleId?: string;
  onBack: () => void;
  onEndSession: () => void;
  isPro?: boolean;
  onNavigate?: (view: string) => void;
}

export interface ExerciseSet {
  // 'time' sets are held for a duration (seconds); 'reps' sets count repetitions.
  type: 'reps' | 'time';
  reps: number;
  duration: number; // seconds (for time sets)
  weight: number;
  distance: number; // metres
  height: number; // cm
  grade: string; // climbing grade (V / Font)
  restSeconds: number;
  completed: boolean;
}

export interface ExerciseMetrics {
  weight: boolean;
  distance: boolean;
  grade: boolean;
  height: boolean;
}

export interface SessionExercise {
  id: string;
  name: string;
  exerciseId?: string; // Actual exercise ID from exercises table
  mediaUrl?: string | null;
  metrics: ExerciseMetrics;
  sets: ExerciseSet[];
  targetSets: number;
  targetReps: number;
  targetWeight: number;
}

const SESSION_KEY = 'coachwise-active-session';

// Set durations/rest come from the API as nanoseconds (Go time.Duration).
const nsToSeconds = (value?: number | null) => Math.max(0, Math.round((value ?? 0) / 1e9));

type TrackFlags = { track_weight?: boolean; track_distance?: boolean; track_grade?: boolean; track_height?: boolean };
const metricsOf = (ex?: TrackFlags | null): ExerciseMetrics => ({
  weight: ex?.track_weight !== false, // defaults on
  distance: !!ex?.track_distance,
  grade: !!ex?.track_grade,
  height: !!ex?.track_height,
});

// Only send the metrics this exercise actually tracks (grade only when set).
const metricValues = (ex: SessionExercise, set: ExerciseSet) => ({
  weight: ex.metrics.weight ? set.weight : undefined,
  distance: ex.metrics.distance ? set.distance : undefined,
  height: ex.metrics.height ? set.height : undefined,
  grade: ex.metrics.grade && set.grade ? set.grade : undefined,
});

type SetTemplate = { rep_count?: number | null; duration?: number | null; rest_time: number };
const makeSet = (s: SetTemplate): ExerciseSet => ({
  type: s.duration ? 'time' : 'reps',
  reps: s.rep_count || 10,
  duration: nsToSeconds(s.duration),
  weight: 0,
  distance: 0,
  height: 0,
  grade: '',
  restSeconds: nsToSeconds(s.rest_time),
  completed: false,
});

export function WorkoutSession({ planId, scheduleId, onBack, onEndSession, isPro = true, onNavigate }: WorkoutSessionProps) {
  const { tokens } = useAuth();
  const { t, language } = useLanguage();
  const [showProModal, setShowProModal] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [finishingSession, setFinishingSession] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [guidedOpen, setGuidedOpen] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: number;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Persist elapsed time into the session key so leaving and resuming continues
  // the timer instead of resetting it.
  useEffect(() => {
    if (!sessionId) return;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      obj.sessionTime = sessionTime;
      localStorage.setItem(SESSION_KEY, JSON.stringify(obj));
    } catch {
      /* ignore */
    }
  }, [sessionTime, sessionId]);

  // Initialize session and load plan exercises
  useEffect(() => {
    const initializeSession = async () => {
      if (!tokens?.access_token) {
        setLoading(false);
        return;
      }

      try {
        // Restore an in-progress session instead of creating a new one
        const storedRaw = localStorage.getItem(SESSION_KEY);
        const stored = storedRaw ? JSON.parse(storedRaw) : null;
        let resolvedSessionId: string;

        if (stored?.sessionId) {
          resolvedSessionId = stored.sessionId;
        } else {
          const session = await SessionsAPI.createSession(tokens.access_token, {
            session_type: planId ? 'PLAN' : 'FREESTYLE',
            plan_id: planId,
          });
          resolvedSessionId = session.id;
          localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: resolvedSessionId, planId: planId || null, scheduleId: scheduleId || null }));
        }
        setSessionId(resolvedSessionId);
        if (stored?.sessionTime) setSessionTime(stored.sessionTime);

        // Load plan exercises if planId provided
        if (planId) {
          const planExercises = await PlansAPI.listPlanExercises(tokens.access_token, planId);

          const loadedExercises: SessionExercise[] = planExercises.map((pe, idx) => {
            const exerciseSets = pe.exercise?.sets || [];
            return {
              id: pe.id,
              name: localized(pe.exercise?.name_i18n, pe.exercise?.name || `Exercise ${idx + 1}`, language),
              exerciseId: pe.exercise_id,
              mediaUrl: pe.exercise?.media?.url,
              metrics: metricsOf(pe.exercise),
              targetSets: exerciseSets.length || 3,
              targetReps: exerciseSets[0]?.rep_count || 10,
              targetWeight: 0,
              sets: (exerciseSets.length > 0 ? exerciseSets : [{ rep_count: 10, rest_time: 60e9 }]).map(makeSet),
            };
          });

          // Restore already-logged sets so resuming keeps progress intact.
          let restored = loadedExercises;
          try {
            const logs = await SessionsAPI.getSessionLogs(tokens.access_token, resolvedSessionId);
            if (logs.length > 0) {
              restored = loadedExercises.map((ex) => ({
                ...ex,
                sets: ex.sets.map((s, i) => {
                  const log = logs.find((l) => l.exercise_id === ex.exerciseId && l.set_number === i + 1);
                  return log
                    ? {
                        ...s,
                        reps: log.reps ?? s.reps,
                        duration: log.duration_seconds ?? s.duration,
                        weight: Number(log.weight ?? s.weight),
                        distance: Number(log.distance ?? s.distance),
                        height: Number(log.height ?? s.height),
                        grade: log.grade ?? s.grade,
                        completed: !!log.completed,
                      }
                    : s;
                }),
              }));
            }
          } catch {
            /* logs are best-effort */
          }

          setExercises(restored);
          // Expand the first exercise that still has work left.
          const firstIncomplete = restored.find((ex) => ex.sets.some((s) => !s.completed)) || restored[0];
          if (firstIncomplete) setExpandedExercise(firstIncomplete.id);
          // Workouts are guided by default: if there's work left, drop straight
          // into the guided run rather than making the athlete tap Start.
          if (restored.some((ex) => ex.sets.some((s) => !s.completed))) {
            setGuidedOpen(true);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToStartSession'));
        setLoading(false);
      }
    };

    initializeSession();
  }, [tokens?.access_token, planId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSetComplete = async (exerciseIndex: number, setIndex: number) => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }

    if (!tokens?.access_token || !sessionId) return;

    const exercise = exercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    const newCompletedState = !set.completed;

    // Update UI optimistically
    setExercises(prev =>
      prev.map((exercise, exIdx) => {
        if (exIdx !== exerciseIndex) return exercise;
        const updatedSets = exercise.sets.map((set, sIdx) =>
          sIdx === setIndex ? { ...set, completed: newCompletedState } : set
        );
        return { ...exercise, sets: updatedSets };
      })
    );

    // Save to API if marking as complete
    if (newCompletedState) {
      try {
        await SessionsAPI.createWorkoutLog(tokens.access_token, {
          session_id: sessionId,
          exercise_name: exercise.name,
          exercise_id: exercise.exerciseId, // Use the actual exercise_id from exercises table
          set_number: setIndex + 1,
          reps: set.type === 'reps' ? set.reps : undefined,
          duration_seconds: set.type === 'time' ? set.duration : undefined,
          ...metricValues(exercise, set),
          completed: true,
        });
      } catch (err) {
        console.error('Failed to save workout log:', err);
        setError(t('failedToSaveSet'));
      }
    }
  };

  // Guided run logs each set as it finishes: apply the actual values and persist.
  const handleGuidedLog = async (exerciseIndex: number, setIndex: number, values: GuidedSetValues) => {
    setExercises(prev =>
      prev.map((ex, i) =>
        i !== exerciseIndex
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j !== setIndex
                  ? s
                  : {
                      ...s,
                      reps: values.reps ?? s.reps,
                      duration: values.duration ?? s.duration,
                      weight: values.weight ?? s.weight,
                      distance: values.distance ?? s.distance,
                      height: values.height ?? s.height,
                      grade: values.grade ?? s.grade,
                      completed: true,
                    },
              ),
            },
      ),
    );
    if (!tokens?.access_token || !sessionId) return;
    const ex = exercises[exerciseIndex];
    try {
      await SessionsAPI.createWorkoutLog(tokens.access_token, {
        session_id: sessionId,
        exercise_name: ex.name,
        exercise_id: ex.exerciseId,
        set_number: setIndex + 1,
        reps: values.reps,
        duration_seconds: values.duration,
        weight: values.weight,
        distance: values.distance,
        height: values.height,
        grade: values.grade || undefined,
        completed: true,
      });
    } catch (err) {
      console.error('Failed to save workout log:', err);
    }
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight' | 'duration' | 'distance' | 'height',
    change: number,
  ) => {
    setExercises(prev =>
      prev.map((exercise, exIdx) => {
        if (exIdx !== exerciseIndex) return exercise;
        const updatedSets = exercise.sets.map((set, sIdx) => {
          if (sIdx !== setIndex) return set;
          const nextValue = Math.max(0, set[field] + change);
          return { ...set, [field]: nextValue };
        });
        return { ...exercise, sets: updatedSets };
      })
    );
  };

  const updateGrade = (exerciseIndex: number, setIndex: number, grade: string) => {
    setExercises(prev =>
      prev.map((exercise, exIdx) =>
        exIdx !== exerciseIndex
          ? exercise
          : { ...exercise, sets: exercise.sets.map((s, i) => (i === setIndex ? { ...s, grade } : s)) },
      ),
    );
  };

  const handleFinishWorkout = () => {
    // Open feedback dialog
    setShowFeedbackDialog(true);
  };

  const handleFeedbackSubmit = async (feedback: SessionFeedback) => {
    if (!tokens?.access_token || !sessionId) {
      onEndSession();
      return;
    }

    setFinishingSession(true);

    try {
      // Complete the session with feedback
      await SessionsAPI.updateSession(tokens.access_token, sessionId, {
        status: 'COMPLETED',
        intensity: feedback.intensity,
        quality: feedback.quality,
        notes: feedback.notes || undefined,
      });

      // Note: Schedule stays ACTIVE so user can repeat it
      // Only the session is marked COMPLETED

      localStorage.removeItem(SESSION_KEY);
      setShowFeedbackDialog(false);
      onEndSession();
    } catch (err) {
      console.error('Failed to finish workout:', err);
      setError(t('failedToCompleteWorkout'));
    } finally {
      setFinishingSession(false);
    }
  };

  const handleAddSet = (exerciseId: string) => {
    setExercises(prev =>
      prev.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        // Mirror the exercise's existing sets (a new hangboard set is timed, a
        // new bench set is reps) so an added set matches the rest.
        const template = exercise.sets[exercise.sets.length - 1];
        const newSet: ExerciseSet = {
          type: template?.type ?? 'reps',
          reps: template?.reps ?? exercise.targetReps,
          duration: template?.duration ?? 0,
          weight: template?.weight ?? exercise.targetWeight,
          distance: template?.distance ?? 0,
          height: template?.height ?? 0,
          grade: template?.grade ?? '',
          restSeconds: template?.restSeconds ?? 60,
          completed: false,
        };
        return { ...exercise, sets: [...exercise.sets, newSet] };
      })
    );
  };

  // Exercise search for freestyle
  useEffect(() => {
    if (!showExercisePicker || !tokens?.access_token) return;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await ExercisesAPI.listExercises(tokens.access_token, {
          search: exerciseSearch || undefined,
          limit: 20,
        });
        setSearchResults(res.items);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [exerciseSearch, showExercisePicker, tokens?.access_token]);

  const openExercisePicker = () => {
    setExerciseSearch('');
    setSearchResults([]);
    setShowExercisePicker(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleAddExercise = (exercise: Exercise) => {
    const templates = exercise.sets?.length ? exercise.sets : [{ rep_count: 10, rest_time: 60e9 }];
    const sets: ExerciseSet[] = templates.map(makeSet);
    const newExercise: SessionExercise = {
      id: `${exercise.id}-${Date.now()}`,
      name: localized(exercise.name_i18n, exercise.name, language),
      exerciseId: exercise.id,
      mediaUrl: exercise.media?.url ?? null,
      metrics: metricsOf(exercise),
      targetSets: sets.length,
      targetReps: sets[0]?.reps ?? 10,
      targetWeight: 0,
      sets,
    };
    setExercises(prev => [...prev, newExercise]);
    setExpandedExercise(newExercise.id);
    setShowExercisePicker(false);
  };

  const calculateProgress = () => {
    let totalSets = 0;
    let completedSets = 0;
    exercises.forEach(ex => {
      totalSets += ex.sets.length;
      completedSets += ex.sets.filter(s => s.completed).length;
    });
    return totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">{t('loadingWorkout')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-navy px-4 pt-4 pb-6 sticky top-0 z-20 shadow-md">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3 mb-3">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <BackButton onClick={onBack} aria-label={t('back')} />
          <div className="flex flex-col items-center">
            <h2 className="text-white font-bold">{planId ? t('workoutSession') : t('freestyleWorkout')}</h2>
            <div className="flex items-center gap-2 text-yellow-500 text-sm font-mono bg-navy-light px-3 py-0.5 rounded-full mt-1">
              <Clock className="w-3 h-3" />
              {formatTime(sessionTime)}
            </div>
          </div>
          <button
            onClick={handleFinishWorkout}
            className="text-white font-medium hover:text-yellow-500 transition-colors"
          >
            {t('finish')}
          </button>
        </div>
        
        <div className="h-1 bg-navy-light rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-500 transition-all duration-500"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {exercises.some((e) => e.sets.some((s) => !s.completed)) && (
          <Button
            variant="brand"
            size="block"
            icon={<Zap className="size-5" />}
            onClick={() => {
              if (!isPro) { setShowProModal(true); return; }
              setGuidedOpen(true);
            }}
            className="rounded-xl font-bold shadow-md"
          >
            {t('startGuided')}
          </Button>
        )}

        {!planId && exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="font-bold text-navy text-lg mb-1">{t('noExercisesYet')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('noExercisesDesc')}</p>
            <button
              onClick={openExercisePicker}
              className="bg-navy text-white px-6 py-3 rounded-xl font-bold hover:bg-navy-light"
            >
              {t('addExercise')}
            </button>
          </div>
        )}

        {exercises.map((exercise, exerciseIndex) => {
          const isExpanded = expandedExercise === exercise.id;
          const completedCount = exercise.sets.filter(s => s.completed).length;
          const isFullyComplete = completedCount === exercise.sets.length;

          return (
            <div 
              key={exercise.id} 
              className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden ${
                isExpanded ? 'border-yellow-500 ring-1 ring-yellow-500/20' : 'border-gray-200'
              }`}
            >
              <button
                onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                className="w-full p-4 flex items-center gap-3 bg-white"
              >
                {!isExpanded && exercise.mediaUrl && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    {isVideoUrl(exercise.mediaUrl) ? (
                      <video
                        src={exercise.mediaUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img src={exercise.mediaUrl} alt={exercise.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
                <div className="text-left flex-1">
                  <h3 className={`font-bold text-lg ${isFullyComplete ? 'text-green-700' : 'text-navy'}`}>
                    {exercise.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('setsCompletedShort', { completed: completedCount, total: exercise.sets.length })}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${isFullyComplete ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {isFullyComplete ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 bg-gray-50/50 border-t border-gray-100 pt-4">
                  {exercise.mediaUrl && (
                    <div className="mb-1 rounded-2xl overflow-hidden bg-gradient-to-b from-white to-gray-100 border border-gray-200 flex items-center justify-center h-56">
                      {isVideoUrl(exercise.mediaUrl) ? (
                        <video
                          src={exercise.mediaUrl}
                          className="h-full w-auto object-contain"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img src={exercise.mediaUrl} alt={exercise.name} className="h-full w-auto object-contain" />
                      )}
                    </div>
                  )}
                  {exercise.sets.map((set, setIndex) => (
                    <div 
                      key={setIndex}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        set.completed 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center w-8">
                        <span className="text-xs font-bold text-gray-400">{t('setLabel')}</span>
                        <span className="text-sm font-bold text-navy">{setIndex + 1}</span>
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-2">
                        {set.type === 'time' ? (
                          <StepTile label={t('secUpper')} value={set.duration} onDec={() => updateSet(exerciseIndex, setIndex, 'duration', -5)} onInc={() => updateSet(exerciseIndex, setIndex, 'duration', 5)} />
                        ) : (
                          <StepTile label={t('repsUpper')} value={set.reps} onDec={() => updateSet(exerciseIndex, setIndex, 'reps', -1)} onInc={() => updateSet(exerciseIndex, setIndex, 'reps', 1)} />
                        )}
                        {exercise.metrics.weight && (
                          <StepTile label={t('kg')} value={set.weight} onDec={() => updateSet(exerciseIndex, setIndex, 'weight', -2.5)} onInc={() => updateSet(exerciseIndex, setIndex, 'weight', 2.5)} />
                        )}
                        {exercise.metrics.distance && (
                          <StepTile label={t('distanceUpper')} value={set.distance} onDec={() => updateSet(exerciseIndex, setIndex, 'distance', -10)} onInc={() => updateSet(exerciseIndex, setIndex, 'distance', 10)} />
                        )}
                        {exercise.metrics.height && (
                          <StepTile label={t('heightUpper')} value={set.height} onDec={() => updateSet(exerciseIndex, setIndex, 'height', -5)} onInc={() => updateSet(exerciseIndex, setIndex, 'height', 5)} />
                        )}
                        {exercise.metrics.grade && (
                          <div className="bg-gray-50 rounded-lg p-1.5 flex flex-col items-center border border-gray-200">
                            <span className="text-[10px] text-gray-500 font-bold mb-1">{t('gradeUpper')}</span>
                            <GradeSelect value={set.grade} onChange={(g) => updateGrade(exerciseIndex, setIndex, g)} placeholder="—" className="w-full border-0 bg-transparent px-0 py-0 text-center font-bold" />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                        className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                          set.completed
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                        }`}
                      >
                        <Check className="w-6 h-6" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex justify-center pt-2">
                    <button 
                      onClick={() => handleAddSet(exercise.id)}
                      className="text-sm text-yellow-600 font-medium flex items-center gap-1 hover:text-yellow-700"
                    >
                      <Plus className="w-4 h-4" /> {t('addSet')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!planId && exercises.length > 0 && (
          <button
            onClick={openExercisePicker}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium flex items-center justify-center gap-2 hover:border-yellow-500 hover:text-yellow-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> {t('addExercise')}
          </button>
        )}
      </div>

      {/* Exercise picker overlay for freestyle */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col">
          <div className="bg-navy px-4 pt-4 pb-4 flex items-center gap-3">
            <button onClick={() => setShowExercisePicker(false)} className="p-2 -ml-2 hover:bg-navy-light rounded-lg">
              <X className="w-6 h-6 text-white" />
            </button>
            <h2 className="text-white font-bold flex-1">{t('addExercise')}</h2>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)}
                placeholder={t('searchExercisesPlaceholder')}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
            {searchLoading && (
              <p className="text-center text-gray-500 text-sm py-8">{t('searching')}</p>
            )}
            {!searchLoading && searchResults.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-8">
                {exerciseSearch ? t('noExercisesFound') : t('startTypingToSearch')}
              </p>
            )}
            {!searchLoading && searchResults.map(exercise => (
              <button
                key={exercise.id}
                onClick={() => handleAddExercise(exercise)}
                className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left"
              >
                {exercise.media?.url && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {isVideoUrl(exercise.media.url) ? (
                      <video src={exercise.media.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img src={exercise.media.url} alt={localized(exercise.name_i18n, exercise.name, language)} className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy truncate">{localized(exercise.name_i18n, exercise.name, language)}</p>
                  <p className="text-xs text-gray-400 capitalize">{exercise.sport_type.toLowerCase()}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-yellow-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-lg flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isTimerRunning ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
            <div>
               <p className="text-xs text-gray-500 font-bold">{t('sessionTimer')}</p>
               <p className="text-xl font-mono text-navy font-bold">{formatTime(sessionTime)}</p>
            </div>
        </div>
        <button
          onClick={handleFinishWorkout}
          className="bg-navy text-white px-6 py-3 rounded-xl font-bold hover:bg-navy-light shadow-lg shadow-navy/20"
        >
          {t('finishWorkout')}
        </button>
      </div>

      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onUpgrade={() => {
          setShowProModal(false);
          if (onNavigate) onNavigate('athlete-search');
        }}
        feature="log"
      />

      <GuidedWorkout
        open={guidedOpen}
        exercises={exercises}
        onLogSet={handleGuidedLog}
        onClose={() => setGuidedOpen(false)}
        onFinish={() => {
          setGuidedOpen(false);
          handleFinishWorkout();
        }}
      />

      <SessionFeedbackDialog
        isOpen={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        onSubmit={handleFeedbackSubmit}
        loading={finishingSession}
      />
    </div>
  );
}

function StepTile({ label, value, onDec, onInc }: { label: string; value: number; onDec: () => void; onInc: () => void }) {
  return (
    <div className="bg-gray-50 rounded-lg p-1.5 flex flex-col items-center border border-gray-200">
      <span className="text-[10px] text-gray-500 font-bold mb-1">{label}</span>
      <div className="flex items-center gap-2 w-full justify-between px-1">
        <button onClick={onDec} className="text-gray-400 hover:text-navy"><Minus className="w-3 h-3" /></button>
        <span className="font-bold text-navy">{value}</span>
        <button onClick={onInc} className="text-gray-400 hover:text-navy"><Plus className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

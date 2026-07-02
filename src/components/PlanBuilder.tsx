import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, GripVertical, Trash2, RefreshCw, Search, Dumbbell } from 'lucide-react';
import type { Exercise, ExerciseSportType } from '../api/types';
import * as ExercisesAPI from '../api/exercises';
import * as PlansAPI from '../api/plans';
import { useAuth } from '../contexts/AuthContext';
import { ExerciseBuilder } from './ExerciseBuilder';
import { HeatSlider } from './ui';
import { useLanguage } from '../contexts/LanguageContext';

interface PlanBuilderProps {
  onCancel: () => void;
  onSave: () => void;
  userRole: 'athlete' | 'coach';
  userTier?: 'free' | 'pro';
  planId?: string; // when set, open an existing plan (view, or edit if owned)
}

type PlanExercise = {
  key: string;
  exerciseId: string;
  name: string;
  type: 'reps' | 'time';
  sets: number;
  repsOrDuration: number;
  restInterval: number;
  intensity: number;
};

// Helper component for sport type badge
function SportTypeBadge({ sportType }: { sportType: ExerciseSportType }) {
  const { t } = useLanguage();
  const colors = {
    STRENGTH: 'bg-blue-100 text-blue-700',
    CLIMBING: 'bg-purple-100 text-purple-700',
    CARDIO: 'bg-red-100 text-red-700',
    MOBILITY: 'bg-green-100 text-green-700',
    GENERAL: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[sportType]}`}>
      {t(`sport${sportType}`)}
    </span>
  );
}

export function PlanBuilder({ onCancel, onSave, planId }: PlanBuilderProps) {
  const { tokens, user } = useAuth();
  const { t } = useLanguage();
  const [planName, setPlanName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExerciseBuilder, setShowExerciseBuilder] = useState(false);
  const [sportTypeFilter, setSportTypeFilter] = useState<ExerciseSportType | 'ALL'>('ALL');
  // Existing-plan state. isOwner gates editing; read-only when viewing a plan you don't own.
  const [isOwner, setIsOwner] = useState(true);
  const [originalExerciseIds, setOriginalExerciseIds] = useState<string[]>([]);
  const readOnly = Boolean(planId) && !isOwner;

  const nsToSeconds = (value?: number | null) => Math.max(0, Math.round((value ?? 0) / 1e9));
  const secondsToNs = (value: number) => Math.max(0, Math.round(value) * 1e9);

  // Load an existing plan (name, visibility, exercises) when a planId is given.
  useEffect(() => {
    const token = tokens?.access_token;
    if (!planId || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const [plan, planExercises] = await Promise.all([
          PlansAPI.getPlan(token, planId),
          PlansAPI.listPlanExercises(token, planId),
        ]);
        if (cancelled) return;
        setPlanName(plan.name);
        setIsPublic(plan.public);
        setIsOwner(plan.user_id === user?.id);
        const mapped: PlanExercise[] = (planExercises || []).map((pe) => {
          const summary = pe.exercise?.sets?.[0];
          const type: 'reps' | 'time' = summary?.duration ? 'time' : 'reps';
          return {
            key: pe.id,
            exerciseId: pe.exercise_id,
            name: pe.exercise?.name ?? '',
            type,
            sets: pe.exercise?.sets?.length || 1,
            repsOrDuration: type === 'reps' ? summary?.rep_count ?? 0 : nsToSeconds(summary?.duration),
            restInterval: nsToSeconds(pe.rest_time),
            intensity: pe.intensity ?? 5,
          };
        });
        setExercises(mapped);
        setOriginalExerciseIds(mapped.map((m) => m.exerciseId));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t('unableToLoadPlans'));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, tokens?.access_token, user?.id]);

  const loadExercises = async () => {
    if (!tokens?.access_token) {
      setError(t('loginToLoadExercises'));
      return;
    }
    setLoadingExercises(true);
    setError(null);
    try {
      const list = await ExercisesAPI.listExercises(tokens.access_token, {
        name: exerciseSearch.trim() || undefined,
      });
      setExerciseLibrary(Array.isArray(list) ? list : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('unableToLoadExercises');
      setError(msg);
    } finally {
      setLoadingExercises(false);
    }
  };

  useEffect(() => {
    loadExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.access_token]);

  const addExerciseToPlan = (exercise: Exercise) => {
    const summary = exercise.sets?.[0];
    const type: 'reps' | 'time' = summary?.duration ? 'time' : 'reps';
    const repsOrDuration = type === 'reps' ? summary?.rep_count ?? 0 : nsToSeconds(summary?.duration);
    const restInterval =
      summary && summary.rest_time !== undefined ? nsToSeconds(summary.rest_time) : 60;
    setExercises((prev) => [
      ...prev,
      {
        key: `${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        name: exercise.name,
        type,
        sets: exercise.sets?.length || 1,
        repsOrDuration,
        restInterval,
        intensity: 5,
      },
    ]);
    setShowExerciseSelector(false);
  };

  useEffect(() => {
    if (!tokens?.access_token) return;
    const timer = window.setTimeout(() => {
      loadExercises();
    }, 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseSearch, tokens?.access_token]);

  const handleSave = async () => {
    const token = tokens?.access_token;
    if (readOnly || !planName.trim() || exercises.length === 0 || !token || saving) {
      if (!token) setError(t('loginToSavePlan'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (planId) {
        // Update the existing plan, then resync its exercises (remove all, re-add
        // in order) to reflect adds/removes/reorders/rest+intensity changes.
        await PlansAPI.updatePlan(token, planId, { name: planName.trim(), public: isPublic });
        await Promise.all(
          originalExerciseIds.map((exerciseId) =>
            PlansAPI.removePlanExercise(token, planId, exerciseId).catch(() => {})
          )
        );
        for (let index = 0; index < exercises.length; index++) {
          const exercise = exercises[index];
          await PlansAPI.addPlanExercise(token, planId, {
            exercise_id: exercise.exerciseId,
            exercise_order: index + 1,
            rest_time: secondsToNs(exercise.restInterval),
            intensity: exercise.intensity,
          });
        }
      } else {
        const plan = await PlansAPI.createPlan(token, {
          name: planName.trim(),
          public: isPublic,
        });
        await Promise.all(
          exercises.map((exercise, index) =>
            PlansAPI.addPlanExercise(token, plan.id, {
              exercise_id: exercise.exerciseId,
              exercise_order: index + 1,
              rest_time: secondsToNs(exercise.restInterval),
              intensity: exercise.intensity,
            })
          )
        );
      }

      onSave();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('unableToSavePlan');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const removeExercise = (key: string) => {
    setExercises((prev) => prev.filter((ex) => ex.key !== key));
  };

  const updateRest = (key: string, next: number) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.key === key ? { ...ex, restInterval: Math.max(0, next) } : ex))
    );
  };

  const updateIntensity = (key: string, next: number) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.key === key ? { ...ex, intensity: Math.max(1, Math.min(10, next)) } : ex))
    );
  };

  const existingExerciseIds = useMemo(() => new Set(exercises.map((ex) => ex.exerciseId)), [exercises]);

  const filteredExercises = useMemo(() => {
    if (sportTypeFilter === 'ALL') return exerciseLibrary;
    return exerciseLibrary.filter((ex) => ex.sport_type === sportTypeFilter);
  }, [exerciseLibrary, sportTypeFilter]);

  if (showExerciseBuilder) {
    return (
      <ExerciseBuilder
        onCancel={() => setShowExerciseBuilder(false)}
        onSaved={(exercise) => {
          setShowExerciseBuilder(false);
          addExerciseToPlan(exercise);
          loadExercises();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white">{planId ? (isOwner ? t('editPlan') : t('viewPlan')) : t('createPlan')}</h2>
          {readOnly ? (
            <div className="w-10" />
          ) : (
            <button
              onClick={handleSave}
              disabled={!planName.trim() || exercises.length === 0 || saving}
              className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t('saving') : t('save')}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {error && <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>}

        {/* Plan Name */}
        <div>
          <label className="block mb-2 text-gray-900">{t('planName')}</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder={t('planNamePlaceholder')}
            readOnly={readOnly}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${readOnly ? 'bg-gray-100 text-gray-700 cursor-default' : 'bg-white'}`}
          />
        </div>

        {/* Visibility */}
        {!readOnly && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-gray-900">{t('makePlanPublic')}</span>
              <p className="text-gray-600 text-sm">{t('publicPlansVisible')}</p>
            </div>
          </label>
        )}

        {/* Exercises List */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#3D3D3D]">{t('exercisesCount', { count: exercises.length })}</h3>
            {!readOnly && (
              <button
                onClick={() => setShowExerciseSelector(!showExerciseSelector)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-[#3D3D3D] rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">{t('add')}</span>
              </button>
            )}
          </div>

          {showExerciseSelector && (
            <div className="mb-4 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder={t('searchExercisesPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={loadExercises}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingExercises ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowExerciseBuilder(true)}
                  className="px-3 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  {t('newLabel')}
                </button>
              </div>

              {/* Sport Type Filters */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {(['ALL', 'STRENGTH', 'CLIMBING', 'CARDIO', 'MOBILITY', 'GENERAL'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSportTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      sportTypeFilter === type
                        ? 'bg-[#0E0E55] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t(`sport${type}`)}
                  </button>
                ))}
              </div>

              {loadingExercises && (
                <div className="text-sm text-gray-600 py-4 text-center">
                  <RefreshCw className="w-5 h-5 animate-spin inline-block mb-1" />
                  <div>{t('loadingExercises')}</div>
                </div>
              )}
              {!loadingExercises && (exerciseLibrary?.length ?? 0) === 0 && (
                <div className="text-sm text-gray-600 py-8 text-center">
                  <Dumbbell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <div className="font-medium">{t('noExercisesFound')}</div>
                  <div className="text-xs text-gray-500 mt-1">{t('createFirstExercise')}</div>
                </div>
              )}
              {!loadingExercises && filteredExercises.length === 0 && exerciseLibrary.length > 0 && (
                <div className="text-sm text-gray-600 py-8 text-center">
                  <div className="font-medium">{t('noExercisesMatchFilter')}</div>
                  <div className="text-xs text-gray-500 mt-1">{t('tryDifferentSport')}</div>
                </div>
              )}
              <div className="space-y-2 max-h-96 overflow-auto">
                {filteredExercises.map((exercise) => {
                  const summary = exercise.sets?.[0];
                  const isTime = !!summary?.duration;
                  const displayTarget = isTime ? `${nsToSeconds(summary?.duration)} ${t('secUnit')}` : `${summary?.rep_count ?? 0} ${t('repsUnit')}`;
                  const rest =
                    summary && summary.rest_time !== undefined ? nsToSeconds(summary.rest_time) : 60;
                  const alreadyAdded = existingExerciseIds.has(exercise.id);
                  return (
                    <div key={exercise.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-gray-900 truncate">{exercise.name}</div>
                            <SportTypeBadge sportType={exercise.sport_type} />
                          </div>
                          <div className="text-sm text-gray-600">
                            {t('setsTargetRest', { sets: exercise.sets?.length || 1, target: displayTarget, rest })}
                          </div>
                          {exercise.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{exercise.description}</div>
                          )}
                        </div>
                        <button
                          onClick={() => addExerciseToPlan(exercise)}
                          disabled={alreadyAdded}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                            alreadyAdded
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-[#0E0E55] text-white hover:bg-[#1A1A6E]'
                          }`}
                        >
                          {alreadyAdded ? t('added') : t('add')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {exercises.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-2">{t('noExercisesAddedYet')}</p>
              <p className="text-gray-500 text-sm">{t('tapAddExerciseToBuild')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div key={exercise.key} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    {!readOnly && (
                      <button className="mt-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 mb-1">{exercise.name}</div>
                          <div className="text-sm text-gray-600">
                            {t('setsReps', { sets: exercise.sets, reps: exercise.repsOrDuration, unit: exercise.type === 'reps' ? t('repsUnit') : t('secUnit') })}
                          </div>
                        </div>
                        {!readOnly && (
                          <button
                            onClick={() => removeExercise(exercise.key)}
                            className="text-red-500 hover:text-red-600 p-1"
                            title={t('removeExerciseTitle')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {readOnly ? (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{t('restBetweenSets')}: {exercise.restInterval} {t('secondsUnit')}</span>
                          <span>{t('intensityLevel')}: {exercise.intensity}/10</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Rest Interval */}
                          <div>
                            <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                              {t('restBetweenSets')}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                value={exercise.restInterval}
                                onChange={(e) => updateRest(exercise.key, Number(e.target.value))}
                                className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                              />
                              <span className="text-sm text-gray-600">{t('secondsUnit')}</span>
                            </div>
                          </div>

                          {/* Intensity Slider */}
                          <HeatSlider
                            value={exercise.intensity}
                            onChange={(val) => updateIntensity(exercise.key, val)}
                            label={t('intensityLevel')}
                            min={1}
                            max={10}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, GripVertical, Trash2, RefreshCw, Search } from 'lucide-react';
import type { Exercise } from '../api/types';
import * as ExercisesAPI from '../api/exercises';
import * as PlansAPI from '../api/plans';
import { useAuth } from '../contexts/AuthContext';
import { ExerciseBuilder } from './ExerciseBuilder';

interface PlanBuilderProps {
  onCancel: () => void;
  onSave: () => void;
  userRole: 'athlete' | 'coach';
  userTier?: 'free' | 'pro';
}

type PlanExercise = {
  key: string;
  exerciseId: string;
  name: string;
  type: 'reps' | 'time';
  sets: number;
  repsOrDuration: number;
  restInterval: number;
};

export function PlanBuilder({ onCancel, onSave }: PlanBuilderProps) {
  const { tokens } = useAuth();
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

  const nsToSeconds = (value?: number | null) => Math.max(0, Math.round((value ?? 0) / 1e9));
  const secondsToNs = (value: number) => Math.max(0, Math.round(value) * 1e9);

  const loadExercises = async () => {
    if (!tokens?.access_token) {
      setError('Please log in to load your exercises.');
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
      const msg = e instanceof Error ? e.message : 'Unable to load exercises';
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
    if (!planName.trim() || exercises.length === 0 || !tokens?.access_token || saving) {
      if (!tokens?.access_token) setError('Please log in to save this plan.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const plan = await PlansAPI.createPlan(tokens.access_token, {
        name: planName.trim(),
        public: isPublic,
      });

      await Promise.all(
        exercises.map((exercise, index) =>
          PlansAPI.addPlanExercise(tokens.access_token, plan.id, {
            exercise_id: exercise.exerciseId,
            exercise_order: index + 1,
            rest_time: secondsToNs(exercise.restInterval),
          })
        )
      );

      onSave();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to save plan';
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

  const existingExerciseIds = useMemo(() => new Set(exercises.map((ex) => ex.exerciseId)), [exercises]);

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
          <h2 className="text-white">Create Plan</h2>
          <button
            onClick={handleSave}
            disabled={!planName.trim() || exercises.length === 0 || saving}
            className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {error && <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>}

        {/* Plan Name */}
        <div>
          <label className="block mb-2 text-gray-900">Plan Name</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g., Upper Body Strength"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Visibility */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <span className="text-gray-900">Make this plan public</span>
            <p className="text-gray-600 text-sm">Public plans are visible to the community.</p>
          </div>
        </label>

        {/* Exercises List */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#3D3D3D]">Exercises ({exercises.length})</h3>
            <button
              onClick={() => setShowExerciseSelector(!showExerciseSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-[#3D3D3D] rounded-lg hover:bg-yellow-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add</span>
            </button>
          </div>

          {showExerciseSelector && (
            <div className="mb-4 border border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Search your exercises..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={loadExercises}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingExercises ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setShowExerciseBuilder(true)}
                  className="px-3 py-2 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Exercise
                </button>
              </div>

              {loadingExercises && <div className="text-sm text-gray-600">Loading exercises...</div>}
              {!loadingExercises && (exerciseLibrary?.length ?? 0) === 0 && (
                <div className="text-sm text-gray-600">No exercises found. Create one first, then add it here.</div>
              )}
              <div className="space-y-2 max-h-64 overflow-auto">
                {(exerciseLibrary ?? []).map((exercise) => {
                  const summary = exercise.sets?.[0];
                  const isTime = !!summary?.duration;
                  const displayTarget = isTime ? `${nsToSeconds(summary?.duration)} sec` : `${summary?.rep_count ?? 0} reps`;
                  const rest =
                    summary && summary.rest_time !== undefined ? nsToSeconds(summary.rest_time) : 60;
                  const alreadyAdded = existingExerciseIds.has(exercise.id);
                  return (
                    <div key={exercise.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-gray-900">{exercise.name}</div>
                        <div className="text-sm text-gray-600">
                          {exercise.sets?.length || 1} sets • {displayTarget} • {rest}s rest
                        </div>
                        {exercise.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{exercise.description}</div>}
                      </div>
                      <button
                        onClick={() => addExerciseToPlan(exercise)}
                        disabled={alreadyAdded}
                        className="text-sm px-3 py-2 rounded-lg bg-[#0E0E55] text-white disabled:bg-gray-200 disabled:text-gray-500"
                      >
                        {alreadyAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {exercises.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-2">No exercises added yet</p>
              <p className="text-gray-500 text-sm">Tap "Add Exercise" to start building your plan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((exercise, index) => (
                <div key={exercise.key} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <button className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="text-gray-900">{exercise.name}</span>
                          <div className="text-gray-600 text-sm">
                            {exercise.sets} sets × {exercise.repsOrDuration} {exercise.type === 'reps' ? 'reps' : 'sec'}
                            {' • '}
                            <input
                              type="number"
                              min={0}
                              value={exercise.restInterval}
                              onChange={(e) => updateRest(exercise.key, Number(e.target.value))}
                              className="w-24 inline-flex px-2 py-1 text-sm border border-gray-300 rounded-md ml-1"
                            />{' '}
                            s rest
                          </div>
                        </div>
                        <button
                          onClick={() => removeExercise(exercise.key)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

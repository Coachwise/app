import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, GripVertical, Trash2, RefreshCw, Search, Dumbbell, Save } from 'lucide-react';
import { BackButton } from './ui/back-button';
import { Button } from './ui/button';
import { NumberInput } from './ui/number-input';
import type { Exercise, ExerciseCategory, ExerciseSet, ExerciseSportType } from '../api/types';
import * as ExercisesAPI from '../api/exercises';
import * as PlansAPI from '../api/plans';
import { useAuth } from '../contexts/AuthContext';
import { ExerciseBuilder } from './ExerciseBuilder';
import { HeatSlider } from './ui';
import { useLanguage } from '../contexts/LanguageContext';
import { localized } from '../lib/localize';

interface PlanBuilderProps {
  onCancel: () => void;
  onSave: () => void;
  userRole: 'athlete' | 'coach';
  userTier?: 'free' | 'pro';
  planId?: string; // when set, open an existing plan (view, or edit if owned)
}

// A plan-exercise's prescription, edited right here in the plan. `sets` is the
// source of truth (per-set reps/time + rest). The `custom` flag picks the editor:
// a simple uniform "N × target, rest" by default, or a per-set list when the sets
// differ (climbing repeaters, pyramids, drop sets). Last set gets no rest on save.
type PlanSet = {
  key: string;
  type: 'reps' | 'time';
  value: number; // reps, or duration in seconds
  restSeconds: number; // rest after this set
};
type PlanExercise = {
  key: string;
  exerciseId: string;
  name: string;
  custom: boolean;
  sets: PlanSet[];
  intensity: number;
};

const planSetKey = () => Math.random().toString(36).slice(2);

// Uniform = every set shares type+value, with equal rests except the final one
// (0 by convention). Decides whether the simple or per-set editor is shown.
const isUniform = (sets: PlanSet[]) => {
  if (sets.length <= 1) return true;
  const first = sets[0];
  return sets.every(
    (s, i) =>
      s.type === first.type &&
      s.value === first.value &&
      (i === sets.length - 1 || s.restSeconds === first.restSeconds),
  );
};

// Helper component for sport type badge
function SportTypeBadge({ sportType }: { sportType: ExerciseSportType }) {
  const { t } = useLanguage();
  const colors = {
    STRENGTH: 'bg-tint-soft text-tint-ink',
    CLIMBING: 'bg-amber-100 text-amber-700',
    CARDIO: 'bg-red-100 text-red-700',
    MOBILITY: 'bg-green-100 text-green-700',
    GENERAL: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[sportType]}`}>
      {t(`sport${sportType}`)}
    </span>
  );
}

export function PlanBuilder({ onCancel, onSave, planId }: PlanBuilderProps) {
  const { tokens, user } = useAuth();
  const { t, language } = useLanguage();
  const PAGE_SIZE = 20;
  const [planName, setPlanName] = useState('');
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExerciseBuilder, setShowExerciseBuilder] = useState(false);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [sport, setSport] = useState(''); // selected exercise_sport_type
  const [category, setCategory] = useState(''); // selected category slug ('' = all)
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const categoriesForSport = categories.filter((c) => !c.sport_type || c.sport_type === sport);
  // Existing-plan state. isOwner gates editing; read-only when viewing a plan you don't own.
  const [isOwner, setIsOwner] = useState(true);
  const [originalExerciseIds, setOriginalExerciseIds] = useState<string[]>([]);
  const readOnly = Boolean(planId) && !isOwner;

  const nsToSeconds = (value?: number | null) => Math.max(0, Math.round((value ?? 0) / 1e9));
  const secondsToNs = (value: number) => Math.max(0, Math.round(value) * 1e9);

  // Map a raw set list (plan prescription or exercise default) into editor sets.
  const toPlanSets = (raw: ExerciseSet[]): PlanSet[] =>
    raw.map((s) => {
      const type: 'reps' | 'time' = s.duration ? 'time' : 'reps';
      return {
        key: planSetKey(),
        type,
        value: type === 'reps' ? s.rep_count ?? 0 : nsToSeconds(s.duration),
        restSeconds: nsToSeconds(s.rest_time),
      };
    });
  const blankSet = (): PlanSet => ({ key: planSetKey(), type: 'reps', value: 10, restSeconds: 60 });

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
        setIsOwner(plan.user_id === user?.id);
        const mapped: PlanExercise[] = (planExercises || []).map((pe) => {
          // Prefer this plan-exercise's own prescription; fall back to the
          // exercise's default sets for plans saved before prescriptions existed.
          const rx = (pe.sets && pe.sets.length ? pe.sets : pe.exercise?.sets) ?? [];
          const sets = rx.length ? toPlanSets(rx) : [blankSet()];
          return {
            key: pe.id,
            exerciseId: pe.exercise_id,
            name: localized(pe.exercise?.name_i18n, pe.exercise?.name ?? '', language),
            custom: !isUniform(sets),
            sets,
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

  const loadExercises = async (opts?: { search?: string; category?: string; sport?: string; page?: number; append?: boolean }) => {
    if (!tokens?.access_token) {
      setError(t('loginToLoadExercises'));
      return;
    }
    setLoadingExercises(true);
    setError(null);
    try {
      const pageToLoad = opts?.page ?? 1;
      const res = await ExercisesAPI.listExercises(tokens.access_token, {
        search: (opts?.search ?? exerciseSearch).trim() || undefined,
        category: (opts?.category ?? category) || undefined,
        sport: (opts?.sport ?? sport) || undefined,
        page: pageToLoad,
        limit: PAGE_SIZE,
      });
      setTotal(res.total);
      setPage(pageToLoad);
      setExerciseLibrary((prev) => (opts?.append ? [...prev, ...res.items] : res.items));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('unableToLoadExercises');
      setError(msg);
    } finally {
      setLoadingExercises(false);
    }
  };

  // Load categories and derive the sport filter chips. Exercises themselves load
  // via the effect below (unconditionally), so an empty/odd category list can't
  // leave the picker blank.
  useEffect(() => {
    if (!tokens?.access_token) return;
    ExercisesAPI.listExerciseCategories(tokens.access_token)
      .then((res) => {
        setCategories(res.items);
        const derived = Array.from(
          new Set(res.items.map((c) => c.sport_type).filter((s): s is string => !!s)),
        );
        setSports(derived);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.access_token]);

  const selectSport = (s: string) => {
    setSport(s);
    setCategory('');
    if (listRef.current) listRef.current.scrollTop = 0;
    loadExercises({ sport: s, category: '', page: 1 });
  };

  const selectCategory = (slug: string) => {
    setCategory(slug);
    if (listRef.current) listRef.current.scrollTop = 0;
    loadExercises({ category: slug, page: 1 });
  };

  // Infinite scroll: load the next page as the list nears its bottom.
  const onListScroll = () => {
    const el = listRef.current;
    if (!el || loadingExercises || exerciseLibrary.length >= total) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      loadExercises({ page: page + 1, append: true });
    }
  };

  const addExerciseToPlan = (exercise: Exercise) => {
    // Seed the plan prescription from the exercise's suggested default sets. A
    // non-uniform default (e.g. a repeater ladder) opens straight in per-set mode.
    const seeded = exercise.sets?.length ? toPlanSets(exercise.sets) : [blankSet()];
    setExercises((prev) => [
      ...prev,
      {
        key: `${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        name: localized(exercise.name_i18n, exercise.name, language),
        custom: !isUniform(seeded),
        sets: seeded,
        intensity: 5,
      },
    ]);
    setShowExerciseSelector(false);
  };

  // Load exercises on open and whenever the search changes (debounced) — no sport
  // required, so the list always populates without a manual refresh.
  useEffect(() => {
    if (!tokens?.access_token) return;
    const timer = window.setTimeout(() => {
      loadExercises({ page: 1 });
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
    // Send each set as its own row; the final set gets no rest by convention.
    const payloadFor = (exercise: PlanExercise, index: number) => ({
      exercise_id: exercise.exerciseId,
      exercise_order: index + 1,
      rest_time: secondsToNs(exercise.sets[0]?.restSeconds ?? 0),
      intensity: exercise.intensity,
      sets: exercise.sets.map((s, i) => ({
        rep_count: s.type === 'reps' ? Math.max(0, Math.round(s.value)) : null,
        duration: s.type === 'time' ? secondsToNs(s.value) : null,
        rest_time: i === exercise.sets.length - 1 ? 0 : secondsToNs(s.restSeconds),
      })),
    });
    try {
      if (planId) {
        // Update the existing plan, then resync its exercises (remove all, re-add
        // in order) to reflect adds/removes/reorders/prescription changes.
        await PlansAPI.updatePlan(token, planId, { name: planName.trim() });
        await Promise.all(
          originalExerciseIds.map((exerciseId) =>
            PlansAPI.removePlanExercise(token, planId, exerciseId).catch(() => {})
          )
        );
        for (let index = 0; index < exercises.length; index++) {
          await PlansAPI.addPlanExercise(token, planId, payloadFor(exercises[index], index));
        }
      } else {
        const plan = await PlansAPI.createPlan(token, {
          name: planName.trim(),
        });
        await Promise.all(
          exercises.map((exercise, index) =>
            PlansAPI.addPlanExercise(token, plan.id, payloadFor(exercise, index))
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

  const patchExercise = (key: string, patch: Partial<PlanExercise>) => {
    setExercises((prev) => prev.map((ex) => (ex.key === key ? { ...ex, ...patch } : ex)));
  };
  const updateIntensity = (key: string, next: number) =>
    patchExercise(key, { intensity: Math.max(1, Math.min(10, next)) });

  // --- Simple (uniform) editor: derive one spec, rewrite all sets from it. ---
  const uniformSpec = (ex: PlanExercise) => ({
    count: ex.sets.length,
    type: ex.sets[0]?.type ?? ('reps' as 'reps' | 'time'),
    value: ex.sets[0]?.value ?? 0,
    rest: ex.sets[0]?.restSeconds ?? 60,
  });
  const applyUniform = (
    key: string,
    patch: Partial<{ count: number; type: 'reps' | 'time'; value: number; rest: number }>,
  ) =>
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.key !== key) return ex;
        const next = { ...uniformSpec(ex), ...patch };
        const count = Math.max(1, Math.round(next.count));
        const sets = Array.from({ length: count }, () => ({
          key: planSetKey(),
          type: next.type,
          value: Math.max(0, next.value),
          restSeconds: Math.max(0, next.rest),
        }));
        return { ...ex, sets };
      }),
    );

  // --- Per-set editor ---
  const updateSet = (key: string, setK: string, patch: Partial<PlanSet>) =>
    setExercises((prev) =>
      prev.map((ex) =>
        ex.key === key
          ? { ...ex, sets: ex.sets.map((s) => (s.key === setK ? { ...s, ...patch } : s)) }
          : ex,
      ),
    );
  const addSet = (key: string) =>
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.key !== key) return ex;
        const last = ex.sets[ex.sets.length - 1] ?? blankSet();
        return { ...ex, sets: [...ex.sets, { ...last, key: planSetKey() }] };
      }),
    );
  const removeSet = (key: string, setK: string) =>
    setExercises((prev) =>
      prev.map((ex) =>
        ex.key === key && ex.sets.length > 1
          ? { ...ex, sets: ex.sets.filter((s) => s.key !== setK) }
          : ex,
      ),
    );
  // Flip between simple and per-set editing. Returning to simple collapses every
  // set to the first one's shape (per-set variation is intentionally discarded).
  const toggleCustom = (key: string) =>
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.key !== key) return ex;
        if (!ex.custom) return { ...ex, custom: true };
        const t = ex.sets[0] ?? blankSet();
        const sets = Array.from({ length: ex.sets.length }, () => ({
          key: planSetKey(),
          type: t.type,
          value: t.value,
          restSeconds: t.restSeconds,
        }));
        return { ...ex, custom: false, sets };
      }),
    );

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <BackButton onClick={onCancel} aria-label={t('back')} />
          <h2 className="text-foreground">{planId ? (isOwner ? t('editPlan') : t('viewPlan')) : t('createPlan')}</h2>
          {readOnly ? (
            <div className="w-10" />
          ) : (
            <Button variant="brand" size="sm" icon={<Save />} loading={saving} disabled={!planName.trim() || exercises.length === 0} onClick={handleSave}>
              {t('save')}
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {error && <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>}

        {/* Plan Name */}
        <div>
          <label className="block mb-2 text-foreground">{t('planName')}</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder={t('planNamePlaceholder')}
            readOnly={readOnly}
            className={`w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent ${readOnly ? 'bg-muted text-foreground cursor-default' : 'bg-card'}`}
          />
        </div>

        {/* Exercises List */}
        <div className="bg-card rounded-lg shadow-md p-4 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">{t('exercisesCount', { count: exercises.length })}</h3>
            {!readOnly && (
              <button
                onClick={() => setShowExerciseSelector(!showExerciseSelector)}
                className="flex items-center gap-2 px-4 py-2 bg-tint text-tint-fg rounded-lg hover:bg-tint-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">{t('add')}</span>
              </button>
            )}
          </div>

          {showExerciseSelector && (
            <div className="mb-4 border border-border rounded-lg p-4 bg-card shadow-sm">
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder={t('searchExercisesPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent text-sm"
                  />
                </div>
                <Button variant="brand" size="sm" icon={<Plus />} onClick={() => setShowExerciseBuilder(true)}>
                  {t('newLabel')}
                </Button>
              </div>

              {/* Sport selector (first level) */}
              {sports.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('chooseSport')}</div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {sports.map((s) => (
                      <button
                        key={s}
                        onClick={() => selectSport(s)}
                        className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          sport === s ? 'bg-tint text-tint-fg shadow-sm' : 'bg-muted text-foreground hover:bg-secondary'
                        }`}
                      >
                        {t(`sport${s}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category selector (second level) */}
              {categoriesForSport.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('chooseCategory')}</div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => selectCategory('')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        category === '' ? 'bg-tint text-tint-fg' : 'bg-muted text-foreground hover:bg-secondary'
                      }`}
                    >
                      {t('allCategories')}
                    </button>
                    {categoriesForSport.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCategory(c.slug)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          category === c.slug ? 'bg-tint text-tint-fg' : 'bg-muted text-foreground hover:bg-secondary'
                        }`}
                      >
                        {localized(c.name_i18n, c.slug, language)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loadingExercises && (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  <RefreshCw className="w-5 h-5 animate-spin inline-block mb-1" />
                  <div>{t('loadingExercises')}</div>
                </div>
              )}
              {!loadingExercises && (exerciseLibrary?.length ?? 0) === 0 && (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  <Dumbbell className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <div className="font-medium">{t('noExercisesFound')}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t('createFirstExercise')}</div>
                </div>
              )}
              <div ref={listRef} onScroll={onListScroll} className="space-y-2 max-h-96 overflow-auto">
                {exerciseLibrary.map((exercise) => {
                  const summary = exercise.sets?.[0];
                  const isTime = !!summary?.duration;
                  const displayTarget = isTime ? `${nsToSeconds(summary?.duration)} ${t('secUnit')}` : `${summary?.rep_count ?? 0} ${t('repsUnit')}`;
                  const rest =
                    summary && summary.rest_time !== undefined ? nsToSeconds(summary.rest_time) : 60;
                  const alreadyAdded = existingExerciseIds.has(exercise.id);
                  return (
                    <div key={exercise.id} className="bg-muted border border-border rounded-lg p-3 hover:border-border transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-foreground truncate">{localized(exercise.name_i18n, exercise.name, language)}</div>
                            <SportTypeBadge sportType={exercise.sport_type} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('setsTargetRest', { sets: exercise.sets?.length || 1, target: displayTarget, rest })}
                          </div>
                          {localized(exercise.description_i18n, exercise.description, language) && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{localized(exercise.description_i18n, exercise.description, language)}</div>
                          )}
                        </div>
                        <button
                          onClick={() => addExerciseToPlan(exercise)}
                          disabled={alreadyAdded}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                            alreadyAdded
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'bg-tint text-tint-fg hover:bg-tint-2'
                          }`}
                        >
                          {alreadyAdded ? t('added') : t('add')}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {loadingExercises && exerciseLibrary.length > 0 && (
                  <div className="py-3 text-center text-muted-foreground text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin inline-block" />
                  </div>
                )}
                {!loadingExercises && exerciseLibrary.length > 0 && exerciseLibrary.length < total && (
                  <div className="py-2 text-center text-xs text-muted-foreground">
                    {exerciseLibrary.length}/{total}
                  </div>
                )}
              </div>
            </div>
          )}

          {exercises.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground mb-2">{t('noExercisesAddedYet')}</p>
              <p className="text-muted-foreground text-sm">{t('tapAddExerciseToBuild')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div key={exercise.key} className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    {!readOnly && (
                      <button className="mt-2 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground mb-1">{exercise.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {exercise.custom
                              ? t('setsVaried', { sets: exercise.sets.length })
                              : t('setsReps', {
                                  sets: exercise.sets.length,
                                  reps: exercise.sets[0]?.value ?? 0,
                                  unit: exercise.sets[0]?.type === 'time' ? t('secUnit') : t('repsUnit'),
                                })}
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
                        <div className="space-y-2">
                          {exercise.custom ? (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {exercise.sets.map((s, i) => (
                                <div key={s.key}>
                                  {t('setNumber', { n: i + 1 })}: {s.value}{' '}
                                  {s.type === 'time' ? t('secUnit') : t('repsUnit')}
                                  {i < exercise.sets.length - 1 && ` · ${s.restSeconds} ${t('secondsUnit')}`}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {t('restBetweenSets')}: {exercise.sets[0]?.restSeconds ?? 0} {t('secondsUnit')}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {t('intensityLevel')}: {exercise.intensity}/10
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {exercise.custom ? (
                            /* Per-set list — each set edited independently */
                            <div className="space-y-2">
                              {exercise.sets.map((s, i) => {
                                const isLast = i === exercise.sets.length - 1;
                                return (
                                  <div key={s.key} className="rounded-lg border border-border p-2.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-foreground">
                                        {t('setNumber', { n: i + 1 })}
                                      </span>
                                      {exercise.sets.length > 1 && (
                                        <button
                                          onClick={() => removeSet(exercise.key, s.key)}
                                          className="text-red-500 hover:text-red-600 p-1"
                                          aria-label={t('removeSetAria')}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant={s.type === 'reps' ? 'brand' : 'outline'}
                                        onClick={() => updateSet(exercise.key, s.key, { type: 'reps' })}
                                      >
                                        {t('repsLabel')}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={s.type === 'time' ? 'brand' : 'outline'}
                                        onClick={() => updateSet(exercise.key, s.key, { type: 'time' })}
                                      >
                                        {t('timeLabel')}
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                          {s.type === 'reps' ? t('repsLabel') : t('durationSec')}
                                        </label>
                                        <NumberInput
                                          min={0}
                                          value={s.value}
                                          onChange={(v) => updateSet(exercise.key, s.key, { value: v })}
                                          className="w-full"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                          {t('restSecondsLabel')}
                                        </label>
                                        <NumberInput
                                          min={0}
                                          step={5}
                                          value={isLast ? 0 : s.restSeconds}
                                          disabled={isLast}
                                          onChange={(v) => updateSet(exercise.key, s.key, { restSeconds: v })}
                                          className="w-full"
                                        />
                                        {isLast && (
                                          <p className="mt-1 text-xs text-muted-foreground">{t('lastSetNoRest')}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="flex items-center justify-between">
                                <Button variant="outline" size="sm" icon={<Plus />} onClick={() => addSet(exercise.key)}>
                                  {t('addSet')}
                                </Button>
                                <button
                                  onClick={() => toggleCustom(exercise.key)}
                                  className="text-xs text-tint-ink hover:underline"
                                >
                                  {t('sameEverySet')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Simple uniform editor */
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                                    {t('setsLabel')}
                                  </label>
                                  <NumberInput
                                    min={1}
                                    value={exercise.sets.length}
                                    onChange={(v) => applyUniform(exercise.key, { count: v })}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                                    {exercise.sets[0]?.type === 'time' ? t('durationSec') : t('repsLabel')}
                                  </label>
                                  <NumberInput
                                    min={0}
                                    value={exercise.sets[0]?.value ?? 0}
                                    onChange={(v) => applyUniform(exercise.key, { value: v })}
                                    className="w-full"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={exercise.sets[0]?.type !== 'time' ? 'brand' : 'outline'}
                                  onClick={() => applyUniform(exercise.key, { type: 'reps' })}
                                >
                                  {t('repsLabel')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant={exercise.sets[0]?.type === 'time' ? 'brand' : 'outline'}
                                  onClick={() => applyUniform(exercise.key, { type: 'time' })}
                                >
                                  {t('timeLabel')}
                                </Button>
                              </div>

                              <div>
                                <label className="text-xs font-medium text-foreground mb-1.5 block">
                                  {t('restBetweenSets')}
                                </label>
                                <div className="flex items-center gap-2">
                                  <NumberInput
                                    min={0}
                                    step={5}
                                    value={exercise.sets[0]?.restSeconds ?? 0}
                                    onChange={(v) => applyUniform(exercise.key, { rest: v })}
                                    className="w-32"
                                  />
                                  <span className="text-sm text-muted-foreground">{t('secondsUnit')}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => toggleCustom(exercise.key)}
                                className="text-xs text-tint-ink hover:underline"
                              >
                                {t('customizeEachSet')}
                              </button>
                            </>
                          )}

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

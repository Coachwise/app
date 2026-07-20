import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Search, Dumbbell, Edit3, Trash2 } from 'lucide-react';
import { BackButton } from './ui/back-button';
import { Button } from './ui/button';
import { ExerciseBuilder } from './ExerciseBuilder';
import * as ExercisesAPI from '../api/exercises';
import type { Exercise, ExerciseCategory } from '../api/types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { localized } from '../lib/localize';

// Only these play as <video>; everything else (svg, gif, webp, png, jpg) is an <img>.
const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v)$/i.test(url);

interface ExercisesProps {
  onBack: () => void;
}

const nsToSeconds = (value?: number | null) => Math.max(0, Math.round((value ?? 0) / 1e9));

export function Exercises({ onBack }: ExercisesProps) {
  const { tokens, user } = useAuth();
  const { t, language } = useLanguage();
  // Anyone can build their own exercises; editing is limited to ones they own
  // (library rows have a null user_id and belong to nobody).
  const ownsExercise = (ex: Exercise) => !!user && ex.user_id === user.id;
  const PAGE_SIZE = 20;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [publicOnly, setPublicOnly] = useState(false);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [category, setCategory] = useState(''); // selected category slug ('' = all)
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const fetchExercises = async (opts?: { publicOnly?: boolean; search?: string; category?: string; page?: number; append?: boolean }) => {
    if (!tokens?.access_token) {
      setError(t('notAuthenticated'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const publicFilter = opts?.publicOnly ?? publicOnly;
      const searchFilter = opts?.search ?? search;
      const categoryFilter = opts?.category ?? category;
      const pageToLoad = opts?.page ?? 1;
      const res = await ExercisesAPI.listExercises(tokens.access_token, {
        search: searchFilter.trim() || undefined,
        category: categoryFilter || undefined,
        public: publicFilter ? true : undefined,
        page: pageToLoad,
        limit: PAGE_SIZE,
      });
      setTotal(res.total);
      setPage(pageToLoad);
      setExercises((prev) => (opts?.append ? [...prev, ...res.items] : res.items));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('unableToLoadExercises');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Debounced server-side search: refetch page 1 when the query settles.
  useEffect(() => {
    const id = setTimeout(() => fetchExercises({ search, page: 1 }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Load categories once for the filter chips.
  useEffect(() => {
    if (!tokens?.access_token) return;
    ExercisesAPI.listExerciseCategories(tokens.access_token)
      .then((res) => setCategories(res.items))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.access_token]);

  const selectCategory = (slug: string) => {
    setCategory(slug);
    fetchExercises({ category: slug, page: 1 });
  };

  const handleSaved = (exercise: Exercise) => {
    setCreating(false);
    setEditing(null);
    setExercises((prev) => {
      const exists = prev.find((ex) => ex.id === exercise.id);
      if (exists) {
        return prev.map((ex) => (ex.id === exercise.id ? exercise : ex));
      }
      return [exercise, ...prev];
    });
  };

  const handleDelete = async (id: string) => {
    if (!tokens?.access_token) return;
    const confirmed = window.confirm(t('deleteExerciseConfirm'));
    if (!confirmed) return;
    try {
      await ExercisesAPI.deleteExercise(tokens.access_token, id);
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('unableToDeleteExercise');
      setError(msg);
    }
  };

  if (creating || editing) {
    return (
      <ExerciseBuilder
        onCancel={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        exercise={editing || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} aria-label={t('back')} />
          <h2 className="text-foreground flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            {t('exercisesLabel')}
          </h2>
          <Button variant="brand" size="sm" icon={<Plus />} onClick={() => setCreating(true)}>
            {t('newLabel')}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>}

        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchExercisesByName')}
                className="w-full pl-9 pr-3 py-2 bg-card border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchExercises}
              className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm">{t('refresh')}</span>
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={publicOnly}
              onChange={(e) => {
                const next = e.target.checked;
                setPublicOnly(next);
                fetchExercises({ publicOnly: next });
              }}
              className="w-4 h-4 text-tint-ink border-gray-300 rounded focus:ring-tint"
            />
            {t('showPublicOnly')}
          </label>

          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                onClick={() => selectCategory('')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  category === '' ? 'bg-tint text-tint-fg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('allCategories')}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCategory(c.slug)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    category === c.slug ? 'bg-tint text-tint-fg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {localized(c.name_i18n, c.slug, language)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="text-gray-600 text-sm">{t('loadingExercises')}</div>
          )}
          {!loading && exercises.length === 0 && (
            <div className="bg-card border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-600">
              {t('noExercisesTryCreate')}
            </div>
          )}
          {!loading &&
            exercises.map((exercise) => {
              const name = localized(exercise.name_i18n, exercise.name, language);
              const description = localized(exercise.description_i18n, exercise.description, language);
              return (
              <div key={exercise.id} className="bg-card border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  {exercise.media?.url && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      {isVideoUrl(exercise.media.url) ? (
                        <video
                          src={exercise.media.url}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img src={exercise.media.url} alt={name} className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-900 font-semibold">{name}</h3>
                      {exercise.public && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{t('publicLabel')}</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{description || t('noDescriptionYet')}</p>
                    <div className="mt-3 space-y-1">
                      {exercise.sets.map((set, idx) => (
                        <div key={set.id || idx} className="text-sm text-gray-700">
                          <span className="font-medium">{t('setNumberColon', { n: idx + 1 })}</span>{' '}
                          <span>{set.name || t('untitled')}</span>
                          {' • '}
                          <span>{set.rep_count !== undefined && set.rep_count !== null ? `${set.rep_count} ${t('repsUnit')}` : `${nsToSeconds(set.duration)} ${t('secUnit')}`}</span>
                          {' • '}
                          <span>{t('restShort', { sec: nsToSeconds(set.rest_time) })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {ownsExercise(exercise) && (
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => setEditing(exercise)}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                        aria-label={t('editExercise')}
                      >
                        <Edit3 className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => handleDelete(exercise.id)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100"
                        aria-label={t('removeExerciseTitle')}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              );
            })}

          {!loading && exercises.length > 0 && exercises.length < total && (
            <button
              onClick={() => fetchExercises({ page: page + 1, append: true })}
              className="w-full py-2.5 text-sm text-foreground bg-card border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('loadMore')} ({exercises.length}/{total})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

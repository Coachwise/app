import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, RefreshCw, Search, Dumbbell, Edit3, Trash2 } from 'lucide-react';
import { ExerciseBuilder } from './ExerciseBuilder';
import * as ExercisesAPI from '../api/exercises';
import type { Exercise } from '../api/types';
import { useAuth } from '../contexts/AuthContext';

interface ExercisesProps {
  onBack: () => void;
}

const nsToSeconds = (value?: number | null) => Math.max(0, Math.round((value ?? 0) / 1e9));

export function Exercises({ onBack }: ExercisesProps) {
  const { tokens } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [publicOnly, setPublicOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const fetchExercises = async (opts?: { publicOnly?: boolean; search?: string }) => {
    if (!tokens?.access_token) {
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const publicFilter = opts?.publicOnly ?? publicOnly;
      const searchFilter = opts?.search ?? search;
      const items = await ExercisesAPI.listExercises(tokens.access_token, {
        name: searchFilter.trim() || undefined,
        public: publicFilter ? true : undefined,
      });
      setExercises(items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to load exercises';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const confirmed = window.confirm('Delete this exercise?');
    if (!confirmed) return;
    try {
      await ExercisesAPI.deleteExercise(tokens.access_token, id);
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to delete exercise';
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
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Exercises
          </h2>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exercises by name"
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchExercises}
              className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
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
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            Show public exercises only
          </label>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="text-gray-600 text-sm">Loading exercises...</div>
          )}
          {!loading && exercises.length === 0 && (
            <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-600">
              No exercises found. Try creating one.
            </div>
          )}
          {!loading &&
            exercises.map((exercise) => (
              <div key={exercise.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-900 font-semibold">{exercise.name}</h3>
                      {exercise.public && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Public</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{exercise.description || 'No description yet.'}</p>
                    <div className="mt-3 space-y-1">
                      {exercise.sets.map((set, idx) => (
                        <div key={set.id || idx} className="text-sm text-gray-700">
                          <span className="font-medium">Set {idx + 1}:</span>{' '}
                          <span>{set.name || 'Untitled'}</span>
                          {' • '}
                          <span>{set.rep_count !== undefined && set.rep_count !== null ? `${set.rep_count} reps` : `${nsToSeconds(set.duration)} sec`}</span>
                          {' • '}
                          <span>{nsToSeconds(set.rest_time)}s rest</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(exercise)}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                      aria-label="Edit exercise"
                    >
                      <Edit3 className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleDelete(exercise.id)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100"
                      aria-label="Delete exercise"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

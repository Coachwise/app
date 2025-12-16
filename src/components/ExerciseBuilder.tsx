import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Loader2, Eye } from 'lucide-react';
import * as ExercisesAPI from '../api/exercises';
import type { Exercise } from '../api/types';
import { useAuth } from '../contexts/AuthContext';

type EditableSet = {
  id: string;
  name: string;
  type: 'reps' | 'time';
  value: number;
  restSeconds: number;
};

interface ExerciseBuilderProps {
  onCancel: () => void;
  onSaved: (exercise: Exercise) => void;
  exercise?: Exercise;
}

const nsToSeconds = (value?: number | null) => Math.max(0, Math.round((value ?? 0) / 1e9));
const secondsToNs = (value: number) => Math.max(0, Math.round(value) * 1e9);
const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export function ExerciseBuilder({ onCancel, onSaved, exercise }: ExerciseBuilderProps) {
  const { tokens } = useAuth();
  const [name, setName] = useState(exercise?.name || '');
  const [description, setDescription] = useState(exercise?.description || '');
  const [isPublic, setIsPublic] = useState<boolean>(!!exercise?.public);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sets, setSets] = useState<EditableSet[]>(() => {
    if (!exercise?.sets?.length) {
      return [
        { id: uuid(), name: 'Warm-up', type: 'reps', value: 10, restSeconds: 60 },
        { id: uuid(), name: 'Working', type: 'reps', value: 10, restSeconds: 90 },
      ];
    }
    return exercise.sets.map((set, idx) => ({
      id: set.id || uuid(),
      name: set.name || `Set ${idx + 1}`,
      type: set.duration ? 'time' : 'reps',
      value: set.duration ? nsToSeconds(set.duration) : set.rep_count ?? 0,
      restSeconds: nsToSeconds(set.rest_time),
    }));
  });

  const canSave = useMemo(() => name.trim() !== '' && description.trim() !== '' && sets.length > 0, [name, description, sets.length]);

  const updateSet = (id: string, updates: Partial<EditableSet>) => {
    setSets((prev) => prev.map((set) => (set.id === id ? { ...set, ...updates } : set)));
  };

  const addSet = () => {
    setSets((prev) => [
      ...prev,
      {
        id: uuid(),
        name: `Set ${prev.length + 1}`,
        type: 'reps',
        value: 10,
        restSeconds: 60,
      },
    ]);
  };

  const removeSet = (id: string) => {
    setSets((prev) => prev.filter((set) => set.id !== id));
  };

  useEffect(() => {
    // Keep set names numbered when none provided
    setSets((prev) =>
      prev.map((set, idx) => ({
        ...set,
        name: set.name || `Set ${idx + 1}`,
      }))
    );
  }, []);

  const handleSave = async () => {
    if (!tokens?.access_token || !canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        public: isPublic,
        sets: sets.map((set, idx) => ({
          name: set.name || `Set ${idx + 1}`,
          rest_time: secondsToNs(set.restSeconds),
          rep_count: set.type === 'reps' ? Math.max(0, Math.round(set.value)) : undefined,
          duration: set.type === 'time' ? secondsToNs(set.value) : undefined,
        })),
      };

      const saved = exercise
        ? await ExercisesAPI.updateExercise(tokens.access_token, exercise.id, payload)
        : await ExercisesAPI.createExercise(tokens.access_token, payload);
      onSaved(saved);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to save exercise';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white">{exercise ? 'Edit Exercise' : 'New Exercise'}</h2>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>}

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 space-y-3">
          <div>
            <label className="text-[#3D3D3D] mb-2 block">Exercise Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bench Press"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#3D3D3D]"
            />
          </div>

          <div>
            <label className="text-[#3D3D3D] mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Movement notes, tempo, intent..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-[#3D3D3D]"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-gray-900">Make this exercise public</span>
              <p className="text-gray-600 text-sm">Share with the community and reuse in plans</p>
            </div>
          </label>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[#3D3D3D]">Sets</h3>
              <p className="text-sm text-gray-600">Reps or timed holds with rest between sets</p>
            </div>
            <button
              onClick={addSet}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add set
            </button>
          </div>

          <div className="space-y-3">
            {sets.map((set, index) => (
              <div key={set.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye className="w-4 h-4" />
                    <span>Set {index + 1}</span>
                  </div>
                  <button
                    onClick={() => removeSet(set.id)}
                    className="text-red-500 hover:text-red-600"
                    aria-label="Remove set"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={set.name}
                      onChange={(e) => updateSet(set.id, { name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Working set"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Rest (seconds)</label>
                    <input
                      type="number"
                      min={0}
                      value={set.restSeconds}
                      onChange={(e) => updateSet(set.id, { restSeconds: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Target</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSet(set.id, { type: 'reps' })}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          set.type === 'reps' ? 'bg-yellow-500 text-[#0E0E55]' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Reps
                      </button>
                      <button
                        onClick={() => updateSet(set.id, { type: 'time' })}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          set.type === 'time' ? 'bg-yellow-500 text-[#0E0E55]' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Time
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      {set.type === 'reps' ? 'Reps' : 'Duration (sec)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={set.value}
                      onChange={(e) => updateSet(set.id, { value: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

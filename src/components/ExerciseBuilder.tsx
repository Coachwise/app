import { useEffect, useMemo, useState, useRef } from 'react';
import { Plus, Trash2, Loader2, Eye, Upload, X, Copy, Save } from 'lucide-react';
import { Button } from './ui/button';
import { BackButton } from './ui/back-button';
import { NumberInput } from './ui/number-input';
import * as ExercisesAPI from '../api/exercises';
import * as MediaAPI from '../api/media';
import type { Exercise, ExerciseSportType } from '../api/types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(exercise?.name || '');
  const [description, setDescription] = useState(exercise?.description || '');
  const [sportType, setSportType] = useState<ExerciseSportType>(exercise?.sport_type || 'GENERAL');
  // Which extra actuals this exercise logs per set. Weight defaults on for new
  // exercises; editing an existing one keeps whatever it had.
  const [trackWeight, setTrackWeight] = useState(exercise ? exercise.track_weight !== false : true);
  const [trackDistance, setTrackDistance] = useState(!!exercise?.track_distance);
  const [trackGrade, setTrackGrade] = useState(!!exercise?.track_grade);
  const [trackHeight, setTrackHeight] = useState(!!exercise?.track_height);
  const [mediaId, setMediaId] = useState<string | null>(exercise?.media_id || null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(exercise?.media?.url || null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
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

  // Quick-add builds N identical sets in one go (e.g. 12 hangboard repeaters).
  const [bulkCount, setBulkCount] = useState(12);
  const [bulkType, setBulkType] = useState<'reps' | 'time'>('time');
  const [bulkValue, setBulkValue] = useState(10);
  const [bulkRest, setBulkRest] = useState(5);

  const canSave = useMemo(() => name.trim() !== '' && description.trim() !== '' && sets.length > 0, [name, description, sets.length]);

  const updateSet = (id: string, updates: Partial<EditableSet>) => {
    setSets((prev) => prev.map((set) => (set.id === id ? { ...set, ...updates } : set)));
  };

  // A new manual set inherits the previous one's shape, so building a run of
  // similar sets is one tap each instead of re-entering every field.
  const addSet = () => {
    setSets((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          id: uuid(),
          name: `Set ${prev.length + 1}`,
          type: last?.type ?? 'reps',
          value: last?.value ?? 10,
          restSeconds: last?.restSeconds ?? 60,
        },
      ];
    });
  };

  const duplicateSet = (id: string) => {
    setSets((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: uuid() };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  };

  const addBulkSets = () => {
    const n = Math.max(1, Math.floor(bulkCount));
    setSets((prev) => {
      const base = prev.length;
      const extra: EditableSet[] = Array.from({ length: n }, (_, i) => ({
        id: uuid(),
        name: `Set ${base + i + 1}`,
        type: bulkType,
        value: Math.max(0, bulkValue),
        restSeconds: Math.max(0, bulkRest),
      }));
      return [...prev, ...extra];
    });
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tokens?.access_token) return;

    setUploadingMedia(true);
    setError(null);
    try {
      const uploadedMedia = await MediaAPI.uploadMedia(tokens.access_token, file);
      setMediaId(uploadedMedia.id);
      setMediaUrl(uploadedMedia.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('failedToUploadMedia');
      setError(msg);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = () => {
    setMediaId(null);
    setMediaUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!tokens?.access_token || !canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        sport_type: sportType,
        media_id: mediaId,
        track_weight: trackWeight,
        track_distance: trackDistance,
        track_grade: trackGrade,
        track_height: trackHeight,
        sets: sets.map((set, idx) => ({
          name: set.name || `Set ${idx + 1}`,
          // There is no rest after the final set.
          rest_time: idx === sets.length - 1 ? 0 : secondsToNs(set.restSeconds),
          rep_count: set.type === 'reps' ? Math.max(0, Math.round(set.value)) : undefined,
          duration: set.type === 'time' ? secondsToNs(set.value) : undefined,
        })),
      };

      const saved = exercise
        ? await ExercisesAPI.updateExercise(tokens.access_token, exercise.id, payload)
        : await ExercisesAPI.createExercise(tokens.access_token, payload);
      onSaved(saved);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('unableToSaveExercise');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-navy px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <BackButton onClick={onCancel} aria-label={t('back')} />
          <h2 className="text-white">{exercise ? t('editExercise') : t('newExercise')}</h2>
          <Button variant="brand" size="sm" icon={<Save />} loading={saving} disabled={!canSave} onClick={handleSave}>
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>}

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 space-y-3">
          <div>
            <label className="text-[#3D3D3D] mb-2 block">{t('exerciseName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('exerciseNamePlaceholder')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#3D3D3D]"
            />
          </div>

          <div>
            <label className="text-[#3D3D3D] mb-2 block">{t('descriptionLabel')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-[#3D3D3D]"
            />
          </div>

          <div>
            <label className="text-[#3D3D3D] mb-2 block">{t('sportTypeLabel')}</label>
            <select
              value={sportType}
              onChange={(e) => setSportType(e.target.value as ExerciseSportType)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#3D3D3D] bg-white"
            >
              <option value="STRENGTH">{t('sportSTRENGTH')}</option>
              <option value="CLIMBING">{t('sportCLIMBING')}</option>
              <option value="CARDIO">{t('sportCARDIO')}</option>
              <option value="MOBILITY">{t('sportMOBILITY')}</option>
              <option value="GENERAL">{t('sportGENERAL')}</option>
            </select>
          </div>

          <div>
            <label className="text-[#3D3D3D] mb-2 block">{t('trackedMetrics')}</label>
            <p className="text-gray-500 text-xs mb-2">{t('trackedMetricsHint')}</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['weight', trackWeight, setTrackWeight, t('metricWeight')],
                ['distance', trackDistance, setTrackDistance, t('metricDistance')],
                ['grade', trackGrade, setTrackGrade, t('metricGrade')],
                ['height', trackHeight, setTrackHeight, t('metricHeight')],
              ] as const).map(([key, on, set, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set(!on)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    on ? 'bg-yellow-500 text-navy border-yellow-500' : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[#3D3D3D] mb-2 block">{t('mediaOptional')}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {mediaUrl ? (
              <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                {mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={mediaUrl} alt="Exercise media" className="w-full h-48 object-cover" />
                ) : (
                  <video
                    src={mediaUrl}
                    className="w-full h-48 object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                  />
                )}
                <button
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  aria-label={t('removeMedia')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 transition-colors flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                {uploadingMedia ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm">{t('uploading')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8" />
                    <span className="text-sm">{t('uploadImageOrVideo')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[#3D3D3D]">{t('setsLabel')}</h3>
              <p className="text-sm text-gray-600">{t('repsOrTimedHolds')}</p>
            </div>
            <Button variant="brand" size="sm" icon={<Plus />} onClick={addSet}>
              {t('addSet')}
            </Button>
          </div>

          <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3">
            <div className="mb-2">
              <h4 className="text-sm font-medium text-[#3D3D3D]">{t('quickAddTitle')}</h4>
              <p className="text-xs text-gray-600">{t('quickAddHint')}</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">{t('countLabel')}</label>
                <NumberInput min={1} value={bulkCount} onChange={setBulkCount} className="w-24" />
              </div>
              <div className="flex gap-1 pb-[1px]">
                <button
                  onClick={() => setBulkType('reps')}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${bulkType === 'reps' ? 'bg-yellow-500 text-navy' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  {t('repsLabel')}
                </button>
                <button
                  onClick={() => setBulkType('time')}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${bulkType === 'time' ? 'bg-yellow-500 text-navy' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  {t('timeLabel')}
                </button>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">{bulkType === 'reps' ? t('repsLabel') : t('durationSec')}</label>
                <NumberInput min={0} value={bulkValue} onChange={setBulkValue} className="w-24" />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">{t('restSecondsLabel')}</label>
                <NumberInput min={0} value={bulkRest} onChange={setBulkRest} className="w-24" />
              </div>
              <button
                onClick={addBulkSets}
                className="flex items-center gap-2 px-3 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                {t('addCountSets', { n: Math.max(1, Math.floor(bulkCount)) })}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {sets.map((set, index) => (
              <div key={set.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye className="w-4 h-4" />
                    <span>{t('setNumber', { n: index + 1 })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => duplicateSet(set.id)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label={t('duplicateSet')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeSet(set.id)}
                      className="text-red-500 hover:text-red-600"
                      aria-label={t('removeSetAria')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">{t('nameLabel')}</label>
                    <input
                      type="text"
                      value={set.name}
                      onChange={(e) => updateSet(set.id, { name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('workingSetPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">{t('restSecondsLabel')}</label>
                    <NumberInput
                      min={0}
                      step={5}
                      value={index === sets.length - 1 ? 0 : set.restSeconds}
                      disabled={index === sets.length - 1}
                      onChange={(v) => updateSet(set.id, { restSeconds: v })}
                      className="w-full"
                    />
                    {index === sets.length - 1 && (
                      <p className="mt-1 text-xs text-gray-500">{t('lastSetNoRest')}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">{t('target')}</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSet(set.id, { type: 'reps' })}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          set.type === 'reps' ? 'bg-yellow-500 text-navy' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t('repsLabel')}
                      </button>
                      <button
                        onClick={() => updateSet(set.id, { type: 'time' })}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          set.type === 'time' ? 'bg-yellow-500 text-navy' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t('timeLabel')}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      {set.type === 'reps' ? t('repsLabel') : t('durationSec')}
                    </label>
                    <NumberInput
                      min={0}
                      value={set.value}
                      onChange={(v) => updateSet(set.id, { value: v })}
                      className="w-full"
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

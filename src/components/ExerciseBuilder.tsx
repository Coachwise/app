import { useEffect, useMemo, useState, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Loader2, Eye, Upload, X } from 'lucide-react';
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
  const [isPublic, setIsPublic] = useState<boolean>(!!exercise?.public);
  const [sportType, setSportType] = useState<ExerciseSportType>(exercise?.sport_type || 'GENERAL');
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
        public: isPublic,
        sport_type: sportType,
        media_id: mediaId,
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
      const msg = e instanceof Error ? e.message : t('unableToSaveExercise');
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
          <h2 className="text-white">{exercise ? t('editExercise') : t('newExercise')}</h2>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{t('save')}</span>
          </button>
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

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-gray-900">{t('makeExercisePublic')}</span>
              <p className="text-gray-600 text-sm">{t('shareWithCommunity')}</p>
            </div>
          </label>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[#3D3D3D]">{t('setsLabel')}</h3>
              <p className="text-sm text-gray-600">{t('repsOrTimedHolds')}</p>
            </div>
            <button
              onClick={addSet}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('addSet')}
            </button>
          </div>

          <div className="space-y-3">
            {sets.map((set, index) => (
              <div key={set.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye className="w-4 h-4" />
                    <span>{t('setNumber', { n: index + 1 })}</span>
                  </div>
                  <button
                    onClick={() => removeSet(set.id)}
                    className="text-red-500 hover:text-red-600"
                    aria-label={t('removeSetAria')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                    <label className="block text-sm text-gray-700 mb-1">{t('target')}</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSet(set.id, { type: 'reps' })}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          set.type === 'reps' ? 'bg-yellow-500 text-[#0E0E55]' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t('repsLabel')}
                      </button>
                      <button
                        onClick={() => updateSet(set.id, { type: 'time' })}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          set.type === 'time' ? 'bg-yellow-500 text-[#0E0E55]' : 'bg-gray-100 text-gray-700'
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

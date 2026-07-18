import { useEffect, useState } from 'react';
import { Check, Save } from 'lucide-react';
import { Button } from './ui/button';
import { BackButton } from './ui/back-button';
import { useLanguage } from '../contexts/LanguageContext';
import { TestsAPI } from '../api';
import type { Exercise } from '../api/types';
import { ExercisePicker } from './ExercisePicker';
import { toast } from 'sonner';

interface TestBuilderProps {
  token: string;
  testId?: string;
  onCancel: () => void;
  onSave: () => void;
}

type MetricKey = 'track_reps' | 'track_weight' | 'track_time';

interface DraftItem {
  exercise_id: string;
  exercise_name: string;
  track_reps: boolean;
  track_weight: boolean;
  track_time: boolean;
}

const METRIC_KEYS: { key: MetricKey; labelKey: string }[] = [
  { key: 'track_reps', labelKey: 'metricCount' },
  { key: 'track_weight', labelKey: 'metricKg' },
  { key: 'track_time', labelKey: 'metricSecond' },
];

export function TestBuilder({ token, testId, onCancel, onSave }: TestBuilderProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(testId);

  useEffect(() => {
    if (!testId) return;
    let active = true;
    (async () => {
      try {
        const test = await TestsAPI.getTest(token, testId);
        if (!active) return;
        setName(test.name);
        setDescription(test.description || '');
        setItems((test.items || []).map((it) => ({
          exercise_id: it.exercise_id,
          exercise_name: it.exercise_name,
          track_reps: it.track_reps,
          track_weight: it.track_weight,
          track_time: it.track_time,
        })));
      } catch (e) {
        toast.error((e as Error).message);
      }
    })();
    return () => { active = false; };
  }, [token, testId]);

  const addExercise = (ex: Exercise) =>
    setItems([...items, { exercise_id: ex.id, exercise_name: ex.name, track_reps: true, track_weight: false, track_time: false }]);

  const toggleMetric = (idx: number, key: MetricKey) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: !it[key] } : it)));

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const isValid =
    name.trim().length > 0 &&
    items.length > 0 &&
    items.every((it) => it.track_reps || it.track_weight || it.track_time);

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        items: items.map((it) => ({
          exercise_id: it.exercise_id,
          track_reps: it.track_reps,
          track_weight: it.track_weight,
          track_time: it.track_time,
        })),
      };
      if (testId) await TestsAPI.updateTest(token, testId, payload);
      else await TestsAPI.createTest(token, payload);
      toast.success(t('saved'));
      onSave();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-navy px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <BackButton onClick={onCancel} aria-label={t('back')} />
          <h2 className="text-white">{isEdit ? t('editTest') : t('createTest')}</h2>
          <Button variant="brand" size="sm" icon={<Save />} loading={saving} disabled={!isValid} onClick={handleSave}>
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-28">
        <div>
          <label className="text-[#3D3D3D] mb-2 block">{t('testName')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('testNamePlaceholder')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#3D3D3D]"
          />
        </div>
        <div>
          <label className="block mb-2 text-gray-900">{t('descriptionLabel')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('whatsIncluded')}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <ExercisePicker
          token={token}
          items={items}
          onAdd={addExercise}
          onRemove={removeItem}
          renderControl={(it, idx) => (
            <>
              <p className="text-[11px] text-gray-400 mb-1.5">{t('whatToMeasure')}</p>
              <div className="flex gap-1.5">
                {METRIC_KEYS.map(({ key, labelKey }) => {
                  const on = it[key];
                  return (
                    <button
                      key={key}
                      onClick={() => toggleMetric(idx, key)}
                      className={`flex-1 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 border ${
                        on ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {on && <Check className="w-3 h-3" />}
                      {t(labelKey)}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        />
      </div>
    </div>
  );
}

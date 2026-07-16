import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { localized } from '../lib/localize';
import { TestsAPI } from '../api';
import type { Test, TestItem, SubmittedRecord } from '../api/types';
import { toast } from 'sonner';

interface RunAssessmentProps {
  token: string;
  protocolId: string;
  onCancel: () => void;
  onSaved: () => void;
}

// The metrics an item can track, in display order.
const METRIC_FIELDS: { field: 'reps' | 'weight' | 'time'; track: keyof TestItem; unitKey: string }[] = [
  { field: 'reps', track: 'track_reps', unitKey: 'unitReps' },
  { field: 'weight', track: 'track_weight', unitKey: 'unitKg' },
  { field: 'time', track: 'track_time', unitKey: 'unitSec' },
];

export function RunAssessment({ token, protocolId, onCancel, onSaved }: RunAssessmentProps) {
  const { t, language } = useLanguage();
  const [protocol, setProtocol] = useState<Test | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await TestsAPI.getTest(token, protocolId);
        if (active) setProtocol(p);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token, protocolId]);

  const items = protocol?.items ?? [];

  const save = async () => {
    if (saving || !protocol) return;
    const records: SubmittedRecord[] = [];
    for (const it of items) {
      const rec: SubmittedRecord = { test_item_id: it.id };
      let any = false;
      for (const f of METRIC_FIELDS) {
        if (it[f.track] && values[`${it.id}:${f.field}`]) {
          rec[f.field] = Number(values[`${it.id}:${f.field}`]);
          any = true;
        }
      }
      if (any) records.push(rec);
    }
    if (records.length === 0) {
      toast.error(t('enterAtLeastOne'));
      return;
    }
    setSaving(true);
    try {
      await TestsAPI.runProtocol(token, protocol.id, records);
      toast.success(t('runSaved'));
      onSaved();
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
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-navy-light rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white truncate px-2">{protocol?.name || t('newRun')}</h2>
          <button
            onClick={save}
            disabled={saving || loading}
            className="px-4 py-2 bg-yellow-500 text-navy rounded-lg hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-28">
        {loading && <div className="text-center text-gray-500 py-8">{t('loading')}</div>}

        {!loading && (
          <>
            <p className="text-gray-500 text-sm">{t('runHint')}</p>
            {items.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <ClipboardList className="w-9 h-9 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">{t('protocolNoExercises')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => {
                  const fields = METRIC_FIELDS.filter((f) => it[f.track]);
                  return (
                    <div key={it.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="text-navy font-medium mb-2.5">{localized(it.exercise_name_i18n, it.exercise_name, language)}</div>
                      <div className="flex gap-2">
                        {fields.map((f) => (
                          <div key={f.field} className="flex-1">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={values[`${it.id}:${f.field}`] ?? ''}
                              onChange={(e) => setValues({ ...values, [`${it.id}:${f.field}`]: e.target.value })}
                              placeholder={t(f.unitKey)}
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-navy text-center"
                            />
                            <div className="text-[10px] text-gray-400 text-center mt-0.5">{t(f.unitKey)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

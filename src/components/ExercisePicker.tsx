import { useEffect, useState, type ReactNode } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { ExercisesAPI } from '../api';
import type { Exercise } from '../api/types';
import { localized } from '../lib/localize';
import { toast } from 'sonner';

export interface PickedExercise {
  exercise_id: string;
  exercise_name: string;
}

interface ExercisePickerProps<T extends PickedExercise> {
  token: string;
  /** The exercises already added (each row gets a control via renderControl). */
  items: T[];
  onAdd: (exercise: Exercise) => void;
  onRemove: (index: number) => void;
  /** Per-exercise control: metric toggles (coach) or value inputs (athlete). */
  renderControl: (item: T, index: number) => ReactNode;
  title?: string;
  emptyHint?: string;
}

/**
 * Shared "choose exercises" card used by the coach test builder and the athlete
 * self-assessment: a header add-action, an inline searchable picker, and the
 * list of chosen exercises. Each row renders a caller-supplied control.
 */
export function ExercisePicker<T extends PickedExercise>({
  token,
  items,
  onAdd,
  onRemove,
  renderControl,
  title,
  emptyHint,
}: ExercisePickerProps<T>) {
  const { t, language } = useLanguage();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState('');

  // Server-side search (debounced); the backend does the tsvector matching.
  useEffect(() => {
    let active = true;
    const id = setTimeout(async () => {
      try {
        const res = await ExercisesAPI.listExercises(token, { search: search.trim() || undefined, limit: 20 });
        if (active) setExercises(res.items);
      } catch (e) {
        toast.error((e as Error).message);
      }
    }, 300);
    return () => { active = false; clearTimeout(id); };
  }, [token, search]);

  const chosen = new Set(items.map((it) => it.exercise_id));
  const exName = (e: Exercise) => localized(e.name_i18n, e.name, language);
  const filtered = exercises.filter((e) => !chosen.has(e.id));

  const add = (ex: Exercise) => {
    onAdd(ex);
    setPicking(false);
    setSearch('');
  };

  return (
    <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-foreground font-medium">
          {title || t('testExercises')} <span className="text-gray-400">({items.length})</span>
        </h3>
        <Button variant="brand" size="sm" icon={<Plus />} onClick={() => setPicking(!picking)}>
          {t('addExercise')}
        </Button>
      </div>

      {picking && (
        <div className="border-b border-gray-100 bg-gray-50/60">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchExercises')}
                className="w-full ps-10 pe-3 py-2 bg-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm text-foreground"
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="px-4 pb-4 text-center text-gray-500 text-sm">{t('noResults')}</div>
          ) : (
            <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
              {filtered.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => add(ex)}
                  className="w-full text-start px-4 py-2.5 hover:bg-yellow-50 transition-colors text-sm text-foreground"
                >
                  {exName(ex)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="p-6 text-center text-gray-400 text-sm">{emptyHint || t('noTestExercises')}</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((it, idx) => (
            <div key={it.exercise_id} className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-foreground text-sm truncate">{it.exercise_name}</span>
                <button
                  onClick={() => onRemove(idx)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {renderControl(it, idx)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

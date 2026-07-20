import { useMemo, useState } from 'react';
import { Trophy, Award, Medal, Eye, EyeOff, ChevronUp, ChevronDown, Check, X, SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { AchievementsAPI } from '../api';
import type { UserAchievements, PersonalRecord, Achievement } from '../api/types';
import { toast } from 'sonner';

interface TrophyCaseProps {
  data: UserAchievements;
  isOwner: boolean;
  token: string;
  onLayoutSaved: (layout: { order: string[]; hidden: string[] }) => void;
}

type Item =
  | { key: string; kind: 'record'; record: PersonalRecord }
  | { key: string; kind: 'badge'; badge: Achievement };

// The headline value for a record, keeping compound sets paired (e.g. 60kg × 10).
function recordPrimary(r: PersonalRecord, t: (k: string) => string): string {
  if (r.best_weight != null) return `${r.best_weight.toLocaleString()} ${t('unitKg')}`;
  if (r.best_reps != null) return `${r.best_reps.toLocaleString()} ${t('unitReps')}`;
  if (r.best_time != null) return `${r.best_time.toLocaleString()} ${t('unitSec')}`;
  return '—';
}
function recordSecondary(r: PersonalRecord, t: (k: string) => string): string | null {
  const parts: string[] = [];
  if (r.best_weight != null) {
    if (r.best_reps != null) parts.push(`× ${r.best_reps.toLocaleString()}`);
    if (r.best_time != null) parts.push(`${r.best_time.toLocaleString()} ${t('unitSec')}`);
  } else if (r.best_reps != null && r.best_time != null) {
    parts.push(`${r.best_time.toLocaleString()} ${t('unitSec')}`);
  }
  return parts.length ? parts.join(' · ') : null;
}

export function TrophyCase({ data, isOwner, token, onLayoutSaved }: TrophyCaseProps) {
  const { t } = useLanguage();

  // Merge badges + records into one ordered list following the saved layout;
  // anything new (not yet in `order`) falls to the end, badges before records.
  const ordered = useMemo<Item[]>(() => {
    const items: Item[] = [
      ...data.badges.map((b) => ({ key: `badge:${b.id}`, kind: 'badge' as const, badge: b })),
      ...data.records.map((r) => ({ key: `record:${r.exercise_id}`, kind: 'record' as const, record: r })),
    ];
    const rank = new Map(data.layout.order.map((k, i) => [k, i]));
    return items
      .map((it, i) => ({ it, i }))
      .sort((a, b) => {
        const ra = rank.has(a.it.key) ? rank.get(a.it.key)! : Number.MAX_SAFE_INTEGER;
        const rb = rank.has(b.it.key) ? rank.get(b.it.key)! : Number.MAX_SAFE_INTEGER;
        return ra - rb || a.i - b.i;
      })
      .map(({ it }) => it);
  }, [data]);

  const savedHidden = useMemo(() => new Set(data.layout.hidden), [data]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Item[]>(ordered);
  const [hidden, setHidden] = useState<Set<string>>(savedHidden);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(ordered);
    setHidden(new Set(savedHidden));
    setEditing(true);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...draft];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  };

  const toggleHidden = (key: string) => {
    const next = new Set(hidden);
    next.has(key) ? next.delete(key) : next.add(key);
    setHidden(next);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const layout = { order: draft.map((i) => i.key), hidden: [...hidden] };
    try {
      await AchievementsAPI.saveLayout(token, layout);
      onLayoutSaved(layout);
      setEditing(false);
      toast.success(t('layoutSaved'));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const list = editing ? draft : ordered.filter((i) => !savedHidden.has(i.key));
  if (list.length === 0 && !isOwner) return null;

  const renderCard = (item: Item, index: number) => {
    const isHidden = hidden.has(item.key);
    const dim = editing && isHidden;
    return (
      <div
        key={item.key}
        className={`bg-card rounded-2xl border shadow-sm flex items-center gap-3 p-3.5 transition-opacity ${
          dim ? 'opacity-45 border-gray-100' : 'border-gray-100'
        }`}
      >
        {item.kind === 'record' ? (
          <>
            <span className="w-11 h-11 rounded-xl bg-tint flex items-center justify-center shrink-0">
              <Medal className="w-5 h-5 text-tint-ink" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-foreground font-medium truncate">{item.record.exercise_name}</div>
              <div className="text-[11px] text-gray-400">{t('recordLabel')}</div>
            </div>
            {!editing && (
              <div className="text-end shrink-0">
                <div className="text-lg font-semibold text-foreground tabular-nums leading-none">
                  {recordPrimary(item.record, t)}
                </div>
                {recordSecondary(item.record, t) && (
                  <div className="text-xs text-gray-400 mt-1 tabular-nums">{recordSecondary(item.record, t)}</div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <span className="w-11 h-11 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-yellow-600" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-foreground font-medium truncate">{item.badge.title}</div>
              {item.badge.description ? (
                <p className="text-xs text-gray-500 truncate">{item.badge.description}</p>
              ) : (
                <div className="text-[11px] text-gray-400">{t('coachBadge')}</div>
              )}
            </div>
          </>
        )}

        {editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="p-1.5 rounded-lg text-gray-400 hover:text-foreground hover:bg-gray-100 disabled:opacity-30 transition-colors"
              aria-label={t('moveUp')}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => move(index, 1)}
              disabled={index === list.length - 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-foreground hover:bg-gray-100 disabled:opacity-30 transition-colors"
              aria-label={t('moveDown')}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleHidden(item.key)}
              className={`p-1.5 rounded-lg transition-colors ${
                isHidden ? 'text-gray-400 hover:bg-gray-100' : 'text-foreground hover:bg-yellow-50'
              }`}
              aria-label={isHidden ? t('show') : t('hide')}
            >
              {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-foreground font-medium flex items-center gap-2">
          <Trophy className="w-5 h-5 text-tint-ink" />
          {t('achievementsTitle')}
        </h3>
        {isOwner && list.length > 0 && !editing && (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-foreground border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('arrange')}
          </button>
        )}
      </div>

      {editing && <p className="text-gray-500 text-xs mb-3">{t('arrangeHint')}</p>}

      {list.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <Trophy className="w-9 h-9 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">{t('noAchievementsYet')}</p>
        </div>
      ) : (
        <div className="space-y-2">{list.map((item, i) => renderCard(item, i))}</div>
      )}

      {editing && (
        <div className="flex gap-2 mt-4">
          <Button variant="brand" icon={<Check />} loading={saving} onClick={save} className="flex-1 rounded-xl">
            {t('saveOrder')}
          </Button>
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            {t('cancel')}
          </button>
        </div>
      )}
    </div>
  );
}

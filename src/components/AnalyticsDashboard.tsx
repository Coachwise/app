import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, Dumbbell, Flame, Repeat, Timer, Trophy, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts@2.15.2';
import { BackButton } from './ui/back-button';
import * as SessionsAPI from '../api/sessions';
import { AchievementsAPI } from '../api';
import type { DailyAnalytics } from '../api/sessions';
import type { PersonalRecord } from '../api/types';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalyticsDashboardProps {
  token: string;
  /** Current user's id — used for their own PRs when not viewing a client. */
  selfId: string;
  /** Set when a coach is viewing a client; scopes analytics + PRs to them. */
  athleteId?: string;
  clientName?: string;
  onBack: () => void;
  onViewAssessments?: () => void;
}

const DAY_MS = 86_400_000;
const HEATMAP_WEEKS = 13;

export function AnalyticsDashboard({ token, selfId, athleteId, clientName, onBack, onViewAssessments }: AnalyticsDashboardProps) {
  const { t, language } = useLanguage();
  const locale = language === 'fa' ? 'fa-IR-u-ca-persian' : undefined;
  const [days, setDays] = useState<DailyAnalytics[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const who = athleteId ?? selfId;
    Promise.all([
      SessionsAPI.listDailyAnalytics(token, { limit: 120, athlete: athleteId }),
      AchievementsAPI.getUserAchievements(token, who).catch(() => null),
    ])
      .then(([analytics, ach]) => {
        if (!active) return;
        setDays(analytics.items);
        setRecords(ach?.records ?? []);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token, selfId, athleteId]);

  // Index day rows by their date for quick lookup.
  const byDate = useMemo(() => {
    const map = new Map<string, DailyAnalytics>();
    days.forEach((d) => map.set(d.date.slice(0, 10), d));
    return map;
  }, [days]);

  // Rolling totals over whatever the API returned.
  const totals = useMemo(() => {
    let sessions = 0, activeDays = 0, sets = 0, reps = 0, volume = 0, minutes = 0;
    days.forEach((d) => {
      if (d.sessions_count > 0) activeDays += 1;
      sessions += d.sessions_count;
      sets += d.total_sets;
      reps += d.total_reps ?? 0;
      volume += d.total_volume ?? 0;
      minutes += d.total_duration ?? 0;
    });
    return { sessions, activeDays, sets, reps, volume, avgMin: sessions ? Math.round(minutes / sessions) : 0 };
  }, [days]);

  // Volume-over-time series (oldest → newest), for the trend chart.
  const trend = useMemo(
    () =>
      [...days]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => ({
          date: d.date.slice(5, 10),
          volume: Math.round(d.total_volume ?? 0),
          sets: d.total_sets,
        })),
    [days],
  );

  // Contribution-style grid: HEATMAP_WEEKS columns of 7 days, ending today.
  const heatmap = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Back up to the start of this week (Saturday, as the Persian week starts Sat).
    const end = new Date(today);
    const cells: { key: string; volume: number; label: string }[] = [];
    const start = new Date(end.getTime() - (HEATMAP_WEEKS * 7 - 1) * DAY_MS);
    let max = 0;
    for (let ts = start.getTime(); ts <= end.getTime(); ts += DAY_MS) {
      const d = new Date(ts);
      const key = d.toISOString().slice(0, 10);
      const vol = byDate.get(key)?.total_volume ?? (byDate.get(key)?.sessions_count ? 1 : 0);
      max = Math.max(max, vol);
      cells.push({ key, volume: vol, label: d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) });
    }
    // Group into weeks (columns).
    const weeks: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return { weeks, max };
  }, [byDate, locale]);

  const heatColor = (v: number) => {
    if (v <= 0) return 'bg-gray-100';
    const r = heatmap.max ? v / heatmap.max : 0;
    if (r > 0.66) return 'bg-yellow-500';
    if (r > 0.33) return 'bg-yellow-400';
    return 'bg-yellow-200';
  };

  const prValue = (r: PersonalRecord) => {
    if (r.best_weight != null) return `${r.best_weight.toLocaleString()} ${t('unitKg')}`;
    if (r.best_reps != null) return `${r.best_reps.toLocaleString()} ${t('unitReps')}`;
    if (r.best_time != null) return `${r.best_time.toLocaleString()} ${t('unitSec')}`;
    return '—';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-navy px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} aria-label={t('back')} />
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-500" />
            <h1 className="text-white text-xl">{clientName ? t('clientAnalytics', { name: clientName }) : t('analytics')}</h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('loading')}</div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={<Dumbbell className="w-4 h-4" />} label={t('sessionsCount')} value={totals.sessions} />
            <StatTile icon={<CalendarDays className="w-4 h-4" />} label={t('activeDays')} value={totals.activeDays} />
            <StatTile icon={<Repeat className="w-4 h-4" />} label={t('totalSets')} value={totals.sets} />
            <StatTile icon={<Activity className="w-4 h-4" />} label={t('totalReps')} value={totals.reps} />
            <StatTile icon={<Flame className="w-4 h-4" />} label={t('trainingVolume')} value={`${totals.volume.toLocaleString()} ${t('unitKg')}`} />
            <StatTile icon={<Timer className="w-4 h-4" />} label={t('avgSession')} value={`${totals.avgMin} ${t('minShort')}`} />
          </div>

          {/* Volume trend */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-navy font-medium mb-3">{t('volumeTrend')}</h3>
            {trend.length > 1 ? (
              <div className="h-48 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Area type="monotone" dataKey="volume" stroke="#ca8a04" strokeWidth={2} fill="url(#vol)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-8 text-center">{t('notEnoughData')}</p>
            )}
          </div>

          {/* Workout-days heatmap */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-navy font-medium mb-3">{t('workoutDays')}</h3>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {heatmap.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((cell) => (
                    <div
                      key={cell.key}
                      title={`${cell.label}${cell.volume > 0 ? ` · ${Math.round(cell.volume).toLocaleString()} ${t('unitKg')}` : ''}`}
                      className={`w-3.5 h-3.5 rounded-sm ${heatColor(cell.volume)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-gray-400">
              <span>{t('less')}</span>
              <span className="w-3 h-3 rounded-sm bg-gray-100" />
              <span className="w-3 h-3 rounded-sm bg-yellow-200" />
              <span className="w-3 h-3 rounded-sm bg-yellow-400" />
              <span className="w-3 h-3 rounded-sm bg-yellow-500" />
              <span>{t('more')}</span>
            </div>
          </div>

          {/* PRs + assessments */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-navy font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                {t('personalRecords')}
              </h3>
              {onViewAssessments && (
                <button onClick={onViewAssessments} className="text-sm text-yellow-600 font-medium inline-flex items-center gap-0.5">
                  {t('assessments')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            {records.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">{t('noRecordsYet')}</p>
            ) : (
              <div className="space-y-2">
                {records.slice(0, 6).map((r) => (
                  <div key={r.exercise_id} className="flex items-center justify-between text-sm">
                    <span className="text-navy truncate pr-2">{r.exercise_name}</span>
                    <span className="font-semibold text-navy tabular-nums whitespace-nowrap">{prValue(r)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-navy text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

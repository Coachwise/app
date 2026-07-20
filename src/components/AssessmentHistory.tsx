import { useCallback, useEffect, useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Minus, LineChart, History } from 'lucide-react';
import { BackButton } from './ui/back-button';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { localized } from '../lib/localize';
import { TestsAPI } from '../api';
import type { Test, TestRequest, TestItem } from '../api/types';
import { toast } from 'sonner';

interface AssessmentHistoryProps {
  token: string;
  protocolId: string;
  onBack: () => void;
  // When set, the athlete can record a new run. Omitted for a coach viewing a client.
  onRun?: () => void;
  // When a coach is viewing a specific client's runs.
  athleteId?: string;
  clientName?: string;
}

type Metric = 'weight' | 'reps' | 'time';

function itemMetric(it: TestItem): { metric: Metric; unitKey: string } | null {
  if (it.track_weight) return { metric: 'weight', unitKey: 'unitKg' };
  if (it.track_reps) return { metric: 'reps', unitKey: 'unitReps' };
  if (it.track_time) return { metric: 'time', unitKey: 'unitSec' };
  return null;
}
function recValue(rec: TestRequest['records'][number], m: Metric): number | null {
  const v = m === 'weight' ? rec.weight : m === 'reps' ? rec.reps : rec.duration_seconds;
  return v == null ? null : v;
}
function runDate(r: TestRequest): number {
  return new Date(r.submitted_at || r.created_at).getTime();
}

// A tiny SVG sparkline. Higher is better for weight/reps; for time it's still
// drawn as-is (the delta arrow conveys direction).
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 280, h = 44, pad = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pt = (v: number, i: number) => {
    const x = pad + (i / (values.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return [x, y] as const;
  };
  const line = values.map((v, i) => pt(v, i).join(',')).join(' ');
  const [lx, ly] = pt(values[values.length - 1], values.length - 1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-11" preserveAspectRatio="none">
      <polyline points={line} fill="none" style={{ stroke: 'var(--brand-yellow)' }} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={3.5} style={{ fill: 'var(--tint)' }} />
    </svg>
  );
}

export function AssessmentHistory({ token, protocolId, onBack, onRun, athleteId, clientName }: AssessmentHistoryProps) {
  const { t, language } = useLanguage();
  const [protocol, setProtocol] = useState<Test | null>(null);
  const [runs, setRuns] = useState<TestRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const dateLocale = language === 'fa' ? 'fa-IR-u-ca-persian' : undefined;
  const fmtDate = (r: TestRequest) =>
    new Date(r.submitted_at || r.created_at).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, rs] = await Promise.all([
        TestsAPI.getTest(token, protocolId),
        TestsAPI.listRuns(token, protocolId, athleteId ? { athlete: athleteId } : undefined),
      ]);
      setProtocol(p);
      setRuns(rs.items);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, protocolId, athleteId]);

  useEffect(() => { load(); }, [load]);

  const chrono = [...runs].reverse(); // oldest → newest for trends

  // Build a per-exercise trend series from the protocol's items.
  const series = (protocol?.items ?? []).map((it) => {
    const m = itemMetric(it);
    const points = m
      ? chrono
          .map((run) => {
            const rec = run.records.find((r) => r.exercise_id === it.exercise_id);
            const v = rec ? recValue(rec, m.metric) : null;
            return v == null ? null : v;
          })
          .filter((v): v is number => v != null)
      : [];
    return { item: it, metric: m, points };
  });

  const fmtVal = (v: number, unitKey: string) => `${v.toLocaleString()} ${t(unitKey)}`;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} aria-label={t('back')} />
          <div className="min-w-0 text-center px-2">
            <h1 className="text-foreground text-lg truncate">{protocol?.name || t('history')}</h1>
            {clientName && <p className="text-muted-foreground text-xs truncate">{clientName}</p>}
          </div>
          {onRun ? (
            <Button variant="brand" size="sm" icon={<Plus />} onClick={onRun}>
              {t('runNow')}
            </Button>
          ) : (
            <span className="w-10" />
          )}
        </div>
      </div>

      <div className="p-4 space-y-5 pb-28">
        {loading && <div className="text-center text-gray-500 py-8">{t('loading')}</div>}

        {!loading && runs.length === 0 && (
          <div className="bg-card rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
            <LineChart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{athleteId ? t('clientNoRuns') : t('noRunsYet')}</p>
            {onRun && (
              <Button variant="brand" size="sm" icon={<Plus />} className="mt-4" onClick={onRun}>
                {t('recordFirstRun')}
              </Button>
            )}
          </div>
        )}

        {/* Progress per exercise */}
        {!loading && runs.length > 0 && (
          <div>
            <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-tint-ink" />
              {t('progress')}
            </h3>
            <div className="space-y-3">
              {series.map(({ item, metric, points }) => {
                if (!metric || points.length === 0) return null;
                const latest = points[points.length - 1];
                const first = points[0];
                const delta = latest - first;
                const Arrow = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                const deltaCls = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400';
                return (
                  <div key={item.id} className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <div className="text-foreground font-medium truncate">{localized(item.exercise_name_i18n, item.exercise_name, language)}</div>
                        <div className="text-[11px] text-gray-400">{t('latest')}</div>
                      </div>
                      <div className="text-end shrink-0">
                        <div className="text-xl font-semibold text-foreground tabular-nums leading-none">
                          {fmtVal(latest, metric.unitKey)}
                        </div>
                        {points.length > 1 && (
                          <div className={`text-xs mt-1 flex items-center gap-0.5 justify-end ${deltaCls}`}>
                            <Arrow className="w-3.5 h-3.5" />
                            <span className="tabular-nums">
                              {delta > 0 ? '+' : ''}{delta.toLocaleString()} {t(metric.unitKey)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {points.length > 1 && <Sparkline values={points} />}
                    <div className="text-[11px] text-gray-400 mt-1">{t('runsCount', { count: String(points.length) })}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Every recorded run */}
        {!loading && runs.length > 0 && (
          <div>
            <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-tint-ink" />
              {t('runHistory')}
            </h3>
            <div className="space-y-3">
              {runs.map((run) => (
                <div key={run.id} className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="text-foreground text-sm font-medium mb-2">{fmtDate(run)}</div>
                  <div className="space-y-1.5">
                    {run.records.map((r, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-gray-600 truncate">{localized(r.exercise_name_i18n, r.exercise_name ?? '', language)}</span>
                        <span className="text-foreground tabular-nums shrink-0">
                          {[
                            r.weight != null ? `${r.weight} ${t('unitKg')}` : null,
                            r.reps != null ? `${r.reps} ${t('unitReps')}` : null,
                            r.duration_seconds != null ? `${r.duration_seconds} ${t('unitSec')}` : null,
                          ].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, Send, Plus, Play, LineChart, Pencil, Dumbbell } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import { UserAvatar } from './UserAvatar';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { TestsAPI } from '../api';
import type { Test } from '../api/types';
import { toast } from 'sonner';

interface AthleteTestsProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
  onNewProtocol: () => void;
  onEditProtocol: (id: string) => void;
  onRunProtocol: (id: string) => void;
  onViewHistory: (id: string) => void;
  userRole?: UserRole;
  isPro?: boolean;
}

export function AthleteTests({
  onBack, onNavigate, onNewProtocol, onEditProtocol, onRunProtocol, onViewHistory, userRole = 'athlete', isPro = false,
}: AthleteTestsProps) {
  const { t } = useLanguage();
  const { tokens } = useAuth();
  const token = tokens?.access_token || '';

  const [protocols, setProtocols] = useState<Test[]>([]);
  const [assigned, setAssigned] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [mine, fromCoach] = await Promise.all([
        TestsAPI.listTests(token, { limit: 100 }),
        TestsAPI.listAssigned(token, { limit: 100 }),
      ]);
      setProtocols(mine.items);
      setAssigned(fromCoach.items);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const coachName = (u: NonNullable<Test['coach']>) =>
    `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;

  // A protocol card with Run + History; Edit only for protocols the athlete owns.
  // Assigned protocols show who set them.
  const protocolCard = (p: Test, editable: boolean) => (
    <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {!editable && p.coach && (
        <div className="flex items-center gap-2 mb-2.5 pb-2.5 border-b border-gray-100">
          <UserAvatar url={p.coach.avatar?.url ?? null} alt={coachName(p.coach)} sizeClass="w-7 h-7" iconClass="w-4 h-4" />
          <span className="text-xs text-gray-500 truncate">{t('assignedByCoach', { coach: coachName(p.coach) })}</span>
        </div>
      )}
      <div className="min-w-0">
        <h4 className="text-navy font-medium truncate">{p.name}</h4>
        <p className="text-gray-400 text-xs mt-0.5">{t('exercisesCountShort', { count: String(p.item_count) })}</p>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onRunProtocol(p.id)}
          className="flex-1 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors text-sm flex items-center justify-center gap-1.5"
        >
          <Play className="w-4 h-4" />
          {t('runNow')}
        </button>
        <button
          onClick={() => onViewHistory(p.id)}
          className="px-4 py-2 border-2 border-gray-200 text-navy rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-1.5"
        >
          <LineChart className="w-4 h-4" />
          {t('history')}
        </button>
        {editable && (
          <button
            onClick={() => onEditProtocol(p.id)}
            className="px-3 py-2 border-2 border-gray-200 text-navy rounded-lg hover:bg-gray-50 transition-colors text-sm"
            aria-label={t('edit')}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-navy px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-navy-light rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl">{t('myAssessments')}</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewProtocol}
              className="inline-flex items-center gap-1 px-3 py-2 bg-yellow-500 text-navy rounded-lg hover:bg-yellow-400 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('newProtocolShort')}
            </button>
            <HamburgerMenu userRole={userRole} onNavigate={onNavigate} isPro={isPro} />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-28">
        {loading && <div className="text-center text-gray-500 py-8">{t('loading')}</div>}

        {/* Assigned by a coach — run + history, identical to personal protocols */}
        {!loading && assigned.length > 0 && (
          <div>
            <h3 className="text-navy font-medium mb-3 flex items-center gap-2">
              <Send className="w-5 h-5 text-yellow-500" />
              {t('fromYourCoach')}
            </h3>
            <div className="space-y-3">{assigned.map((p) => protocolCard(p, false))}</div>
          </div>
        )}

        {/* My protocols */}
        {!loading && (
          <div>
            <h3 className="text-navy font-medium mb-3 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-yellow-500" />
              {t('myProtocols')}
            </h3>
            {protocols.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <ClipboardList className="w-9 h-9 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">{t('noProtocolsYet')}</p>
                <p className="text-gray-400 text-xs mt-1">{t('protocolsHint')}</p>
                <button
                  onClick={onNewProtocol}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-500 text-navy rounded-lg hover:bg-yellow-400 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  {t('newProtocol')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">{protocols.map((p) => protocolCard(p, true))}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

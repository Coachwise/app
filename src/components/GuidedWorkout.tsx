import { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Layers, Minus, Pause, Play, Plus, SkipForward, Timer } from 'lucide-react';
import { AppOverlay } from './ui/app-overlay';
import { Button } from './ui/button';
import { GradeSelect } from './ui/grade-select';
import { useLanguage } from '../contexts/LanguageContext';
import { beep, initAudio, soundStartSet, soundStartRest, soundExerciseDone, soundPlanDone } from '../lib/sound';
import type { SessionExercise } from './WorkoutSession';

const READY_SECONDS = 5;

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v)$/i.test(url);

export interface GuidedSetValues {
  reps?: number;
  duration?: number; // seconds
  weight?: number;
  distance?: number; // metres
  height?: number; // cm
  grade?: string;
}

interface GuidedWorkoutProps {
  open: boolean;
  exercises: SessionExercise[];
  onLogSet: (exerciseIndex: number, setIndex: number, values: GuidedSetValues) => void;
  onClose: () => void;
  onFinish: () => void;
}

type Phase = 'ready' | 'active' | 'rest' | 'done';
// `round` is only set for a step inside a group, where it labels which round of
// the circuit this is. `lastOfRound` marks the step the round's rest follows.
type Step = { exIdx: number; setIdx: number; round?: number; rounds?: number; lastOfRound?: boolean };

/**
 * Flattens the session into the order it is actually performed. Plain exercises
 * run set by set, as they always have. A group's rows (which share a groupKey and
 * hold one set per round) are interleaved instead: every exercise once, then the
 * next round — which is what makes it a circuit rather than three exercises done
 * back to back.
 */
function buildSteps(exercises: SessionExercise[]): Step[] {
  const steps: Step[] = [];
  let i = 0;
  while (i < exercises.length) {
    const key = exercises[i].groupKey;
    if (!key) {
      exercises[i].sets.forEach((s, setIdx) => {
        if (!s.completed) steps.push({ exIdx: i, setIdx });
      });
      i++;
      continue;
    }
    // Collect the contiguous run of rows belonging to this group.
    const members: number[] = [];
    while (i < exercises.length && exercises[i].groupKey === key) members.push(i++);
    const rounds = Math.max(...members.map((m) => exercises[m].sets.length));
    for (let round = 0; round < rounds; round++) {
      const inRound = members.filter((m) => exercises[m].sets[round] && !exercises[m].sets[round].completed);
      inRound.forEach((m, idx) => {
        steps.push({
          exIdx: m,
          setIdx: round,
          round: round + 1,
          rounds,
          lastOfRound: idx === inRound.length - 1,
        });
      });
    }
  }
  return steps;
}

/**
 * The guided run: a full-screen overlay that walks the athlete through each set
 * one at a time — a 5s "get ready", then either a duration countdown (timed
 * holds) or a "done when finished" prompt (rep sets), then the rest countdown.
 * The last 3 seconds of every countdown beep and turn red so the athlete is
 * cued without looking. Rest is also a chance to fine-tune what gets logged; the
 * set is logged when its rest ends (or immediately when it has no rest).
 */
export function GuidedWorkout({ open, exercises, onLogSet, onClose, onFinish }: GuidedWorkoutProps) {
  const { t } = useLanguage();

  // Only the sets still to do, in the order they're performed. Built once per open.
  const steps = useMemo<Step[]>(() => (open ? buildSteps(exercises) : []), [open]);

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [remaining, setRemaining] = useState(READY_SECONDS);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [distance, setDistance] = useState(0);
  const [height, setHeight] = useState(0);
  const [grade, setGrade] = useState('');
  const [paused, setPaused] = useState(false);

  const cur = steps[stepIndex];
  const curEx = cur ? exercises[cur.exIdx] : null;
  const curSet = cur ? curEx!.sets[cur.setIdx] : null;

  // (Re)start the run whenever it opens; unlock audio for the countdown beeps.
  useEffect(() => {
    if (!open) return;
    initAudio();
    setStepIndex(0);
    if (steps.length === 0) {
      setPhase('done');
    } else {
      setPhase('ready');
      setRemaining(READY_SECONDS);
    }
  }, [open, steps.length]);

  // Move into a step, either its ready countdown or straight to work.
  const enter = (i: number, kind: 'ready' | 'active') => {
    const s = steps[i];
    const set = exercises[s.exIdx].sets[s.setIdx];
    setStepIndex(i);
    setReps(set.reps);
    setWeight(set.weight);
    setDistance(set.distance);
    setHeight(set.height);
    setGrade(set.grade);
    setPaused(false);
    if (kind === 'ready') {
      setPhase('ready');
      setRemaining(READY_SECONDS);
    } else {
      setPhase('active');
      soundStartSet();
      if (set.type === 'time') setRemaining(set.duration);
    }
  };

  // Log the current set with whatever the steppers currently show.
  const commitCurrent = () => {
    if (!cur || !curSet || !curEx) return;
    const m = curEx.metrics;
    const values: GuidedSetValues = {
      ...(curSet.type === 'time' ? { duration: curSet.duration } : { reps }),
      ...(m.weight ? { weight } : {}),
      ...(m.distance ? { distance } : {}),
      ...(m.height ? { height } : {}),
      ...(m.grade && grade ? { grade } : {}),
    };
    onLogSet(cur.exIdx, cur.setIdx, values);
  };

  // The set's work is over (Done tapped or the timer ran out).
  const finishActive = () => {
    if (!cur || !curSet) return;
    const next = steps[stepIndex + 1];
    const inGroup = cur.round != null;
    // Inside a circuit you rest between exercises too, and the gap after the
    // round's last exercise is the group's own rest, not that exercise's.
    const restSeconds = inGroup && cur.lastOfRound ? curEx?.groupRestSeconds ?? 0 : curSet.restSeconds;
    const goRest = !!next && restSeconds > 0 && (inGroup || next.exIdx === cur.exIdx);
    if (goRest) {
      // Log at the end of rest so the athlete can adjust during it.
      soundStartRest();
      setPhase('rest');
      setRemaining(restSeconds);
    } else {
      commitCurrent();
      if (!next) {
        soundPlanDone(); // whole plan finished — big fanfare
        setPhase('done');
        return;
      }
      // In a circuit every step changes exercise, so only chime when the whole
      // block is behind you rather than on each movement.
      const leavingGroup = !inGroup || exercises[next.exIdx]?.groupKey !== curEx?.groupKey;
      if (next.exIdx !== cur.exIdx && leavingGroup) soundExerciseDone();
      enter(stepIndex + 1, 'ready');
    }
  };

  const endRest = () => {
    commitCurrent();
    enter(stepIndex + 1, 'active');
  };

  const handleExit = () => {
    // Save the set they were resting after, in case they leave mid-rest.
    if (phase === 'rest') commitCurrent();
    onClose();
  };

  // One-second ticker + beeps for the countdown phases.
  const counting = phase === 'ready' || phase === 'rest' || (phase === 'active' && curSet?.type === 'time');
  useEffect(() => {
    if (!open || !counting || paused) return;
    if (remaining <= 0) {
      // The transition itself plays a semantic cue (start-set / start-rest /
      // exercise-done / plan-done), so no generic "go" beep here.
      if (phase === 'ready') enter(stepIndex, 'active');
      else if (phase === 'rest') endRest();
      else if (phase === 'active') finishActive();
      return;
    }
    if (remaining <= 3) beep(880, 110); // last-3 ticks
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, counting, remaining, phase, stepIndex, paused]);

  if (!open) return null;

  const totalSteps = steps.length;
  const isCountdown = phase === 'ready' || phase === 'rest' || (phase === 'active' && curSet?.type === 'time');
  const urgent = isCountdown && remaining <= 3;

  // Preview of the exercise we're getting ready for: set count + rough time.
  const setCount = curEx?.sets.length ?? 0;
  const estSeconds = curEx
    ? curEx.sets.reduce((sum, s) => sum + (s.type === 'time' ? s.duration : s.reps * 3) + s.restSeconds, 0)
    : 0;
  const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const firstSet = curEx?.sets[0];
  const setSummary = firstSet
    ? firstSet.type === 'time'
      ? `${setCount} × ${firstSet.duration} ${t('secUnit')}`
      : `${setCount} × ${firstSet.reps} ${t('repsUnit')}`
    : '';

  // Inputs for the extra metrics this exercise tracks (weight/distance/height/grade).
  const m = curEx?.metrics;
  const metricInputs = (
    <>
      {m?.weight && <Stepper label={t('kg')} value={weight} onChange={(d) => setWeight((v) => Math.max(0, v + d))} step={2.5} />}
      {m?.distance && <Stepper label={t('distanceUpper')} value={distance} onChange={(d) => setDistance((v) => Math.max(0, v + d))} step={10} />}
      {m?.height && <Stepper label={t('heightUpper')} value={height} onChange={(d) => setHeight((v) => Math.max(0, v + d))} step={5} />}
      {m?.grade && (
        <div className="bg-white/10 rounded-2xl p-3 flex flex-col items-center gap-2">
          <span className="text-[11px] font-bold text-white/60">{t('gradeUpper')}</span>
          <GradeSelect value={grade} onChange={setGrade} placeholder="—" className="w-full text-center font-bold" />
        </div>
      )}
    </>
  );

  return (
    <AppOverlay
      open={open}
      onClose={handleExit}
      className="text-white"
      backdropClassName={phase === 'rest' ? 'bg-emerald-900/95' : undefined}
    >
      {phase === 'done' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="size-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t('workoutComplete')}</h2>
            <p className="text-white/70 mt-1">{t('allSetsLogged')}</p>
          </div>
          <Button variant="brand" size="block" onClick={onFinish} className="max-w-xs">
            {t('finishWorkout')}
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-6">
          {/* Exercise demo media, pinned to the top of the frame. */}
          {curEx?.mediaUrl && (
            <div className="mt-8 mb-2 h-40 rounded-2xl overflow-hidden bg-black/25 border border-white/10 flex items-center justify-center shrink-0">
              {isVideoUrl(curEx.mediaUrl) ? (
                <video
                  key={curEx.id}
                  src={curEx.mediaUrl}
                  className="h-full w-auto object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              ) : (
                <img src={curEx.mediaUrl} alt={curEx.name} className="h-full w-auto object-contain" />
              )}
            </div>
          )}

          {/* Header: what and where we are */}
          <div className={`text-center ${curEx?.mediaUrl ? 'pt-1' : 'pt-8'}`}>
            <p className={`text-sm font-semibold uppercase tracking-wide ${phase === 'rest' ? 'text-emerald-300' : 'text-tint-ink'}`}>
              {phase === 'ready' ? t('nextUp') : phase === 'rest' ? t('restNow') : t('work')}
            </p>
            {/* Inside a circuit, which round you're on matters more than anything
                else on screen — the exercise changes every step. */}
            {cur?.round != null && (
              <p className="text-xs font-medium text-white/70 mt-1">
                {curEx?.groupName ? `${curEx.groupName} · ` : ''}
                {t('roundOf', { current: cur.round, total: cur.rounds ?? 0 })}
              </p>
            )}
            <h2 className="text-2xl font-bold mt-1">{curEx?.name}</h2>
            {phase === 'ready' ? (
              <div className="mt-2">
                <div className="flex items-center justify-center gap-4 text-white/75 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="size-4" />
                    {t('setsCount', { count: setCount })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {fmtClock(estSeconds)}
                  </span>
                </div>
                {setSummary && <p className="text-white/40 text-xs mt-1">{setSummary}</p>}
              </div>
            ) : (
              <p className="text-white/60 text-sm mt-1">
                {t('setProgress', { done: stepIndex + 1, total: totalSteps })}
              </p>
            )}
          </div>

          {/* Center stage: countdown or rep prompt */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            {isCountdown && (
              <div className="text-center">
                <div className={`text-8xl font-mono font-bold tabular-nums transition-colors ${urgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {remaining}
                </div>
                <p className="text-white/50 mt-2 flex items-center justify-center gap-1.5">
                  <Timer className="size-4" />
                  {phase === 'rest' ? t('restNow') : phase === 'ready' ? t('getReady') : t('secondsLeft')}
                </p>
                <Button
                  variant="ghost"
                  size="xl"
                  onClick={() => setPaused((p) => !p)}
                  icon={paused ? <Play className="size-7" /> : <Pause className="size-7" />}
                  className="mt-6 min-w-44 rounded-full bg-white/15 hover:bg-white/25 text-white"
                >
                  {paused ? t('resume') : t('pause')}
                </Button>
              </div>
            )}

            {phase === 'active' && curSet?.type === 'reps' && (
              <div className="w-full max-w-xs flex flex-col items-center gap-6">
                <p className="text-white/60">{t('tapWhenDone')}</p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Stepper label={t('repsUpper')} value={reps} onChange={(d) => setReps((v) => Math.max(0, v + d))} step={1} />
                  {metricInputs}
                </div>
              </div>
            )}

            {/* Rest is a chance to log/adjust the set just finished. */}
            {phase === 'rest' && (
              <div className="w-full max-w-xs">
                <p className="text-center text-white/50 text-xs mb-2">{t('adjustWhileResting')}</p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {curSet?.type === 'reps' ? (
                    <Stepper label={t('repsUpper')} value={reps} onChange={(d) => setReps((v) => Math.max(0, v + d))} step={1} />
                  ) : (
                    <Stepper label={t('secUpper')} value={curSet?.duration ?? 0} onChange={() => {}} step={0} readOnly />
                  )}
                  {metricInputs}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {phase === 'active' && (
              <Button variant="brand" size="blockXl" icon={<Check className="size-6" />} onClick={() => { initAudio(); finishActive(); }}>
                {t('doneSet')}
              </Button>
            )}
            {phase === 'ready' && (
              <Button variant="brand" size="blockXl" icon={<SkipForward className="size-6" />} onClick={() => { initAudio(); enter(stepIndex, 'active'); }}>
                {t('startNow')}
              </Button>
            )}
            {phase === 'rest' && (
              <Button variant="brand" size="blockXl" icon={<SkipForward className="size-6" />} onClick={() => { initAudio(); endRest(); }}>
                {t('skipRest')}
              </Button>
            )}
          </div>
        </div>
      )}
    </AppOverlay>
  );
}

function Stepper({
  label,
  value,
  onChange,
  step,
  readOnly,
}: {
  label: string;
  value: number;
  onChange: (delta: number) => void;
  step: number;
  readOnly?: boolean;
}) {
  return (
    <div className="bg-white/10 rounded-2xl p-3 flex flex-col items-center gap-2">
      <span className="text-[11px] font-bold text-white/60">{label}</span>
      <div className="flex items-center gap-3">
        {!readOnly && (
          <Button variant="ghost" size="icon" onClick={() => onChange(-step)} className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="decrease">
            <Minus className="size-4" />
          </Button>
        )}
        <span className="text-2xl font-bold tabular-nums w-12 text-center">{value}</span>
        {!readOnly && (
          <Button variant="ghost" size="icon" onClick={() => onChange(step)} className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="increase">
            <Plus className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

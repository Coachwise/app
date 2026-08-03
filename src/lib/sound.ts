// Tiny Web Audio beeper for the guided workout countdowns, so the athlete is
// cued by ear (like an interval timer) without watching the screen. No audio
// assets — tones are synthesised. Browsers block audio until a user gesture, so
// call initAudio() from a tap before relying on beep().
//
// Cues play near full scale on purpose: they have to carry across a gym, and the
// phone's own volume buttons are how the athlete turns them down.

let ctx: AudioContext | null = null;

export function initAudio() {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  // A context created outside a gesture starts "suspended"; resume it here.
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function beep(freq = 880, ms = 120, gain = 0.9) {
  if (!ctx) initAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(vol);
    vol.connect(ctx.destination);
    const now = ctx.currentTime;
    vol.gain.setValueAtTime(gain, now);
    vol.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
    osc.start(now);
    osc.stop(now + ms / 1000);
  } catch {
    /* audio is best-effort */
  }
}

// A little melody: each note is [frequency, startOffsetMs, durationMs, gain?].
type Note = [freq: number, atMs: number, durMs: number, gain?: number];
function play(notes: Note[], type: OscillatorType = 'triangle') {
  if (!ctx) initAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const [freq, atMs, durMs, gain = 0.9] of notes) {
    try {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(vol);
      vol.connect(ctx.destination);
      const start = now + atMs / 1000;
      const end = start + durMs / 1000;
      vol.gain.setValueAtTime(0.0001, start);
      vol.gain.exponentialRampToValueAtTime(gain, start + 0.01);
      vol.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.start(start);
      osc.stop(end + 0.02);
    } catch {
      /* best-effort */
    }
  }
}

// Rising two-note cue as a set's work begins.
export const soundStartSet = () => play([[784, 0, 90], [1175, 80, 150]]);

// Calmer descending cue as rest begins.
export const soundStartRest = () => play([[587, 0, 130, 0.75], [392, 120, 200, 0.75]], 'sine');

// Short "tada" arpeggio when an exercise is finished.
export const soundExerciseDone = () => play([[523, 0, 100], [659, 90, 100], [784, 180, 100], [1047, 270, 240]]);

// Bigger fanfare at the end of the whole plan. The closing chord's three notes
// sound together, so each is quieter to keep the sum inside full scale.
export const soundPlanDone = () =>
  play([
    [523, 0, 120], [659, 110, 120], [784, 220, 120], [1047, 330, 180],
    [1047, 540, 340, 0.34], [1319, 540, 340, 0.3], [1568, 540, 420, 0.26],
  ]);

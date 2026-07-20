// App theme = colour mode (light/dark) + brand accent (azure/pink). Both are set
// as data-attributes on <html>, which globals.css reads to swap the tokens.
// Persisted locally; onboarding seeds the brand from gender and Settings changes
// either. Azure is the default; pink is the female-default. See docs/design-system.md.

export type ThemeMode = 'light' | 'dark';
export type Accent = 'azure' | 'pink';

export interface ThemePref {
  mode: ThemeMode;
  accent: Accent;
}

const KEY = 'coachwise-theme';
const DEFAULT: ThemePref = { mode: 'light', accent: 'azure' };

export function getTheme(): ThemePref {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const p = JSON.parse(raw);
    return {
      mode: p.mode === 'dark' ? 'dark' : 'light',
      // Migrate the retired aqua/bubblegum names onto azure/pink.
      accent: p.accent === 'pink' || p.accent === 'bubblegum' ? 'pink' : 'azure',
    };
  } catch {
    return DEFAULT;
  }
}

export function applyTheme(pref: ThemePref) {
  const el = document.documentElement;
  el.setAttribute('data-theme', pref.mode);
  el.setAttribute('data-accent', pref.accent);
  // Keep the shadcn `.dark` variant in sync for any component that uses it.
  el.classList.toggle('dark', pref.mode === 'dark');
}

export function setTheme(patch: Partial<ThemePref>): ThemePref {
  const next = { ...getTheme(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  applyTheme(next);
  return next;
}

// Apply the stored (or default) theme as early as possible to avoid a flash.
export function initTheme() {
  applyTheme(getTheme());
}

// Default brand by gender: azure for men, pink for women (both changeable later
// in Appearance). Unspecified keeps the current/azure default.
export function accentForGender(gender: 'MALE' | 'FEMALE' | 'UNSPECIFIED'): Accent {
  return gender === 'FEMALE' ? 'pink' : 'azure';
}

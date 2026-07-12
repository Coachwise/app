import type { LocalizedText } from '../api/types';

/**
 * Resolve a localized string for the given language, falling back to the plain
 * default (e.g. the exercise's `name`) when that locale is missing. Used for
 * data that carries `{ en, fa }` translation maps (exercises, categories, ...).
 */
export function localized(
  map: LocalizedText | null | undefined,
  fallback: string,
  lang: string,
): string {
  const v = map?.[lang];
  return v && v.trim() ? v : fallback;
}

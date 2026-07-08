// Dial-code data for the phone-login country selector. The default is resolved
// at runtime from the client IP (see detectDialCode); this list is the pick-list
// and the source of truth for normalizing a local number into E.164-ish form.
export interface Country {
  code: string; // ISO 3166-1 alpha-2, e.g. "IR"
  name: string;
  dial: string; // e.g. "+98"
  flag: string; // emoji
}

export const COUNTRIES: Country[] = [
  { code: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'TR', name: 'Türkiye', dial: '+90', flag: '🇹🇷' },
  { code: 'IQ', name: 'Iraq', dial: '+964', flag: '🇮🇶' },
  { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { code: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲' },
  { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
  { code: 'AF', name: 'Afghanistan', dial: '+93', flag: '🇦🇫' },
  { code: 'AZ', name: 'Azerbaijan', dial: '+994', flag: '🇦🇿' },
  { code: 'AM', name: 'Armenia', dial: '+374', flag: '🇦🇲' },
  { code: 'GE', name: 'Georgia', dial: '+995', flag: '🇬🇪' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Iran — used only when IP lookup fails

export function countryByCode(code?: string | null): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

// Detect the caller's country from their IP so the prefix defaults sensibly.
// Best-effort: tries a couple of CORS-friendly lookups and, on any failure
// (offline, blocked, timeout, rate-limit), falls back to the default.
export async function detectCountry(): Promise<Country> {
  const sources: Array<{ url: string; pick: (d: any) => string | undefined }> = [
    { url: 'https://ipwho.is/?fields=country_code', pick: (d) => d?.country_code },
    { url: 'https://get.geojs.io/v1/ip/country.json', pick: (d) => d?.country },
  ];
  for (const s of sources) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(s.url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const found = countryByCode(s.pick(await res.json()));
      if (found) return found;
    } catch {
      // try the next source
    }
  }
  return DEFAULT_COUNTRY;
}

// Combine a selected dial code with a locally-typed number into a single E.164
// string: strip spaces/dashes and any leading zero(s) national-trunk prefix.
export function normalizePhone(dial: string, local: string): string {
  const digits = local.replace(/[^\d]/g, '').replace(/^0+/, '');
  return `${dial}${digits}`;
}

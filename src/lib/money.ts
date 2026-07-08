// Money formatting. Amounts are whole units (Toman for IRR, decimals 0). Never
// do money math on the client — the server returns exact figures.

const SYMBOLS: Record<string, { en: string; fa: string }> = {
  IRR: { en: "Toman", fa: "تومان" },
  USD: { en: "$", fa: "$" },
  EUR: { en: "€", fa: "€" },
};

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toFaDigits(s: string): string {
  return s.replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

// Group a whole-unit amount with thousands separators, localizing digits for FA.
export function formatAmount(amount: number, lang: "en" | "fa"): string {
  const grouped = Math.round(amount).toLocaleString("en-US");
  return lang === "fa" ? toFaDigits(grouped) : grouped;
}

// Format an amount with its currency label. IRR/USD symbols are language-aware;
// the Toman label trails the number (matches Persian convention).
export function formatMoney(amount: number, currency: string, lang: "en" | "fa"): string {
  const num = formatAmount(amount, lang);
  const sym = SYMBOLS[currency];
  if (!sym) return `${num} ${currency}`;
  if (currency === "USD" || currency === "EUR") return `${sym[lang]}${num}`;
  return `${num} ${sym[lang]}`; // Toman-style trailing label
}

// The display label for a currency (e.g. "Toman" / "تومان").
export function currencyLabel(currency: string, lang: "en" | "fa"): string {
  return SYMBOLS[currency]?.[lang] ?? currency;
}

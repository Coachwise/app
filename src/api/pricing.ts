import { request } from "./client";
import type { Currency, DurationTier, PaymentProvider, PurchaseOption, Quote } from "./types";

// Platform-supported (enabled) currencies.
export function listCurrencies(token: string) {
  return request<Currency[]>("/pricing/currencies", { token });
}

// Duration discount tiers (shared by Pro and subscription packages).
export function listTiers(token: string) {
  return request<DurationTier[]>("/pricing/tiers", { token });
}

// Pro monthly price for a currency + the tiers, for the upsell screen.
export function proPricing(token: string, currency?: string) {
  const q = currency ? `?currency=${encodeURIComponent(currency)}` : "";
  return request<{ currency: string; monthly_amount: number; tiers: DurationTier[] }>(
    `/pricing/pro${q}`,
    { token },
  );
}

// Providers that handle a currency (Pro / top-up provider picker).
export function providersFor(token: string, currency: string) {
  return request<PaymentProvider[]>(
    `/pricing/providers?currency=${encodeURIComponent(currency)}`,
    { token },
  );
}

// Per-package purchase options: each sellable currency with its providers.
export function packageOptions(token: string, packageId: string) {
  return request<PurchaseOption[]>(
    `/pricing/options?kind=PACKAGE&package_id=${packageId}`,
    { token },
  );
}

// Server-computed price breakdown. months ignored for one-time packages.
export function quote(
  token: string,
  params: { kind: "PRO" | "PACKAGE"; currency: string; months?: number; packageId?: string },
) {
  const q = new URLSearchParams({ kind: params.kind, currency: params.currency });
  if (params.months) q.set("months", String(params.months));
  if (params.packageId) q.set("package_id", params.packageId);
  return request<Quote>(`/pricing/quote?${q.toString()}`, { token });
}

import { request } from "./client";
import type {
  Order,
  Payout,
  PayoutAccount,
  PayoutAccountResponse,
  WalletBalance,
  WalletIncome,
  WalletTransaction,
} from "./types";

// The current user's wallet balance (available + pending/escrow).
export function getWallet(token: string) {
  return request<WalletBalance>("/wallet", { token });
}

// Cumulative earnings: all-time total + current month. Distinct from the
// spendable balance, which nets out payouts and escrow.
export function getIncome(token: string) {
  return request<WalletIncome>("/wallet/income", { token });
}

// Ledger, newest first.
export function listTransactions(token: string, params?: { limit?: number; offset?: number }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<WalletTransaction[]>(`/wallet/transactions${query}`, { token });
}

// Manual top-up via a provider (the buy flows auto-top-up, so this is optional).
export function topUp(token: string, body: { amount: number; currency?: string; provider: string }) {
  return request<{ message: string; amount: number; currency: string }>("/wallet/topup", {
    method: "POST",
    token,
    body,
  });
}

// Start a redirect-gateway top-up (e.g. SEP). Returns a URL to open in a new tab;
// the wallet is credited when the gateway calls back, and a realtime "wallet"
// signal tells the client to refetch.
export function initiateTopup(token: string, body: { amount: number; provider: string }) {
  return request<{ payment_id: string; redirect_url: string }>("/wallet/topup/initiate", {
    method: "POST",
    token,
    body,
  });
}

// Coach requests a payout (top-out) against available balance.
export function requestPayout(token: string, body: { amount: number; note?: string }) {
  return request<Payout>("/wallet/payout", { method: "POST", token, body });
}

// A coach's payout requests.
export function listPayouts(token: string, params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<{ items: Payout[]; total: number }>(`/wallet/payouts${query}`, { token });
}

// The coach's payout destination for the wallet currency (account may be null).
export function getPayoutAccount(token: string) {
  return request<PayoutAccountResponse>("/wallet/payout-account", { token });
}

// Create/update the payout destination. Fields used depend on the currency
// (IRR: card_number + account_holder).
export function savePayoutAccount(
  token: string,
  body: { card_number?: string; account_holder?: string; iban?: string; bank_name?: string; swift?: string },
) {
  return request<PayoutAccount>("/wallet/payout-account", { method: "PUT", token, body });
}

// Buy Pro for a duration in a currency, via the chosen provider.
export function buyPro(
  token: string,
  body: { currency: string; provider: string; months: number },
) {
  return request<Order>("/billing/pro", { method: "POST", token, body });
}

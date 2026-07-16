// Client-side crash reporting. Anything the user should never have seen — a
// white-screen crash, an unhandled rejection, a 5xx from the API — is posted to
// the backend, which forwards it to the #alert-log Discord channel. The app never
// talks to Discord directly: the webhook must not ship in the bundle.
//
// Three rules keep this from becoming the problem it reports on:
//   1. it never throws (a broken reporter must not break the app),
//   2. it never reports its own network failure (no infinite loop), and
//   3. it dedupes and caps, so a render loop is a handful of posts, not a flood.

import { config, APP_VERSION } from "@/config";
import { platform } from "./platform";

export type ReportKind = "crash" | "unhandled" | "api";

interface ReportInput {
  kind: ReportKind;
  message: string;
  stack?: string;
  view?: string;
  /** X-Request-ID of the API response that failed, so both halves can be joined. */
  requestId?: string;
  url?: string;
}

// Belt and braces against a storm: at most N posts per session, and never the
// same fingerprint twice.
const MAX_PER_SESSION = 20;
const seen = new Set<string>();
let sent = 0;
// True only while our own reporting fetch is in flight, so its failure can't
// re-enter and report itself.
let reporting = false;

// The app records where it is so a report can name the screen. App.tsx keeps
// this current as the view changes; it is best-effort context, never required.
let currentView = "";
export function setReportView(view: string) {
  currentView = view;
}

export function report(input: ReportInput): void {
  try {
    if (reporting || sent >= MAX_PER_SESSION) return;

    const fp = `${input.kind}:${input.view ?? currentView}:${input.message}`.slice(0, 300);
    if (seen.has(fp)) return;
    seen.add(fp);
    sent += 1;

    const payload = {
      kind: input.kind,
      message: (input.message || "unknown error").slice(0, 1000),
      stack: (input.stack ?? "").slice(0, 4000),
      view: input.view ?? currentView,
      url: input.url ?? location.href,
      request_id: input.requestId ?? "",
      version: APP_VERSION,
      platform: platform(),
      language: document.documentElement.lang || "",
    };

    reporting = true;
    // keepalive lets the POST outlive a page that is unloading (the crash that
    // navigated away still gets reported). No await, no .then chain that could
    // resurface a rejection — we deliberately do not care about the outcome.
    void fetch(`${config.apiURL}/telemetry/error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .catch(() => {
        // Swallowed on purpose: if the backend is unreachable, that is the very
        // outage we cannot report anyway. Never re-report a reporting failure.
      })
      .finally(() => {
        reporting = false;
      });
  } catch {
    // report() is called from error handlers; it must not add a second error.
    reporting = false;
  }
}

// installGlobalHandlers wires the two browser-level nets: uncaught errors and
// unhandled promise rejections. Call once at startup.
export function installGlobalHandlers(): void {
  window.addEventListener("error", (e) => {
    report({
      kind: "unhandled",
      message: e.message || String(e.error ?? "error"),
      stack: e.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    report({
      kind: "unhandled",
      message: reason?.message ?? String(reason ?? "unhandled rejection"),
      stack: reason?.stack,
    });
  });
}

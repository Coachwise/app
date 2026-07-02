import { request } from "./client";
import type {
  CoachAssignment,
  SelfRecord,
  SubmittedRecord,
  Test,
  TestPayload,
  TestRequest,
  TestRequestStatus,
} from "./types";

type Paged<T> = { items: T[]; total: number };

// --- Coach: test templates ---
export function listTests(token: string, params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<Paged<Test>>(`/tests${query}`, { token });
}

export function getTest(token: string, id: string) {
  return request<Test>(`/tests/${id}`, { token });
}

// Protocols a coach has assigned to the current athlete (run like personal ones).
export function listAssigned(token: string, params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<Paged<Test>>(`/tests/assigned${query}`, { token });
}

export function createTest(token: string, body: TestPayload) {
  return request<Test>("/tests", { method: "POST", token, body });
}

export function updateTest(token: string, id: string, body: TestPayload) {
  return request<Test>(`/tests/${id}`, { method: "PUT", token, body });
}

export function deleteTest(token: string, id: string) {
  return request<void>(`/tests/${id}`, { method: "DELETE", token });
}

// Coach requests an athlete to take a test.
export function requestTest(token: string, testId: string, athleteId: string, note?: string) {
  return request<TestRequest>(`/tests/${testId}/request`, {
    method: "POST",
    token,
    body: { athlete_id: athleteId, note },
  });
}

// --- Requests ---
function reqQuery(params?: { status?: TestRequestStatus; page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  return q.toString() ? `?${q.toString()}` : "";
}

// Coach's sent requests (for review).
export function listSentRequests(token: string, params?: { status?: TestRequestStatus; page?: number; limit?: number }) {
  return request<Paged<TestRequest>>(`/tests/requests${reqQuery(params)}`, { token });
}

// Athlete's assigned requests.
export function listAssignedRequests(token: string, params?: { status?: TestRequestStatus; page?: number; limit?: number }) {
  return request<Paged<TestRequest>>(`/tests/requests/assigned${reqQuery(params)}`, { token });
}

export function getRequest(token: string, id: string) {
  return request<TestRequest>(`/tests/requests/${id}`, { token });
}

// Athlete submits results for a coach-requested test.
export function submitRequest(token: string, id: string, records: SubmittedRecord[]) {
  return request<TestRequest>(`/tests/requests/${id}/submit`, {
    method: "POST",
    token,
    body: { records },
  });
}

// Athlete records their own assessment (no coach, no template).
export function createSelfAssessment(token: string, name: string, records: SelfRecord[]) {
  return request<TestRequest>(`/tests/requests/self`, {
    method: "POST",
    token,
    body: { name, records },
  });
}

// Coach acknowledges a submitted assessment (marks it seen).
export function markSeen(token: string, id: string) {
  return request<TestRequest>(`/tests/requests/${id}/seen`, {
    method: "POST",
    token,
  });
}

// --- Personal protocols: run a saved test and read its run history ---

// Record one dated run of a protocol the current user owns.
export function runProtocol(token: string, testId: string, records: SubmittedRecord[]) {
  return request<TestRequest>(`/tests/${testId}/run`, { method: "POST", token, body: { records } });
}

// A protocol's dated run history (newest first). A coach can pass a client's id
// to view that client's runs of a protocol they own.
export function listRuns(token: string, testId: string, opts?: { athlete?: string }) {
  const q = opts?.athlete ? `?athlete=${opts.athlete}` : "";
  return request<Paged<TestRequest>>(`/tests/${testId}/runs${q}`, { token });
}

// The coach's assigned protocols per client (client + run stats).
export function listAssignments(token: string) {
  return request<Paged<CoachAssignment>>(`/tests/assignments`, { token });
}

// The client-side executor registry: it maps a proposed write action to the
// real, existing API call, run with the user's own token. The model never
// touches the DB — it only names an action; this is the hand that runs it, and
// only after the user approved it. Keyed by name (kept in sync with the backend
// catalog in api/src/llm/actions.go).
import { createExercise } from "@/api/exercises";
import { createPlan, addPlanExercise, assignPlan } from "@/api/plans";
import type { ExerciseSportType } from "@/api/types";

export type ActionExecutor = (token: string, args: Record<string, unknown>) => Promise<unknown>;

const SPORTS: ExerciseSportType[] = ["STRENGTH", "CLIMBING", "CARDIO", "MOBILITY", "GENERAL"];

function toSport(v: unknown): ExerciseSportType {
  const s = String(v ?? "").toUpperCase();
  return (SPORTS.includes(s as ExerciseSportType) ? s : "GENERAL") as ExerciseSportType;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

type PlanSet = { name?: string; rep_count?: number | null; duration?: number | null; rest_time: number };

async function addExercise(token: string, planId: string, e: Record<string, unknown>, order: number) {
  await addPlanExercise(token, planId, {
    exercise_id: String(e.exercise_id),
    exercise_order: Number(e.order ?? order),
    intensity: Number(e.intensity ?? 5), // API requires it (1-10); default mid
    rest_time: Number(e.rest_time ?? 0),
    sets: (e.sets as PlanSet[] | undefined) ?? undefined,
  });
}

const executors: Record<string, ActionExecutor> = {
  create_exercise: async (token, args) => {
    const ex = await createExercise(token, {
      name: String(args.name ?? ""),
      description: String(args.description ?? ""),
      sport_type: toSport(args.sport),
    });
    return { id: ex.id, name: ex.name };
  },

  create_plan: async (token, args) => {
    const plan = await createPlan(token, { name: String(args.name ?? ""), public: false });
    // Only add exercises that carry a real id — the model must have created or
    // found them first. Skip invalid entries instead of erroring so a stray item
    // never leaves a broken plan.
    const exercises = Array.isArray(args.exercises) ? (args.exercises as Record<string, unknown>[]) : [];
    let added = 0;
    let order = 1;
    for (const e of exercises) {
      if (!isUuid(e.exercise_id)) continue;
      await addExercise(token, plan.id, e, order++);
      added++;
    }
    return { id: plan.id, name: plan.name, exercises_added: added };
  },

  add_plan_exercise: async (token, args) => {
    if (!isUuid(args.plan_id)) throw new Error("plan_id is required");
    if (!isUuid(args.exercise_id)) throw new Error("exercise_id is required");
    await addExercise(token, String(args.plan_id), args, Number(args.order ?? 1));
    return { plan_id: args.plan_id, exercise_id: args.exercise_id };
  },

  assign_plan: async (token, args) => {
    if (!isUuid(args.plan_id)) throw new Error("plan_id is required");
    if (!isUuid(args.client_id)) throw new Error("client_id is required");
    await assignPlan(token, String(args.plan_id), { user_id: String(args.client_id) });
    return { assigned: true };
  },
};

export function getExecutor(name: string): ActionExecutor | undefined {
  return executors[name];
}

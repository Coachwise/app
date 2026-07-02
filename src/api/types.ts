export type UUID = string;

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token: string;
}

export interface User {
  id: UUID;
  username: string;
  email: string;
  job_title?: string | null;
  bio?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_id?: UUID | null;
  avatar?: {
    url?: string | null;
    filename?: string | null;
  };
  status: string;
  password_expired: boolean;
  pro_until?: string | null;
  pro: boolean;
  is_coach: boolean;
  // Connection state relative to the current viewer (set by the backend on
  // list/get user endpoints). "none" | "pending_outgoing" | "pending_incoming" | "connected".
  connection_status?: string;
  is_connected?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  job_title?: string;
  bio?: string;
  phone?: string;
  username?: string;
}

export interface Media {
  id: UUID;
  url: string;
  filename: string;
  created_at: string;
}

export interface Chat {
  id: UUID;
  type: "DIRECT" | "CHANNEL";
  name?: string | null;
  owner_id: UUID;
  chat_key?: string | null;
  created_at: string;
}

export interface Message {
  id: UUID;
  chat_id: UUID;
  sender_id: UUID;
  body: string;
  media_id?: UUID | null;
  read_at?: string | null;
  created_at: string;
  media?: Media;
}

export interface ExerciseSet {
  id?: UUID;
  name?: string | null;
  exercise_id?: UUID;
  set_number: number;
  rest_time: number;
  rep_count?: number | null;
  duration?: number | null;
}

export type ExerciseSportType = 'STRENGTH' | 'CLIMBING' | 'CARDIO' | 'MOBILITY' | 'GENERAL';

export interface Exercise {
  id: UUID;
  user_id?: UUID | null;
  name: string;
  description: string;
  public: boolean;
  sport_type: ExerciseSportType;
  media_id?: UUID | null;
  media?: Media | null;
  sets: ExerciseSet[];
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: UUID;
  user_id: UUID;
  public: boolean;
  name: string;
  created_at: string;
  updated_at: string;
  exercise_count?: number; // included by the plans list so the UI needn't fetch exercises per plan
  estimated_seconds?: number; // rough completion estimate computed by the backend
  user?: User; // the plan owner (the coach, for a plan assigned to you)
}

export interface PlanExercise {
  id: UUID;
  exercise_id: UUID;
  plan_id: UUID;
  exercise_order: number;
  rest_time: number;
  intensity: number; // 1-10 scale
  created_at: string;
  exercise?: Exercise; // Populated when joined from backend
}

export interface PlanAssignee {
  id: UUID;
  plan_id: UUID;
  user_id: UUID;
  assigner: UUID;
  created_at: string;
}

// A plan reference bundled inside a coach package (hydrated by the backend).
export interface PackagePlanRef {
  id: UUID;
  name: string;
}

// A coach-owned, sellable "tier" that bundles a set of plans. Pricing/feature
// fields are metadata only for now (no payment processing).
export interface CoachPackage {
  id: UUID;
  coach_id: UUID;
  name: string;
  description?: string | null;
  price_monthly?: number | null;
  price_annual?: number | null;
  price_one_time?: number | null;
  trial_days: number;
  check_in_frequency?: string | null;
  video_access: boolean;
  nutrition_guides: boolean;
  custom_features: string[];
  is_active: boolean;
  popular: boolean;
  plan_count: number;
  plans: PackagePlanRef[];
  created_at: string;
  updated_at: string;
}

// An athlete's enrollment in a coach's package.
export interface PackageSubscription {
  id: UUID;
  package_id: UUID;
  coach_id: UUID;
  client_id: UUID;
  status: string;
  created_at: string;
  updated_at: string;
}

// --- Assessment tests ---

// v1 metrics map onto workout_logs columns: COUNT→reps, KG→weight, SECOND→duration.
export type TestMetric = 'COUNT' | 'KG' | 'SECOND';

// A test item can measure a combination of metrics (e.g. weighted pull-up =
// reps + weight), so each metric is an independent flag.
export interface TestItem {
  id: UUID;
  exercise_id: UUID;
  exercise_name: string;
  track_reps: boolean;
  track_weight: boolean;
  track_time: boolean;
  target_value?: number | null;
  item_order: number;
}

export interface Test {
  id: UUID;
  coach_id: UUID;
  name: string;
  description?: string | null;
  public: boolean;
  item_count: number;
  items: TestItem[];
  // The owner, hydrated on fetch (shown when a coach assigned the protocol).
  coach?: User | null;
  created_at: string;
  updated_at: string;
}

export interface TestItemInput {
  exercise_id: UUID;
  track_reps: boolean;
  track_weight: boolean;
  track_time: boolean;
  target_value?: number | null;
}

export interface TestPayload {
  name: string;
  description?: string | null;
  public?: boolean;
  items?: TestItemInput[];
}

export type TestRequestStatus = 'PENDING' | 'SUBMITTED' | 'SEEN';

export interface TestRequestRecord {
  exercise_id: UUID;
  exercise_name?: string;
  reps?: number | null;
  weight?: number | null;
  duration_seconds?: number | null;
}

export interface TestRequest {
  id: UUID;
  test_id?: UUID | null;
  coach_id?: UUID | null;
  athlete_id: UUID;
  name?: string | null;
  status: TestRequestStatus;
  note?: string | null;
  submitted_at?: string | null;
  seen_at?: string | null;
  created_at: string;
  updated_at: string;
  athlete?: User | null;
  coach?: User | null;
  // `self` is true for athlete self-assessments (no coach/template).
  test: { id: UUID | null; name: string; description?: string | null; self?: boolean };
  items: TestItem[];
  records: TestRequestRecord[];
}

// One result the athlete submits for a coach-requested test item.
export interface SubmittedRecord {
  test_item_id: UUID;
  reps?: number;
  weight?: number;
  time?: number;
}

// A coach's assignment of a protocol to a client, with the client + run stats.
export interface CoachAssignment {
  test_id: UUID;
  athlete_id: UUID;
  assigned_at: string;
  test_name: string;
  item_count: number;
  runs_count: number;
  last_run_at?: string | null;
  athlete: User;
}

// One exercise result in a self-assessment (athlete picks the exercise directly).
export interface SelfRecord {
  exercise_id: UUID;
  reps?: number;
  weight?: number;
  time?: number;
}

export interface Achievement {
  id: UUID;
  athlete_id: UUID;
  coach_id: UUID;
  title: string;
  description?: string | null;
  created_at: string;
}

export interface PersonalRecord {
  exercise_id: UUID;
  exercise_name: string;
  best_weight?: number | null;
  best_reps?: number | null;
  best_time?: number | null;
}

export interface AchievementLayout {
  order: string[];
  hidden: string[];
}

export interface UserAchievements {
  records: PersonalRecord[];
  badges: Achievement[];
  layout: AchievementLayout;
  active_clients: number;
}

export interface PackagePayload {
  name: string;
  description?: string | null;
  price_monthly?: number | null;
  price_annual?: number | null;
  price_one_time?: number | null;
  trial_days?: number;
  check_in_frequency?: string | null;
  video_access?: boolean;
  nutrition_guides?: boolean;
  custom_features?: string[];
  is_active?: boolean;
  popular?: boolean;
  plan_ids?: UUID[];
}

// A single plan a coach has assigned to one of their clients.
export interface AssignedPlanInfo {
  plan_id: UUID;
  plan_name: string;
  package_id?: UUID | null; // set when the plan came from a package; null = added manually
  assigned_at: string;
}

// A package a client is subscribed to under the coach.
export interface ClientPackageInfo {
  package_id: UUID;
  package_name: string;
  subscribed_at: string;
}

// A client of the coach = a user enrolled in one of the coach's packages,
// enriched with their package subscriptions and the plans the coach assigned.
export interface CoachClient extends User {
  packages: ClientPackageInfo[];
  assigned_plans: AssignedPlanInfo[];
}

export interface PlanSchedule {
  id: UUID;
  plan_id: UUID;
  user_id: UUID;
  status: string;
  scheduled_for?: string;
  scheduled_at?: string;
  scheduled_date?: string;
  created_at?: string;
  updated_at?: string;
  plan?: Plan;
}

export interface Session {
  id: UUID;
  user_id: UUID;
  session_type: "PLAN" | "FREESTYLE" | "STRENGTH" | "CLIMBING";
  plan_id?: UUID | null;
  status: string;
  started_at: string;
  ended_at?: string | null;
  notes?: string | null;
  intensity?: number | null; // 1-10 scale
  quality?: number | null; // 1-5 scale (5-star rating)
  created_at: string;
  updated_at: string;
}

export interface WorkoutLog {
  id: UUID;
  session_id: UUID;
  exercise_id?: UUID | null;
  exercise_name?: string | null;
  set_number: number;
  reps?: number | null;
  weight?: number | null;
  rpe?: number | null;
  duration_seconds?: number | null;
  grade?: string | null;
  completed: boolean;
  attempts?: number | null;
  notes?: string | null;
  logged_at: string;
  created_at: string;
}

export interface Tag {
  id: UUID;
  name: string;
  normalized_name: string;
  is_system: boolean;
  created_at: string;
}

export interface FeedMedia {
  id: UUID;
  feed_id: UUID;
  kind: "IMAGE" | "VIDEO";
  url: string;
  thumbnail_url?: string | null;
  order_index: number;
  created_at: string;
}

export interface Feed {
  id: UUID;
  user_id: UUID;
  body?: string | null;
  location?: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  created_at: string;
  updated_at: string;
  media: FeedMedia[];
  tags: Tag[];
  like_count: number;
  comment_count: number;
  liked: boolean;
}

export interface FeedComment {
  id: UUID;
  feed_id: UUID;
  user_id: UUID;
  body: string;
  created_at: string;
  updated_at: string;
}

// Payloads
export interface PreRegisterPayload {
  email?: string;
  username?: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}

export interface OTPPayload {
  email: string;
}

export interface OTPVerifyPayload {
  email: string;
  code: string | number;
}

export interface DirectPasswordChangePayload {
  password: string;
}

export interface NormalPasswordChangePayload {
  current_password: string;
  password: string;
}

export type PasswordChangePayload = DirectPasswordChangePayload | NormalPasswordChangePayload;

export interface ExerciseForm {
  name: string;
  description: string;
  public: boolean;
  sport_type?: ExerciseSportType;
  media_id?: UUID | null;
  sets?: Array<{
    name: string;
    rest_time: number;
    rep_count?: number | null;
    duration?: number | null;
  }>;
}

export interface CreatePlanPayload {
  name: string;
  public: boolean;
}

export interface UpdatePlanPayload {
  name?: string;
  public?: boolean;
}

export interface PlanExercisePayload {
  exercise_id: UUID;
  exercise_order: number;
  rest_time: number;
  intensity?: number; // 1-10 scale, optional (defaults to 5 on backend)
}

export interface PlanAssignPayload {
  user_id: UUID;
}

export interface CreatePlanSchedulePayload {
  plan_id: UUID;
  scheduled_for: string;
  status?: string;
}

export interface UpdatePlanSchedulePayload {
  scheduled_for?: string;
  status?: string;
}

export interface CreateSessionPayload {
  session_type: Session["session_type"];
  plan_id?: UUID;
  started_at?: string;
  status?: string;
  notes?: string;
}

export interface UpdateSessionPayload {
  status?: string;
  started_at?: string;
  notes?: string;
  intensity: number; // Required: 1-10 scale
  quality: number; // Required: 1-5 scale (5-star rating)
}

export interface CreateWorkoutLogPayload {
  session_id: UUID;
  exercise_id?: UUID;
  exercise_name?: string;
  set_number: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  duration_seconds?: number;
  grade?: string;
  completed?: boolean;
  attempts?: number;
  notes?: string;
  tags?: string[];
}

export interface UpdateWorkoutLogPayload {
  reps?: number;
  weight?: number;
  rpe?: number;
  duration_seconds?: number;
  grade?: string;
  completed?: boolean;
  attempts?: number;
  notes?: string;
}

export interface FeedMediaForm {
  kind: "IMAGE" | "VIDEO";
  url: string;
  thumbnail_url?: string;
  order_index?: number;
}

export interface FeedCreatePayload {
  body?: string;
  location?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  media?: FeedMediaForm[];
  tags?: string[];
}

export interface FeedCommentPayload {
  body: string;
}

export interface CreateMediaPayload {
  url: string;
  filename: string;
}

export interface MessageCreatePayload {
  chat_id?: UUID;
  recipient_id?: UUID;
  body: string;
  media_id?: UUID;
}

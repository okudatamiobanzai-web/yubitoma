// nomikai-app 型定義

export type EventType = "nomikai" | "event" | "tane" | "project";
export type EventStatus = "recruiting" | "confirmed" | "closed" | "cancelled";
export type TaneStatus = "open" | "reached" | "promoted" | "closed";
export type ProjectStatus = "planning" | "active" | "paused" | "completed";
export type AttendeeStatus = "approved" | "pending" | "rejected";
export type SupportRole = "core" | "supporter" | "watcher";

// カテゴリ定義
export const CATEGORIES = [
  { value: "nomikai" as const, label: "飲み会", emoji: "🍻", color: "var(--color-nomikai)" },
  { value: "event" as const, label: "イベント", emoji: "🎪", color: "var(--color-event)" },
  { value: "tane" as const, label: "タネ", emoji: "🌱", color: "var(--color-tane)" },
  { value: "project" as const, label: "プロジェクト", emoji: "🚀", color: "var(--color-project)" },
] as const;

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  provider: "line" | "google" | null;
  line_user_id: string | null;
  bio: string | null;
  area: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  organizer_id: string;
  event_type: EventType;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  venue_name: string | null;
  venue_address: string | null;
  cover_image_url: string | null;
  // 飲み会用
  min_people: number;
  max_people: number | null;
  // 体験イベント用
  fee_per_person: number | null;
  // ステータス
  status: EventStatus;
  created_at: string;
  updated_at: string;
  // 関連プロジェクト
  related_project_id?: string | null;
  // JOINで取得
  organizer?: Profile;
  attendees?: Attendee[];
  // 応援
  supports?: Support[];
}

// タネ（🌱 アイデア段階）
export interface Tane {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  // 昇格閾値（言い出しっぺが設定）
  promotion_threshold: number;
  status: TaneStatus;
  created_at: string;
  updated_at: string;
  // JOINで取得
  owner?: Profile;
  supports?: Support[];
  supporter_count?: number;
  watcher_count?: number;
}

// プロジェクト（🚀 動き出した企画）
export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  status: ProjectStatus;
  // 元のタネ
  tane_id: string | null;
  created_at: string;
  updated_at: string;
  // JOINで取得
  owner?: Profile;
  core_members?: Profile[];
  supports?: Support[];
  updates?: ProjectUpdate[];
  related_events?: Event[];
  supporter_count?: number;
  watcher_count?: number;
}

// プロジェクト進捗投稿
export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  image_urls: string[];
  created_at: string;
  author?: Profile;
}

// 応援
export interface Support {
  id: string;
  user_id: string;
  target_type: "event" | "tane" | "project";
  target_id: string;
  role: SupportRole;
  comment: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Attendee {
  id: string;
  event_id: string;
  user_id: string;
  status: AttendeeStatus;
  created_at: string;
  // JOINで取得
  profile?: Profile;
}

// 通知
export type NotificationType =
  | "join_request"
  | "join_approved"
  | "join_rejected"
  | "event_confirmed"
  | "event_reminder"
  | "tane_promoted"
  | "support_received"
  | "project_update";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  event_id?: string;
  tane_id?: string;
  project_id?: string;
  from_user_id?: string;
  from_profile?: Profile;
  is_read: boolean;
  created_at: string;
  action_id?: string;
}

// 応援定型文
export const SUPPORT_PRESETS = [
  "応援してる！",
  "次は参加したい！",
  "また企画して！",
  "実現したら絶対行く！",
  "友達にも紹介する！",
] as const;

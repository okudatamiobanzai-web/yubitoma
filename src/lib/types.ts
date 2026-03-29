// nomikai-app 型定義

export type EventType = "nomikai" | "event" | "tane" | "project";
export type EventStatus = "recruiting" | "confirmed" | "closed" | "cancelled";
export type TaneStatus = "open" | "reached" | "promoted" | "closed";
export type ProjectStatus = "planning" | "active" | "paused" | "completed";
export type PaymentMethod = "cash" | "square" | "shirube_proxy";
export type TransportType = "car" | "daikou" | "taxi" | "walk_bike" | "rideshare" | "stay";
export type ServiceType = "daikou" | "taxi";
export type AttendeeStatus = "approved" | "pending" | "rejected";
export type SupportRole = "core" | "supporter" | "watcher";

// カテゴリ定義
export const CATEGORIES = [
  { value: "nomikai" as const, label: "飲み会", emoji: "🍻", color: "var(--color-nomikai)" },
  { value: "event" as const, label: "イベント", emoji: "🎪", color: "var(--color-event)" },
  { value: "tane" as const, label: "タネ", emoji: "🌱", color: "var(--color-tane)" },
  { value: "project" as const, label: "プロジェクト", emoji: "🚀", color: "var(--color-project)" },
] as const;

// SNSリンク
export interface SocialLinks {
  instagram?: string;
  x?: string;
  note?: string;
  facebook?: string;
}

// 興味タグ
export const INTEREST_TAGS = [
  "AI", "酪農", "移住", "起業", "子育て", "アウトドア",
  "グルメ", "テクノロジー", "まちづくり", "写真", "音楽", "釣り",
] as const;
export type InterestTag = (typeof INTEREST_TAGS)[number];

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  provider: "line" | "google" | null;
  line_user_id: string | null;
  bio: string | null;
  area: string | null;
  interest_tags: InterestTag[];
  social_links: SocialLinks;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  organizer_id: string;
  event_type: EventType;
  title: string;
  description: string | null;
  theme_tag: string | null;
  date: string;
  start_time: string;
  venue_name: string | null;
  venue_address: string | null;
  venue_phone: string | null;
  flyer_url: string | null;
  cover_image_url: string | null;
  // 飲み会用
  min_people: number;
  max_people: number | null;
  has_after_party: boolean;
  // 体験イベント用
  fee_per_person: number | null;
  target_revenue: number | null;
  insurance_required: boolean;
  // 決済
  payment_method: PaymentMethod;
  square_payment_url: string | null;
  // アクセス制御
  is_private: boolean;
  invite_code: string | null;
  requires_approval: boolean;
  // 募集締め切り
  deadline: string | null;
  // ステータス
  status: EventStatus;
  created_at: string;
  updated_at: string;
  // リッチコンテンツ
  rich_content?: RichBlock[];
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
  // 外部リンク
  external_links: ExternalLink[];
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

// 外部リンク
export interface ExternalLink {
  label: string;
  url: string;
  type: "crowdfunding" | "website" | "social" | "other";
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

// コアメンバー招待
export interface CoreMemberInvite {
  id: string;
  project_id: string;
  invite_code: string;
  created_by: string;
  used_by: string | null;
  expires_at: string;
  created_at: string;
}

export interface Attendee {
  id: string;
  event_id: string;
  user_id: string;
  drink_preference: string | null;
  transport: TransportType | null;
  stay_needs_info: boolean;
  offer_rideshare: boolean;
  rideshare_seats: number;
  insurance_agreed: boolean;
  payment_completed: boolean;
  // 承認制
  status: AttendeeStatus;
  referred_by: string | null;
  // 規約同意
  terms_agreed: boolean;
  sns_ng: boolean;
  created_at: string;
  // JOINで取得
  profile?: Profile;
}

export interface TransportService {
  id: string;
  service_type: ServiceType;
  name: string;
  phone: string;
  area: string | null;
  hours: string | null;
  note: string | null;
}

// リッチコンテンツブロック
export type RichBlock =
  | { type: "text"; body: string }
  | { type: "heading"; body: string }
  | { type: "image"; src: string; alt?: string; caption?: string }
  | { type: "highlight"; emoji?: string; body: string }
  | { type: "list"; items: string[] }
  | { type: "divider" };

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

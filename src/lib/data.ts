import { supabase } from "./supabase";
import type { Event, Tane, Project, Profile, Attendee, Support, Notification } from "./types";

// ==========================================
// イベント
// ==========================================
export async function fetchEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*, organizer:profiles!organizer_id(*), attendees(*, profile:profiles!user_id(*))")
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Event[];
}

export async function fetchEvent(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*, organizer:profiles!organizer_id(*), attendees(*, profile:profiles!user_id(*))")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as Event;
}

export async function createEvent(event: Partial<Event> & { organizer_id: string; title: string; date: string }): Promise<string> {
  const { data, error } = await supabase
    .from("events")
    .insert(event)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// ==========================================
// タネ
// ==========================================
export async function fetchTane(): Promise<Tane[]> {
  const { data, error } = await supabase
    .from("tane")
    .select("*, owner:profiles!owner_id(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  // supporter_count を集計
  const taneList = (data ?? []) as unknown as Tane[];
  for (const t of taneList) {
    const { count } = await supabase
      .from("supports")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "tane")
      .eq("target_id", t.id);
    t.supporter_count = count ?? 0;
  }
  return taneList;
}

export async function fetchTaneById(id: string): Promise<Tane | null> {
  const { data, error } = await supabase
    .from("tane")
    .select("*, owner:profiles!owner_id(*)")
    .eq("id", id)
    .single();
  if (error) return null;

  const tane = data as unknown as Tane;
  const { count } = await supabase
    .from("supports")
    .select("id", { count: "exact", head: true })
    .eq("target_type", "tane")
    .eq("target_id", id);
  tane.supporter_count = count ?? 0;
  return tane;
}

export async function createTane(tane: { owner_id: string; title: string; description: string; promotion_threshold: number; cover_image_url?: string }): Promise<string> {
  const { data, error } = await supabase
    .from("tane")
    .insert(tane)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// ==========================================
// プロジェクト
// ==========================================
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, owner:profiles!owner_id(*), updates:project_updates(*, author:profiles!author_id(*))")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const projects = (data ?? []) as unknown as Project[];
  for (const p of projects) {
    const { count } = await supabase
      .from("supports")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "project")
      .eq("target_id", p.id);
    p.supporter_count = count ?? 0;
  }
  return projects;
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, owner:profiles!owner_id(*), updates:project_updates(*, author:profiles!author_id(*))")
    .eq("id", id)
    .single();
  if (error) return null;

  const project = data as unknown as Project;

  // Load core_members via project_members table
  const { data: members } = await supabase
    .from("project_members")
    .select("user_id, role, profile:profiles!user_id(*)")
    .eq("project_id", id);
  if (members) {
    project.core_members = members.map((m: { profile: unknown }) => m.profile as Profile);
  }

  // Load related events
  const { data: events } = await supabase
    .from("events")
    .select("*, organizer:profiles!organizer_id(*), attendees(*, profile:profiles!user_id(*))")
    .eq("related_project_id", id)
    .order("date", { ascending: false });
  if (events) {
    project.related_events = events as unknown as Event[];
  }

  return project;
}

export async function createProject(params: {
  owner_id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  tane_id?: string;
  external_links?: { label: string; url: string; type: string }[];
}): Promise<string> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: params.owner_id,
      title: params.title,
      description: params.description,
      cover_image_url: params.cover_image_url || null,
      tane_id: params.tane_id || null,
      external_links: params.external_links || [],
      status: "active",
    })
    .select("id")
    .single();
  if (error) throw error;

  // Add owner as project member
  await supabase.from("project_members").insert({
    project_id: data.id,
    user_id: params.owner_id,
    role: "owner",
  });

  return data.id;
}

export async function fetchUserProjects(userId: string): Promise<Project[]> {
  const { data } = await supabase
    .from("projects")
    .select("id, title, status, cover_image_url")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  return (data || []) as Project[];
}

// ==========================================
// プロフィール
// ==========================================
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as unknown as Profile;
}

export async function upsertProfile(profile: {
  id?: string;
  display_name: string;
  avatar_url?: string | null;
  avatar_char?: string;
  provider?: "line" | "google";
  line_user_id?: string | null;
}): Promise<Profile> {
  // LINE IDで既存ユーザーを検索
  if (profile.line_user_id) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("line_user_id", profile.line_user_id)
      .single();
    if (existing) {
      // 既存ユーザーの名前とアバターを更新
      const { data, error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as Profile;
    }
  }

  // 新規作成
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      display_name: profile.display_name,
      avatar_url: profile.avatar_url ?? null,
      provider: profile.provider,
      line_user_id: profile.line_user_id ?? null,
      interest_tags: [],
      social_links: {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Profile;
}

// ==========================================
// 参加
// ==========================================
export async function joinEvent(eventId: string, userId: string, options?: {
  drink_preference?: string;
  transport?: string;
  terms_agreed?: boolean;
  sns_ng?: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from("attendees")
    .insert({
      event_id: eventId,
      user_id: userId,
      drink_preference: options?.drink_preference ?? null,
      transport: options?.transport ?? null,
      terms_agreed: options?.terms_agreed ?? true,
      sns_ng: options?.sns_ng ?? false,
      status: "pending",
    });
  if (error) throw error;
}

export async function leaveEvent(eventId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("attendees")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ==========================================
// 応援
// ==========================================
export async function addSupport(targetType: "event" | "tane" | "project", targetId: string, userId: string, comment?: string): Promise<void> {
  const { error } = await supabase
    .from("supports")
    .insert({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
      role: "supporter",
      comment: comment ?? null,
    });
  if (error) throw error;
}

export async function removeSupport(targetType: string, targetId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("supports")
    .delete()
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId);
  if (error) throw error;
}

export async function hasSupported(targetType: string, targetId: string, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from("supports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId);
  return (count ?? 0) > 0;
}

// ==========================================
// 交通サービス
// ==========================================
export async function fetchTransportServices(): Promise<import("./types").TransportService[]> {
  const { data, error } = await supabase
    .from("transport_services")
    .select("*")
    .order("service_type");
  if (error) return [];
  return (data ?? []) as unknown as import("./types").TransportService[];
}

// ==========================================
// 通知
// ==========================================
export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*, from_profile:profiles!from_user_id(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as Notification[];
}

// ==========================================
// 管理画面用クエリ
// ==========================================
export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Profile[];
}

export async function updateEventStatus(eventId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw error;
}

export async function updateTaneStatus(taneId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("tane")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taneId);
  if (error) throw error;
}

export async function updateProjectStatus(projectId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) throw error;
}

export async function deleteEvent(eventId: string): Promise<void> {
  // 先に参加者を削除
  await supabase.from("attendees").delete().eq("event_id", eventId);
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

export async function deleteTane(taneId: string): Promise<void> {
  // 先にタネに紐づくプロジェクトのtane_id参照を解除
  await supabase.from("projects").update({ tane_id: null }).eq("tane_id", taneId);
  // 応援を削除
  await supabase.from("supports").delete().eq("target_type", "tane").eq("target_id", taneId);
  const { error } = await supabase.from("tane").delete().eq("id", taneId);
  if (error) throw error;
}

export async function deleteProject(projectId: string): Promise<void> {
  // 先に紐づくイベントの参照を解除
  await supabase.from("events").update({ related_project_id: null }).eq("related_project_id", projectId);
  // プロジェクトメンバーを削除
  await supabase.from("project_members").delete().eq("project_id", projectId);
  // プロジェクト更新を削除
  await supabase.from("project_updates").delete().eq("project_id", projectId);
  // 応援を削除
  await supabase.from("supports").delete().eq("target_type", "project").eq("target_id", projectId);
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

// ==========================================
// 応援コメント取得
// ==========================================
export async function fetchSupportComments(targetType: string, targetId: string): Promise<Support[]> {
  const { data, error } = await supabase
    .from("supports")
    .select("*, profile:profiles!user_id(*)")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as Support[];
}

// ==========================================
// プロジェクト進捗投稿
// ==========================================
export async function createProjectUpdate(params: {
  project_id: string;
  author_id: string;
  content: string;
  image_urls?: string[];
}): Promise<string> {
  const { data, error } = await supabase
    .from("project_updates")
    .insert({
      project_id: params.project_id,
      author_id: params.author_id,
      content: params.content,
      image_urls: params.image_urls ?? [],
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// ==========================================
// 通知生成ヘルパー
// ==========================================
export async function createNotification(params: {
  user_id: string;
  type: string;
  title: string;
  body: string;
  event_id?: string;
  tane_id?: string;
  project_id?: string;
  from_user_id?: string;
}): Promise<void> {
  const { error } = await supabase.from("notifications").insert(params);
  if (error) console.error("Notification create error:", error);
}

/**
 * イベント参加申請時に主催者へ通知を送る
 */
export async function notifyJoinRequest(eventId: string, eventTitle: string, organizerId: string, applicantName: string, fromUserId: string): Promise<void> {
  await createNotification({
    user_id: organizerId,
    type: "join_request",
    title: "参加リクエスト",
    body: `${applicantName}さんが「${eventTitle}」への参加をリクエストしました`,
    event_id: eventId,
    from_user_id: fromUserId,
  });
}

/**
 * 応援時にオーナーへ通知を送る
 */
export async function notifySupportReceived(targetType: "tane" | "project", targetId: string, targetTitle: string, ownerId: string, supporterName: string, fromUserId: string): Promise<void> {
  await createNotification({
    user_id: ownerId,
    type: "support_received",
    title: "応援を受けました",
    body: `${supporterName}さんが「${targetTitle}」を応援しました`,
    tane_id: targetType === "tane" ? targetId : undefined,
    project_id: targetType === "project" ? targetId : undefined,
    from_user_id: fromUserId,
  });
}

// ==========================================
// 参加者ステータス更新
// ==========================================
export async function updateAttendeeStatus(attendeeId: string, status: "approved" | "rejected"): Promise<void> {
  const { error } = await supabase
    .from("attendees")
    .update({ status })
    .eq("id", attendeeId);
  if (error) throw error;
}

// ==========================================
// レビュー
// ==========================================
export async function createReview(params: {
  event_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  media_urls?: string[];
  is_public?: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .insert(params);
  if (error) throw error;
}

// ==========================================
// 通知の既読
// ==========================================
export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

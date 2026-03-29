import { createAdminBrowserClient } from "./supabase-admin";

const supabase = createAdminBrowserClient();

// ==========================================
// ストレージ（画像アップロード）
// ==========================================
export async function uploadMedia(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Try uploading to "media" bucket
  const { error } = await supabase.storage
    .from("media")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) {
    // If bucket doesn't exist, try creating it and retrying
    if (error.message?.includes("not found") || error.message?.includes("Bucket")) {
      console.warn("Media bucket may not exist. Attempting to create...");
      try {
        await supabase.storage.createBucket("media", { public: true });
      } catch {
        // Bucket might already exist or we don't have permissions, try upload anyway
      }
      // Retry upload
      const { error: retryError } = await supabase.storage
        .from("media")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (retryError) {
        console.error("Upload retry failed:", retryError);
        throw new Error(`画像のアップロードに失敗しました: ${retryError.message}`);
      }
    } else {
      console.error("Upload failed:", error);
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
    }
  }

  const { data } = supabase.storage.from("media").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteMedia(url: string): Promise<void> {
  // URLからパスを抽出
  const match = url.match(/\/storage\/v1\/object\/public\/media\/(.+)/);
  if (!match) return;
  const path = match[1];
  await supabase.storage.from("media").remove([path]);
}

// ==========================================
// イベント
// ==========================================
export async function getEvents(filters?: {
  type?: string;
  status?: string;
  search?: string;
}) {
  let query = supabase.from("events").select("*, organizer:profiles!organizer_id(*)");

  if (filters?.type === "nomikai" || filters?.type === "event") {
    query = query.eq("event_type", filters.type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getEvent(id: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*, organizer:profiles!organizer_id(*), attendees(*, profile:profiles!user_id(*))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("events")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// ==========================================
// タネ
// ==========================================
export async function getTaneList(filters?: { search?: string; status?: string }) {
  let query = supabase.from("tane").select("*, owner:profiles!owner_id(*)");

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTane(id: string) {
  const { data, error } = await supabase
    .from("tane")
    .select("*, owner:profiles!owner_id(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateTane(id: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("tane")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTane(id: string) {
  const { error } = await supabase.from("tane").delete().eq("id", id);
  if (error) throw error;
}

// ==========================================
// プロジェクト
// ==========================================
export async function getProjects(filters?: { search?: string; status?: string }) {
  let query = supabase.from("projects").select("*, owner:profiles!owner_id(*)");

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, owner:profiles!owner_id(*), updates:project_updates(*, author:profiles!author_id(*))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("projects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// ==========================================
// 参加者
// ==========================================
export async function updateAttendeeStatus(id: string, status: "approved" | "rejected") {
  const { error } = await supabase
    .from("attendees")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

// ==========================================
// プロフィール
// ==========================================
export async function getProfiles(search?: string) {
  let query = supabase.from("profiles").select("*");

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,area.ilike.%${search}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProfile(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// ==========================================
// 統計
// ==========================================
export async function getDashboardStats() {
  const [events, tane, projects, profiles] = await Promise.all([
    supabase.from("events").select("id, event_type, status, title, date, created_at", { count: "exact" }),
    supabase.from("tane").select("id, title, status, supporter_count, promotion_threshold, created_at", { count: "exact" }),
    supabase.from("projects").select("id, title, status, created_at", { count: "exact" }),
    supabase.from("profiles").select("id", { count: "exact" }),
  ]);

  return {
    eventCount: events.count ?? 0,
    taneCount: tane.count ?? 0,
    projectCount: projects.count ?? 0,
    userCount: profiles.count ?? 0,
    recentEvents: (events.data ?? []).slice(0, 5),
    recentTane: (tane.data ?? []).slice(0, 3),
  };
}

// ==========================================
// 管理者
// ==========================================
export async function getAdminUsers() {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addAdminUser(email: string, displayName: string, role: string) {
  const { error } = await supabase
    .from("admin_users")
    .insert({ email, display_name: displayName, role });
  if (error) throw error;
}

export async function removeAdminUser(id: string) {
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) throw error;
}

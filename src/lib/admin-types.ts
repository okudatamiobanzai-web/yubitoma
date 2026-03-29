export type AdminRole = "super_admin" | "admin" | "moderator";

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: AdminRole;
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

// 権限チェック
export function canManageUsers(role: AdminRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canManageAdmins(role: AdminRole): boolean {
  return role === "super_admin";
}

export function canEditContent(role: AdminRole): boolean {
  return true; // 全ロールがコンテンツ編集可能
}

export function canDeleteContent(role: AdminRole): boolean {
  return role === "super_admin" || role === "admin";
}

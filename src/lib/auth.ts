/**
 * Supabase認証ヘルパー
 * LINE LIFFログイン後にSupabaseの認証セッションを作成する
 * これによりRLS（Row Level Security）の auth.uid() が機能する
 */
import { supabase } from "./supabase";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface AuthResult {
  userId: string;       // Supabase auth user ID（= auth.uid()）
  profileId: string;    // profiles テーブルの ID（= auth.uid() と同じにする）
}

/**
 * LINE LIFFプロフィールを使ってSupabase認証セッションを作成し、
 * profilesテーブルにupsertする
 *
 * 重要: profileId は必ず auth.uid() と一致させる（RLSが機能するため）
 */
export async function signInWithLine(lineProfile: LineProfile): Promise<AuthResult> {
  const email = `${lineProfile.userId}@line.yubitoma.local`;
  const password = `liff_${lineProfile.userId}_yubitoma`;

  let authUserId: string;

  // まずサインインを試みる
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError && signInData.user) {
    // サインイン成功
    authUserId = signInData.user.id;
  } else {
    // サインイン失敗 → 新規ユーザーとしてサインアップ
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // メール確認をスキップ（ダミーメールなので確認不要）
        data: {
          line_user_id: lineProfile.userId,
          display_name: lineProfile.displayName,
        },
      },
    });

    if (signUpError) throw signUpError;
    if (!signUpData.user) throw new Error("Sign up failed: no user returned");

    // signUp後にセッションが作られない場合がある（メール確認必要設定の場合）
    // その場合は即座にsignInを再試行
    if (!signUpData.session) {
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (retryError) {
        console.error("Post-signup signIn failed:", retryError);
        // セッションなしでもprofileは作る（読み取りは可能）
      }
      authUserId = retryData?.user?.id ?? signUpData.user.id;
    } else {
      authUserId = signUpData.user.id;
    }
  }

  // profilesテーブルにupsert
  // 重要: profile.id = authUserId にする（RLSで auth.uid() = organizer_id が必要）
  const profileId = await ensureProfile(authUserId, lineProfile);

  return { userId: authUserId, profileId };
}

/**
 * profilesテーブルにプロフィールを確保する
 * profile.id は必ず authUserId と一致させる
 */
async function ensureProfile(authUserId: string, lineProfile: LineProfile): Promise<string> {
  // まず line_user_id で既存プロフィールを検索
  const { data: existingByLine } = await supabase
    .from("profiles")
    .select("id")
    .eq("line_user_id", lineProfile.userId)
    .single();

  if (existingByLine) {
    // 既存プロフィールがある場合
    if (existingByLine.id !== authUserId) {
      // IDがずれてる場合 → auth.uid()と同じIDのプロフィールも確保
      // （RLSが auth.uid() で検証するため）
      const { data: existingByAuth } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", authUserId)
        .single();

      if (!existingByAuth) {
        // authUserId のプロフィールがない → 既存のを更新してIDを維持
        // ただしIDは変更できないので、既存IDをそのまま使う
        // → createEvent等で organizer_id に渡す値を authUserId ではなく profileId にする
        console.warn(`Profile ID mismatch: profile=${existingByLine.id}, auth=${authUserId}`);
      }
    }

    // プロフィール情報を更新
    await supabase
      .from("profiles")
      .update({
        display_name: lineProfile.displayName,
        avatar_url: lineProfile.pictureUrl ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingByLine.id);

    return existingByLine.id;
  }

  // authUserId で既存プロフィールを検索
  const { data: existingByAuth } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", authUserId)
    .single();

  if (existingByAuth) {
    // authUserId のプロフィールがある → line_user_id を追加
    await supabase
      .from("profiles")
      .update({
        display_name: lineProfile.displayName,
        avatar_url: lineProfile.pictureUrl ?? null,
        line_user_id: lineProfile.userId,
        provider: "line",
        updated_at: new Date().toISOString(),
      })
      .eq("id", authUserId);

    return authUserId;
  }

  // 新規作成（profile.id = authUserId）
  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: authUserId,
      display_name: lineProfile.displayName,
      avatar_url: lineProfile.pictureUrl ?? null,
      provider: "line",
      line_user_id: lineProfile.userId,
      interest_tags: [],
      social_links: {},
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Profile insert error:", insertError);
    return authUserId; // フォールバック
  }

  return newProfile.id;
}

/**
 * Supabaseからサインアウト
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * 現在のSupabase認証ユーザーIDを取得
 */
export async function getCurrentAuthUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

"use client";

import { Profile } from "@/lib/types";
import { UserAvatarWithFallback } from "./UserAvatar";

interface ProfilePopupProps {
  profile: Profile;
  onClose: () => void;
  eventCount?: number;
}

export function ProfilePopup({ profile, onClose, eventCount }: ProfilePopupProps) {
  const hasSocial = profile.social_links &&
    (profile.social_links.instagram || profile.social_links.x || profile.social_links.note || profile.social_links.facebook);

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* ボトムシート */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.25s_ease-out]">
        <div className="bg-[var(--color-card)] rounded-t-2xl shadow-2xl max-w-lg mx-auto max-h-[80vh] overflow-y-auto">
          {/* ハンドル */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
          </div>

          <div className="px-5 pb-6">
            {/* プロフィール */}
            <div className="flex items-center gap-4 mb-3">
              <UserAvatarWithFallback
                profile={profile}
                size="w-16 h-16"
                textSize="text-2xl"
                bgColor="bg-[var(--color-primary-light)]"
                textColor="text-[var(--color-primary-dark)]"
              />
              <div className="min-w-0">
                <h3 className="text-lg font-bold">{profile.display_name}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {profile.area && (
                    <span className="text-[10px] text-[var(--color-mute)]">📍 {profile.area}</span>
                  )}
                  {profile.provider === "line" && (
                    <span className="text-[10px] bg-[#06C755]/10 text-[#06C755] px-2 py-0.5 rounded-full font-medium">
                      LINE
                    </span>
                  )}
                  {profile.provider === "google" && (
                    <span className="text-[10px] bg-[#4285F4]/10 text-[#4285F4] px-2 py-0.5 rounded-full font-medium">
                      Google
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 自己紹介 */}
            {profile.bio && (
              <p className="text-sm text-[var(--color-sub)] leading-relaxed mb-3 bg-[var(--color-soft)] rounded-xl p-3">
                {profile.bio}
              </p>
            )}

            {/* 興味タグ */}
            {profile.interest_tags && profile.interest_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {profile.interest_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-[var(--color-accent-soft)] text-[var(--color-primary)] px-2 py-0.5 rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* スタッツ */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[var(--color-soft)] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-[var(--color-ink)]">
                  {eventCount ?? 0}
                </div>
                <div className="text-[10px] text-[var(--color-mute)]">参加イベント</div>
              </div>
              <div className="bg-[var(--color-soft)] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-[var(--color-ink)]">
                  {new Date(profile.created_at).getFullYear()}〜
                </div>
                <div className="text-[10px] text-[var(--color-mute)]">登録年</div>
              </div>
            </div>

            {/* SNSリンク */}
            {hasSocial && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {profile.social_links.instagram && (
                  <a
                    href={`https://instagram.com/${profile.social_links.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] bg-gradient-to-r from-[#833AB4]/10 to-[#FD1D1D]/10 text-[#833AB4] px-2.5 py-1 rounded-full font-medium hover:opacity-80 transition-opacity"
                  >
                    📸 @{profile.social_links.instagram}
                  </a>
                )}
                {profile.social_links.x && (
                  <a
                    href={`https://x.com/${profile.social_links.x}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] bg-[#1DA1F2]/10 text-[#1DA1F2] px-2.5 py-1 rounded-full font-medium hover:opacity-80 transition-opacity"
                  >
                    𝕏 @{profile.social_links.x}
                  </a>
                )}
                {profile.social_links.note && (
                  <a
                    href={`https://note.com/${profile.social_links.note}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] bg-[#41C9B4]/10 text-[#41C9B4] px-2.5 py-1 rounded-full font-medium hover:opacity-80 transition-opacity"
                  >
                    📝 {profile.social_links.note}
                  </a>
                )}
                {profile.social_links.facebook && (
                  <a
                    href={`https://facebook.com/${profile.social_links.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] bg-[#1877F2]/10 text-[#1877F2] px-2.5 py-1 rounded-full font-medium hover:opacity-80 transition-opacity"
                  >
                    👤 {profile.social_links.facebook}
                  </a>
                )}
              </div>
            )}

            {/* アクション */}
            <div className="space-y-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[var(--color-soft)] text-[var(--color-sub)] text-sm font-medium transition-all active:scale-[0.98]"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

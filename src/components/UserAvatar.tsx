"use client";

import { Profile } from "@/lib/types";

interface UserAvatarProps {
  /** Profile object - if available, avatar_url and display_name are used */
  profile?: Profile | null;
  /** Fallback display name (used if profile is null) */
  name?: string;
  /** Fallback avatar URL (used if profile is null) */
  avatarUrl?: string | null;
  /** Tailwind size classes e.g. "w-10 h-10" */
  size?: string;
  /** Tailwind text size class e.g. "text-sm" */
  textSize?: string;
  /** Background color class for initials fallback */
  bgColor?: string;
  /** Text color class for initials fallback */
  textColor?: string;
}

export function UserAvatar({
  profile,
  name,
  avatarUrl,
  size = "w-10 h-10",
  textSize = "text-sm",
  bgColor = "bg-[var(--color-primary)]/20",
  textColor = "text-[var(--color-primary)]",
}: UserAvatarProps) {
  const displayName = profile?.display_name ?? name ?? "?";
  const imageUrl = profile?.avatar_url ?? avatarUrl ?? null;
  const initial = displayName[0] ?? "?";

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={displayName}
        className={`${size} rounded-full object-cover shrink-0`}
        onError={(e) => {
          // If image fails to load, replace with initials
          const target = e.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full ${bgColor} flex items-center justify-center ${textColor} ${textSize} font-bold shrink-0`}
    >
      {initial}
    </div>
  );
}

/**
 * UserAvatar with image fallback (renders both img and div, hides one via onError)
 */
export function UserAvatarWithFallback({
  profile,
  name,
  avatarUrl,
  size = "w-10 h-10",
  textSize = "text-sm",
  bgColor = "bg-[var(--color-primary)]/20",
  textColor = "text-[var(--color-primary)]",
}: UserAvatarProps) {
  const displayName = profile?.display_name ?? name ?? "?";
  const imageUrl = profile?.avatar_url ?? avatarUrl ?? null;
  const initial = displayName[0] ?? "?";

  return (
    <span className="inline-flex shrink-0">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={displayName}
          className={`${size} rounded-full object-cover`}
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      )}
      <div
        className={`${size} rounded-full ${bgColor} items-center justify-center ${textColor} ${textSize} font-bold`}
        style={{ display: imageUrl ? "none" : "flex" }}
      >
        {initial}
      </div>
    </span>
  );
}

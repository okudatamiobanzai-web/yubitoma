"use client";

import { useEffect, useRef, useState } from "react";

// プラットフォーム判定
type Platform = "twitter" | "youtube" | "instagram" | "other";

function detectPlatform(url: string): Platform {
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  return "other";
}

// YouTube の動画IDを抽出
function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

// Twitter oEmbed
function TwitterEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/oembed?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.html) setHtml(data.html);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [url]);

  useEffect(() => {
    if (!html || !ref.current) return;
    ref.current.innerHTML = html;
    // Twitter widget.js を読み込んで描画
    const existing = document.getElementById("twitter-wjs");
    if (existing) {
      // 既にロード済みの場合は再描画
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).twttr?.widgets?.load(ref.current);
    } else {
      const script = document.createElement("script");
      script.id = "twitter-wjs";
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).twttr?.widgets?.load(ref.current!);
      };
      document.body.appendChild(script);
    }
  }, [html]);

  if (error) return <LinkCard url={url} platform="twitter" />;
  if (!html) {
    return (
      <div className="bg-[var(--color-soft)] rounded-xl p-4 animate-pulse h-24" />
    );
  }
  return <div ref={ref} className="overflow-hidden rounded-xl [&>*]:!max-w-full" />;
}

// YouTube 埋め込み（音声なし自動再生）
function YouTubeEmbed({ url }: { url: string }) {
  const videoId = getYouTubeId(url);
  if (!videoId) return <LinkCard url={url} platform="youtube" />;

  const isShort = url.includes("/shorts/");
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1`;

  return (
    <div className={`rounded-xl overflow-hidden bg-black ${isShort ? "aspect-[9/16] max-w-[280px] mx-auto" : "aspect-video"}`}>
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title="YouTube"
      />
    </div>
  );
}

// リンクカード（Instagram・その他）
function LinkCard({ url, platform }: { url: string; platform: string }) {
  const configs: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
    instagram: { label: "Instagram", bg: "#E1306C", color: "white", emoji: "📸" },
    twitter: { label: "X (Twitter)", bg: "#000", color: "white", emoji: "𝕏" },
    youtube: { label: "YouTube", bg: "#FF0000", color: "white", emoji: "▶" },
    other: { label: "リンク", bg: "#666", color: "white", emoji: "🔗" },
  };
  const c = configs[platform] ?? configs.other;

  let displayUrl = url;
  try {
    const u = new URL(url);
    displayUrl = u.hostname.replace("www.", "") + u.pathname;
    if (displayUrl.length > 40) displayUrl = displayUrl.slice(0, 40) + "…";
  } catch {}

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-[var(--color-soft)] rounded-xl hover:bg-[var(--color-border)] transition-colors"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
        style={{ backgroundColor: c.bg, color: c.color }}
      >
        {c.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-[var(--color-sub)]">{c.label}</div>
        <div className="text-xs text-[var(--color-mute)] truncate">{displayUrl}</div>
      </div>
      <svg className="w-4 h-4 text-[var(--color-mute)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

interface Props {
  url: string;
}

export function SnsEmbed({ url }: Props) {
  const platform = detectPlatform(url);

  switch (platform) {
    case "twitter":
      return <TwitterEmbed url={url} />;
    case "youtube":
      return <YouTubeEmbed url={url} />;
    case "instagram":
      return <LinkCard url={url} platform="instagram" />;
    default:
      return <LinkCard url={url} platform="other" />;
  }
}

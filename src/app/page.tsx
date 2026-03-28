"use client";

import { useState } from "react";
import Link from "next/link";

// --- Types ---
type Category = "all" | "nomikai" | "event" | "tane" | "project" | "boshu" | "kakutei";

interface YubitomaEvent {
  id: string;
  title: string;
  description: string;
  category: Category;
  emoji: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  participantCount: number;
  maxParticipants: number;
  imageUrl?: string;
  tags: string[];
}

// --- Sample Data ---
const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "nomikai", label: "🍻飲み会" },
  { key: "event", label: "🎪イベント" },
  { key: "tane", label: "🌱タネ" },
  { key: "project", label: "🚀プロジェクト" },
  { key: "boshu", label: "募集中" },
  { key: "kakutei", label: "開催確定" },
];

const SAMPLE_EVENTS: YubitomaEvent[] = [
  {
    id: "1",
    title: "中標津もくもく勉強会 #5",
    description: "milkでもくもく作業しませんか？ジャンル問わず、作業仲間を募集中。途中参加・退出OK！",
    category: "event",
    emoji: "💻",
    date: "2026-04-12",
    time: "13:00〜17:00",
    location: "milk coworking",
    organizer: "久保 竜太郎",
    participantCount: 4,
    maxParticipants: 10,
    tags: ["勉強会", "エンジニア"],
  },
  {
    id: "2",
    title: "金曜サク飲み＠中標津",
    description: "金曜日、軽く飲みに行きませんか？場所は集まったメンバーで決めましょう。2〜3人でも開催します！",
    category: "nomikai",
    emoji: "🍻",
    date: "2026-04-11",
    time: "19:00〜",
    location: "未定（当日決定）",
    organizer: "山川 優貴",
    participantCount: 2,
    maxParticipants: 8,
    tags: ["飲み会", "カジュアル"],
  },
  {
    id: "3",
    title: "道東こども食堂ネットワーク",
    description: "道東エリアでこども食堂をやりたい・手伝いたい人の緩いつながり。まずは情報交換から。",
    category: "project",
    emoji: "🍚",
    date: "常時",
    time: "オンライン",
    location: "LINEグループ",
    organizer: "佐藤 綾佳",
    participantCount: 7,
    maxParticipants: 30,
    tags: ["子ども", "食", "ボランティア"],
  },
  {
    id: "4",
    title: "milkでボドゲ会やりたい",
    description: "ボードゲーム好きな人いませんか？4人集まったら開催！初心者大歓迎です。",
    category: "tane",
    emoji: "🎲",
    date: "未定",
    time: "調整中",
    location: "milk coworking",
    organizer: "大川 尭郁",
    participantCount: 1,
    maxParticipants: 6,
    tags: ["遊び", "交流"],
  },
];

// --- Components ---
function Header({ activeCategory, onCategoryChange }: { activeCategory: Category; onCategoryChange: (c: Category) => void }) {
  return (
    <header className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-sm z-40 border-b border-[var(--color-border)]">
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-[var(--color-primary)]">指とま</span>
          <span className="text-[var(--color-mute)] text-xs font-normal ml-1.5">この指とまれ！</span>
        </h1>
        <Link className="p-1.5 rounded-lg text-[var(--color-mute)] hover:text-[var(--color-sub)] hover:bg-[var(--color-soft)] transition-colors" title="マップ" href="/map">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>
      <div className="px-4 pb-2.5 flex gap-2 overflow-x-auto hide-scrollbar" style={{ scrollSnapType: "x mandatory" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            style={{ scrollSnapAlign: "start" }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.key
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-soft)] text-[var(--color-sub)] hover:bg-[var(--color-border)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </header>
  );
}

function EventCard({ event }: { event: YubitomaEvent }) {
  const progress = (event.participantCount / event.maxParticipants) * 100;
  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
      <div className="h-32 bg-[var(--color-soft)] flex items-center justify-center">
        <span className="text-5xl">{event.emoji}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {event.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--color-soft)] text-[var(--color-mute)]">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-[var(--color-foreground)]">{event.title}</h3>
        <p className="text-xs text-[var(--color-mute)] leading-relaxed line-clamp-2">{event.description}</p>
        <div className="flex gap-3 text-xs text-[var(--color-mute)]">
          <span>📅 {event.date}</span>
          <span>⏰ {event.time}</span>
        </div>
        <div className="flex gap-3 text-xs text-[var(--color-mute)]">
          <span>📍 {event.location}</span>
        </div>
        <div className="relative h-2 bg-[var(--color-soft)] rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: progress > 80 ? "var(--color-primary)" : "var(--color-accent)" }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[var(--color-soft)] flex items-center justify-center text-[8px]">👤</div>
            <span className="text-xs text-[var(--color-mute)]">{event.organizer}</span>
          </div>
          <span className="text-xs font-semibold text-[var(--color-primary)]">
            {event.participantCount}/{event.maxParticipants}人
          </span>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-14 relative">
        <Link className="flex flex-col items-center gap-0.5 text-xs text-[var(--color-primary)]" href="/">
          <span className="text-lg">🏠</span><span>ホーム</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-xs text-[var(--color-mute)] hover:text-[var(--color-sub)]" href="/notifications">
          <span className="text-lg">🔔</span><span>通知</span>
        </Link>
        <Link className="flex flex-col items-center -mt-8" href="/events/new">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/30 hover:bg-[var(--color-primary-dark)] transition-all active:scale-95 ring-4 ring-[var(--color-bg)]">
            <span className="text-2xl">☝️</span>
          </div>
          <span className="text-[10px] mt-1 text-[var(--color-primary)] font-bold">言い出す</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-xs text-[var(--color-mute)] hover:text-[var(--color-sub)]" href="/archive">
          <span className="text-lg">📚</span><span>アーカイブ</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-xs text-[var(--color-mute)] hover:text-[var(--color-sub)]" href="/mypage">
          <span className="text-lg">👤</span><span>マイページ</span>
        </Link>
      </div>
    </nav>
  );
}

// --- Main Page ---
export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered = activeCategory === "all"
    ? SAMPLE_EVENTS
    : SAMPLE_EVENTS.filter((e) => e.category === activeCategory);

  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <Header activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <div className="px-4 py-4 space-y-4">
        {filtered.length > 0 ? (
          filtered.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="text-center py-16 text-[var(--color-mute)]">
            <p className="text-4xl mb-3">🤷</p>
            <p className="text-sm">このカテゴリにはまだイベントがありません</p>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/bottom-nav";
import LoadingState from "@/components/loading-state";

const AREAS = ["すべて", "中標津", "別海", "釧路", "根室", "弟子屈", "帯広"];

export default function MapPage() {
  const [activeArea, setActiveArea] = useState("すべて");
  const [mapMode, setMapMode] = useState<"map" | "satellite">("map");

  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="min-h-screen bg-[var(--color-bg)] pb-20">
        {/* Header */}
        <header className="sticky top-0 bg-[var(--color-bg)]/90 backdrop-blur-sm z-[1000] border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-[var(--color-mute)] hover:text-[var(--color-sub)] cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">📍 マップ</h1>
              <p className="text-xs text-[var(--color-mute)]">道東エリアのイベント</p>
            </div>
            <div className="ml-auto flex gap-1">
              {(["map", "satellite"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMapMode(mode)}
                  className={`text-[10px] px-2 py-1 rounded-full cursor-pointer ${
                    mapMode === mode
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-soft)] text-[var(--color-sub)]"
                  }`}
                >
                  {mode === "map" ? "地図" : "航空写真"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto hide-scrollbar">
            {AREAS.map((area) => (
              <button
                key={area}
                onClick={() => setActiveArea(area)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeArea === area
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-soft)] text-[var(--color-sub)]"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </header>

        {/* Map Placeholder */}
        <div
          className="mx-4 mt-4 rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-soft)] flex items-center justify-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center text-[var(--color-mute)]">
            <span className="text-4xl block mb-2">🗺️</span>
            <p className="text-sm">マップを読み込み中...</p>
          </div>
        </div>

        {/* Legend */}
        <div className="mx-4 mt-2 flex gap-3 text-[10px] text-[var(--color-mute)]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[var(--color-primary)]" /> 飲み会
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> イベント
          </span>
          <span className="ml-auto">0件表示</span>
        </div>

        {/* Event List */}
        <div className="px-4 py-4 space-y-2">
          <h2 className="text-sm font-bold text-[var(--color-foreground)] mb-2">道東のイベント</h2>
          <LoadingState />
        </div>
      </div>
      <BottomNav />
    </main>
  );
}

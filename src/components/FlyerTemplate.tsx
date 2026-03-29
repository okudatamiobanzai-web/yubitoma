import { Event } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function FlyerTemplate({ event }: { event: Event }) {
  const isExperience = event.event_type === "event";
  const bgColor = isExperience ? "var(--color-event)" : "var(--color-primary)";
  const emoji = isExperience ? "🏔️" : "🍻";

  return (
    <div
      className="relative w-full overflow-hidden rounded-t-2xl"
      style={{ aspectRatio: "210 / 297" }}
    >
      {/* 背景 */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, ${bgColor} 0%, ${bgColor}dd 40%, ${bgColor}99 100%)`,
        }}
      />
      {/* 装飾パターン */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-6 right-6 w-32 h-32 rounded-full border-4 border-white" />
        <div className="absolute bottom-16 left-4 w-20 h-20 rounded-full border-4 border-white" />
        <div className="absolute top-1/3 left-1/4 w-12 h-12 rounded-full border-2 border-white" />
      </div>

      {/* コンテンツ */}
      <div className="relative z-10 flex flex-col h-full p-5 text-white">
        {/* 上部: タイプバッジ + タグ */}
        <div className="flex items-center gap-2 mb-auto">
          <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            {isExperience ? "イベント" : "飲み会"}
          </span>
        </div>

        {/* 中央: 大きな絵文字 + タイトル */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-xl font-bold leading-tight mb-2 drop-shadow-sm">
            {event.title}
          </h2>
          {event.description && (
            <p className="text-xs text-white/80 line-clamp-2 max-w-[90%]">
              {event.description.split("\n")[0]}
            </p>
          )}
        </div>

        {/* 下部: 日時・場所・料金 */}
        <div className="space-y-2 mt-auto">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <span>📅</span>
              <span className="font-medium">
                {formatDate(event.date)} {event.start_time}〜
              </span>
            </div>
            {event.venue_name && (
              <div className="flex items-center gap-2 text-sm">
                <span>📍</span>
                <span>{event.venue_name}</span>
              </div>
            )}
            {isExperience && event.fee_per_person && (
              <div className="flex items-center gap-2 text-sm">
                <span>💰</span>
                <span className="font-bold">
                  {event.fee_per_person.toLocaleString()}円/人
                </span>
              </div>
            )}
          </div>

          {/* 指とまブランド */}
          <div className="text-center">
            <span className="text-[10px] text-white/50">☝️ 指とま</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { RichBlock } from "@/lib/types";

export function RichContent({ blocks }: { blocks: RichBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h4
                key={i}
                className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2 pt-1"
              >
                <span className="w-1 h-5 bg-[var(--color-primary)] rounded-full inline-block" />
                {block.body}
              </h4>
            );

          case "text":
            return (
              <p
                key={i}
                className="text-sm text-[var(--color-sub)] whitespace-pre-line leading-relaxed"
              >
                {block.body}
              </p>
            );

          case "image":
            return (
              <figure key={i} className="rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.src}
                  alt={block.alt ?? ""}
                  className="w-full h-44 object-cover"
                />
                {block.caption && (
                  <figcaption className="bg-[var(--color-soft)] text-[11px] text-[var(--color-mute)] px-3 py-2">
                    📸 {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          case "highlight":
            return (
              <div
                key={i}
                className="bg-[var(--color-accent-soft)] border-l-3 border-[var(--color-primary)] rounded-r-xl px-4 py-3 flex gap-2"
              >
                {block.emoji && (
                  <span className="text-lg flex-shrink-0">{block.emoji}</span>
                )}
                <p className="text-sm text-[var(--color-primary-dark)] leading-relaxed">
                  {block.body}
                </p>
              </div>
            );

          case "list":
            return (
              <ul key={i} className="space-y-1.5 pl-1">
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-sm text-[var(--color-sub)]"
                  >
                    <span className="text-[var(--color-primary)] mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );

          case "divider":
            return (
              <div
                key={i}
                className="border-t border-[var(--color-border)] my-2"
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

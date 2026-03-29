import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: event } = await supabase
    .from("events")
    .select("title, description, flyer_url, cover_image_url, date, venue_name, event_type")
    .eq("id", id)
    .single();

  if (!event) {
    return { title: "イベント | 指とま" };
  }

  const emoji = event.event_type === "nomikai" ? "🍻" : "🎪";
  const description = event.description?.substring(0, 120) || `${event.venue_name || ""}で開催`;
  const imageUrl = event.flyer_url || event.cover_image_url;

  return {
    title: `${event.title} | 指とま`,
    description,
    openGraph: {
      title: `${emoji} ${event.title}`,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
      type: "article",
      siteName: "指とま",
      url: `https://yubitoma.shirubelab.jp/events/${id}`,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: `${emoji} ${event.title}`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

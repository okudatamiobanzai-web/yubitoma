import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: tane } = await supabase
    .from("tanes")
    .select("title, description, cover_image_url, promotion_threshold")
    .eq("id", id)
    .single();

  if (!tane) {
    return { title: "タネ | 指とま" };
  }

  const description =
    tane.description?.substring(0, 120) ||
    `${tane.promotion_threshold}人の応援でプロジェクトへ昇格`;

  return {
    title: `${tane.title} | 指とま`,
    description,
    openGraph: {
      title: `🌱 ${tane.title}`,
      description,
      images: tane.cover_image_url
        ? [{ url: tane.cover_image_url, width: 1200, height: 630 }]
        : [],
      type: "article",
      siteName: "指とま",
      url: `https://yubitoma.shirubelab.jp/tane/${id}`,
    },
    twitter: {
      card: tane.cover_image_url ? "summary_large_image" : "summary",
      title: `🌱 ${tane.title}`,
      description,
      images: tane.cover_image_url ? [tane.cover_image_url] : [],
    },
  };
}

export default function TaneDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

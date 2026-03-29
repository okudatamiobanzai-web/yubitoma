import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: project } = await supabase
    .from("projects")
    .select("title, description, cover_image_url")
    .eq("id", id)
    .single();

  if (!project) {
    return { title: "プロジェクト | 指とま" };
  }

  const description = project.description?.substring(0, 120) || "指とまのプロジェクト";

  return {
    title: `${project.title} | 指とま`,
    description,
    openGraph: {
      title: `🚀 ${project.title}`,
      description,
      images: project.cover_image_url ? [{ url: project.cover_image_url, width: 1200, height: 630 }] : [],
      type: "article",
      siteName: "指とま",
      url: `https://yubitoma.shirubelab.jp/projects/${id}`,
    },
    twitter: {
      card: project.cover_image_url ? "summary_large_image" : "summary",
      title: `🚀 ${project.title}`,
      description,
      images: project.cover_image_url ? [project.cover_image_url] : [],
    },
  };
}

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

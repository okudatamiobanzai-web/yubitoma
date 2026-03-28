import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "指とま — この指とまれ！",
  description: "地域のイベント・飲み会・プロジェクトをカジュアルに企画・参加できるプラットフォーム",
  openGraph: {
    title: "指とま — この指とまれ！",
    description: "地域のイベント・飲み会・プロジェクトをカジュアルに企画・参加できるプラットフォーム",
    url: "https://yubitoma.shirubelab.jp",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

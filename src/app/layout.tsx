import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Providers } from "@/components/Providers";
import { RootLayoutContent } from "@/components/RootLayoutContent";
import { ToastProvider } from "@/components/Toast";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "指とま — この指とまれ！",
  description:
    "「こんな飲み会やりたい」「馬に乗りに行こう」— 言い出しっぺが集まりを作る、道東発のイベントアプリ",
  openGraph: {
    title: "指とま — この指とまれ！",
    description:
      "「こんな飲み会やりたい」「馬に乗りに行こう」— 言い出しっぺが集まりを作る、道東発のイベントアプリ",
    url: "https://yubitoma.shirubelab.jp",
    siteName: "指とま",
    images: [
      {
        url: "https://yubitoma.shirubelab.jp/api/og",
        width: 1200,
        height: 630,
        alt: "指とま — この指とまれ！",
      },
    ],
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "指とま — この指とまれ！",
    description:
      "「こんな飲み会やりたい」「馬に乗りに行こう」— 言い出しっぺが集まりを作る、道東発のイベントアプリ",
    images: ["https://yubitoma.shirubelab.jp/api/og"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans antialiased grain`}>
        <Providers>
          <ToastProvider>
            <RootLayoutContent>{children}</RootLayoutContent>
            <BottomNav />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}

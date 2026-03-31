import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: "2px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
          }}
        />

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ fontSize: "80px", lineHeight: 1 }}>☝️</div>
          <div
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              color: "#ffffff",
              letterSpacing: "-2px",
            }}
          >
            指とま
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "2px",
            }}
          >
            この指とまれ！
          </div>
          <div
            style={{
              marginTop: "16px",
              fontSize: "18px",
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
              maxWidth: "700px",
            }}
          >
            言い出しっぺが集まりを作る、道東発のイベントアプリ
          </div>
        </div>

        {/* Bottom tag */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            display: "flex",
            gap: "16px",
          }}
        >
          {["🍻 飲み会", "🎪 イベント", "🌱 タネ", "🚀 プロジェクト"].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "999px",
                padding: "8px 20px",
                fontSize: "16px",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

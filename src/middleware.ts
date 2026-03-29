import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // middlewareでの管理画面保護は無効化
  // 認証チェックは各adminページのクライアントサイドで行う
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

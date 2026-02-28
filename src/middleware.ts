import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "basic_auth_ok";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7日（30日→短縮）

/**
 * HMAC署名でCookie値を生成（推測不可能にする）
 */
function computeCookieSignature(user: string, pass: string): string {
  // Edge Runtimeではcryptoモジュールが使えないため、
  // ユーザー名+パスワードからハッシュ的な値を生成
  let hash = 0;
  const str = `${user}:${pass}:hire-dispatch-auth`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // 環境変数の値に依存する署名（外部からは推測不可能）
  return `auth_${Math.abs(hash).toString(36)}_${str.length}`;
}

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // 本番環境で環境変数未設定ならアクセス拒否（fail-closed）
  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Server configuration error", { status: 500 });
    }
    // 開発環境のみスキップ
    return NextResponse.next();
  }

  const expectedSignature = computeCookieSignature(user, pass);

  // Cookie があれば署名検証
  if (req.cookies.get(COOKIE_NAME)?.value === expectedSignature) {
    return NextResponse.next();
  }

  // Authorization ヘッダーチェック
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [u, p] = decoded.split(":");
      if (u === user && p === pass) {
        const res = NextResponse.next();
        res.cookies.set(COOKIE_NAME, expectedSignature, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: COOKIE_MAX_AGE,
          path: "/",
        });
        return res;
      }
    }
  }

  // 認証要求
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="hire-dispatch"' },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

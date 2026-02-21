import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "basic_auth_ok";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30日

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // 環境変数未設定なら認証スキップ（ローカル開発用）
  if (!user || !pass) return NextResponse.next();

  // Cookie があれば認証済み
  if (req.cookies.get(COOKIE_NAME)?.value === "1") {
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
        res.cookies.set(COOKIE_NAME, "1", {
          httpOnly: true,
          secure: true,
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
    // 静的ファイルと_next以外の全てに適用
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

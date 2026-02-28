import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

/**
 * メール送信テスト用エンドポイント（開発環境のみ）
 * GET /api/test-email?to=your@email.com
 */
export async function GET(req: Request) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const SMTP_USER = process.env.GMAIL_SMTP_USER;
  const SMTP_PASS = process.env.GMAIL_SMTP_PASS;

  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      { error: "?to=email@example.com を指定してください" },
      { status: 400 }
    );
  }

  if (!SMTP_USER || !SMTP_PASS) {
    return NextResponse.json(
      { error: "SMTP credentials are not configured" },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: SMTP_USER,
      to,
      subject: "[テスト] hire-dispatch メール送信テスト",
      html: `
        <h2>メール送信テスト</h2>
        <p>このメールは hire-dispatch アプリからのテスト送信です。</p>
        <p>送信時刻: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</p>
      `,
    });

    return NextResponse.json({ success: true, to, messageId: info.messageId });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: "メール送信に失敗しました" },
      { status: 500 }
    );
  }
}

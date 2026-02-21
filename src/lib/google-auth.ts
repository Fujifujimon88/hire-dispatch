import { google } from "googleapis";

/**
 * 共通サービスアカウント認証（Calendar / Sheets / Drive 用）
 */
export function getGoogleAuth(scopes: string[]) {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n"),
    },
    scopes,
  });
}

/**
 * Gmail用JWT認証（ドメイン全体の委任でユーザーを代理送信）
 */
export function getGmailAuth(impersonateEmail: string) {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
    subject: impersonateEmail,
  });
}

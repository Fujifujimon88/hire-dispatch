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

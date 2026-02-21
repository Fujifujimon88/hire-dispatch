import { google } from "googleapis";
import { getGmailAuth } from "./google-auth";

const SEND_AS = process.env.GMAIL_SEND_AS || "support@litaer.net";

function getGmailClient() {
  const auth = getGmailAuth(SEND_AS);
  return google.gmail({ version: "v1", auth });
}

type EmailAttachment = {
  filename: string;
  mimeType: string;
  content: Buffer;
};

/**
 * Gmail APIでメール送信（ドメイン全体の委任でsupport@litaer.netから送信）
 */
export async function sendEmail(params: {
  to: string[];
  subject: string;
  htmlBody: string;
  attachments?: EmailAttachment[];
}): Promise<void> {
  const gmail = getGmailClient();

  const boundary = "boundary_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  const toHeader = params.to.join(", ");

  // UTF-8件名をBase64エンコード
  const encodedSubject = `=?UTF-8?B?${Buffer.from(params.subject).toString("base64")}?=`;

  const messageParts: string[] = [
    `From: ${SEND_AS}`,
    `To: ${toHeader}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
  ];

  if (params.attachments && params.attachments.length > 0) {
    // マルチパートメール（HTML + 添付ファイル）
    messageParts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    messageParts.push("");
    messageParts.push(`--${boundary}`);
    messageParts.push("Content-Type: text/html; charset=UTF-8");
    messageParts.push("Content-Transfer-Encoding: base64");
    messageParts.push("");
    messageParts.push(Buffer.from(params.htmlBody).toString("base64"));

    for (const att of params.attachments) {
      // ファイル名をRFC 2231形式でエンコード
      const encodedFilename = `=?UTF-8?B?${Buffer.from(att.filename).toString("base64")}?=`;
      messageParts.push(`--${boundary}`);
      messageParts.push(
        `Content-Type: ${att.mimeType}; name="${encodedFilename}"`
      );
      messageParts.push("Content-Transfer-Encoding: base64");
      messageParts.push(
        `Content-Disposition: attachment; filename="${encodedFilename}"`
      );
      messageParts.push("");
      messageParts.push(att.content.toString("base64"));
    }
    messageParts.push(`--${boundary}--`);
  } else {
    // HTMLのみ
    messageParts.push("Content-Type: text/html; charset=UTF-8");
    messageParts.push("Content-Transfer-Encoding: base64");
    messageParts.push("");
    messageParts.push(Buffer.from(params.htmlBody).toString("base64"));
  }

  // Base64url エンコード
  const rawMessage = Buffer.from(messageParts.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: rawMessage },
  });
}

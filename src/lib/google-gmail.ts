import nodemailer from "nodemailer";

const SMTP_USER = process.env.GMAIL_SMTP_USER;
const SMTP_PASS = process.env.GMAIL_SMTP_PASS;

function getTransporter() {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "GMAIL_SMTP_USER / GMAIL_SMTP_PASS が設定されていません。"
    );
  }
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

type EmailAttachment = {
  filename: string;
  mimeType: string;
  content: Buffer;
};

/**
 * Nodemailer + Gmail SMTPでメール送信
 * ドメイン全体の委任は不要。アプリパスワードのみでOK。
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEmail(params: {
  to: string[];
  subject: string;
  htmlBody: string;
  attachments?: EmailAttachment[];
}): Promise<void> {
  // メールアドレス検証
  for (const addr of params.to) {
    if (!EMAIL_REGEX.test(addr)) {
      throw new Error(`Invalid email address: ${addr}`);
    }
  }

  const transporter = getTransporter();

  const mailOptions: nodemailer.SendMailOptions = {
    from: SMTP_USER,
    to: params.to.join(", "),
    subject: params.subject,
    html: params.htmlBody,
    attachments: params.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.mimeType,
    })),
  };

  await transporter.sendMail(mailOptions);
}

import nodemailer from "nodemailer";

const SMTP_USER = process.env.GMAIL_SMTP_USER || "support@litaer.net";
const SMTP_PASS = process.env.GMAIL_SMTP_PASS || "";

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
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
export async function sendEmail(params: {
  to: string[];
  subject: string;
  htmlBody: string;
  attachments?: EmailAttachment[];
}): Promise<void> {
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

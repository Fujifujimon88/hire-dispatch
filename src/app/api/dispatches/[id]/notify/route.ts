import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/google-gmail";
import { downloadPdfFromDrive } from "@/lib/google-drive";
import {
  buildInternalEmailHtml,
  buildClientEmailHtml,
  toEmailData,
} from "@/lib/email-templates";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { type } = (await req.json()) as {
    type: "internal" | "client" | "both";
  };

  const dispatch = await prisma.dispatch.findUnique({
    where: { id: params.id },
    include: { vehicle: true, driver: true },
  });

  if (!dispatch) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // デフォルトアドレス + 手配書個別アドレスをマージ
    const defaultInternal = (process.env.NOTIFY_INTERNAL_DEFAULT || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const defaultClient = (process.env.NOTIFY_CLIENT_DEFAULT || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const internalEmails = Array.from(
      new Set([...defaultInternal, ...dispatch.internalNotifyEmails])
    );
    const clientEmails = Array.from(
      new Set([...defaultClient, ...dispatch.clientNotifyEmails])
    );

    // PDF添付ファイルを準備
    let pdfAttachment:
      | { filename: string; mimeType: string; content: Buffer }
      | undefined;
    if (dispatch.pdfFileId) {
      try {
        const { buffer, fileName } = await downloadPdfFromDrive(
          dispatch.pdfFileId
        );
        pdfAttachment = {
          filename: fileName,
          mimeType: "application/pdf",
          content: buffer,
        };
      } catch (e) {
        console.error("PDF download for attachment failed:", e);
      }
    }

    const emailData = toEmailData(dispatch);
    const results: { internal?: string; client?: string } = {};

    // 社内通知
    if (
      (type === "internal" || type === "both") &&
      internalEmails.length > 0
    ) {
      await sendEmail({
        to: internalEmails,
        subject: `[手配書] ${dispatch.customerName} ${new Date(dispatch.arrangementDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
        htmlBody: buildInternalEmailHtml(emailData),
        attachments: pdfAttachment ? [pdfAttachment] : [],
      });
      results.internal = "sent";
    }

    // 顧客通知
    if ((type === "client" || type === "both") && clientEmails.length > 0) {
      await sendEmail({
        to: clientEmails,
        subject: `手配確認書 - ${dispatch.orderNumber}`,
        htmlBody: buildClientEmailHtml(emailData),
        attachments: pdfAttachment ? [pdfAttachment] : [],
      });
      results.client = "sent";
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Email notification failed:", error);
    const message =
      error instanceof Error ? error.message : "Email notification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

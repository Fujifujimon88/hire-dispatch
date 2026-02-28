import { NextResponse } from "next/server";
import { uploadPdfToDrive } from "@/lib/google-drive";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pdfBase64, fileName, dispatchType } = body;

    if (!pdfBase64 || !fileName) {
      return NextResponse.json({ error: "pdfBase64 and fileName are required" }, { status: 400 });
    }

    const type = dispatchType === "OTHER" ? "OTHER" : "BOJ";
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    const result = await uploadPdfToDrive(pdfBuffer, fileName, type);

    return NextResponse.json({
      fileId: result.fileId,
      webViewLink: result.webViewLink,
    });
  } catch (e) {
    console.error("PDF upload error:", e);
    return NextResponse.json(
      { error: "PDFのアップロードに失敗しました" },
      { status: 500 }
    );
  }
}

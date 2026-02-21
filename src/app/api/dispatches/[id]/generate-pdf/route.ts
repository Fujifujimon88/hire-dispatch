import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeToTemplateSheet, getSheetGid } from "@/lib/google-sheets";
import { exportSheetAsPdf } from "@/lib/google-drive";
import {
  mapDispatchToBOJTemplate,
  mapDispatchToOtherTemplate,
  generatePdfFileName,
} from "@/lib/dispatch-mapping";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const dispatch = await prisma.dispatch.findUnique({
    where: { id: params.id },
    include: { vehicle: true, driver: true },
  });

  if (!dispatch) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const type = dispatch.dispatchType as "BOJ" | "OTHER";
    const no = dispatch.sheetRowNumber || 1;

    // 1. PDFテンプレートシートにデータを転記
    const cellDataMap =
      type === "BOJ"
        ? mapDispatchToBOJTemplate(no, dispatch)
        : mapDispatchToOtherTemplate(no, dispatch);
    await writeToTemplateSheet(type, cellDataMap);

    // 2. テンプレートシートのGIDを取得
    const sheetGid = await getSheetGid(type);

    // 3. PDF出力してDriveに保存
    const fileName = generatePdfFileName(
      type,
      no,
      dispatch.orderNumber,
      dispatch.arrangementDate
    );
    const { fileId, webViewLink } = await exportSheetAsPdf(
      sheetGid,
      fileName,
      type
    );

    // 4. DBにPDF情報を保存
    await prisma.dispatch.update({
      where: { id: params.id },
      data: { pdfFileId: fileId, pdfUrl: webViewLink },
    });

    return NextResponse.json({ fileId, pdfUrl: webViewLink });
  } catch (error) {
    console.error("PDF generation failed:", error);
    const message =
      error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

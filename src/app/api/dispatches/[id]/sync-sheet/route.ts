import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  appendDispatchRow,
  updateDispatchRow,
  getNextNo,
} from "@/lib/google-sheets";
import {
  mapDispatchToBOJRow,
  mapDispatchToOtherRow,
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
    let rowNumber = dispatch.sheetRowNumber;

    if (rowNumber) {
      // 既存行を更新
      const no = rowNumber - 1; // ヘッダー行分を引く（概算）
      const rowData =
        type === "BOJ"
          ? mapDispatchToBOJRow(no, dispatch)
          : mapDispatchToOtherRow(no, dispatch);
      await updateDispatchRow(type, rowNumber, rowData);
    } else {
      // 新しい行を追加
      const nextNo = await getNextNo(type);
      const rowData =
        type === "BOJ"
          ? mapDispatchToBOJRow(nextNo, dispatch)
          : mapDispatchToOtherRow(nextNo, dispatch);
      rowNumber = await appendDispatchRow(type, rowData);

      if (rowNumber) {
        await prisma.dispatch.update({
          where: { id: params.id },
          data: { sheetRowNumber: rowNumber },
        });
      }
    }

    return NextResponse.json({ rowNumber });
  } catch (error) {
    console.error("Sheet sync failed:", error);
    const message =
      error instanceof Error ? error.message : "Sheet sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

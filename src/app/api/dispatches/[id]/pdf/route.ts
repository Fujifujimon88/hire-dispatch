import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const dispatch = await prisma.dispatch.findUnique({
    where: { id: params.id },
    select: { pdfUrl: true },
  });

  if (!dispatch?.pdfUrl) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  return NextResponse.redirect(dispatch.pdfUrl);
}

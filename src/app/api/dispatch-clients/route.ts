import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clients = await prisma.dispatchClient.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.slug || !body.name) {
    return NextResponse.json(
      { error: "slug と name は必須です" },
      { status: 400 }
    );
  }

  const client = await prisma.dispatchClient.create({
    data: {
      slug: body.slug,
      name: body.name,
      mappingType: body.mappingType || "BOJ",
      headerTitle: body.headerTitle || null,
      headerSubtitle: body.headerSubtitle || null,
      calendarId: body.calendarId || null,
      spreadsheetId: body.spreadsheetId || null,
      dataSheetName: body.dataSheetName || null,
      pdfSheetName: body.pdfSheetName || null,
      driveFolderId: body.driveFolderId || null,
      defaultInternalEmails: body.defaultInternalEmails || [],
      defaultClientEmails: body.defaultClientEmails || [],
    },
  });

  return NextResponse.json(client, { status: 201 });
}

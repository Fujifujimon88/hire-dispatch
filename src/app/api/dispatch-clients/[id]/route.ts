import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const client = await prisma.dispatchClient.update({
    where: { id: params.id },
    data: {
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.mappingType !== undefined && { mappingType: body.mappingType }),
      ...(body.headerTitle !== undefined && { headerTitle: body.headerTitle }),
      ...(body.headerSubtitle !== undefined && { headerSubtitle: body.headerSubtitle }),
      ...(body.calendarId !== undefined && { calendarId: body.calendarId }),
      ...(body.spreadsheetId !== undefined && { spreadsheetId: body.spreadsheetId }),
      ...(body.dataSheetName !== undefined && { dataSheetName: body.dataSheetName }),
      ...(body.pdfSheetName !== undefined && { pdfSheetName: body.pdfSheetName }),
      ...(body.driveFolderId !== undefined && { driveFolderId: body.driveFolderId }),
      ...(body.defaultInternalEmails !== undefined && { defaultInternalEmails: body.defaultInternalEmails }),
      ...(body.defaultClientEmails !== undefined && { defaultClientEmails: body.defaultClientEmails }),
    },
  });
  return NextResponse.json(client);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.dispatchClient.update({
    where: { id: params.id },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}

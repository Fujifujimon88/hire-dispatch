import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = await prisma.consultation.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.customerName !== undefined) data.customerName = body.customerName;
  if (body.contactInfo !== undefined) data.contactInfo = body.contactInfo || null;
  if (body.preferredDatetime !== undefined) data.preferredDatetime = body.preferredDatetime ? new Date(body.preferredDatetime) : null;
  if (body.consultationDetails !== undefined) data.consultationDetails = body.consultationDetails || null;
  if (body.status !== undefined) data.status = body.status;
  if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo || null;
  if (body.notes !== undefined) data.notes = body.notes || null;

  const item = await prisma.consultation.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.consultation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
